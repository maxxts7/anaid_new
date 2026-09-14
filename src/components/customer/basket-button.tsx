'use client'

import Link from 'next/link'
import { ShoppingBasket } from 'lucide-react'
import { useBasket } from '@/components/customer/basket-store'

/**
 * The basket in the top bar.
 *
 * It reads the same store the margin panel does, so the count moves the instant
 * a line is added rather than waiting for the server to re-render the layout —
 * which is what it used to do, and what made adding anything feel broken.
 */
export function BasketButton() {
  const basket = useBasket()

  if (!basket) return null

  const { count } = basket

  return (
    <Link
      href="/basket"
      className="icon-btn relative"
      aria-label={`Basket, ${count} ${count === 1 ? 'line' : 'lines'}`}
    >
      <ShoppingBasket className="size-[18px]" />
      {count > 0 && (
        <span className="tnum absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-accent-ink">
          {count}
        </span>
      )}
    </Link>
  )
}
