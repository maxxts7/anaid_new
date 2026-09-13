'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireStaff } from '@/lib/auth/guards'
import { recordAudit } from '@/lib/audit'
import { parsePence } from '@/lib/money'

export type ProductActionState = { message?: string; ok?: boolean }

export async function updateProduct(
  _previous: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const { staff } = await requireStaff('products.edit')

  const id = String(formData.get('id') ?? '')
  const value = (key: string) => String(formData.get(key) ?? '').trim()

  const before = await prisma.product.findUnique({ where: { id } })
  if (!before) return { message: 'That product no longer exists.' }

  let standardPricePence: number
  try {
    standardPricePence = parsePence(value('standardPrice'))
  } catch {
    return { message: 'Enter the price as a number, for example 36 or 36.00.' }
  }

  if (standardPricePence <= 0) return { message: 'The list price must be more than nothing.' }

  const vatPercent = Number(value('vatRatePercent'))
  if (!Number.isFinite(vatPercent) || vatPercent < 0 || vatPercent > 100) {
    return { message: 'VAT must be a percentage between 0 and 100.' }
  }

  const minOrderQuantity = Math.max(1, Number(value('minOrderQuantity')) || 1)

  await prisma.product.update({
    where: { id },
    data: {
      name: value('name') || before.name,
      description: value('description') || null,
      categoryId: value('categoryId') || before.categoryId,
      packSize: value('packSize') || null,
      unitsPerCarton: Math.max(1, Number(value('unitsPerCarton')) || 1),
      minOrderQuantity,
      standardPricePence,
      vatRateBasisPoints: Math.round(vatPercent * 100),
      lowStockThreshold: Math.max(0, Number(value('lowStockThreshold')) || 0),
      trackStock: formData.get('trackStock') === 'on',
      featured: formData.get('featured') === 'on',
      active: formData.get('active') === 'on',
    },
  })

  await recordAudit({
    actorType: 'STAFF',
    actorId: staff.id,
    actorLabel: staff.name,
    action: 'product.updated',
    entityType: 'Product',
    entityId: id,
    before: {
      standardPricePence: before.standardPricePence,
      minOrderQuantity: before.minOrderQuantity,
      active: before.active,
    },
    after: { standardPricePence, minOrderQuantity, active: formData.get('active') === 'on' },
  })

  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${id}`)

  return { ok: true, message: 'Product saved.' }
}

/**
 * Stock is counted, not typed over: the difference between what was there and
 * what the count says is written as a movement, so the history explains itself.
 */
export async function adjustStock(
  _previous: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const { staff } = await requireStaff('inventory.adjust')

  const id = String(formData.get('id') ?? '')
  const counted = Number(formData.get('stockOnHand'))
  const note = String(formData.get('note') ?? '').trim()

  if (!Number.isFinite(counted) || counted < 0) {
    return { message: 'Enter the counted quantity as a whole number.' }
  }

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) return { message: 'That product no longer exists.' }

  const difference = Math.trunc(counted) - product.stockOnHand
  if (difference === 0) return { ok: true, message: 'No change — the count matches.' }

  await prisma.$transaction(async (tx) => {
    const updated = await tx.product.update({
      where: { id },
      data: { stockOnHand: Math.trunc(counted) },
    })

    await tx.stockMovement.create({
      data: {
        productId: id,
        reason: difference > 0 ? 'RECEIPT' : 'ADJUSTMENT',
        quantity: difference,
        staffId: staff.id,
        resultingOnHand: updated.stockOnHand,
        resultingReserved: updated.stockReserved,
        note: note || (difference > 0 ? 'Stock received' : 'Stock count adjustment'),
      },
    })
  })

  await recordAudit({
    actorType: 'STAFF',
    actorId: staff.id,
    actorLabel: staff.name,
    action: 'product.stock_adjusted',
    entityType: 'Product',
    entityId: id,
    before: { stockOnHand: product.stockOnHand },
    after: { stockOnHand: Math.trunc(counted), difference, note },
  })

  revalidatePath(`/admin/products/${id}`)

  return { ok: true, message: `Stock set to ${Math.trunc(counted)} (${difference > 0 ? '+' : ''}${difference}).` }
}

export async function saveQuantityBreak(
  _previous: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const { staff } = await requireStaff('pricing.edit')

  const productId = String(formData.get('productId') ?? '')
  const minQuantity = Number(formData.get('minQuantity'))

  if (!Number.isFinite(minQuantity) || minQuantity < 2) {
    return { message: 'A bulk band starts at 2 or more.' }
  }

  let pricePence: number
  try {
    pricePence = parsePence(String(formData.get('price') ?? ''))
  } catch {
    return { message: 'Enter the band price as a number.' }
  }

  await prisma.quantityBreak.upsert({
    where: { productId_minQuantity: { productId, minQuantity: Math.trunc(minQuantity) } },
    update: { pricePence },
    create: { productId, minQuantity: Math.trunc(minQuantity), pricePence },
  })

  await recordAudit({
    actorType: 'STAFF',
    actorId: staff.id,
    actorLabel: staff.name,
    action: 'product.quantity_break_saved',
    entityType: 'Product',
    entityId: productId,
    after: { minQuantity, pricePence },
  })

  revalidatePath(`/admin/products/${productId}`)

  return { ok: true, message: 'Bulk price saved.' }
}

export async function removeQuantityBreak(
  _previous: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const { staff } = await requireStaff('pricing.edit')

  const id = String(formData.get('breakId') ?? '')
  const productId = String(formData.get('productId') ?? '')

  await prisma.quantityBreak.deleteMany({ where: { id, productId } })

  await recordAudit({
    actorType: 'STAFF',
    actorId: staff.id,
    actorLabel: staff.name,
    action: 'product.quantity_break_removed',
    entityType: 'Product',
    entityId: productId,
    before: { breakId: id },
  })

  revalidatePath(`/admin/products/${productId}`)

  return { ok: true, message: 'Bulk price removed.' }
}
