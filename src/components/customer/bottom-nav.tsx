'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import { LayoutGrid, ShoppingBasket, ReceiptText, UserRound } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * Bottom navigation, phone only. A busy manager reorders with a thumb, so the
 * four things they actually do live within reach of it.
 */
export function BottomNav({ showBasket }: { showBasket: boolean }) {
  const pathname = usePathname()

  const items: { href: Route; label: string; icon: typeof LayoutGrid }[] = [
    { href: '/products' as Route, label: 'Shop', icon: LayoutGrid },
    ...(showBasket ? [{ href: '/basket' as Route, label: 'Basket', icon: ShoppingBasket }] : []),
    { href: '/orders' as Route, label: 'Orders', icon: ReceiptText },
    { href: '/account' as Route, label: 'Account', icon: UserRound },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="mx-auto flex max-w-md">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium',
                  active ? 'text-accent' : 'text-ink-muted'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="size-[18px]" />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
