'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { User, Download, Trash2, LogOut, Shield, Bell } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export default function SettingsClient({ user, holdingsCount }: { user: SupabaseUser; holdingsCount: number }) {
  const [displayName, setDisplayName] = useState(user.user_metadata?.full_name || user.user_metadata?.name || '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  async function handleSaveProfile() {
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ data: { full_name: displayName } })
    if (!error) toast({ title: 'Profile updated' })
    else toast({ title: 'Failed to update', variant: 'destructive' })
    setSaving(false)
  }

  async function handleExport() {
    const { data: holdings } = await supabase.from('holdings').select('*').eq('user_id', user.id)
    if (!holdings?.length) return toast({ title: 'No holdings to export' })
    const { holdingsToCSV } = await import('@/lib/holdings')
    const csv = holdingsToCSV(holdings)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'portifi-holdings.csv'; a.click()
    URL.revokeObjectURL(url)
    toast({ title: `Exported ${holdings.length} holdings` })
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleDeleteAccount() {
    if (!confirm('This will permanently delete your account and all data. Are you absolutely sure?')) return
    if (!confirm('Last chance — this cannot be undone. Delete account?')) return
    setDeleting(true)
    // Delete holdings first
    await supabase.from('holdings').delete().eq('user_id', user.id)
    toast({ title: 'Account data deleted. Contact support to fully remove auth account.' })
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = displayName
    ? displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email?.[0]?.toUpperCase() ?? 'P'

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-[#8E8E93] text-sm">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Card className="bg-[#13131A] border-[#2C2C3E]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User size={16} className="text-[#0066FF]" />
            <CardTitle className="text-white text-base">Profile</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0066FF] to-[#00C2A8] flex items-center justify-center">
              <span className="text-white text-xl font-bold">{initials}</span>
            </div>
            <div>
              <p className="text-white font-medium">{displayName || 'User'}</p>
              <p className="text-[#8E8E93] text-sm">{user.email}</p>
              <p className="text-[#48484A] text-xs mt-0.5">{holdingsCount} holdings</p>
            </div>
          </div>
          <div>
            <Label className="text-[#8E8E93] text-sm">Display Name</Label>
            <Input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="mt-1 bg-[#1C1C2E] border-[#2C2C3E] text-white"
            />
          </div>
          <div>
            <Label className="text-[#8E8E93] text-sm">Email</Label>
            <Input
              value={user.email || ''}
              disabled
              className="mt-1 bg-[#1C1C2E] border-[#2C2C3E] text-[#48484A]"
            />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving} className="bg-[#0066FF] hover:bg-[#0055DD]">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <Card className="bg-[#13131A] border-[#2C2C3E]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-[#00C2A8]" />
            <CardTitle className="text-white text-base">Connected Accounts</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-[#1C1C2E] rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              </div>
              <div>
                <p className="text-white text-sm font-medium">Apple</p>
                <p className="text-[#48484A] text-xs">Sign in with Apple</p>
              </div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${user.app_metadata?.provider === 'apple' ? 'bg-[#00C2A8]/15 text-[#00C2A8]' : 'bg-[#2C2C3E] text-[#48484A]'}`}>
              {user.app_metadata?.provider === 'apple' ? 'Connected' : 'Not Connected'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-[#1C1C2E] rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#0066FF] flex items-center justify-center">
                <span className="text-white text-xs font-bold">E</span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">Email / Password</p>
                <p className="text-[#48484A] text-xs">{user.email}</p>
              </div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${user.app_metadata?.provider === 'email' || !user.app_metadata?.provider ? 'bg-[#00C2A8]/15 text-[#00C2A8]' : 'bg-[#2C2C3E] text-[#48484A]'}`}>
              Connected
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Data */}
      <Card className="bg-[#13131A] border-[#2C2C3E]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download size={16} className="text-[#8B5CF6]" />
            <CardTitle className="text-white text-base">Data</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium">Export Holdings</p>
              <p className="text-[#48484A] text-xs">Download your portfolio as CSV</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport} className="border-[#2C2C3E] text-[#8E8E93] hover:text-white">
              <Download size={14} className="mr-1.5" /> Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="bg-[#13131A] border-red-500/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 size={16} className="text-red-400" />
            <CardTitle className="text-red-400 text-base">Danger Zone</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium">Sign Out</p>
              <p className="text-[#48484A] text-xs">Sign out of all devices</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="border-[#2C2C3E] text-[#8E8E93] hover:text-white">
              <LogOut size={14} className="mr-1.5" /> Sign Out
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium">Delete Account</p>
              <p className="text-[#48484A] text-xs">Permanently delete your data</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 size={14} className="mr-1.5" /> Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
