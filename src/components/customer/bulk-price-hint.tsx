import { Star } from 'lucide-react'
import { formatPence } from '@/lib/money'
import type { PriceBand } from '@/lib/pricing'

/**
 * A star against a price that has bulk bands behind it, and the ladder itself
 * on hover.
 *
 * Quantity breaks are the strongest reason a trade customer orders more, and
 * until now they were only visible on the product page — which is a click away
 * from the list where the ordering actually happens. The star is a mark that
 * something is there; the ladder answers it without leaving the row.
 *
 * There is no JavaScript in it. Hover and keyboard focus both reveal the panel
 * through CSS alone, which is why this can stay a server component and why it
 * works before anything has hydrated.
 */
export function BulkPriceHint({
  bands,
  sellUnit,
  appliedMinQuantity,
}: {
  bands: PriceBand[]
  sellUnit: string
  /** The band in force at the quantity being shown, marked in the ladder. */
  appliedMinQuantity?: number | null
}) {
  if (bands.length === 0) return null

  const label = `Bulk prices: ${bands
    .map((band) => `${band.minQuantity} or more, ${formatPence(band.pricePence)} each`)
    .join('; ')}`

  return (
    <span className="group/bulk relative -ml-0.5 inline-flex self-center">
      <button
        type="button"
        // It opens nothing and goes nowhere — it is a place for focus to land so
        // the ladder can be read without a mouse.
        aria-label={label}
        className="inline-flex size-3.5 items-center justify-center rounded-full text-ink-faint transition-colors hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 group-hover/bulk:text-accent"
      >
        <Star className="size-2.5" fill="currentColor" strokeWidth={0} aria-hidden />
      </button>

      <span
        role="tooltip"
        aria-hidden
        className="pointer-events-none invisible absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-56 -translate-x-1/2 rounded-md border border-hairline bg-surface p-3 opacity-0 shadow-lg transition-[opacity,visibility] duration-150 group-hover/bulk:visible group-hover/bulk:opacity-100 group-focus-within/bulk:visible group-focus-within/bulk:opacity-100"
      >
        <span className="eyebrow block">Bulk prices</span>

        <span className="mt-2 block">
          {bands.map((band) => {
            const applied = appliedMinQuantity === band.minQuantity

            return (
              <span
                key={band.minQuantity}
                className={
                  'tnum flex items-baseline justify-between gap-4 text-small ' +
                  (applied ? 'font-semibold text-ink' : 'text-ink-muted')
                }
              >
                <span>
                  {band.minQuantity}+ {sellUnit}
                  {band.minQuantity === 1 ? '' : 's'}
                </span>
                <span>{formatPence(band.pricePence)}</span>
              </span>
            )
          })}
        </span>
      </span>
    </span>
  )
}
