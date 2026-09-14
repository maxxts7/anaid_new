'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import { LayoutGrid, ShoppingBasket, ReceiptText, UserRound } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useBasket } from '@/components/customer/basket-store'

/**
 * Bottom navigation, phone only. A busy manager reorders with a thumb, so the
 * four things they actually do live within reach of it.
 *
 * It is the one piece of furniture that never moves: the header rolls away
 * while you scroll, and this stays, so there is always a way out of wherever
 * you are. That is the trade an application makes and a website usually does
 * not — and it is why the header is allowed to leave at all.
 */
export function BottomNav({ showBasket }: { showBasket: boolean }) {
  const pathname = usePathname()
  const basket = useBasket()

  const items: { href: Route; label: string; icon: typeof LayoutGrid; badge?: number }[] = [
    { href: '/products' as Route, label: 'Shop', icon: LayoutGrid },
    ...(showBasket
      ? [
          {
            href: '/basket' as Route,
            label: 'Basket',
            icon: ShoppingBasket,
            // Straight from the shared store, so it moves the moment a line is
            // added rather than when the server next re-renders the layout.
            badge: basket?.count ?? 0,
          },
        ]
      : []),
    { href: '/orders' as Route, label: 'Orders', icon: ReceiptText },
    { href: '/account' as Route, label: 'Account', icon: UserRound },
  ]

  return (
    <nav
      aria-label="Main"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-surface md:hidden"
    >
      <ul className="mx-auto flex max-w-md">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                // 3.5rem is the tab-bar height both platforms settle on, and it
                // is what `--bottom-nav` in the stylesheet promises anything
                // stacking on top of this.
                className={cn(
                  'flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium',
                  active ? 'text-accent' : 'text-ink-muted'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <span className="relative">
                  <Icon className="size-[19px]" />
                  {item.badge ? (
                    <span className="tnum absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-ink">
                      {item.badge}
                    </span>
                  ) : null}
                </span>
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
