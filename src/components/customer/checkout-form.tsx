'use client'

import { useActionState } from 'react'
import { AlertCircle } from 'lucide-react'
import { placeOrder, type CheckoutState } from '@/app/(customer)/checkout/actions'
import { Button } from '@/components/ui/button'
import { Field, Input, Select, Textarea } from '@/components/ui/field'

type AddressOption = {
  id: string
  label: string
  isDefaultDelivery: boolean
  isDefaultBilling: boolean
}

export function CheckoutForm({
  addresses,
  defaultPhone,
  earliestDeliveryDate,
  totalLabel,
  disabled,
}: {
  addresses: AddressOption[]
  defaultPhone: string
  earliestDeliveryDate: string
  totalLabel: string
  disabled?: boolean
}) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(placeOrder, {})

  const defaultDelivery = addresses.find((address) => address.isDefaultDelivery) ?? addresses[0]
  const defaultBilling = addresses.find((address) => address.isDefaultBilling) ?? addresses[0]

  return (
    <form action={action} className="space-y-6">
      {state.message && (
        <div className="rounded-lg border border-refused/20 bg-refused-soft px-3 py-2.5 text-small text-refused">
          <p className="flex items-start gap-2 font-medium">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {state.message}
          </p>
          {state.problems && (
            <ul className="mt-1.5 ml-6 list-disc space-y-0.5">
              {state.problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Deliver to" required>
          <Select name="deliveryAddressId" required defaultValue={defaultDelivery?.id}>
            {addresses.map((address) => (
              <option key={address.id} value={address.id}>
                {address.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Invoice to" required>
          <Select name="billingAddressId" required defaultValue={defaultBilling?.id}>
            {addresses.map((address) => (
              <option key={address.id} value={address.id}>
                {address.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Contact number on the day" required hint="The driver calls this number.">
          <Input name="contactPhone" required defaultValue={defaultPhone} inputMode="tel" className="tnum" />
        </Field>

        <Field label="Preferred delivery date" hint="We will do our best. Weekdays only.">
          <Input name="preferredDeliveryDate" type="date" min={earliestDeliveryDate} className="tnum" />
        </Field>
      </div>

      <Field label="Purchase order reference" hint="Printed on your invoice if your business uses one.">
        <Input name="poReference" maxLength={60} />
      </Field>

      <Field label="Delivery instructions" hint="Gate codes, parking, best times, where to leave pallets.">
        <Textarea name="deliveryInstructions" rows={2} maxLength={500} />
      </Field>

      <Field label="Anything else we should know">
        <Textarea name="customerNotes" rows={2} maxLength={500} />
      </Field>

      <div className="rounded-lg border border-hairline bg-sunken p-4">
        <p className="text-small font-medium">Payment</p>
        <p className="mt-1 text-small text-ink-muted">
          On account. We invoice you after dispatch, on your agreed terms.
        </p>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending || disabled}>
        {pending ? 'Placing your order…' : `Place order — ${totalLabel}`}
      </Button>

      <p className="text-center text-micro text-ink-muted">
        We check prices, stock and your credit before the order is created.
      </p>
    </form>
  )
}
