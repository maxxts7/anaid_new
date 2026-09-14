'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LayoutGrid, List, PackageSearch, X } from 'lucide-react'
import { BasketPanel } from '@/components/customer/basket-panel'
import type { CatalogueGroup } from '@/lib/catalogue'

/**
 * Browsing the catalogue.
 *
 * ANAID's categories nest one level — twelve departments, sixty-odd sections
 * beneath them — and the old rails of filled chips made that nesting look like
 * two unrelated rows of buttons. Here it is what it actually is: a column of
 * departments down the side, and inside whichever ones are open, a rail of
 * their sections across the top of the products. Standing the two levels at
 * right angles to each other is what stops them reading as one long row — and a
 * column also lets all eleven departments be read at once, as an index, which
 * two wrapped rows of names never quite managed.
 *
 * Several can be on at once. That is why these are filters and not tabs, in
 * spite of looking like them: a tab means one panel at a time and says so to a
 * screen reader, so these are toggles that report `aria-pressed` instead. The
 * rails are unchanged to look at.
 *
 * Sections narrow their own department and nothing else. Pick two departments
 * and a section inside one of them, and you get that section plus the whole of
 * the other — which is what a customer means by it, and what a single global
 * "AND" would get wrong.
 *
 * A phone has no room for the column, so below the tablet breakpoint both
 * levels are rails you swipe, one above the other.
 *
 * Every product is rendered on the server and handed over already priced — the
 * cards arrive as nodes, not as data — so toggling a filter is a pass over what
 * is already here rather than a trip to the database. That matters on a phone
 * in a kitchen: a manager comparing lids across three sections is not waiting
 * on the network for any of it.
 *
 * The chosen categories are written back to the address bar, which is what
 * makes a selection shareable and lets the home page's category tiles and a
 * product's breadcrumb open the catalogue already filtered.
 */

export type CatalogueCard = {
  id: string
  /** Slug of the top-level category this product rolls up to. */
  top: string
  /** Slug of the section beneath it, or null when filed on the parent itself. */
  child: string | null
  /** The product as a tile, for the grid. */
  card: React.ReactNode
  /** The same product as a table row, for the list. */
  row: React.ReactNode
}

export type CatalogueView = 'grid' | 'list'

