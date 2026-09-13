'use client'

import { useState, useTransition } from 'react'
import { cancelOrder } from '@/app/(customer)/orders/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/field'

export function CancelOrder({ orderNumber }: { orderNumber: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (!open) {
    return (
      <Button variant="quiet" size="sm" onClick={() => setOpen(true)}>
        Cancel this order
      </Button>
    )
  }

  return (
    <div className="rounded-lg border border-hairline bg-sunken p-3">
      <p className="text-small font-medium">Cancel {orderNumber}?</p>
      <p className="mt-1 text-micro text-ink-muted">
        The stock goes back on the shelf straight away. You can order again whenever you like.
      </p>

      <Input
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Reason (optional)"
        className="mt-2"
        maxLength={200}
      />

      {error && <p className="mt-2 text-micro text-refused">{error}</p>}

      <div className="mt-3 flex gap-2">
        <Button
          variant="danger"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await cancelOrder(orderNumber, reason)
              if (!result.ok) setError(result.message)
            })
          }
        >
          {pending ? 'Cancelling…' : 'Yes, cancel it'}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setOpen(false)} disabled={pending}>
          Keep the order
        </Button>
      </div>
    </div>
  )
}
