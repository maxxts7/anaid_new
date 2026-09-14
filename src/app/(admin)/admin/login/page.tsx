'use client'

import { useActionState } from 'react'
import { AlertCircle } from 'lucide-react'
import { signInStaff, type StaffLoginState } from './actions'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'

export default function StaffLoginPage() {
  const [state, action, pending] = useActionState<StaffLoginState, FormData>(signInStaff, {})

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ground px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <p className="text-lead font-bold tracking-[-0.03em]">
            ANAID
          </p>
          <p className="text-small text-ink-muted">Staff dashboard</p>
        </div>

        <form action={action} className="space-y-4 rounded-lg border border-hairline bg-surface p-5">
          {state.message && (
            <p className="flex items-start gap-2 rounded-lg border border-refused/20 bg-refused-soft px-3 py-2.5 text-small text-refused">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {state.message}
            </p>
          )}

          <Field label="Email address" required>
            <Input name="email" type="email" required autoFocus autoComplete="username" />
          </Field>

          <Field label="Password" required>
            <Input name="password" type="password" required autoComplete="current-password" />
          </Field>

          <Button type="submit" className="w-full" size="lg" disabled={pending}>
            {pending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-4 text-center text-micro text-ink-faint">
          For ANAID staff. Customers sign in on the main site.
        </p>
      </div>
    </div>
  )
}
