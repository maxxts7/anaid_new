'use client'

import { useActionState, useState } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import {
  addCustomerNote,
  approveCustomer,
  reinstateCustomer,
  rejectCustomer,
  requestMoreInformation,
  suspendCustomer,
  updateCommercialTerms,
  type DecisionState,
} from '@/app/(admin)/admin/customers/actions'
import { Button } from '@/components/ui/button'
import { Field, Input, Select, Textarea } from '@/components/ui/field'

type Level = { id: string; name: string; discountBasisPoints: number; isDefault: boolean }

function Feedback({ state }: { state: DecisionState }) {
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

/** Approving is also where the commercial terms are set (LEVEL-4 §10). */
export function ApproveForm({
  customerId,
  levels,
  defaultCreditLimit = '0',
  defaultTerms = 30,
}: {
  customerId: string
  levels: Level[]
  defaultCreditLimit?: string
  defaultTerms?: number
}) {
  const [state, action, pending] = useActionState<DecisionState, FormData>(approveCustomer, {})
  const defaultLevel = levels.find((level) => level.isDefault) ?? levels[0]

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="customerId" value={customerId} />
      <Feedback state={state} />

      <Field label="Pricing level" required hint="A percentage off the list price, applied to everything.">
        <Select name="pricingLevelId" defaultValue={defaultLevel?.id}>
          {levels.map((level) => (
            <option key={level.id} value={level.id}>
              {level.name} — {(level.discountBasisPoints / 100).toFixed(2)}% off
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Credit limit" hint="Leave at 0 to require payment before dispatch.">
          <Input name="creditLimit" defaultValue={defaultCreditLimit} inputMode="decimal" className="tnum" />
        </Field>

        <Field label="Payment terms (days)">
          <Input name="paymentTermsDays" type="number" min={0} max={120} defaultValue={defaultTerms} className="tnum" />
        </Field>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? 'Approving…' : 'Approve and issue account number'}
      </Button>
    </form>
  )
}

export function TermsForm({
  customerId,
  levels,
  currentLevelId,
  creditLimit,
  paymentTermsDays,
}: {
  customerId: string
  levels: Level[]
  currentLevelId: string | null
  creditLimit: string
  paymentTermsDays: number
}) {
  const [state, action, pending] = useActionState<DecisionState, FormData>(updateCommercialTerms, {})

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="customerId" value={customerId} />
      <Feedback state={state} />

      <Field label="Pricing level">
        <Select name="pricingLevelId" defaultValue={currentLevelId ?? ''}>
          <option value="">No level — list price</option>
          {levels.map((level) => (
            <option key={level.id} value={level.id}>
              {level.name} — {(level.discountBasisPoints / 100).toFixed(2)}% off
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Credit limit">
          <Input name="creditLimit" defaultValue={creditLimit} inputMode="decimal" className="tnum" />
        </Field>
        <Field label="Payment terms (days)">
          <Input name="paymentTermsDays" type="number" min={0} max={120} defaultValue={paymentTermsDays} className="tnum" />
        </Field>
      </div>

      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? 'Saving…' : 'Save terms'}
      </Button>
    </form>
  )
}

export function RequestInfoForm({ customerId }: { customerId: string }) {
  const [state, action, pending] = useActionState<DecisionState, FormData>(requestMoreInformation, {})

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="customerId" value={customerId} />
      <Feedback state={state} />

      <Field label="What do you need from them?" required hint="They see this wording exactly.">
        <Textarea name="message" rows={3} placeholder="Please send a copy of your food business registration." />
      </Field>

      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? 'Sending…' : 'Ask for more information'}
      </Button>
    </form>
  )
}

export function RejectForm({ customerId }: { customerId: string }) {
  const [state, action, pending] = useActionState<DecisionState, FormData>(rejectCustomer, {})
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <Button variant="quiet" onClick={() => setOpen(true)}>
        Reject this application
      </Button>
    )
  }

  return (
    <form action={action} className="space-y-3 rounded-lg border border-refused/20 bg-refused-soft p-3">
      <input type="hidden" name="customerId" value={customerId} />
      <Feedback state={state} />

      <Field label="Reason" required hint="Internal only. The customer is told the outcome, not the reason.">
        <Textarea name="reason" rows={2} />
      </Field>

      <div className="flex gap-2">
        <Button type="submit" variant="danger" disabled={pending}>
          {pending ? 'Rejecting…' : 'Reject application'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

export function SuspendForm({ customerId }: { customerId: string }) {
  const [state, action, pending] = useActionState<DecisionState, FormData>(suspendCustomer, {})
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <Button variant="quiet" onClick={() => setOpen(true)}>
        Suspend this account
      </Button>
    )
  }

  return (
    <form action={action} className="space-y-3 rounded-lg border border-refused/20 bg-refused-soft p-3">
      <input type="hidden" name="customerId" value={customerId} />
      <Feedback state={state} />

      <p className="text-micro text-refused">
        Orders already placed still run to completion, and their invoices stay visible. No new orders.
      </p>

      <Field label="Reason" required>
        <Textarea name="reason" rows={2} placeholder="Invoice 1042 unpaid after 45 days." />
      </Field>

      <div className="flex gap-2">
        <Button type="submit" variant="danger" disabled={pending}>
          {pending ? 'Suspending…' : 'Suspend account'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

export function ReinstateForm({ customerId }: { customerId: string }) {
  const [state, action, pending] = useActionState<DecisionState, FormData>(reinstateCustomer, {})

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="customerId" value={customerId} />
      <Feedback state={state} />

      <Field label="Why is this being reinstated?" required>
        <Input name="note" placeholder="Invoice settled in full." />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? 'Reinstating…' : 'Reinstate account'}
      </Button>
    </form>
  )
}

export function NoteForm({ customerId }: { customerId: string }) {
  const [state, action, pending] = useActionState<DecisionState, FormData>(addCustomerNote, {})

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="customerId" value={customerId} />
      <Feedback state={state} />

      <Textarea name="body" rows={2} placeholder="Add an internal note. The customer never sees these." />

      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? 'Saving…' : 'Add note'}
      </Button>
    </form>
  )
}
