import { cn } from '@/lib/cn'
import { ACCOUNT_STATUS_LABELS } from '@/lib/permissions'
import type { AccountStatus, OrderStatus } from '@/generated/prisma/client'

const tones = {
  neutral: 'border-hairline-strong bg-sunken text-ink-muted',
  approved: 'border-approved/20 bg-approved-soft text-approved',
  pending: 'border-pending/20 bg-pending-soft text-pending',
  refused: 'border-refused/20 bg-refused-soft text-refused',
  accent: 'border-accent/20 bg-accent-soft text-accent',
} as const

export type Tone = keyof typeof tones

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: Tone
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-micro font-medium whitespace-nowrap',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  )
}

const accountTones: Record<AccountStatus, Tone> = {
  REGISTERED: 'neutral',
  PENDING_APPROVAL: 'pending',
  APPROVED: 'approved',
  REJECTED: 'refused',
  SUSPENDED: 'refused',
}

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  return <Badge tone={accountTones[status]}>{ACCOUNT_STATUS_LABELS[status]}</Badge>
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  RECEIVED: 'Order received',
  CONFIRMED: 'Order confirmed',
  PROCESSING: 'Processing',
  PICKING: 'Picking',
  PACKED: 'Packed',
  DISPATCHED: 'Dispatched',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
}

const orderTones: Record<OrderStatus, Tone> = {
  RECEIVED: 'pending',
  CONFIRMED: 'accent',
  PROCESSING: 'accent',
  PICKING: 'accent',
  PACKED: 'accent',
  DISPATCHED: 'accent',
  OUT_FOR_DELIVERY: 'accent',
  DELIVERED: 'approved',
  CANCELLED: 'refused',
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={orderTones[status]}>{ORDER_STATUS_LABELS[status]}</Badge>
}
