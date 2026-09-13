'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import {
  BadgePoundSterling,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/cn'

export type NavItem = {
  href: Route
  label: string
  icon: keyof typeof ICONS
  badge?: number
}

const ICONS = {
  dashboard: LayoutDashboard,
  approvals: ShieldCheck,
  customers: Users,
  orders: ClipboardList,
  products: Boxes,
  pricing: BadgePoundSterling,
  settings: Settings,
}

export function AdminNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <nav className="table-scroll flex gap-1 border-b border-hairline px-2 py-2 lg:flex-col lg:border-b-0 lg:px-3 lg:py-3">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        const Icon = ICONS[item.icon]

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2.5 rounded-sm px-3 py-2 text-small whitespace-nowrap transition-colors',
              active
                ? 'bg-ink text-ink-inverse'
                : 'text-ink-muted hover:bg-sunken hover:text-ink'
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.badge ? (
              <span
                className={cn(
                  'tnum rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                  active ? 'bg-ink-inverse text-ink' : 'bg-pending text-white'
                )}
              >
                {item.badge}
              </span>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
