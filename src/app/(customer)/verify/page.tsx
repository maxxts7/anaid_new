import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { VerifyForm } from '@/components/customer/auth-forms'
import { isOtpPinned } from '@/lib/otp'
import { getSettings } from '@/lib/settings'

export const metadata: Metadata = { title: 'Confirm your code' }

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string; purpose?: string }>
}) {
  const { to, purpose } = await searchParams
  if (!to) redirect('/login')

  const settings = await getSettings()
  const isRegistration = purpose === 'registration'
  const viaEmail = to.includes('@')

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-display font-semibold">
        {isRegistration ? 'Confirm your details' : 'Check your messages'}
      </h1>
      <p className="mt-2 text-ink-muted">
        We sent a {settings['otp.codeLength']}-digit code to{' '}
        <span className={viaEmail ? 'font-medium text-ink' : 'tnum font-medium text-ink'}>{to}</span>. It
        is valid for {settings['otp.expiryMinutes']} minutes.
      </p>

      <div className="mt-8 rounded-lg border border-hairline bg-surface shadow-xs p-5">
        <VerifyForm
          to={to}
          purpose={isRegistration ? 'registration' : 'login'}
          codeLength={settings['otp.codeLength']}
          pinned={isOtpPinned}
        />
      </div>

      {isRegistration && (
        <p className="mt-6 text-small text-ink-muted">
          Confirming your number is not the same as being approved. Once confirmed, your application goes
          to ANAID for review, and prices appear on your account when it is approved.
        </p>
      )}
    </div>
  )
}
