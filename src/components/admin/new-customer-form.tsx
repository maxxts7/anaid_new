'use client'

import { useActionState } from 'react'
import { AlertCircle } from 'lucide-react'
import { createCustomer, type NewCustomerState } from '@/app/(admin)/admin/customers/new/actions'
import { BUSINESS_TYPE_LABELS } from '@/lib/business-types'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/field'

export function NewCustomerForm({
  levels,
}: {
  levels: { id: string; name: string; discountBasisPoints: number; isDefault: boolean }[]
}) {
  const [state, action, pending] = useActionState<NewCustomerState, FormData>(createCustomer, {})
  const defaultLevel = levels.find((level) => level.isDefault) ?? levels[0]

  return (
    <form action={action} className="space-y-6">
      {state.message && (
        <p className="flex items-start gap-2 rounded-lg border border-refused/20 bg-refused-soft px-3 py-2.5 text-small text-refused">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {state.message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Business name" required>
          <Input name="businessName" required autoFocus />
        </Field>

        <Field label="Type of business" required>
          <Select name="businessType" defaultValue="RESTAURANT">
            {Object.entries(BUSINESS_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Contact name" required>
          <Input name="contactName" required />
        </Field>

        <Field label="VAT number">
          <Input name="vatNumber" className="tnum uppercase" />
        </Field>

        <Field label="Email address" required hint="They sign in with this.">
          <Input name="email" type="email" required />
        </Field>

        <Field label="Mobile number" required hint="They sign in with this too.">
          <Input name="mobile" required inputMode="tel" className="tnum" />
        </Field>
      </div>

      <fieldset className="space-y-4 border-t border-hairline pt-5">
        <legend className="sr-only">Address</legend>

        <Field label="Address line 1" required>
          <Input name="line1" required />
        </Field>

        <Field label="Address line 2">
          <Input name="line2" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Town or city" required>
            <Input name="city" required />
          </Field>
          <Field label="Postcode" required>
            <Input name="postcode" required className="tnum uppercase" />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-hairline pt-5">
        <legend className="mb-2 font-medium">Commercial terms</legend>

        <Field label="Pricing level" required>
          <Select name="pricingLevelId" defaultValue={defaultLevel?.id}>
            {levels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name} — {(level.discountBasisPoints / 100).toFixed(2)}% off
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Credit limit" hint="0 means payment before dispatch.">
            <Input name="creditLimit" defaultValue="0" inputMode="decimal" className="tnum" />
          </Field>
          <Field label="Payment terms (days)">
            <Input name="paymentTermsDays" type="number" min={0} max={120} defaultValue={30} className="tnum" />
          </Field>
        </div>
      </fieldset>

      <div className="flex items-center gap-3 border-t border-hairline pt-5">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? 'Creating…' : 'Create approved account'}
        </Button>
        <p className="text-small text-ink-muted">
          The account is approved straight away and can order immediately.
        </p>
      </div>
    </form>
  )
}
