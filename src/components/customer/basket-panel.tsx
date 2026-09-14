'use client'

import { useId } from 'react'
import Link from 'next/link'
import { ShoppingBasket } from 'lucide-react'
import { formatPence } from '@/lib/money'
import { useBasket } from '@/components/customer/basket-store'

/**
 * The basket, kept in sight while shopping.
 *
 * A trade reorder is a long session — twenty lines picked out of a hundred and
 * thirty — and the question that keeps coming up is "what have I got so far".
 * Answering it by leaving for the basket page and coming back loses your place
 * in the list every time, so the running total lives in the margin instead.
 *
 * It is a summary and not a second basket screen: names, quantities and a
 * total. Changing a quantity or removing a line is still the basket's job,
 * because those want room and a confirmation, and this has neither.
 *
 * It reads the shared store rather than server props, so a line appears here
 * the moment it is pressed rather than when the server gets round to saying so.
 */
export function BasketPanel({ className }: { className?: string }) {
  const basket = useBasket()
  const headingId = useId()

  if (!basket) return null

  const lines = basket.lines

  if (lines.length === 0) {
    return (
      <section aria-labelledby={headingId} className={className}>
        <p id={headingId} className="eyebrow">
          Your basket
        </p>
        <p className="mt-2.5 flex items-center gap-2 text-small text-ink-muted">
          <ShoppingBasket className="size-4 shrink-0 text-ink-faint" aria-hidden />
          Nothing in it yet
        </p>
      </section>
    )
  }

  return (
    <section aria-labelledby={headingId} className={className}>
      <div className="flex items-baseline justify-between gap-2">
        <p id={headingId} className="eyebrow">
          Your basket
        </p>
        <p className="tnum text-micro text-ink-faint">
          {lines.length} {lines.length === 1 ? 'line' : 'lines'}
        </p>
      </div>

      {basket.error && <p className="mt-2 text-micro text-refused">{basket.error}</p>}

      {/* Long baskets scroll inside the panel rather than pushing the
          departments off the bottom of a sticky column. */}
      {/* The right padding is for the scrollbar: without it the thumb sits on
          top of the line totals, which are the numbers being read. */}
      <ul className="mt-3 max-h-56 overflow-y-auto pr-2.5 [scrollbar-width:thin]">
        {lines.map((line) => (
          <li key={line.productId} className="border-b border-hairline-soft py-2 last:border-b-0">
            <Link href={`/products/${line.slug}`} className="group block">
              <span className="flex items-baseline justify-between gap-2">
                <span className="min-w-0 truncate text-small font-medium transition-colors group-hover:text-accent">
                  {line.name}
                </span>
                <span className="tnum shrink-0 text-small text-ink-muted">
                  {formatPence(line.lineNetPence)}
                </span>
              </span>
              <span className="tnum mt-0.5 block text-micro text-ink-faint">
                {line.quantity} × {formatPence(line.unitPricePence)}
                {line.issues.length > 0 && (
                  <span className="text-pending"> · {line.issues[0].toLowerCase()}</span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="tnum mt-3 flex items-baseline justify-between gap-2 border-t border-hairline pt-3 text-small">
        <span className="font-medium">Subtotal</span>
        <span className="font-semibold">{formatPence(basket.subtotalPence)}</span>
      </p>

      {basket.remainingForFreeDeliveryPence > 0 && (
        <p className="tnum mt-1.5 text-micro text-ink-muted">
          {formatPence(basket.remainingForFreeDeliveryPence)} more for free delivery
        </p>
      )}

      <Link
        href="/basket"
        className="mt-4 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full border border-hairline-strong px-3.5 text-[0.84375rem] font-medium transition-[background-color,border-color,color] duration-150 hover:border-accent hover:text-accent"
      >
        <ShoppingBasket className="size-3.5" aria-hidden />
        Go to basket
      </Link>
    </section>
  )
}
