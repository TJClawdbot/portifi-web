'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Briefcase, Bot, Eye, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const mobileNavItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/holdings', label: 'Holdings', icon: Briefcase },
  { href: '/advisor', label: 'Advisor', icon: Bot },
  { href: '/watchlist', label: 'Watchlist', icon: Eye },
  { href: '/analysis', label: 'Analysis', icon: BarChart2 },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0D0D14]/95 backdrop-blur border-t border-[#1C1C2E] z-50">
      <div className="flex items-center justify-around px-2 py-2 pb-safe">
        {mobileNavItems.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all',
                isActive ? 'text-[#0066FF]' : 'text-[#48484A]'
              )}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
