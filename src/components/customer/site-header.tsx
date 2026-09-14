import Link from 'next/link'
import { Search, UserRound } from 'lucide-react'
import { getCustomerSession } from '@/lib/auth/session'
import { canSeePrices } from '@/lib/permissions'
import { Wordmark } from '@/components/ui/wordmark'
import { BasketButton } from '@/components/customer/basket-button'
import { AppBar } from '@/components/customer/app-bar'

/**
 * The customer header.
 *
 * Built for a phone held in one hand in a kitchen: the search field is the
 * widest target on the screen, and the wordmark is a link home rather than a
 * decoration.
 *
 * The bar is solid white rather than a frosted pane. Translucency blurs
 * whatever slides under it, and on a catalogue what slides under it is the
 * photography the customer is trying to look at. Its only decoration is a hair
 * of accent laid along the bottom edge, under the hairline.
 *
 * Nothing in it is boxed except the one thing to press. The navigation is a row
 * of words and the tools are circles that are invisible until the cursor finds
 * them, because a bar of grey hover-pills reads as chrome and this header is
 * meant to read as the top of a page.
 */
export async function SiteHeader({ query }: { query?: string }) {
  const session = await getCustomerSession()
  const approved = session ? canSeePrices(session.customer.status) : false

  return (
    <AppBar>
      <div className="rail px-safe">
        <div className="mx-auto flex h-full max-w-6xl items-center gap-3 px-4 sm:gap-5 sm:px-6 lg:px-8">
          <Link href="/" className="group mr-auto" aria-label="ANAID Quality Disposables Limited — home">
            <Wordmark size="sm" />
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <HeaderLink href="/products">Shop</HeaderLink>
            {session && <HeaderLink href="/orders">Orders</HeaderLink>}
            <HeaderLink href="/about">About</HeaderLink>
            <HeaderLink href="/contact">Contact</HeaderLink>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-3.5">
            {approved && <BasketButton />}

            {session ? (
              <Link href="/account" className="icon-btn" aria-label="Your account">
                <UserRound className="size-[18px]" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex h-10 shrink-0 items-center rounded-full border border-hairline px-4 text-small font-medium transition-[background-color,border-color,color] duration-150 hover:border-ink-muted hover:bg-sunken-soft sm:px-4.5 sm:text-base"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="px-safe [--gutter:1rem] sm:[--gutter:1.5rem] border-b border-hairline bg-surface py-2.5 md:hidden">
        <SearchField query={query} />
      </div>
    </AppBar>
  )
}

function HeaderLink({
  href,
  children,
}: {
  href: '/products' | '/orders' | '/about' | '/contact'
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="text-[0.9375rem] font-bold tracking-[0.06em] text-ink-muted uppercase transition-colors hover:text-ink"
    >
      {children}
    </Link>
  )
}

export function SearchField({ query, className }: { query?: string; className?: string }) {
  return (
    <form action="/products" className={className}>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-faint" />
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search products or codes"
          className="h-11 w-full rounded-[10px] border border-hairline bg-surface pr-4 pl-10 text-base placeholder:text-ink-faint hover:border-hairline-strong focus:border-accent focus:ring-4 focus:ring-accent/10 focus:outline-none"
        />
      </div>
    </form>
  )
}
