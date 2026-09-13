import type { Metadata } from 'next'
import { SettingsGroupForm, type SettingField } from '@/components/admin/settings-form'
import { requireStaff } from '@/lib/auth/guards'
import { getSettings, SETTING_DEFINITIONS, SETTING_GROUPS } from '@/lib/settings'
import { penceToInput } from '@/lib/money'
import { isOtpPinned } from '@/lib/otp'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  await requireStaff('settings.manage')
  const settings = await getSettings()

  return (
    <div className="p-4 lg:p-6">
      <h1 className="text-display font-semibold">Settings</h1>
      <p className="mt-1 max-w-xl text-ink-muted">
        These values drive the whole system. Changing the free-delivery threshold here changes what every
        customer sees at checkout, immediately.
      </p>

      {isOtpPinned && (
        <p className="mt-4 max-w-2xl rounded-lg border border-pending/20 bg-pending-soft px-3 py-2.5 text-small text-pending">
          Sign-in codes are pinned to a fixed value while text messaging is being set up, so the code
          length and expiry below have no effect yet. Remove OTP_FIXED_CODE from the environment to switch
          real codes on.
        </p>
      )}

      <div className="mt-6 max-w-3xl space-y-4">
        {SETTING_GROUPS.map((group) => {
          const fields: SettingField[] = SETTING_DEFINITIONS.filter(
            (definition) => definition.group === group.id
          ).map((definition) => {
            const value = settings[definition.key as keyof typeof settings]
            const money = 'money' in definition && definition.money
            const rate = 'rate' in definition && definition.rate

            return {
              key: definition.key,
              label: definition.label,
              description: 'description' in definition ? definition.description : undefined,
              kind: definition.kind,
              money,
              rate,
              checked: definition.kind === 'BOOL' ? Boolean(value) : undefined,
              value: money
                ? penceToInput(Number(value))
                : rate
                  ? (Number(value) / 100).toFixed(2)
                  : String(value),
            }
          })

          return (
            <section key={group.id} className="overflow-hidden rounded-lg border border-hairline bg-surface shadow-xs">
              <div className="border-b border-hairline px-5 py-3">
                <h2 className="font-medium">{group.label}</h2>
                <p className="mt-0.5 text-small text-ink-muted">{group.description}</p>
              </div>
              <div className="p-5">
                <SettingsGroupForm group={group.id} fields={fields} />
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
