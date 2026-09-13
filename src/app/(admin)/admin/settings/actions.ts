'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireStaff } from '@/lib/auth/guards'
import { recordAudit } from '@/lib/audit'
import { parsePence } from '@/lib/money'
import { SETTING_DEFINITIONS, invalidateSettingsCache } from '@/lib/settings'

export type SettingsState = { message?: string; ok?: boolean }

/**
 * Settings are edited as a group at a time. Money is typed in pounds and stored
 * in pence; rates are typed in per cent and stored in basis points. Nothing in
 * the database ever holds a fraction.
 */
export async function updateSettings(
  _previous: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const { staff } = await requireStaff('settings.manage')

  const group = String(formData.get('group') ?? '')
  const definitions = SETTING_DEFINITIONS.filter((definition) => definition.group === group)

  if (definitions.length === 0) return { message: 'Nothing to save.' }

  const changes: Record<string, string> = {}

  for (const definition of definitions) {
    const raw = formData.get(definition.key)

    let value: string

    if (definition.kind === 'BOOL') {
      value = raw === 'on' ? 'true' : 'false'
    } else if ('money' in definition && definition.money) {
      try {
        value = String(parsePence(String(raw ?? '0')))
      } catch {
        return { message: `${definition.label}: enter an amount in pounds, for example 250 or 250.00.` }
      }
    } else if ('rate' in definition && definition.rate) {
      const percent = Number(raw)
      if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
        return { message: `${definition.label}: enter a percentage between 0 and 100.` }
      }
      value = String(Math.round(percent * 100))
    } else if (definition.kind === 'INT') {
      const number = Number(raw)
      if (!Number.isFinite(number)) return { message: `${definition.label}: enter a whole number.` }
      value = String(Math.trunc(number))
    } else {
      value = String(raw ?? '')
    }

    changes[definition.key] = value
  }

  await prisma.$transaction(
    Object.entries(changes).map(([key, value]) =>
      prisma.setting.update({ where: { key }, data: { value } })
    )
  )

  invalidateSettingsCache()

  await recordAudit({
    actorType: 'STAFF',
    actorId: staff.id,
    actorLabel: staff.name,
    action: 'settings.updated',
    entityType: 'Setting',
    entityId: group,
    after: changes,
  })

  revalidatePath('/admin/settings')
  revalidatePath('/', 'layout')

  return { ok: true, message: 'Saved.' }
}
