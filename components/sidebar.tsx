'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Briefcase, Bot, Eye, Newspaper,
  BarChart2, Settings, LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, key: 'd' },
  { href: '/holdings', label: 'Holdings', icon: Briefcase, key: 'h' },
  { href: '/advisor', label: 'Advisor', icon: Bot, key: 'a' },
  { href: '/watchlist', label: 'Watchlist', icon: Eye, key: 'w' },
  { href: '/news', label: 'News', icon: Newspaper, key: 'n' },
  { href: '/analysis', label: 'Analysis', icon: BarChart2, key: 'x' },
  { href: '/settings', label: 'Settings', icon: Settings, key: 's' },
]

interface SidebarProps {
  userEmail?: string
  userDisplayName?: string
}

export default function Sidebar({ userEmail, userDisplayName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const item = navItems.find(n => n.key === e.key.toLowerCase())
      if (item) router.push(item.href)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = userDisplayName
    ? userDisplayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : userEmail?.[0]?.toUpperCase() ?? 'P'

  return (
    <aside className="hidden md:flex flex-col w-60 bg-[#0D0D14] border-r border-[#1C1C2E] h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#1C1C2E]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0066FF] to-[#00C2A8] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="text-xl font-bold gradient-text">PortiFi</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                isActive
                  ? 'bg-[#0066FF]/15 text-[#0066FF]'
                  : 'text-[#8E8E93] hover:bg-[#1C1C2E] hover:text-white'
              )}
            >
              <Icon size={18} className={cn(isActive ? 'text-[#0066FF]' : 'text-[#48484A] group-hover:text-white')} />
              {item.label}
              <kbd className="ml-auto text-[10px] text-[#3C3C4E] font-mono hidden group-hover:block">
                {item.key}
              </kbd>
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-[#1C1C2E]">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#1C1C2E] cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0066FF] to-[#00C2A8] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{userDisplayName || 'User'}</p>
            <p className="text-xs text-[#48484A] truncate">{userEmail}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-[#48484A] hover:text-red-400"
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
