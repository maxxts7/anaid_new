'use client'

import { useActionState, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { registerCustomer, type RegisterState } from '@/app/(customer)/register/actions'
import { BUSINESS_TYPE_LABELS } from '@/lib/business-types'
import { Button } from '@/components/ui/button'
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field'

export function RegisterForm() {
  const [state, action, pending] = useActionState<RegisterState, FormData>(registerCustomer, {})
  const [deliverySame, setDeliverySame] = useState(true)

  const error = (field: string) => state.errors?.[field]

  return (
    <form action={action} className="space-y-8">
      {state.message && (
        <p className="flex items-start gap-2 rounded-lg border border-refused/20 bg-refused-soft px-3 py-2.5 text-small text-refused">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {state.message}
        </p>
      )}

      <Section title="Your business" description="This is what appears on your invoices and delivery notes.">
        <Field label="Business name" required error={error('businessName')}>
          <Input name="businessName" required autoComplete="organization" placeholder="The Copper Kettle" />
        </Field>

        <Field label="Type of business" required error={error('businessType')}>
          <Select name="businessType" required defaultValue="">
            <option value="" disabled>
              Choose one
            </option>
            {Object.entries(BUSINESS_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Contact name" required error={error('contactName')}>
          <Input name="contactName" required autoComplete="name" placeholder="Rowan Ellis" />
        </Field>
      </Section>

      <Section
        title="How we reach you"
        description="We send your sign-in code to your mobile, and invoices to your email."
      >
        <Field label="Mobile number" required error={error('mobile')}>
          <Input name="mobile" required inputMode="tel" autoComplete="tel" placeholder="07700 900123" className="tnum" />
        </Field>

        <Field label="Email address" required error={error('email')}>
          <Input name="email" type="email" required autoComplete="email" placeholder="orders@yourbusiness.co.uk" />
        </Field>

        <Field label="Other telephone number" error={error('altPhone')}>
          <Input name="altPhone" inputMode="tel" className="tnum" placeholder="020 0000 0000" />
        </Field>
      </Section>

      <Section title="Billing address" description="Where your invoices are addressed.">
        <Field label="Address line 1" required error={error('billingLine1')}>
          <Input name="billingLine1" required autoComplete="address-line1" />
        </Field>

        <Field label="Address line 2" error={error('billingLine2')}>
          <Input name="billingLine2" autoComplete="address-line2" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Town or city" required error={error('billingCity')}>
            <Input name="billingCity" required autoComplete="address-level2" />
          </Field>

          <Field label="Postcode" required error={error('billingPostcode')}>
            <Input name="billingPostcode" required autoComplete="postal-code" className="tnum uppercase" />
          </Field>
        </div>
      </Section>

      <Section title="Delivery address" description="Where the goods actually go.">
        <Checkbox
          name="deliverySameAsBilling"
          label="Same as my billing address"
          checked={deliverySame}
          onChange={(event) => setDeliverySame(event.target.checked)}
        />

        {!deliverySame && (
          <div className="mt-4 space-y-4 border-l-2 border-hairline pl-4">
            <Field label="Address line 1" required error={error('deliveryLine1')}>
              <Input name="deliveryLine1" autoComplete="shipping address-line1" />
            </Field>

            <Field label="Address line 2" error={error('deliveryLine2')}>
              <Input name="deliveryLine2" autoComplete="shipping address-line2" />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Town or city" required error={error('deliveryCity')}>
                <Input name="deliveryCity" autoComplete="shipping address-level2" />
              </Field>

              <Field label="Postcode" required error={error('deliveryPostcode')}>
                <Input name="deliveryPostcode" autoComplete="shipping postal-code" className="tnum uppercase" />
              </Field>
            </div>

            <Field label="Delivery instructions" hint="Gate codes, best times, where to leave pallets.">
              <Textarea name="deliveryInstructions" rows={2} />
            </Field>
          </div>
        )}
      </Section>

      <Section title="Company details" description="Helpful for our accounts team. Skip anything you do not have.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="VAT number" error={error('vatNumber')}>
            <Input name="vatNumber" className="tnum uppercase" placeholder="GB123456789" />
          </Field>

          <Field label="Company number" error={error('companyNumber')}>
            <Input name="companyNumber" className="tnum" placeholder="12345678" />
          </Field>
        </div>

        <Field label="Website" error={error('website')}>
          <Input name="website" type="url" placeholder="https://" />
        </Field>
      </Section>

      <Section title="Before you send">
        <div className="rounded-lg border border-hairline bg-surface p-4">
          <Checkbox
            name="acceptTerms"
            label="I accept the terms and conditions"
            required
          />
          {error('acceptTerms') && <p className="text-micro text-refused">{error('acceptTerms')}</p>}

          <Checkbox name="acceptPrivacy" label="I accept the privacy policy" required />
          {error('acceptPrivacy') && <p className="text-micro text-refused">{error('acceptPrivacy')}</p>}

          <Checkbox
            name="marketing"
            label="Send me occasional offers and new product news"
            description="Optional. You can turn this off at any time."
          />
        </div>
      </Section>

      <div className="flex flex-col gap-3 border-t border-hairline pt-6 sm:flex-row sm:items-center">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? 'Sending your application…' : 'Send application'}
        </Button>
        <p className="text-small text-ink-muted">
          We will text you a code to confirm your number, then review your application.
        </p>
      </div>
    </form>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="grid gap-4 md:grid-cols-[220px_1fr] md:gap-8">
      <div>
        <h2 className="text-lead font-semibold">{title}</h2>
        {description && <p className="mt-1 text-small text-ink-muted">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}
