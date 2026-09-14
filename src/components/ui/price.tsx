import { Lock } from 'lucide-react'
import { formatPence } from '@/lib/money'
import { cn } from '@/lib/cn'
import type { PriceResult } from '@/lib/pricing'
import { PRICE_SOURCE_LABELS } from '@/lib/pricing'

/**
 * A price, or the absence of one.
 *
 * These two components are the only place in the application where a price is
 * rendered, and `Withheld` is what the other 99% of the world sees. The absence
 * is designed rather than apologised for: a ruled block the same size and shape
 * as a real price, so a visitor can see exactly what approval unlocks.
 */

export function Price({
  pence,
  unit,
  size = 'md',
  className,
  children,
}: {
  pence: number
  unit?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Slotted in hard against the figure — a mark about the price itself. */
  children?: React.ReactNode
}) {
  const sizes = {
    sm: 'text-base',
    md: 'text-lead',
    lg: 'text-display',
  }

  return (
    <span className={cn('tnum inline-flex items-baseline gap-1 font-semibold text-ink', sizes[size], className)}>
      {formatPence(pence)}
      {children}
      {unit && <span className="text-micro font-normal text-ink-muted">per {unit}</span>}
    </span>
  )
}

export function PriceWithheld({
  message,
  size = 'md',
  className,
}: {
  message: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const heights = {
    sm: 'h-7 px-2',
    md: 'h-9 px-2.5',
    lg: 'h-11 px-3',
  }

  return (
    <span className={cn('price-withheld', heights[size], className)} title={message}>
      <span className="inline-flex items-center gap-1.5 text-micro font-medium text-ink-muted">
        <Lock className="size-3" aria-hidden />
        {message}
      </span>
    </span>
  )
}

/**
 * The full price presentation on a product: what they pay, what it would have
 * cost at list, and how close they are to the next bulk band.
 */
export function PriceDetail({ price, unit }: { price: PriceResult; unit?: string | null }) {
  const saving = price.standardPricePence - price.unitPricePence

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <Price pence={price.unitPricePence} unit={unit} size="lg" />
        {saving > 0 && (
          <span className="tnum text-small text-ink-muted">
            <span className="line-through">{formatPence(price.standardPricePence)}</span> list
          </span>
        )}
      </div>

      <p className="mt-1.5 text-micro text-ink-muted">
        {saving > 0
          ? `${PRICE_SOURCE_LABELS[price.source]}, saving ${formatPence(saving)} a ${unit ?? 'unit'}`
          : PRICE_SOURCE_LABELS[price.source]}
      </p>

      {price.nextBand && price.nextBand.savingPerUnitPence > 0 && (
        <p className="mt-3 flex items-center gap-2 text-micro font-medium text-accent">
          <span aria-hidden className="h-3 w-0.5 rounded-full bg-accent" />
          Order {price.nextBand.minQuantity} or more and pay {formatPence(price.nextBand.pricePence)} each
        </p>
      )}
    </div>
  )
}
