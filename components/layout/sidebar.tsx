'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ListMusic,
  BookOpen,
  Settings,
} from 'lucide-react'

const links = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sequences', label: 'Sequences', icon: ListMusic },
  { href: '/poses', label: 'Pose library', icon: BookOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 min-h-screen border-r pt-20 pb-6 px-3 fixed left-0 top-0 bg-background">
      <nav className="flex flex-col gap-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              pathname === href
                ? 'bg-secondary text-primary font-medium'
                : 'text-muted-foreground hover:bg-secondary hover:text-primary'
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
