import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import {
  ApproveForm,
  NoteForm,
  ReinstateForm,
  RejectForm,
  RequestInfoForm,
  SuspendForm,
  TermsForm,
} from '@/components/admin/customer-decisions'
import { AccountStatusBadge, OrderStatusBadge } from '@/components/ui/badge'
import { requireStaff } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'
import { formatPence, penceToInput } from '@/lib/money'
import { outstandingBalancePence } from '@/lib/basket'
import { staffCan } from '@/lib/permissions'
import { BUSINESS_TYPE_LABELS } from '@/lib/business-types'

export const metadata: Metadata = { title: 'Customer' }

export default async function AdminCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { staff } = await requireStaff('customers.view')

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      pricingLevel: true,
      addresses: { where: { archivedAt: null }, orderBy: { createdAt: 'asc' } },
      users: { orderBy: { createdAt: 'asc' } },
      notes: { orderBy: { createdAt: 'desc' }, include: { staff: { select: { name: true } } } },
      orders: { orderBy: { placedAt: 'desc' }, take: 5 },
      approvedBy: { select: { name: true } },
      customerPrices: { include: { product: { select: { sku: true, name: true } } } },
    },
  })

  if (!customer) notFound()

  const [levels, outstandingPence] = await Promise.all([
    prisma.pricingLevel.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
    outstandingBalancePence(customer.id),
  ])

  const canApprove = staffCan(staff.roles, 'customers.approve')
  const canSetTerms = staffCan(staff.roles, 'customers.credit')

  return (
    <div className="p-4 lg:p-6">
      <Link
        href="/admin/approvals"
        className="inline-flex items-center gap-1 text-small text-ink-muted hover:text-ink"
      >
        <ChevronLeft className="size-4" />
        Approvals
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-display font-bold">{customer.businessName}</h1>
          <p className="tnum mt-1 text-small text-ink-muted">
            {customer.customerNumber ?? 'No account number yet'} — applied{' '}
            {customer.createdAt.toLocaleDateString('en-GB')}
            {customer.approvedBy && ` — approved by ${customer.approvedBy.name}`}
          </p>
        </div>
        <AccountStatusBadge status={customer.status} />
      </div>

      {customer.infoRequested && customer.infoRequestedMessage && (
        <p className="mt-4 rounded-lg border border-pending/20 bg-pending-soft px-3 py-2.5 text-small text-pending">
          Waiting on the customer: “{customer.infoRequestedMessage}”
        </p>
      )}

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Panel title="Application">
            <Row label="Contact name" value={customer.contactName} />
            <Row label="Email" value={customer.email} />
            <Row label="Mobile" value={customer.mobile} tabular />
            {customer.altPhone && <Row label="Other telephone" value={customer.altPhone} tabular />}
            <Row label="Business type" value={BUSINESS_TYPE_LABELS[customer.businessType]} />
            {customer.website && <Row label="Website" value={customer.website} />}
            {customer.vatNumber && <Row label="VAT number" value={customer.vatNumber} tabular />}
            {customer.companyNumber && <Row label="Company number" value={customer.companyNumber} tabular />}
            <Row
              label="Contact verified"
              value={customer.verifiedAt ? customer.verifiedAt.toLocaleString('en-GB') : 'Not verified'}
              tabular
            />
            <Row
              label="Terms accepted"
              value={customer.termsAcceptedAt ? customer.termsAcceptedAt.toLocaleString('en-GB') : '—'}
              tabular
            />
            <Row label="Marketing consent" value={customer.marketingConsent ? 'Yes' : 'No'} />
          </Panel>

          <Panel title="Addresses">
            {customer.addresses.map((address) => (
              <div key={address.id} className="border-b border-hairline px-4 py-2.5 last:border-b-0">
                <p className="text-small font-medium">
                  {address.label ?? 'Address'}
                  {address.isDefaultDelivery && <span className="ml-2 text-micro text-ink-muted">Delivery</span>}
                  {address.isDefaultBilling && <span className="ml-2 text-micro text-ink-muted">Billing</span>}
                </p>
                <p className="tnum mt-0.5 text-small text-ink-muted">
                  {[address.line1, address.line2, address.city, address.postcode].filter(Boolean).join(', ')}
                </p>
                {address.deliveryInstructions && (
                  <p className="mt-1 text-micro text-ink-muted">{address.deliveryInstructions}</p>
                )}
              </div>
            ))}
          </Panel>

          <Panel title="People with access">
            {customer.users.map((user) => (
              <div key={user.id} className="flex justify-between gap-3 border-b border-hairline px-4 py-2.5 last:border-b-0">
                <div>
                  <p className="text-small font-medium">
                    {user.name}
                    {user.isPrimary && <span className="ml-2 text-micro text-ink-muted">Main contact</span>}
                  </p>
                  <p className="tnum mt-0.5 text-micro text-ink-muted">
                    {user.email} — {user.mobile}
                  </p>
                </div>
                <p className="tnum text-micro text-ink-faint">
                  {user.lastLoginAt ? `Last in ${user.lastLoginAt.toLocaleDateString('en-GB')}` : 'Never signed in'}
                </p>
              </div>
            ))}
          </Panel>

          {customer.customerPrices.length > 0 && (
            <Panel title="Agreed prices">
              {customer.customerPrices.map((price) => (
                <div key={price.id} className="flex justify-between gap-3 border-b border-hairline px-4 py-2.5 last:border-b-0">
                  <div>
                    <p className="text-small font-medium">{price.product.name}</p>
                    <p className="tnum mt-0.5 text-micro text-ink-muted">{price.product.sku}</p>
                  </div>
                  <p className="tnum font-medium">{formatPence(price.pricePence)}</p>
                </div>
              ))}
            </Panel>
          )}

          {customer.orders.length > 0 && (
            <Panel title="Recent orders">
              {customer.orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.orderNumber}`}
                  className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-2.5 last:border-b-0 hover:bg-sunken"
                >
                  <div>
                    <p className="tnum text-small font-medium">{order.orderNumber}</p>
                    <p className="tnum mt-0.5 text-micro text-ink-muted">
                      {order.placedAt.toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <OrderStatusBadge status={order.status} />
                    <span className="tnum text-small font-medium">{formatPence(order.totalPence)}</span>
                  </div>
                </Link>
              ))}
            </Panel>
          )}
        </div>

        <div className="space-y-4">
          {customer.status === 'PENDING_APPROVAL' && canApprove && (
            <Panel title="Decision" padded>
              <ApproveForm customerId={customer.id} levels={levels} />

              <div className="mt-5 space-y-4 border-t border-hairline pt-4">
                <RequestInfoForm customerId={customer.id} />
                <RejectForm customerId={customer.id} />
              </div>
            </Panel>
          )}

          {customer.status === 'APPROVED' && (
            <>
              <Panel title="Trading position" padded>
                <dl className="space-y-2 text-small">
                  <RowInline label="Pricing level" value={customer.pricingLevel?.name ?? 'List price'} />
                  <RowInline label="Credit limit" value={formatPence(customer.creditLimitPence)} />
                  <RowInline label="Outstanding" value={formatPence(outstandingPence)} />
                  <RowInline
                    label="Available credit"
                    value={formatPence(Math.max(0, customer.creditLimitPence - outstandingPence))}
                  />
                </dl>
              </Panel>

              {canSetTerms && (
                <Panel title="Commercial terms" padded>
                  <TermsForm
                    customerId={customer.id}
                    levels={levels}
                    currentLevelId={customer.pricingLevelId}
                    creditLimit={penceToInput(customer.creditLimitPence)}
                    paymentTermsDays={customer.paymentTermsDays}
                  />
                </Panel>
              )}

              {staffCan(staff.roles, 'customers.edit') && (
                <Panel title="Account" padded>
                  <SuspendForm customerId={customer.id} />
                </Panel>
              )}
            </>
          )}

          {(customer.status === 'SUSPENDED' || customer.status === 'REJECTED') && canApprove && (
            <Panel title="Reinstate" padded>
              <p className="mb-3 text-small text-ink-muted">
                {customer.status === 'SUSPENDED'
                  ? customer.suspensionReason ?? 'Suspended.'
                  : customer.rejectionReason ?? 'Application rejected.'}
              </p>
              <ReinstateForm customerId={customer.id} />
            </Panel>
          )}

          <Panel title="Internal notes" padded>
            <NoteForm customerId={customer.id} />

            {customer.notes.length > 0 && (
              <ul className="mt-4 space-y-3 border-t border-hairline pt-3">
                {customer.notes.map((note) => (
                  <li key={note.id}>
                    <p className="text-small">{note.body}</p>
                    <p className="tnum mt-0.5 text-micro text-ink-faint">
                      {note.staff?.name ?? 'System'} — {note.createdAt.toLocaleDateString('en-GB')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}

function Panel({
  title,
  children,
  padded,
}: {
  title: string
  children: React.ReactNode
  padded?: boolean
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-hairline bg-surface">
      <h2 className="border-b border-hairline px-4 py-2.5 font-medium">{title}</h2>
      <div className={padded ? 'p-4' : ''}>{children}</div>
    </section>
  )
}

function Row({ label, value, tabular }: { label: string; value: string; tabular?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-hairline px-4 py-2 text-small last:border-b-0">
      <span className="text-ink-muted">{label}</span>
      <span className={tabular ? 'tnum font-medium' : 'font-medium'}>{value}</span>
    </div>
  )
}

function RowInline({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="tnum font-medium">{value}</dd>
    </div>
  )
}
