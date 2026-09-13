'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { requestLoginCode, type LoginState } from '@/app/(customer)/login/actions'
import { resendCode, submitCode, type VerifyState } from '@/app/(customer)/verify/actions'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(requestLoginCode, {})

  return (
    <form action={action} className="space-y-4">
      {state.message && <FormError>{state.message}</FormError>}

      <Field label="Mobile number or email address" required>
        <Input
          name="identifier"
          required
          autoFocus
          autoComplete="username"
          placeholder="07700 900123"
          className="tnum"
        />
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? 'Sending code…' : 'Send me a code'}
      </Button>

      <p className="text-center text-small text-ink-muted">
        No account yet?{' '}
        <Link href="/register" className="font-medium text-accent underline underline-offset-2">
          Open a trade account
        </Link>
      </p>
    </form>
  )
}

export function VerifyForm({
  to,
  purpose,
  codeLength,
  pinned,
}: {
  to: string
  purpose: 'registration' | 'login'
  codeLength: number
  pinned: boolean
}) {
  const [state, action, pending] = useActionState<VerifyState, FormData>(submitCode, {})
  const [resendState, resendAction, resending] = useActionState<VerifyState, FormData>(resendCode, {})

  return (
    <div className="space-y-4">
      <form action={action} className="space-y-4">
        <input type="hidden" name="to" value={to} />
        <input type="hidden" name="purpose" value={purpose} />

        {state.message && <FormError>{state.message}</FormError>}
        {resendState.sent && (
          <p className="flex items-center gap-2 rounded-lg border border-approved/20 bg-approved-soft px-3 py-2.5 text-small text-approved">
            <CheckCircle2 className="size-4 shrink-0" />
            {resendState.sent}
          </p>
        )}

        <Field label={`Your ${codeLength}-digit code`} required>
          <Input
            name="code"
            required
            autoFocus
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={codeLength}
            autoComplete="one-time-code"
            className="tnum h-14 text-center text-display tracking-[0.5em] font-semibold"
          />
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? 'Checking…' : 'Confirm'}
        </Button>
      </form>

      {pinned && (
        <p className="rounded-lg border border-pending/20 bg-pending-soft px-3 py-2.5 text-small text-pending">
          Text messaging is not switched on yet, so no code has been sent. Use <strong>1234</strong> to
          continue.
        </p>
      )}

      <form action={resendAction} className="text-center">
        <input type="hidden" name="to" value={to} />
        <input type="hidden" name="purpose" value={purpose} />
        <button
          type="submit"
          disabled={resending}
          className="text-small text-ink-muted underline underline-offset-2 hover:text-ink disabled:opacity-50"
        >
          {resending ? 'Sending…' : 'Send a new code'}
        </button>
      </form>
    </div>
  )
}

function FormError({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-lg border border-refused/20 bg-refused-soft px-3 py-2.5 text-small text-refused">
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      {children}
    </p>
  )
}
