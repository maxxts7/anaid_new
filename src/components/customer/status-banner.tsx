import Link from 'next/link'
import { getCustomerSession } from '@/lib/auth/session'
import type { AccountStatus } from '@/generated/prisma/client'

/**
 * The banner that tells a customer where they stand.
 *
 * Shown on every screen until the account is approved, because the single most
 * confusing thing this system can do is let someone browse a catalogue for ten
 * minutes without explaining why there are no prices on it.
 */
export async function StatusBanner() {
  const session = await getCustomerSession()
  if (!session || session.customer.status === 'APPROVED') return null

  const status: AccountStatus = session.customer.status

  const copy: Record<Exclude<AccountStatus, 'APPROVED'>, { text: string; tone: string }> = {
    REGISTERED: {
      text: 'Your contact details are not verified yet. Enter the code we sent to finish signing up.',
      tone: 'bg-pending-soft text-pending border-pending/20',
    },
    PENDING_APPROVAL: {
      text: 'Your account is awaiting approval from ANAID. You can browse the catalogue now; prices appear once you are approved.',
      tone: 'bg-pending-soft text-pending border-pending/20',
    },
    REJECTED: {
      text: 'Your account application was not approved. Please contact us if you think this is wrong.',
      tone: 'bg-refused-soft text-refused border-refused/20',
    },
    SUSPENDED: {
      text: 'Your account is suspended. You can still see your orders and invoices. Please contact ANAID.',
      tone: 'bg-refused-soft text-refused border-refused/20',
    },
  }

  const { text, tone } = copy[status]

  return (
    <div className={`border-b px-4 py-2.5 ${tone}`}>
      <p className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-2 gap-y-1 text-small">
        {text}
        <Link href="/account/status" className="font-medium underline underline-offset-2">
          What this means
        </Link>
      </p>
    </div>
  )
}
