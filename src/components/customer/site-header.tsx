import Link from 'next/link'
import { Search, ShoppingBasket, UserRound } from 'lucide-react'
import { getCustomerSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { canSeePrices } from '@/lib/permissions'

/**
 * The customer header.
 *
 * Built for a phone held in one hand in a kitchen: the search field is the
 * widest target on the screen, and the wordmark is a link home rather than a
 * decoration.
 */
export async function SiteHeader({ query }: { query?: string }) {
  const session = await getCustomerSession()
  const approved = session ? canSeePrices(session.customer.status) : false

  const basketCount = approved
    ? await prisma.basketLine.count({ where: { basket: { userId: session!.user.id } } })
    : 0

  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-surface/80 backdrop-blur-xl supports-[backdrop-filter]:bg-surface/70">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="group mr-auto flex items-baseline gap-2">
          <span
            className="text-lead font-bold tracking-[-0.03em] text-ink transition-colors group-hover:text-accent"
            style={{ fontStretch: '88%' }}
          >
            ANAID
          </span>
          <span className="hidden text-micro text-ink-muted sm:inline">Quality Disposables</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/products" className="rounded-sm px-3 py-1.5 text-small text-ink-muted hover:bg-sunken hover:text-ink">
            Catalogue
          </Link>
          {session && (
            <Link href="/orders" className="rounded-sm px-3 py-1.5 text-small text-ink-muted hover:bg-sunken hover:text-ink">
              Orders
            </Link>
          )}
        </nav>

        {approved && (
          <Link
            href="/basket"
            className="relative flex size-9 items-center justify-center rounded-sm text-ink-muted hover:bg-sunken hover:text-ink"
            aria-label={`Basket, ${basketCount} ${basketCount === 1 ? 'line' : 'lines'}`}
          >
            <ShoppingBasket className="size-[18px]" />
            {basketCount > 0 && (
              <span className="tnum absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-accent-ink">
                {basketCount}
              </span>
            )}
          </Link>
        )}

        {session ? (
          <Link
            href="/account"
            className="flex size-9 items-center justify-center rounded-sm text-ink-muted hover:bg-sunken hover:text-ink"
            aria-label="Your account"
          >
            <UserRound className="size-[18px]" />
          </Link>
        ) : (
          <Link
            href="/login"
            className="rounded-sm border border-hairline-strong px-3 py-1.5 text-small font-medium hover:bg-sunken"
          >
            Sign in
          </Link>
        )}
      </div>

      <div className="border-t border-hairline px-4 py-2.5 md:hidden">
        <SearchField query={query} />
      </div>
    </header>
  )
}

export function SearchField({ query, className }: { query?: string; className?: string }) {
  return (
    <form action="/products" className={className}>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint" />
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search products or codes"
          className="h-11 w-full rounded-md border border-hairline-strong bg-surface pr-3 pl-9 text-base shadow-xs placeholder:text-ink-faint hover:border-ink-faint focus:border-accent focus:ring-4 focus:ring-accent/12 focus:outline-none"
        />
      </div>
    </form>
  )
}
