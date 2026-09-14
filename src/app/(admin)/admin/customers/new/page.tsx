import Link from 'next/link'
import type { Metadata } from 'next'
import { ChevronLeft } from 'lucide-react'
import { NewCustomerForm } from '@/components/admin/new-customer-form'
import { requireStaff } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'

export const metadata: Metadata = { title: 'Add a customer' }

export default async function NewCustomerPage() {
  await requireStaff('customers.create')

  const levels = await prisma.pricingLevel.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
  })

  return (
    <div className="p-4 lg:p-6">
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1 text-small text-ink-muted hover:text-ink"
      >
        <ChevronLeft className="size-4" />
        Customers
      </Link>

      <h1 className="mt-3 text-display font-bold">Add a customer</h1>
      <p className="mt-1 max-w-xl text-ink-muted">
        For businesses you already trade with. The account is created approved, with its prices set, so
        they can sign in and order straight away.
      </p>

      <div className="mt-6 max-w-2xl rounded-lg border border-hairline bg-surface p-5">
        <NewCustomerForm levels={levels} />
      </div>
    </div>
  )
}
