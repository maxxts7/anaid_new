import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/customer/auth-forms'
import { getCustomerSession } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Sign in' }

export default async function LoginPage() {
  const session = await getCustomerSession()
  if (session) redirect('/account')

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-display font-bold">Sign in</h1>
      <p className="mt-2 text-ink-muted">
        We send a short code to your mobile or email. No password to remember.
      </p>

      <div className="mt-8 rounded-lg border border-hairline bg-surface p-5">
        <LoginForm />
      </div>
    </div>
  )
}
