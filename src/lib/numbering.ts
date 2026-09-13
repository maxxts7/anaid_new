import type { Prisma } from '../generated/prisma/client'

/**
 * The visible numbers: ANAID-C00001 for a customer, ANAID-2026-000001 for an
 * order.
 *
 * Both are allocated by incrementing a counter row inside the same transaction
 * as the record being numbered. Two administrators approving two applications
 * at the same instant therefore cannot be handed the same number — which
 * `max(number) + 1` would happily do.
 */

type TransactionClient = Prisma.TransactionClient

export async function allocateCustomerNumber(tx: TransactionClient): Promise<string> {
  const counter = await tx.counter.upsert({
    where: { key: 'customer' },
    create: { key: 'customer', value: 1 },
    update: { value: { increment: 1 } },
  })

  return `ANAID-C${String(counter.value).padStart(5, '0')}`
}

export async function allocateOrderNumber(tx: TransactionClient, when: Date = new Date()): Promise<string> {
  const year = when.getFullYear()

  const counter = await tx.counter.upsert({
    where: { key: `order:${year}` },
    create: { key: `order:${year}`, value: 1 },
    update: { value: { increment: 1 } },
  })

  return `ANAID-${year}-${String(counter.value).padStart(6, '0')}`
}
