import type { Metadata } from 'next'
import { AccountStatusBadge } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { requireCustomer } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'
import { formatPence } from '@/lib/money'
import { outstandingBalancePence } from '@/lib/basket'
import { canSeePrices } from '@/lib/permissions'
import { signOut } from './actions'

export const metadata: Metadata = { title: 'Your account' }

export default async function AccountPage() {
  const session = await requireCustomer()
  const { customer } = session
  const approved = canSeePrices(customer.status)

  const [addresses, users, outstandingPence] = await Promise.all([
    prisma.address.findMany({
      where: { customerId: customer.id, archivedAt: null },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.customerUser.findMany({
      where: { customerId: customer.id, disabledAt: null },
      orderBy: { createdAt: 'asc' },
    }),
    approved ? outstandingBalancePence(customer.id) : Promise.resolve(0),
  ])

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-display font-bold">{customer.businessName}</h1>
          {customer.customerNumber && (
            <p className="tnum mt-1 text-small text-ink-muted">Account {customer.customerNumber}</p>
          )}
        </div>
        <AccountStatusBadge status={customer.status} />
      </div>

      {approved && (
        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <Tile label="Pricing level" value={customer.pricingLevel?.name ?? 'Standard'} />
          <Tile
            label="Credit limit"
            value={customer.creditLimitPence > 0 ? formatPence(customer.creditLimitPence) : 'Pay before dispatch'}
            tabular
          />
          <Tile label="Currently owed" value={formatPence(outstandingPence)} tabular />
        </section>
      )}

      <Section title="Business details">
        <Row label="Contact" value={customer.contactName} />
        <Row label="Email" value={customer.email} />
        <Row label="Mobile" value={customer.mobile} tabular />
        {customer.altPhone && <Row label="Other telephone" value={customer.altPhone} tabular />}
        {customer.vatNumber && <Row label="VAT number" value={customer.vatNumber} tabular />}
        {customer.companyNumber && <Row label="Company number" value={customer.companyNumber} tabular />}
        {customer.paymentTermsDays > 0 && (
          <Row label="Payment terms" value={`${customer.paymentTermsDays} days from invoice`} />
        )}
      </Section>

      <Section
        title="Addresses"
        description="To change an address, contact ANAID — we keep them in step with your invoices."
      >
        {addresses.map((address) => (
          <div key={address.id} className="border-b border-hairline px-4 py-3 last:border-b-0">
            <p className="text-small font-medium">
              {address.label ?? 'Address'}
              {address.isDefaultDelivery && <span className="ml-2 text-micro text-ink-muted">Delivery</span>}
              {address.isDefaultBilling && <span className="ml-2 text-micro text-ink-muted">Billing</span>}
            </p>
            <p className="tnum mt-0.5 text-small text-ink-muted">
              {[address.line1, address.line2, address.city, address.postcode].filter(Boolean).join(', ')}
            </p>
          </div>
        ))}
      </Section>

      <Section title="People who can order" description="Ask ANAID to add a colleague to your account.">
        {users.map((user) => (
          <div key={user.id} className="flex flex-wrap justify-between gap-2 border-b border-hairline px-4 py-3 last:border-b-0">
            <div>
              <p className="text-small font-medium">
                {user.name}
                {user.isPrimary && <span className="ml-2 text-micro text-ink-muted">Main contact</span>}
              </p>
              <p className="tnum mt-0.5 text-small text-ink-muted">{user.email}</p>
            </div>
            {user.lastLoginAt && (
              <p className="tnum text-micro text-ink-faint">
                Last signed in {user.lastLoginAt.toLocaleDateString('en-GB')}
              </p>
            )}
          </div>
        ))}
      </Section>

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-hairline pt-6">
        <ButtonLink href="/orders" variant="secondary">
          Your orders
        </ButtonLink>
        <form action={signOut}>
          <Button type="submit" variant="quiet">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  )
}

function Tile({ label, value, tabular }: { label: string; value: string; tabular?: boolean }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface p-3">
      <p className="text-micro text-ink-muted">{label}</p>
      <p className={`mt-1 font-semibold ${tabular ? 'tnum' : ''}`}>{value}</p>
    </div>
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
    <section className="mt-8">
      <h2 className="text-lead font-semibold">{title}</h2>
      {description && <p className="mt-1 text-small text-ink-muted">{description}</p>}
      <dl className="mt-3 overflow-hidden rounded-lg border border-hairline bg-surface text-small">
        {children}
      </dl>
    </section>
  )
}

function Row({ label, value, tabular }: { label: string; value: string; tabular?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-hairline px-4 py-2.5 last:border-b-0">
      <dt className="text-ink-muted">{label}</dt>
      <dd className={tabular ? 'tnum font-medium' : 'font-medium'}>{value}</dd>
    </div>
  )
}
