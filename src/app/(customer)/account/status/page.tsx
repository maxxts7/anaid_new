import type { Metadata } from 'next'
import Link from 'next/link'
import { Clock, ShieldCheck, ShieldX, Pause } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { requireCustomer } from '@/lib/auth/guards'
import { getSettings } from '@/lib/settings'
import type { AccountStatus } from '@/generated/prisma/client'

export const metadata: Metadata = { title: 'Your account status' }

/**
 * The holding screens (LEVEL-4 §12).
 *
 * Every unapproved customer ends up here. It has one job: say plainly where the
 * account stands, what they can do meanwhile, and what happens next. No dead
 * ends — every state offers the catalogue, because browsing is always allowed.
 */
export default async function AccountStatusPage() {
  const session = await requireCustomer()
  const settings = await getSettings()
  const status: AccountStatus = session.customer.status

  const content: Record<
    AccountStatus,
    { icon: typeof Clock; tone: string; heading: string; body: string; next: string }
  > = {
    REGISTERED: {
      icon: Clock,
      tone: 'text-pending',
      heading: 'Confirm your contact details',
      body: 'We sent you a code but it has not been entered yet. Until it is, your application has not reached us.',
      next: 'Enter the code to send your application to ANAID.',
    },
    PENDING_APPROVAL: {
      icon: Clock,
      tone: 'text-pending',
      heading: 'Your account is awaiting approval',
      body: `Your contact details are confirmed and your application is with ANAID. We review applications by hand, usually within one working day.`,
      next: 'When we approve you, your prices appear across the catalogue and you can start ordering.',
    },
    APPROVED: {
      icon: ShieldCheck,
      tone: 'text-approved',
      heading: 'Your account is approved',
      body: `You are trading on account ${session.customer.customerNumber ?? ''}. Your prices are shown throughout the catalogue.`,
      next: 'Browse the catalogue and place an order.',
    },
    REJECTED: {
      icon: ShieldX,
      tone: 'text-refused',
      heading: 'Your application was not approved',
      body: 'We are not able to open a trade account for you at the moment. You are welcome to browse the catalogue.',
      next: `If you think this is a mistake, contact us on ${settings['company.phone']}.`,
    },
    SUSPENDED: {
      icon: Pause,
      tone: 'text-refused',
      heading: 'Your account is suspended',
      body: 'You cannot place new orders at the moment. You can still see your existing orders and invoices, and any order already in progress will be delivered.',
      next: `Please contact ANAID on ${settings['company.phone']} to put this right.`,
    },
  }

  const { icon: Icon, tone, heading, body, next } = content[status]

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <Icon className={`size-7 ${tone}`} />
      <h1 className="mt-4 text-display font-semibold">{heading}</h1>
      <p className="mt-3 text-lead text-ink-muted">{body}</p>

      <div className="mt-6 rounded-lg border border-hairline bg-surface shadow-xs p-4">
        <p className="text-small font-medium">What happens next</p>
        <p className="mt-1 text-small text-ink-muted">{next}</p>
      </div>

      <dl className="mt-6 overflow-hidden rounded-lg border border-hairline bg-surface shadow-xs text-small">
        <Row label="Business" value={session.customer.businessName} />
        <Row label="Contact" value={session.customer.contactName} />
        <Row label="Mobile" value={session.customer.mobile} tabular />
        <Row label="Email" value={session.customer.email} />
        {session.customer.customerNumber && (
          <Row label="Account number" value={session.customer.customerNumber} tabular />
        )}
      </dl>

      <div className="mt-6 flex flex-wrap gap-2">
        <ButtonLink href="/products">Browse the catalogue</ButtonLink>
        {status === 'REGISTERED' && (
          <ButtonLink href={`/verify?to=${encodeURIComponent(session.customer.mobile)}&purpose=registration`} variant="secondary">
            Enter your code
          </ButtonLink>
        )}
      </div>

      <p className="mt-8 text-small text-ink-muted">
        Questions? Call {settings['company.phone']} or email{' '}
        <Link href={`mailto:${settings['company.email']}`} className="text-accent underline underline-offset-2">
          {settings['company.email']}
        </Link>
        .
      </p>
    </div>
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
