/**
 * Shown while the catalogue is being read. Matching the real page exactly —
 * the eyebrow, the heading, two rails of tabs and a grid of media blocks with
 * their captions underneath — means nothing moves when the products arrive.
 */
export default function CatalogueLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      <div className="skeleton h-3 w-32 rounded-sm" />
      <div className="skeleton mt-3 h-8 w-72 rounded-md" />
      <div className="skeleton mt-3 h-4 w-48 rounded-sm" />

      <div className="mt-6 flex gap-7 overflow-hidden border-b border-hairline pb-3.5">
        {[7, 5, 6, 4, 5, 4].map((width, index) => (
          <div key={index} className="skeleton h-4 shrink-0 rounded-sm" style={{ width: `${width}rem` }} />
        ))}
      </div>

      <div className="mt-7 grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index}>
            <div className="skeleton aspect-[5/4] rounded-lg border border-hairline" />
            <div className="skeleton mt-3.5 h-4 w-3/4 rounded-sm" />
            <div className="skeleton mt-2 h-3 w-1/2 rounded-sm" />
            <div className="skeleton mt-5 h-7 w-28 rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  )
}
