'use client'

import { createContext, useCallback, useContext, useMemo, useState, useTransition } from 'react'
import { setBasketQuantity } from '@/app/(customer)/basket/actions'
import type { BasketLineSummary, BasketSummary } from '@/lib/basket'

/**
 * The basket, held in the browser while shopping.
 *
 * Changing a line used to take five to ten seconds to show up, because the
 * action revalidated the whole layout and the server then re-read and re-priced
 * every product in the shop to deliver one changed total. Now the change lands
 * in this store the instant it is pressed, the action runs behind it, and
 * whatever the server says is true replaces the guess when it arrives.
 *
 * The guess is deliberately a guess: the optimistic line prices at the unit
 * price the tile was showing, which a quantity break can change. That is fine
 * for the half-second it is on screen, and the reconciliation below corrects it
 * — the server remains the only thing that decides what anything costs.
 *
 * Everything that shows the basket reads from here — the panel in the margin
 * and the count in the header — so they cannot disagree with each other.
 */

type BasketState = BasketSummary & {
  count: number
  error: string | null
  pending: boolean
  /** How many of this product are in the basket right now. */
  quantityOf: (productId: string) => number
  /** Set a product's quantity outright; zero removes it. */
  setQuantity: (
    line: { productId: string; name: string; slug: string; unitPricePence: number },
    quantity: number
  ) => void
}

const BasketContext = createContext<BasketState | null>(null)

const EMPTY: BasketSummary = {
  lines: [],
  subtotalPence: 0,
  remainingForFreeDeliveryPence: 0,
  freeDeliveryThresholdPence: 0,
}

export function BasketProvider({
  initial,
  children,
}: {
  initial: BasketSummary | null
  children: React.ReactNode
}) {
  const [summary, setSummary] = useState<BasketSummary>(initial ?? EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const setQuantity = useCallback<BasketState['setQuantity']>(
    (line, quantity) => {
      setError(null)
      const previous = summary
      const next = Math.max(0, Math.trunc(quantity) || 0)

      const lines: BasketLineSummary[] =
        next === 0
          ? previous.lines.filter((entry) => entry.productId !== line.productId)
          : previous.lines.some((entry) => entry.productId === line.productId)
            ? previous.lines.map((entry) =>
                entry.productId === line.productId
                  ? { ...entry, quantity: next, lineNetPence: entry.unitPricePence * next }
                  : entry
              )
            : [
                ...previous.lines,
                {
                  productId: line.productId,
                  name: line.name,
                  slug: line.slug,
                  quantity: next,
                  unitPricePence: line.unitPricePence,
                  lineNetPence: line.unitPricePence * next,
                  issues: [],
                },
              ]

      const subtotalPence = lines.reduce((total, entry) => total + entry.lineNetPence, 0)

      setSummary({
        ...previous,
        lines,
        subtotalPence,
        remainingForFreeDeliveryPence: Math.max(0, previous.freeDeliveryThresholdPence - subtotalPence),
      })

      startTransition(async () => {
        const result = await setBasketQuantity(line.productId, next)

        if (result.ok) {
          setSummary(result.summary)
        } else {
          // Put it back the way it was — the change never landed.
          setSummary(previous)
          setError(result.message)
        }
      })
    },
    [summary]
  )

  const quantityOf = useCallback(
    (productId: string) => summary.lines.find((entry) => entry.productId === productId)?.quantity ?? 0,
    [summary]
  )

  const value = useMemo<BasketState>(
    () => ({
      ...summary,
      count: summary.lines.length,
      error,
      pending,
      quantityOf,
      setQuantity,
    }),
    [summary, error, pending, quantityOf, setQuantity]
  )

  return <BasketContext.Provider value={value}>{children}</BasketContext.Provider>
}

/** Null outside a provider, which is every page an unapproved visitor sees. */
export function useBasket(): BasketState | null {
  return useContext(BasketContext)
}
