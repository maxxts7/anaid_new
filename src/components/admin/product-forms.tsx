'use client'

import { useActionState } from 'react'
import { AlertCircle, CheckCircle2, Trash2 } from 'lucide-react'
import {
  adjustStock,
  removeQuantityBreak,
  saveQuantityBreak,
  updateProduct,
  type ProductActionState,
} from '@/app/(admin)/admin/products/actions'
import { Button } from '@/components/ui/button'
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field'
import { formatPence } from '@/lib/money'

function Feedback({ state }: { state: ProductActionState }) {
  if (!state.message) return null

  return (
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
  )
}

export function ProductForm({
  product,
  categories,
}: {
  product: {
    id: string
    name: string
    description: string | null
    categoryId: string
    packSize: string | null
    unitsPerCarton: number
    minOrderQuantity: number
    standardPrice: string
    vatRatePercent: string
    lowStockThreshold: number
    trackStock: boolean
    featured: boolean
    active: boolean
  }
  categories: { id: string; name: string }[]
}) {
  const [state, action, pending] = useActionState<ProductActionState, FormData>(updateProduct, {})

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={product.id} />
      <Feedback state={state} />

      <Field label="Name" required>
        <Input name="name" defaultValue={product.name} required />
      </Field>

      <Field label="Description">
        <Textarea name="description" rows={2} defaultValue={product.description ?? ''} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category" required>
          <Select name="categoryId" defaultValue={product.categoryId}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Pack description" hint="How it reads on the shelf, e.g. 50 sleeve.">
          <Input name="packSize" defaultValue={product.packSize ?? ''} />
        </Field>

        <Field label="List price per carton" required hint="Before any customer pricing.">
          <Input name="standardPrice" defaultValue={product.standardPrice} inputMode="decimal" className="tnum" required />
        </Field>

        <Field label="VAT rate (%)" required>
          <Input name="vatRatePercent" defaultValue={product.vatRatePercent} inputMode="decimal" className="tnum" required />
        </Field>

        <Field label="Units per carton" required>
          <Input name="unitsPerCarton" type="number" min={1} defaultValue={product.unitsPerCarton} className="tnum" />
        </Field>

        <Field label="Minimum order (cartons)" required>
          <Input name="minOrderQuantity" type="number" min={1} defaultValue={product.minOrderQuantity} className="tnum" />
        </Field>

        <Field label="Low stock warning at" required>
          <Input name="lowStockThreshold" type="number" min={0} defaultValue={product.lowStockThreshold} className="tnum" />
        </Field>
      </div>

      <div className="rounded-lg border border-hairline bg-sunken p-3">
        <Checkbox name="active" label="Available to customers" defaultChecked={product.active} />
        <Checkbox name="featured" label="Show as a popular line" defaultChecked={product.featured} />
        <Checkbox
          name="trackStock"
          label="Track stock for this product"
          description="Turn off for lines that are never out of stock."
          defaultChecked={product.trackStock}
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save product'}
      </Button>
    </form>
  )
}

export function StockForm({
  productId,
  stockOnHand,
  stockReserved,
}: {
  productId: string
  stockOnHand: number
  stockReserved: number
}) {
  const [state, action, pending] = useActionState<ProductActionState, FormData>(adjustStock, {})

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={productId} />
      <Feedback state={state} />

      <dl className="space-y-1.5 text-small">
        <div className="flex justify-between">
          <dt className="text-ink-muted">On hand</dt>
          <dd className="tnum font-medium">{stockOnHand}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-muted">Reserved for orders</dt>
          <dd className="tnum font-medium">{stockReserved}</dd>
        </div>
        <div className="flex justify-between border-t border-hairline pt-1.5">
          <dt className="text-ink-muted">Available to sell</dt>
          <dd className="tnum font-semibold">{Math.max(0, stockOnHand - stockReserved)}</dd>
        </div>
      </dl>

      <Field label="Counted quantity" required hint="What is actually on the shelf right now.">
        <Input name="stockOnHand" type="number" min={0} defaultValue={stockOnHand} className="tnum" />
      </Field>

      <Field label="Note">
        <Input name="note" placeholder="Delivery from supplier, stock count, damage" />
      </Field>

      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? 'Saving…' : 'Update stock'}
      </Button>
    </form>
  )
}

export function QuantityBreaks({
  productId,
  bands,
}: {
  productId: string
  bands: { id: string; minQuantity: number; pricePence: number }[]
}) {
  const [addState, addAction, adding] = useActionState<ProductActionState, FormData>(saveQuantityBreak, {})
  const [removeState, removeAction] = useActionState<ProductActionState, FormData>(removeQuantityBreak, {})

  return (
    <div className="space-y-3">
      <Feedback state={addState} />
      <Feedback state={removeState} />

      {bands.length > 0 ? (
        <ul className="divide-y divide-hairline rounded-sm border border-hairline">
          {bands.map((band) => (
            <li key={band.id} className="flex items-center justify-between gap-2 px-3 py-2">
              <span className="tnum text-small">
                {band.minQuantity}+ cartons — {formatPence(band.pricePence)} each
              </span>
              <form action={removeAction}>
                <input type="hidden" name="breakId" value={band.id} />
                <input type="hidden" name="productId" value={productId} />
                <button
                  type="submit"
                  className="flex size-7 items-center justify-center rounded-sm text-ink-faint hover:bg-sunken hover:text-refused"
                  aria-label={`Remove the ${band.minQuantity} carton band`}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-small text-ink-muted">
          No bulk prices. Add one to reward bigger orders — customers are shown how close they are to it.
        </p>
      )}

      <form action={addAction} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="productId" value={productId} />

        <Field label="From quantity" required className="w-28">
          <Input name="minQuantity" type="number" min={2} placeholder="5" className="tnum" />
        </Field>

        <Field label="Price each" required className="w-32">
          <Input name="price" inputMode="decimal" placeholder="33.50" className="tnum" />
        </Field>

        <Button type="submit" variant="secondary" disabled={adding}>
          {adding ? 'Adding…' : 'Add band'}
        </Button>
      </form>
    </div>
  )
}
