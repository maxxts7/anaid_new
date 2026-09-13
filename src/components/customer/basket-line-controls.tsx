'use client'

import { useTransition } from 'react'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { removeBasketLine, setBasketLineQuantity } from '@/app/(customer)/basket/actions'

export function BasketLineControls({
  lineId,
  quantity,
  minOrderQuantity,
}: {
  lineId: string
  quantity: number
  minOrderQuantity: number
}) {
  const [pending, startTransition] = useTransition()

  const change = (next: number) => {
    startTransition(async () => {
      await setBasketLineQuantity(lineId, next)
    })
  }

  return (
    <div className={`flex items-center gap-2 ${pending ? 'opacity-60' : ''}`}>
      <div className="flex h-9 items-center rounded-sm border border-hairline-strong bg-surface">
        <button
          type="button"
          onClick={() => change(quantity - 1)}
          disabled={pending || quantity <= minOrderQuantity}
          className="flex size-8 items-center justify-center text-ink-muted disabled:opacity-30"
          aria-label="Reduce quantity"
        >
          <Minus className="size-3.5" />
        </button>

        <span className="tnum w-9 border-x border-hairline text-center text-small font-medium">
          {quantity}
        </span>

        <button
          type="button"
          onClick={() => change(quantity + 1)}
          disabled={pending}
          className="flex size-8 items-center justify-center text-ink-muted disabled:opacity-30"
          aria-label="Increase quantity"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => startTransition(async () => void (await removeBasketLine(lineId)))}
        disabled={pending}
        className="flex size-9 items-center justify-center rounded-sm text-ink-faint hover:bg-sunken hover:text-refused"
        aria-label="Remove from basket"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  )
}
