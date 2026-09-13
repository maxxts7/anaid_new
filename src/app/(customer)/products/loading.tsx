/**
 * Shown while the catalogue is being read. Matching the real grid exactly means
 * nothing moves when the products arrive.
 */
export default function CatalogueLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="skeleton h-8 w-48 rounded-md" />
      <div className="skeleton mt-2 h-4 w-28 rounded-sm" />

      <div className="mt-5 flex gap-2 overflow-hidden">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="skeleton h-9 w-28 shrink-0 rounded-md" />
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-lg border border-hairline bg-surface">
            <div className="skeleton aspect-[5/4] border-b border-hairline" />
            <div className="p-3.5">
              <div className="skeleton h-4 w-3/4 rounded-sm" />
              <div className="skeleton mt-2 h-3 w-1/2 rounded-sm" />
              <div className="skeleton mt-5 h-7 w-24 rounded-sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
