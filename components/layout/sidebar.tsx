'use client'

import {
  LayoutDashboard,
  ListMusic,
  BookOpen,
  Settings,
  Menu,
  X,
  MessageSquareText,
  ShieldCheck,
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const baseLinks = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sequences', label: 'Sequences', icon: ListMusic },
  { href: '/poses', label: 'Pose library', icon: BookOpen },
  { href: '/cues', label: 'Cue search', icon: MessageSquareText },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const links = isAdmin
    ? [...baseLinks, { href: '/admin/poses', label: 'Admin: Poses', icon: ShieldCheck }]
    : baseLinks

  return (
    <>
      {/* Hamburger button — mobile only */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-1.5 rounded-md hover:bg-secondary"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay — mobile only */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-full w-56 bg-background border-r pt-20 pb-6 px-3 transition-transform duration-200 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <nav className="flex flex-col gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
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
    </>
  )
}