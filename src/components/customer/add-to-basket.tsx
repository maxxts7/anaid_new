'use client'

import { useState, useTransition } from 'react'
import { Check, Minus, Plus } from 'lucide-react'
import { addToBasket } from '@/app/(customer)/basket/actions'
import { Button } from '@/components/ui/button'

/**
 * Quantity stepper and add button.
 *
 * The steppers are 40px targets because this is used on a phone, often by
 * someone holding something else in the other hand.
 */
export function AddToBasket({
  productId,
  minOrderQuantity,
  sellUnit,
  disabled,
}: {
  productId: string
  minOrderQuantity: number
  sellUnit: string
  disabled?: boolean
}) {
  const [quantity, setQuantity] = useState(minOrderQuantity)
  const [added, setAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function submit() {
    setError(null)
    startTransition(async () => {
      const result = await addToBasket(productId, quantity)
      if (result.ok) {
        setAdded(true)
        setTimeout(() => setAdded(false), 2000)
      } else {
        setError(result.message)
      }
    })
  }

  return (
    <div>
      <div className="flex gap-2">
        <div className="flex h-11 items-center rounded-sm border border-hairline-strong bg-surface">
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(minOrderQuantity, value - 1))}
            disabled={disabled || quantity <= minOrderQuantity}
            className="flex size-10 items-center justify-center text-ink-muted disabled:opacity-30"
            aria-label="Reduce quantity"
          >
            <Minus className="size-4" />
          </button>

          <input
            type="number"
            inputMode="numeric"
            value={quantity}
            min={minOrderQuantity}
            onChange={(event) => setQuantity(Math.max(minOrderQuantity, Number(event.target.value) || 0))}
            className="tnum h-full w-12 border-x border-hairline text-center text-base font-medium focus:outline-none"
            aria-label={`Quantity in ${sellUnit}s`}
          />

          <button
            type="button"
            onClick={() => setQuantity((value) => value + 1)}
            disabled={disabled}
            className="flex size-10 items-center justify-center text-ink-muted disabled:opacity-30"
            aria-label="Increase quantity"
          >
            <Plus className="size-4" />
          </button>
        </div>

        <Button onClick={submit} disabled={disabled || pending} size="lg" className="flex-1">
          {added ? (
            <>
              <Check className="size-4" />
              Added
            </>
          ) : pending ? (
            'Adding…'
          ) : (
            'Add to basket'
          )}
        </Button>
      </div>

      {minOrderQuantity > 1 && (
        <p className="tnum mt-2 text-micro text-ink-muted">
          Sold in {sellUnit}s. Minimum order {minOrderQuantity}.
        </p>
      )}

      {error && <p className="mt-2 text-micro text-refused">{error}</p>}
    </div>
  )
}
