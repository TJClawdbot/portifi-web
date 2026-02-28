'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type Mode = 'signin' | 'signup' | 'confirm'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<Mode>('signin')
  const router = useRouter()
  const supabase = createClient()

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        router.push('/portal')
        router.refresh()
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
      })
      setLoading(false)
      if (error) {
        setError(error.message)
      } else if (data.session) {
        // Email confirmations disabled in Supabase — signed in immediately
        router.push('/portal')
        router.refresh()
      } else {
        // Email confirmation required — show confirmation screen
        setMode('confirm')
      }
    }
  }

  async function handleAppleSignIn() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  // ── Confirmation screen ───────────────────────────────────────────────────
  if (mode === 'confirm') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F] px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0066FF] to-[#00C2A8] flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="text-3xl font-bold gradient-text">PortiFi</span>
            </div>
          </div>

          <Card className="bg-[#13131A] border-[#2C2C3E] card-glow text-center">
            <CardHeader className="pb-2">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-[#0066FF]/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <CardTitle className="text-white text-xl">Check your email</CardTitle>
              <CardDescription className="text-[#8E8E93]">
                We sent a confirmation link to
              </CardDescription>
              <p className="text-white font-medium mt-1">{email}</p>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <p className="text-[#8E8E93] text-sm">
                Click the link in your email to activate your account. Check your spam folder if you don't see it.
              </p>
              <Button
                onClick={() => setMode('signin')}
                variant="outline"
                className="w-full border-[#2C2C3E] text-white hover:bg-[#1C1C2E]"
              >
                Back to sign in
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ── Sign in / Sign up form ────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F] px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0066FF] to-[#00C2A8] flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-3xl font-bold gradient-text">PortiFi</span>
          </div>
          <p className="text-[#8E8E93] text-sm">Your complete financial picture</p>
        </div>

        <Card className="bg-[#13131A] border-[#2C2C3E] card-glow">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-xl">
              {mode === 'signin' ? 'Welcome back' : 'Create account'}
            </CardTitle>
            <CardDescription className="text-[#8E8E93]">
              {mode === 'signin' ? 'Sign in to your PortiFi account' : 'Start tracking your portfolio'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Apple Sign In */}
            <Button
              onClick={handleAppleSignIn}
              disabled={loading}
              className="w-full bg-white hover:bg-gray-100 text-black font-medium h-11"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Continue with Apple
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#2C2C3E]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#13131A] px-2 text-[#8E8E93]">or</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div>
                <Label className="text-[#8E8E93] text-sm">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="mt-1 bg-[#1C1C2E] border-[#2C2C3E] text-white placeholder:text-[#48484A] focus:border-[#0066FF]"
                />
              </div>
              <div>
                <Label className="text-[#8E8E93] text-sm">Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="mt-1 bg-[#1C1C2E] border-[#2C2C3E] text-white placeholder:text-[#48484A] focus:border-[#0066FF]"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0066FF] hover:bg-[#0055DD] text-white font-medium h-11"
              >
                {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <p className="text-center text-sm text-[#8E8E93]">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}
                className="text-[#0066FF] hover:underline"
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
