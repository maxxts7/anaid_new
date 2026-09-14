'use client'

import { Minus, Plus } from 'lucide-react'
import { useBasket } from '@/components/customer/basket-store'

/**
 * How many of this line are on order, and the two controls that change it.
 *
 * There is no "add" button because there is nothing to say: an empty line shows
 * a plus, and a line on order shows its own number with a control either side
 * of it. A manager working down a reorder of forty lines is reading quantities,
 * not pressing a word — and the count doubles as the answer to "did that go
 * in", which an Add button never gives you.
 *
 * The first press puts the product's minimum in, because ordering less than the
 * minimum is not a thing that can happen; after that it steps one at a time,
 * and stepping below the minimum takes the line out altogether rather than
 * stranding it at a quantity that cannot be ordered.
 *
 * Nothing here decides who may order. The action behind it begins with
 * `requireOrderingCustomer`, so an unapproved account gets nothing back even if
 * it calls the action directly; this only decides what is worth drawing.
 */
export function QuantityStepper({
  productId,
  name,
  slug,
  minOrderQuantity,
  unitPricePence,
  sellUnit,
  soldOut,
  className,
}: {
  productId: string
  name: string
  slug: string
  minOrderQuantity: number
  unitPricePence: number
  sellUnit: string
  soldOut?: boolean
  className?: string
}) {
  const basket = useBasket()
  if (!basket) return null

  const quantity = basket.quantityOf(productId)
  const line = { productId, name, slug, unitPricePence }

  // The tile around this is a link to the product. Without these the press
  // would change the line and then navigate away from the list.
  function guard(event: React.MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
  }

  if (quantity === 0) {
    return (
      <div className={className}>
        <button
          type="button"
          disabled={soldOut}
          onClick={(event) => {
            guard(event)
            basket.setQuantity(line, minOrderQuantity)
          }}
          title={soldOut ? 'Out of stock' : undefined}
          aria-label={
            minOrderQuantity > 1
              ? `Order ${name}, minimum ${minOrderQuantity} ${sellUnit}s`
              : `Order ${name}`
          }
          className="inline-flex size-9 items-center justify-center rounded-full border border-hairline-strong bg-surface text-ink transition-[background-color,border-color,color] duration-150 hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-45"
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="inline-flex h-9 items-center rounded-full border border-accent/35 bg-accent-soft">
        <button
          type="button"
          onClick={(event) => {
            guard(event)
            // One below the minimum is not a smaller order, it is no order.
            basket.setQuantity(line, quantity <= minOrderQuantity ? 0 : quantity - 1)
          }}
          aria-label={
            quantity <= minOrderQuantity ? `Remove ${name} from basket` : `One fewer ${sellUnit}`
          }
          className="flex size-9 items-center justify-center rounded-full text-accent transition-colors hover:text-accent-hover"
        >
          <Minus className="size-4" aria-hidden />
        </button>

        <span
          className="tnum min-w-6 text-center text-[0.84375rem] font-semibold text-accent"
          aria-live="polite"
          aria-label={`${quantity} ${sellUnit}${quantity === 1 ? '' : 's'} on order`}
        >
          {quantity}
        </span>

        <button
          type="button"
          disabled={soldOut}
          onClick={(event) => {
            guard(event)
            basket.setQuantity(line, quantity + 1)
          }}
          aria-label={`One more ${sellUnit}`}
          className="flex size-9 items-center justify-center rounded-full text-accent transition-colors hover:text-accent-hover disabled:opacity-45"
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}
