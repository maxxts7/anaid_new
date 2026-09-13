import Link from 'next/link'
import type { Metadata } from 'next'
import { ShieldCheck } from 'lucide-react'
import { requireStaff } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'
import { BUSINESS_TYPE_LABELS } from '@/lib/business-types'

export const metadata: Metadata = { title: 'Approvals' }

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000

/**
 * The Customer Approvals queue (LEVEL-4 §10).
 *
 * Only verified applications appear, so abandoned registrations never clog it.
 * The oldest is at the top, and the age of each is spelled out, because the one
 * thing this queue must not do is let an application quietly sit for a week.
 */
export default async function ApprovalsPage() {
  await requireStaff('customers.approve')

  const [waiting, unverified] = await Promise.all([
    prisma.customer.findMany({
      where: { status: 'PENDING_APPROVAL' },
      orderBy: { verifiedAt: 'asc' },
      include: { _count: { select: { notes: true } } },
    }),
    // Gap #21 — registrations that verified nothing and were never chased.
    prisma.customer.count({
      where: { status: 'REGISTERED', createdAt: { lt: new Date(Date.now() - THIRTY_DAYS) } },
    }),
  ])

  return (
    <div className="p-4 lg:p-6">
      <h1 className="text-display font-semibold">Customer approvals</h1>
      <p className="mt-1 text-ink-muted">
        {waiting.length === 0
          ? 'Nothing is waiting.'
          : `${waiting.length} ${waiting.length === 1 ? 'application' : 'applications'} waiting for a decision.`}
      </p>

      {waiting.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-hairline-strong bg-surface px-6 py-16 text-center">
          <ShieldCheck className="mx-auto size-6 text-approved" />
          <p className="mt-3 font-medium">The queue is clear</p>
          <p className="mt-1 text-small text-ink-muted">
            New applications appear here as soon as a business confirms its contact details.
          </p>
        </div>
      ) : (
        <div className="table-scroll mt-6 rounded-lg border border-hairline bg-surface shadow-xs">
          <table className="w-full min-w-[820px] text-small">
            <thead className="border-b border-hairline bg-sunken text-left">
              <tr>
                <th className="px-4 py-2.5 font-medium">Business</th>
                <th className="px-4 py-2.5 font-medium">Contact</th>
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">Area</th>
                <th className="px-4 py-2.5 font-medium">Waiting</th>
                <th className="px-4 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {waiting.map((customer) => {
                const since = customer.verifiedAt ?? customer.createdAt
                const days = Math.floor((Date.now() - since.getTime()) / (24 * 60 * 60 * 1000))

                return (
                  <tr key={customer.id} className="border-b border-hairline last:border-b-0 hover:bg-sunken">
                    <td className="px-4 py-3">
                      <Link href={`/admin/customers/${customer.id}`} className="font-medium hover:text-accent">
                        {customer.businessName}
                      </Link>
                      {customer.infoRequested && (
                        <span className="ml-2 rounded-sm bg-pending-soft px-1.5 py-0.5 text-micro text-pending">
                          Waiting on them
                        </span>
                      )}
                      {customer._count.notes > 0 && (
                        <span className="ml-2 text-micro text-ink-faint">{customer._count.notes} note(s)</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {customer.contactName}
                      <span className="tnum mt-0.5 block text-micro text-ink-muted">{customer.mobile}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{BUSINESS_TYPE_LABELS[customer.businessType]}</td>
                    <td className="tnum px-4 py-3 text-ink-muted">{customer.postcode}</td>
                    <td className="tnum px-4 py-3">
                      <span className={days >= 2 ? 'font-medium text-pending' : 'text-ink-muted'}>
                        {days === 0 ? 'Today' : days === 1 ? '1 day' : `${days} days`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="rounded-sm border border-hairline-strong px-2.5 py-1 font-medium hover:bg-sunken"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {unverified > 0 && (
        <p className="mt-4 text-small text-ink-muted">
          {unverified} registration{unverified === 1 ? '' : 's'} older than 30 days never confirmed their
          contact details. They are not shown here and cannot do anything.
        </p>
      )}
    </div>
  )
}
