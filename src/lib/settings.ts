import { prisma } from './db'

/**
 * Everything configurable in one place.
 *
 * The admin settings screen renders itself from these definitions, the seed
 * writes them as defaults, and `getSettings()` reads them back typed. Adding a
 * setting means adding one entry here and nothing else.
 *
 * Money is in pence and rates are in basis points, exactly as in the database.
 */

export type SettingKind = 'STRING' | 'INT' | 'BOOL' | 'JSON'

type Definition = {
  key: string
  kind: SettingKind
  group: string
  label: string
  description?: string
  default: string | number | boolean
  /** Render as a £ field over an integer-pence value. */
  money?: boolean
  /** Render as a % field over an integer basis-points value. */
  rate?: boolean
}

export const SETTING_DEFINITIONS = [
  // --- Company -------------------------------------------------------------
  { key: 'company.name', kind: 'STRING', group: 'company', label: 'Company name', default: 'ANAID Quality Disposables Limited' },
  { key: 'company.email', kind: 'STRING', group: 'company', label: 'Sales email', default: 'sales@anaid.co.uk' },
  { key: 'company.phone', kind: 'STRING', group: 'company', label: 'Telephone', default: '020 0000 0000' },
  { key: 'company.website', kind: 'STRING', group: 'company', label: 'Website', default: 'https://www.anaid.co.uk' },
  { key: 'company.address', kind: 'STRING', group: 'company', label: 'Registered address', default: 'Unit 1, Example Industrial Estate, London' },
  { key: 'company.vatNumber', kind: 'STRING', group: 'company', label: 'VAT number', default: 'GB000000000' },
  { key: 'company.companyNumber', kind: 'STRING', group: 'company', label: 'Company number', default: '00000000' },
  { key: 'company.logoUrl', kind: 'STRING', group: 'company', label: 'Logo URL', description: 'Shown in the header and on invoices. Leave blank for the wordmark.', default: '' },

  // --- Commercial ----------------------------------------------------------
  {
    key: 'commerce.vatDefaultBasisPoints',
    kind: 'INT',
    group: 'commerce',
    label: 'Default VAT rate',
    description: 'Applied to new products. Individual products may be zero-rated.',
    default: 2000,
    rate: true,
  },
  {
    key: 'commerce.deliveryFreeThresholdPence',
    kind: 'INT',
    group: 'commerce',
    label: 'Free delivery above',
    description: 'Measured on the order subtotal before VAT.',
    default: 25000,
    money: true,
  },
  {
    key: 'commerce.deliveryChargePence',
    kind: 'INT',
    group: 'commerce',
    label: 'Delivery charge',
    description: 'Charged when an order is below the free-delivery threshold.',
    default: 995,
    money: true,
  },
  {
    key: 'commerce.minimumOrderValuePence',
    kind: 'INT',
    group: 'commerce',
    label: 'Minimum order value',
    description: 'Checkout is blocked below this, in addition to per-product minimum quantities.',
    default: 5000,
    money: true,
  },
  {
    key: 'commerce.deliveryThresholdIncludesVat',
    kind: 'BOOL',
    group: 'commerce',
    label: 'Judge free delivery on the VAT-inclusive total',
    description: 'Off means the threshold is measured before VAT, which matches the subtotal the customer sees.',
    default: false,
  },

  // --- Payments ------------------------------------------------------------
  { key: 'payments.accountEnabled', kind: 'BOOL', group: 'payments', label: 'Allow payment on account', default: true },
  { key: 'payments.cardEnabled', kind: 'BOOL', group: 'payments', label: 'Allow online card payment', description: 'Not implemented yet. Leave off.', default: false },

  // --- One-time codes ------------------------------------------------------
  { key: 'otp.codeLength', kind: 'INT', group: 'otp', label: 'Code length', default: 4 },
  { key: 'otp.expiryMinutes', kind: 'INT', group: 'otp', label: 'Code valid for (minutes)', default: 10 },
  { key: 'otp.maxAttempts', kind: 'INT', group: 'otp', label: 'Attempts allowed per code', default: 5 },
  { key: 'otp.resendsPerHour', kind: 'INT', group: 'otp', label: 'Codes allowed per hour', default: 3 },
  { key: 'auth.sessionDays', kind: 'INT', group: 'otp', label: 'Stay signed in for (days)', default: 30 },

  // --- Notifications -------------------------------------------------------
  {
    key: 'notifications.emailEnabled',
    kind: 'BOOL',
    group: 'notifications',
    label: 'Send notifications by email',
    description: 'Requires a verified sending domain in Resend. While this is off, notifications are written in the app only.',
    default: false,
  },
  {
    key: 'notifications.adminEmail',
    kind: 'STRING',
    group: 'notifications',
    label: 'Admin notification address',
    description: 'Where new registration alerts are sent once email is switched on.',
    default: 'sales@anaid.co.uk',
  },
] as const satisfies readonly Definition[]

export type SettingKey = (typeof SETTING_DEFINITIONS)[number]['key']

type SettingValue<D> = D extends { kind: 'BOOL' } ? boolean : D extends { kind: 'INT' } ? number : string

export type Settings = {
  [D in (typeof SETTING_DEFINITIONS)[number] as D['key']]: SettingValue<D>
}

export const SETTING_GROUPS: { id: string; label: string; description: string }[] = [
  { id: 'company', label: 'Company', description: 'Appears in the header, on notifications and on invoices.' },
  { id: 'commerce', label: 'Commercial', description: 'VAT, delivery and the rules that gate a checkout.' },
  { id: 'payments', label: 'Payments', description: 'How customers are allowed to pay.' },
  { id: 'otp', label: 'Sign-in codes', description: 'One-time code rules and how long a session lasts.' },
  { id: 'notifications', label: 'Notifications', description: 'How customers and staff are told about things.' },
]

function parse(kind: SettingKind, raw: string): string | number | boolean {
  switch (kind) {
    case 'INT':
      return Number.parseInt(raw, 10)
    case 'BOOL':
      return raw === 'true'
    case 'JSON':
      return JSON.parse(raw)
    default:
      return raw
  }
}

export function serialise(value: string | number | boolean): string {
  return typeof value === 'string' ? value : String(value)
}

// Settings change rarely and are read on nearly every request. A short TTL
// keeps a burst of requests in one function instance down to a single query
// without making an edit feel unresponsive.
let cache: { values: Settings; expiresAt: number } | null = null
const CACHE_MS = 15_000

export function invalidateSettingsCache() {
  cache = null
}

export async function getSettings(): Promise<Settings> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.values
  }

  const rows = await prisma.setting.findMany()
  const stored = new Map(rows.map((row) => [row.key, row.value]))

  const values = Object.fromEntries(
    SETTING_DEFINITIONS.map((definition) => {
      const raw = stored.get(definition.key)
      return [
        definition.key,
        raw === undefined || raw === '' && definition.kind !== 'STRING'
          ? definition.default
          : parse(definition.kind, raw),
      ]
    })
  ) as Settings

  cache = { values, expiresAt: Date.now() + CACHE_MS }
  return values
}

/** One setting, typed, for the rare call site that needs only one. */
export async function getSetting<K extends SettingKey>(key: K): Promise<Settings[K]> {
  const settings = await getSettings()
  return settings[key]
}
