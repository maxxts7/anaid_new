'use client'

import { useActionState, useState } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import {
  advanceOrder,
  cancelOrderAsStaff,
  saveInternalNote,
  type OrderActionState,
} from '@/app/(admin)/admin/orders/actions'
import { Button } from '@/components/ui/button'
import { Field, Textarea } from '@/components/ui/field'

function Feedback({ state }: { state: OrderActionState }) {
  if (!state.message) return null

  return (
    <p
      className={`flex items-start gap-2 rounded-sm px-3 py-2 text-small ${
        state.ok ? 'bg-approved-soft text-approved' : 'bg-refused-soft text-refused'
      }`}
    >
      {state.ok ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
      )}
      {state.message}
    </p>
  )
}

export function AdvanceOrder({
  orderNumber,
  toStatus,
  label,
  warning,
}: {
  orderNumber: string
  toStatus: string
  label: string
  warning?: string
}) {
  const [state, action, pending] = useActionState<OrderActionState, FormData>(advanceOrder, {})

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="orderNumber" value={orderNumber} />
      <input type="hidden" name="toStatus" value={toStatus} />
      <Feedback state={state} />

      {warning && <p className="text-micro text-ink-muted">{warning}</p>}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? 'Working…' : label}
      </Button>
    </form>
  )
}

export function CancelOrderAsStaff({ orderNumber }: { orderNumber: string }) {
  const [state, action, pending] = useActionState<OrderActionState, FormData>(cancelOrderAsStaff, {})
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <Button variant="quiet" size="sm" onClick={() => setOpen(true)}>
        Cancel this order
      </Button>
    )
  }

  return (
    <form action={action} className="space-y-3 rounded-lg border border-refused/20 bg-refused-soft p-3">
      <input type="hidden" name="orderNumber" value={orderNumber} />
      <Feedback state={state} />

      <Field label="Reason" required hint="Goes on the order, the customer's message and the audit log.">
        <Textarea name="reason" rows={2} />
      </Field>

      <div className="flex gap-2">
        <Button type="submit" variant="danger" size="sm" disabled={pending}>
          {pending ? 'Cancelling…' : 'Cancel order'}
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
          Keep it
        </Button>
      </div>
    </form>
  )
}

export function InternalNote({
  orderNumber,
  defaultValue,
}: {
  orderNumber: string
  defaultValue: string
}) {
  const [state, action, pending] = useActionState<OrderActionState, FormData>(saveInternalNote, {})

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="orderNumber" value={orderNumber} />
      <Feedback state={state} />

      <Textarea
        name="internalNotes"
        rows={3}
        defaultValue={defaultValue}
        placeholder="Notes for the warehouse and the office. The customer never sees these."
      />

      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? 'Saving…' : 'Save note'}
      </Button>
    </form>
  )
}
