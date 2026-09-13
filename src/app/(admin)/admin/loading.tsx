/** Shown while an admin screen loads. Mirrors the shape of a dashboard. */
export default function AdminLoading() {
  return (
    <div className="p-4 lg:p-6">
      <div className="skeleton h-8 w-56 rounded-md" />
      <div className="skeleton mt-2 h-4 w-40 rounded-sm" />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-hairline bg-surface p-4">
            <div className="skeleton h-3 w-24 rounded-sm" />
            <div className="skeleton mt-3 h-9 w-16 rounded-sm" />
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-hairline bg-surface">
        <div className="border-b border-hairline px-4 py-3">
          <div className="skeleton h-4 w-32 rounded-sm" />
        </div>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between gap-4 border-b border-hairline px-4 py-3 last:border-b-0">
            <div className="skeleton h-4 w-48 rounded-sm" />
            <div className="skeleton h-4 w-20 rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  )
}
