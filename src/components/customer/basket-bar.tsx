'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { formatPence } from '@/lib/money'
import { useBasket } from '@/components/customer/basket-store'

/**
 * The running basket, on a phone.
 *
 * On a wide screen the basket sits in the margin all the way down the
 * catalogue, because the question a trade customer keeps asking while picking
 * twenty lines out of a hundred and thirty is "what have I got so far, and what
 * is it costing me". The margin panel answers it without them leaving the list.
 *
 * A phone has no margin, so until now it answered neither: the only evidence a
 * basket existed at all was a small number on the header icon, which says how
 * many lines and not what they come to — and which rolls away with the header
 * as soon as you scroll. A customer building a £240 order got no running total
 * anywhere, which is exactly the figure they are working to.
 *
 * This is the phone's version of that margin: a bar across the bottom of the
 * screen carrying the count, the money, and the way through to the basket. It
 * is the pattern every ordering app converges on for the same reason.
 *
 * It reads the shared store rather than server props, so a line added from the
 * grid lands here immediately — same store as the header count and the margin
 * panel, so the three cannot disagree.
 */
export function BasketBar() {
  const basket = useBasket()
  const pathname = usePathname()

  // Nothing to summarise, or the customer is already looking at the thing this
  // is a shortcut to. The basket and checkout pages carry their own totals, and
  // a second bar over the top of them is noise in front of the real one.
  if (!basket || basket.count === 0) return null
  if (pathname === '/basket' || pathname === '/checkout') return null

  return (
    <div
      // Above the bottom navigation, which is itself fixed. `--bottom-nav`
      // carries the home-indicator inset with it, so this lands on top of the
      // nav rather than behind the indicator on a phone without a home button.
      className="fixed inset-x-0 z-30 px-3 pb-2 md:hidden"
      style={{ bottom: 'var(--bottom-nav)' }}
    >
      <Link
        href="/basket"
        className="btn-accent flex h-14 items-center gap-3 rounded-xl px-4 text-accent-ink"
      >
        {/* The count reads as a mark rather than as running text, which is what
            lets the money beside it be the thing the eye lands on. */}
        <span className="tnum flex size-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-small font-semibold">
          {basket.count}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-small leading-tight font-medium">
            {basket.count} {basket.count === 1 ? 'line' : 'lines'} in your basket
          </span>
          {basket.remainingForFreeDeliveryPence > 0 && (
            <span className="tnum block text-micro leading-tight text-white/75">
              {formatPence(basket.remainingForFreeDeliveryPence)} more for free delivery
            </span>
          )}
        </span>

        <span className="tnum shrink-0 text-lead font-semibold">
          {formatPence(basket.subtotalPence)}
        </span>
        <ChevronRight className="-mr-1 size-5 shrink-0 text-white/80" aria-hidden />
      </Link>
    </div>
  )
}
