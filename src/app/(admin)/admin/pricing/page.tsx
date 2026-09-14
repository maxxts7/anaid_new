import type { Metadata } from 'next'
import { requireStaff } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'
import { applyDiscount, formatPence } from '@/lib/money'

export const metadata: Metadata = { title: 'Pricing levels' }

/**
 * Pricing levels (gap #16, settled as a percentage off the list price).
 *
 * Worked examples are shown against real products, because "12% off" means
 * nothing to a sales administrator deciding whether to put a new café on
 * Wholesale 2, and "£31.68 a carton" means everything.
 */
export default async function PricingPage() {
  await requireStaff('pricing.view')

  const [levels, samples] = await Promise.all([
    prisma.pricingLevel.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { customers: true } } },
    }),
    prisma.product.findMany({
      where: { active: true, featured: true },
      orderBy: { name: 'asc' },
      take: 4,
      select: { id: true, sku: true, name: true, standardPricePence: true },
    }),
  ])

  return (
    <div className="p-4 lg:p-6">
      <h1 className="text-display font-bold">Pricing levels</h1>
      <p className="mt-1 max-w-2xl text-ink-muted">
        A level is a percentage off the list price, so a new product is sellable at every level the moment
        it is created. A price agreed with one customer overrides their level, and the customer always
        receives whichever applicable price is lowest.
      </p>

      <div className="table-scroll mt-6 rounded-lg border border-hairline bg-surface">
        <table className="w-full min-w-[720px] text-small">
          <thead className="border-b border-hairline bg-sunken text-left">
            <tr>
              <th className="px-4 py-2.5 font-medium">Level</th>
              <th className="px-4 py-2.5 font-medium">Code</th>
              <th className="px-4 py-2.5 text-right font-medium">Discount</th>
              <th className="px-4 py-2.5 text-right font-medium">Customers</th>
              <th className="px-4 py-2.5 font-medium">Default</th>
            </tr>
          </thead>
          <tbody>
            {levels.map((level) => (
              <tr key={level.id} className="border-b border-hairline last:border-b-0">
                <td className="px-4 py-3 font-medium">{level.name}</td>
                <td className="tnum px-4 py-3 text-ink-muted">{level.code}</td>
                <td className="tnum px-4 py-3 text-right">
                  {(level.discountBasisPoints / 100).toFixed(2)}%
                </td>
                <td className="tnum px-4 py-3 text-right text-ink-muted">{level._count.customers}</td>
                <td className="px-4 py-3 text-ink-muted">{level.isDefault ? 'Yes' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-title font-bold">What that means in pounds</h2>

      <div className="table-scroll mt-3 rounded-lg border border-hairline bg-surface">
        <table className="w-full min-w-[720px] text-small">
          <thead className="border-b border-hairline bg-sunken text-left">
            <tr>
              <th className="px-4 py-2.5 font-medium">Product</th>
              <th className="px-4 py-2.5 text-right font-medium">List</th>
              {levels.map((level) => (
                <th key={level.id} className="px-4 py-2.5 text-right font-medium">
                  {level.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {samples.map((product) => (
              <tr key={product.id} className="border-b border-hairline last:border-b-0">
                <td className="px-4 py-3">
                  {product.name}
                  <span className="tnum mt-0.5 block text-micro text-ink-muted">{product.sku}</span>
                </td>
                <td className="tnum px-4 py-3 text-right text-ink-muted">
                  {formatPence(product.standardPricePence)}
                </td>
                {levels.map((level) => (
                  <td key={level.id} className="tnum px-4 py-3 text-right font-medium">
                    {formatPence(applyDiscount(product.standardPricePence, level.discountBasisPoints))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-small text-ink-muted">
        To change a level, or to agree a price with one customer for one product, open that customer and
        set it there. Bulk bands are set per product.
      </p>
    </div>
  )
}