export function CatalogueFilters({
  groups,
  cards,
  header,
  initialCategory,
  initialView = 'grid',
}: {
  groups: CatalogueGroup[]
  cards: CatalogueCard[]
  /** The table's column headings, rendered on the server with the rows. */
  header: React.ReactNode
  initialCategory?: string
  initialView?: CatalogueView
}) {
  const [view, setView] = useState<CatalogueView>(initialView)
  // The address bar may name either level, and may name several. Resolve each
  // slug once, so arriving from a product page's breadcrumb opens the section
  // it came from with its department already open around it.
  const [selection, setSelection] = useState<{ tops: string[]; sections: string[] }>(() => {
    const wanted = (initialCategory ?? '').split(',').map((slug) => slug.trim()).filter(Boolean)
    const tops = new Set<string>()
    const sections = new Set<string>()

    for (const slug of wanted) {
      if (groups.some((group) => group.slug === slug)) {
        tops.add(slug)
        continue
      }
      const parent = groups.find((group) => group.children.some((child) => child.slug === slug))
      if (parent) {
        tops.add(parent.slug)
        sections.add(slug)
      }
    }

    return { tops: [...tops], sections: [...sections] }
  })

  const { tops, sections } = selection

  const parentOf = useCallback(
    (slug: string) => groups.find((group) => group.children.some((child) => child.slug === slug))?.slug,
    [groups]
  )

  /**
   * The address follows the selection rather than being written alongside it.
   * Setting state and pushing history in the same handler means the handler has
   * to read the current selection from its closure, and a closure is a snapshot
   * — two toggles in quick succession would both compute from the same stale
   * set and the second would undo the first. Every toggle below updates from
   * the previous state, and this runs once the result is committed.
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    // A section implies its department, so only the sections need naming where
    // one is chosen — that keeps the address short and still round-trips.
    const narrowed = new Set(sections.map(parentOf).filter(Boolean) as string[])
    const value = [...tops.filter((slug) => !narrowed.has(slug)), ...sections]

    if (value.length > 0) params.set('category', value.join(','))
    else params.delete('category')

    if (view === 'list') params.set('view', 'list')
    else params.delete('view')

    // Replace rather than push: Back should leave the catalogue, not walk back
    // through every filter the customer glanced at.
    const query = params.toString()
    window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname)
  }, [tops, sections, view, parentOf])

  const clear = useCallback(() => setSelection({ tops: [], sections: [] }), [])

  const toggleTop = useCallback(
    (slug: string) => {
      if (slug === '') return clear()

      setSelection((prev) => {
        const on = prev.tops.includes(slug)
        const group = groups.find((entry) => entry.slug === slug)
        const owned = new Set(group?.children.map((child) => child.slug) ?? [])

        return {
          tops: on ? prev.tops.filter((entry) => entry !== slug) : [...prev.tops, slug],
          // Closing a department takes its sections with it; leaving them
          // behind would filter by something the customer can no longer see.
          sections: on ? prev.sections.filter((entry) => !owned.has(entry)) : prev.sections,
        }
      })
    },
    [clear, groups]
  )

  const toggleSection = useCallback((slug: string) => {
    setSelection((prev) => ({
      tops: prev.tops,
      sections: prev.sections.includes(slug)
        ? prev.sections.filter((entry) => entry !== slug)
        : [...prev.sections, slug],
    }))
  }, [])

  /** Which sections are picked, department by department. */
  const picked = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const slug of sections) {
      const parent = parentOf(slug)
      if (!parent) continue
      const set = map.get(parent) ?? new Set<string>()
      set.add(slug)
      map.set(parent, set)
    }
    return map
  }, [sections, parentOf])

  /** True when this product survives its own department's section picks. */
  const survivesSections = useCallback(
    (entry: CatalogueCard) => {
      const narrowed = picked.get(entry.top)
      if (!narrowed) return true
      return entry.child !== null && narrowed.has(entry.child)
    },
    [picked]
  )

  const visible = useMemo(() => {
    if (tops.length === 0) return cards
    return cards.filter((entry) => tops.includes(entry.top) && survivesSections(entry))
  }, [cards, tops, survivesSections])

  /**
   * What each department is currently worth.
   *
   * The departments OR together, so turning one on adds exactly its own
   * products and cannot change what another contributes — which is why these
   * numbers move only when a department is narrowed by its own sections. That
   * is the honest figure: it is what the department will add if you switch it
   * on, and what it is adding now if it is already on.
   */
  const liveCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const entry of cards) {
      if (!survivesSections(entry)) continue
      counts.set(entry.top, (counts.get(entry.top) ?? 0) + 1)
    }
    return counts
  }, [cards, survivesSections])

  const departments = useMemo(
    () => [
      { key: '', label: 'Everything', count: cards.length, on: tops.length === 0 },
      ...groups.map((entry) => ({
        key: entry.slug,
        label: entry.name,
        count: liveCounts.get(entry.slug) ?? 0,
        on: tops.includes(entry.slug),
      })),
    ],
    [groups, cards.length, tops, liveCounts]
  )

  // The section rail carries the sections of every open department. A
  // department with only one section is already its own answer, so it
  // contributes nothing to choose between.
  const sectionChoices = useMemo(() => {
    const open = groups.filter((group) => tops.includes(group.slug) && group.children.length > 1)
    return open.flatMap((group) =>
      group.children.map((child) => ({
        key: child.slug,
        label: child.name,
        count: child.count,
        on: sections.includes(child.slug),
      }))
    )
  }, [groups, tops, sections])

  const openNames = groups.filter((group) => tops.includes(group.slug)).map((group) => group.name)
  const filtered = tops.length > 0 || sections.length > 0

  return (
    <div className="mt-9 md:mt-12 md:grid md:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] md:gap-x-10 lg:grid-cols-[minmax(0,13.5rem)_minmax(0,1fr)] lg:gap-x-14 xl:grid-cols-[minmax(0,13.5rem)_minmax(0,1fr)_minmax(0,17rem)] xl:gap-x-12">
      {/* The department index travels with the customer down a long grid, so
          they can move between departments without scrolling back up. */}
      {/* The column travels with the customer down a long grid. It scrolls
          within itself when the basket and the index together outrun the
          window, so the foot of the index is always reachable. */}
      <div className="quiet-scroll md:sticky md:top-24 md:max-h-[calc(100dvh-7rem)] md:self-start">
        {/* Until there is room for a column of its own, the basket rides at the
            head of this one. From the wide breakpoint it moves to the right,
            where the eye ends up after reading a row of products. Both are the
            same component on the same store, so they cannot drift apart. */}
        <BasketPanel className="mb-6 hidden border-b border-hairline pb-6 md:block md:pl-2.5 xl:hidden" />

        {/* Indented to the same 10px as the department names below, which carry
            left padding so the tint on a chosen one has room to stand off its
            lettering. The label has to move with the list it labels. */}
        <div className="mb-3 hidden items-baseline justify-between gap-3 md:flex md:pl-2.5">
          <p className="eyebrow">Departments</p>
          {filtered && (
            <button
              type="button"
              onClick={clear}
              className="inline-flex items-center gap-1 text-micro font-medium text-ink-muted transition-colors hover:text-accent"
            >
              <X className="size-3" aria-hidden />
              Clear
            </button>
          )}
        </div>

        <FilterRail
          variant="major"
          label="Filter by department — more than one may be chosen"
          options={departments}
          onToggle={toggleTop}
        />
      </div>

      <div className="min-w-0">
        {sectionChoices.length > 0 && (
          <FilterRail
            variant="minor"
            label={
              openNames.length === 1 ? `Sections in ${openNames[0]}` : 'Sections in the open departments'
            }
            options={sectionChoices}
            onToggle={toggleSection}
          />
        )}

        {/* Said out loud when the selection changes, because on a long grid the
            only other evidence that a filter did anything is off-screen. */}
        <div
          className={
            'flex flex-wrap items-center justify-between gap-x-6 gap-y-3 ' +
            (sectionChoices.length > 0 ? 'mt-6' : 'mt-6 md:mt-0')
          }
        >
          <p aria-live="polite" className="tnum text-small text-ink-muted">
            {visible.length} {visible.length === 1 ? 'product' : 'products'}
            {filtered ? ' in your selection' : ''}
          </p>

          <div className="switcher" role="group" aria-label="How to show the products">
            <button
              type="button"
              className="switch-half"
              aria-pressed={view === 'grid'}
              onClick={() => setView('grid')}
            >
              <LayoutGrid className="size-3.5" aria-hidden />
              Grid
            </button>
            <button
              type="button"
              className="switch-half"
              aria-pressed={view === 'list'}
              onClick={() => setView('list')}
            >
              <List className="size-3.5" aria-hidden />
              List
            </button>
          </div>
        </div>

        <div className="mt-4">
          {visible.length === 0 ? (
            <Empty onClear={clear} />
          ) : view === 'list' ? (
            // The columns drop themselves to fit — that is what the container
            // query below does — so the table needs no scroller, and having one
            // would clip the bulk-price panels that rise out of the price
            // column. The one exception is a phone narrower than about 390px,
            // where even the three surviving columns will not fit: there the
            // table scrolls rather than dragging the whole page sideways with
            // it, and a clipped hover panel costs nothing on a touch screen.
            <div className="@container max-[389px]:overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>{header}</thead>
                <tbody>{visible.map((entry) => entry.row)}</tbody>
              </table>
            </div>
          ) : (
            <div
              key={`${tops.join('+')}/${sections.join('+')}`}
              // Two up on a phone, and from the tablet breakpoint the index
              // takes a column of its own, so the grid gains one back only as
              // the window earns the width for it.
              className="grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-3"
            >
              {visible.map((entry, index) => (
                <div
                  key={entry.id}
                  className="rise"
                  style={{ animationDelay: `${Math.min(index, 11) * 30}ms` }}
                >
                  {entry.card}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <aside className="quiet-scroll hidden xl:sticky xl:top-24 xl:block xl:max-h-[calc(100dvh-7rem)] xl:self-start">
        <BasketPanel />
      </aside>
    </div>
  )
}

type Option = { key: string; label: string; count: number; on: boolean }

/**
 * One rail of toggles. A group rather than a tablist, and `aria-pressed` rather
 * than `aria-selected`, because any number of them can be on at once — the look
 * is the same, but a screen reader is told the truth about what it does.
 *
 * Every toggle is in the tab order. Roving focus belongs to a tablist, where
 * there is one selected thing to rove from; a set of filters is a set of
 * checkboxes wearing different clothes, and each one is its own stop.
 */
function FilterRail({
  variant,
  label,
  options,
  onToggle,
}: {
  variant: 'major' | 'minor'
  label: string
  options: Option[]
  onToggle: (key: string) => void
}) {
  const rail = useRef<HTMLDivElement>(null)
  const signature = options.map((option) => (option.on ? '1' : '0')).join('')

  // Eleven departments do not fit across a phone, so on a phone the rail
  // scrolls. Keeping a chosen one in view means a customer arriving on a deep
  // link can see where they are without swiping to find out.
  useEffect(() => {
    const active = rail.current?.querySelector<HTMLElement>('[aria-pressed="true"]')
    active?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [signature])

  return (
    <div
      ref={rail}
      role="group"
      aria-label={label}
      className={
        variant === 'major'
          ? 'tablist tablist-vertical -mx-4 px-4 sm:mx-0 sm:px-0'
          : 'tablist tablist-minor -mx-4 mt-4 px-4 sm:mx-0 sm:px-0 md:mt-0'
      }
    >
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          aria-pressed={option.on}
          onClick={() => onToggle(option.key)}
          className={variant === 'major' ? 'tab-major' : 'tab'}
        >
          {option.label}
          <span className="tab-n">{option.count}</span>
        </button>
      ))}
    </div>
  )
}

function Empty({ onClear }: { onClear: () => void }) {
  return (
    <div className="border-t border-hairline py-20 text-center">
      <PackageSearch className="mx-auto size-6 text-ink-faint" />
      <p className="mt-4 font-medium">Nothing in that combination</p>
      <p className="mx-auto mt-1 max-w-sm text-small text-ink-muted">
        Try fewer sections, or search by product code.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-5 text-small font-medium text-accent underline underline-offset-4 hover:text-accent-hover"
      >
        Clear the filters
      </button>
    </div>
  )
}
