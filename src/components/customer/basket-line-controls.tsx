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
    // The controls are sized for a thumb first and tighten up once there is a
    // pointer driving them. A 32px target is correct for a mouse and roughly
    // three quarters of what either phone platform asks for, and this is the
    // control a customer uses most on the screen where a mis-tap costs the
    // most — pressing the bin instead of the minus deletes the line.
    <div className={`flex items-center gap-1.5 sm:gap-2 ${pending ? 'opacity-60' : ''}`}>
      <div className="flex h-11 items-center rounded-sm border border-hairline-strong bg-surface sm:h-9">
        <button
          type="button"
          onClick={() => change(quantity - 1)}
          disabled={pending || quantity <= minOrderQuantity}
          className="flex size-10 items-center justify-center text-ink-muted disabled:opacity-30 sm:size-8"
          aria-label="Reduce quantity"
        >
          <Minus className="size-4 sm:size-3.5" />
        </button>

        <span className="tnum w-9 border-x border-hairline text-center text-small font-medium">
          {quantity}
        </span>

        <button
          type="button"
          onClick={() => change(quantity + 1)}
          disabled={pending}
          className="flex size-10 items-center justify-center text-ink-muted disabled:opacity-30 sm:size-8"
          aria-label="Increase quantity"
        >
          <Plus className="size-4 sm:size-3.5" />
        </button>
      </div>

      {/* Set apart from the stepper by a gap wide enough that a thumb aiming at
          the minus cannot land on it. */}
      <button
        type="button"
        onClick={() => startTransition(async () => void (await removeBasketLine(lineId)))}
        disabled={pending}
        className="ml-1 flex size-11 items-center justify-center rounded-sm text-ink-faint hover:bg-sunken hover:text-refused sm:ml-0 sm:size-9"
        aria-label="Remove from basket"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  )
}
