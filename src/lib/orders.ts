import type { OrderStatus } from '../generated/prisma/client'

/**
 * The path an order travels (LEVEL-4 §16). Cancellation steps outside it and can
 * happen from any point before delivery.
 */
export const ORDER_SEQUENCE: OrderStatus[] = [
  'RECEIVED',
  'CONFIRMED',
  'PROCESSING',
  'PICKING',
  'PACKED',
  'DISPATCHED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
]

/** The only status an order may move to next, or null when it is finished. */
export function nextStatus(status: OrderStatus): OrderStatus | null {
  const index = ORDER_SEQUENCE.indexOf(status)
  if (index === -1 || index === ORDER_SEQUENCE.length - 1) return null
  return ORDER_SEQUENCE[index + 1]
}

/** What the button that advances an order should say. */
export const ADVANCE_LABELS: Record<OrderStatus, string> = {
  RECEIVED: 'Confirm order',
  CONFIRMED: 'Start processing',
  PROCESSING: 'Send to picking',
  PICKING: 'Mark as packed',
  PACKED: 'Mark as dispatched',
  DISPATCHED: 'Out for delivery',
  OUT_FOR_DELIVERY: 'Mark as delivered',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
}
