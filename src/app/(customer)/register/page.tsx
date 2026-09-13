import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { RegisterForm } from '@/components/customer/register-form'
import { getCustomerSession } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Open a trade account' }

export default async function RegisterPage() {
  const session = await getCustomerSession()
  if (session) redirect('/account')

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      <h1 className="text-display font-semibold">Open a trade account</h1>
      <p className="mt-2 max-w-xl text-lead text-ink-muted">
        We supply businesses only. Tell us about yours and we will set up your account with the right
        pricing.
      </p>

      <ol className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { step: 1, title: 'Send your details', body: 'Takes about two minutes.' },
          { step: 2, title: 'Confirm your number', body: 'We text you a short code.' },
          { step: 3, title: 'We approve you', body: 'Usually within one working day. Then prices appear.' },
        ].map((item) => (
          <li key={item.step} className="rounded-lg border border-hairline bg-surface shadow-xs p-4">
            <span className="tnum flex size-6 items-center justify-center rounded-full bg-ink text-micro font-semibold text-ink-inverse">
              {item.step}
            </span>
            <p className="mt-2.5 font-medium">{item.title}</p>
            <p className="mt-0.5 text-small text-ink-muted">{item.body}</p>
          </li>
        ))}
      </ol>

      <div className="mt-10 border-t border-hairline pt-8">
        <RegisterForm />
      </div>

      <p className="mt-8 text-small text-ink-muted">
        Already applied?{' '}
        <Link href="/login" className="font-medium text-accent underline underline-offset-2">
          Sign in to check your status
        </Link>
      </p>
    </div>
  )
}
