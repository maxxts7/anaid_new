'use client'

import { useActionState } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { updateSettings, type SettingsState } from '@/app/(admin)/admin/settings/actions'
import { Button } from '@/components/ui/button'
import { Checkbox, Field, Input } from '@/components/ui/field'

export type SettingField = {
  key: string
  label: string
  description?: string
  kind: 'STRING' | 'INT' | 'BOOL' | 'JSON'
  money?: boolean
  rate?: boolean
  /** Already converted for display: pounds for money, per cent for rates. */
  value: string
  checked?: boolean
}

export function SettingsGroupForm({ group, fields }: { group: string; fields: SettingField[] }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(updateSettings, {})

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="group" value={group} />

      {state.message && (
        <p
          className={`flex items-start gap-2 rounded-sm px-3 py-2 text-small ${
            state.ok ? 'bg-approved-soft text-approved' : 'bg-refused-soft text-refused'
          }`}
        >
          {state.ok ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
          )}
          {state.message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) =>
          field.kind === 'BOOL' ? (
            <div key={field.key} className="sm:col-span-2">
              <Checkbox
                name={field.key}
                label={field.label}
                description={field.description}
                defaultChecked={field.checked}
              />
            </div>
          ) : (
            <Field
              key={field.key}
              label={field.money ? `${field.label} (£)` : field.rate ? `${field.label} (%)` : field.label}
              hint={field.description}
              required
              className={field.kind === 'STRING' && !field.money ? 'sm:col-span-2' : ''}
            >
              <Input
                name={field.key}
                defaultValue={field.value}
                inputMode={field.money || field.rate || field.kind === 'INT' ? 'decimal' : undefined}
                className={field.money || field.rate || field.kind === 'INT' ? 'tnum' : ''}
              />
            </Field>
          )
        )}
      </div>

      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  )
}
