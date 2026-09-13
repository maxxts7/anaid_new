import Link from 'next/link'
import type { Route } from 'next'
import { AccountStatusBadge, OrderStatusBadge } from '@/components/ui/badge'
import { requireStaff } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'
import { formatPence } from '@/lib/money'
import { staffCan } from '@/lib/permissions'

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>
}) {
  const { staff } = await requireStaff()
  const { denied } = await searchParams

  const canSeeCustomers = staffCan(staff.roles, 'customers.view')
  const canSeeOrders = staffCan(staff.roles, 'orders.view')

  const [awaitingApproval, toConfirm, inProgress, lowStock, applications, recentOrders] =
    await Promise.all([
      canSeeCustomers ? prisma.customer.count({ where: { status: 'PENDING_APPROVAL' } }) : 0,
      canSeeOrders ? prisma.order.count({ where: { status: 'RECEIVED' } }) : 0,
      canSeeOrders
        ? prisma.order.count({
            where: { status: { in: ['CONFIRMED', 'PROCESSING', 'PICKING', 'PACKED', 'DISPATCHED', 'OUT_FOR_DELIVERY'] } },
          })
        : 0,
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count FROM "Product"
        WHERE "active" = true AND "trackStock" = true
          AND "stockOnHand" - "stockReserved" <= "lowStockThreshold"
      `,
      canSeeCustomers
        ? prisma.customer.findMany({
            where: { status: 'PENDING_APPROVAL' },
            orderBy: { verifiedAt: 'asc' },
            take: 5,
          })
        : [],
      canSeeOrders
        ? prisma.order.findMany({
            orderBy: { placedAt: 'desc' },
            take: 6,
            include: { customer: { select: { businessName: true } } },
          })
        : [],
    ])

  const lowStockCount = Number(lowStock[0]?.count ?? 0)

  return (
    <div className="p-4 lg:p-6">
      <h1 className="text-display font-semibold">Good day, {staff.name.split(' ')[0]}</h1>
      <p className="mt-1 text-ink-muted">Here is what needs attention.</p>

      {denied && (
        <p className="mt-4 rounded-lg border border-pending/20 bg-pending-soft px-3 py-2.5 text-small text-pending">
          You do not have permission for that. Ask a Super Administrator if you need it.
        </p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          label="Awaiting approval"
          value={awaitingApproval}
          href="/admin/approvals"
          urgent={awaitingApproval > 0}
        />
        <Tile
          label="Orders to confirm"
          value={toConfirm}
          href={"/admin/orders?status=RECEIVED" as Route}
          urgent={toConfirm > 0}
        />
        <Tile label="Orders in progress" value={inProgress} href="/admin/orders" />
        <Tile label="Low stock lines" value={lowStockCount} href={"/admin/products?filter=low-stock" as Route} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {canSeeCustomers && (
          <Panel
            title="Applications waiting"
            action={{ href: '/admin/approvals', label: 'All applications' }}
            empty={applications.length === 0 ? 'Nothing waiting. The queue is clear.' : undefined}
          >
            {applications.map((customer) => (
              <Link
                key={customer.id}
                href={`/admin/customers/${customer.id}`}
                className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3 last:border-b-0 hover:bg-sunken"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{customer.businessName}</p>
                  <p className="tnum mt-0.5 text-micro text-ink-muted">
                    {customer.postcode} — applied{' '}
                    {(customer.verifiedAt ?? customer.createdAt).toLocaleDateString('en-GB')}
                  </p>
                </div>
                {customer.infoRequested ? (
                  <span className="rounded-sm bg-pending-soft px-2 py-0.5 text-micro text-pending">
                    Waiting on them
                  </span>
                ) : (
                  <AccountStatusBadge status={customer.status} />
                )}
              </Link>
            ))}
          </Panel>
        )}

        {canSeeOrders && (
          <Panel
            title="Recent orders"
            action={{ href: '/admin/orders', label: 'All orders' }}
            empty={recentOrders.length === 0 ? 'No orders yet.' : undefined}
          >
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.orderNumber}`}
                className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3 last:border-b-0 hover:bg-sunken"
              >
                <div className="min-w-0">
                  <p className="tnum truncate font-medium">{order.orderNumber}</p>
                  <p className="mt-0.5 truncate text-micro text-ink-muted">{order.customer.businessName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <OrderStatusBadge status={order.status} />
                  <span className="tnum w-20 text-right text-small font-medium">
                    {formatPence(order.totalPence)}
                  </span>
                </div>
              </Link>
            ))}
          </Panel>
        )}
      </div>
    </div>
  )
}

function Tile({
  label,
  value,
  href,
  urgent,
}: {
  label: string
  value: number
  href: Route
  urgent?: boolean
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-hairline bg-surface shadow-xs p-4 transition-colors hover:border-hairline-strong"
    >
      <p className="text-small text-ink-muted">{label}</p>
      <p className={`tnum mt-1 text-hero leading-none font-bold ${urgent ? 'text-accent' : 'text-ink'}`}>
        {value}
      </p>
    </Link>
  )
}

function Panel({
  title,
  action,
  empty,
  children,
}: {
  title: string
  action?: { href: Route; label: string }
  empty?: string
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-hairline bg-surface shadow-xs">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
        <h2 className="font-medium">{title}</h2>
        {action && (
          <Link href={action.href} className="text-small text-accent hover:underline">
            {action.label}
          </Link>
        )}
      </div>
      {empty ? <p className="px-4 py-8 text-center text-small text-ink-muted">{empty}</p> : children}
    </section>
  )
}
