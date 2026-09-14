'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * The header, got out of the way.
 *
 * On a phone the top bar and the search field below it stand 114px tall and are
 * stuck to the top of a 844px screen — an eighth of the glass, held back from
 * the catalogue for the whole of a long scroll. A native application does not
 * do this: the bar leaves when you are reading and comes back the moment you
 * ask for it, which on a touch screen means the moment you flick up.
 *
 * So: scrolling down past the first screenful rolls it up out of sight;
 * scrolling up by any meaningful amount brings it straight back, wherever you
 * are in the list. Nothing is lost — the search field and the basket are one
 * flick away at every point — and the catalogue gets its eighth back.
 *
 * Only on a phone. From the tablet breakpoint up there is vertical room to
 * spare and a pointer that cannot flick, so the bar stays where it is; the
 * transform is fenced off inside a media query rather than being decided here,
 * so a window dragged across the breakpoint cannot leave it hidden.
 */
export function AppBar({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false)
  const frame = useRef(0)
  const last = useRef(0)

  useEffect(() => {
    last.current = window.scrollY

    function read() {
      const y = window.scrollY
      const previous = last.current

      // Small movements are ignored. Without this the bar flickers under the
      // rubber band at the top of the page and under the one-or-two-pixel
      // corrections a browser makes while images load.
      if (Math.abs(y - previous) < 6) return

      last.current = y

      // The first screenful always shows it, so the top of a page is never
      // missing its header — including after a route change, which lands here
      // at y = 0.
      if (y < 96) {
        setHidden(false)
        return
      }

      // A flick up is a request for the bar, wherever it happens.
      setHidden(y > previous)
    }

    function onScroll() {
      // One read per painted frame. A scroll event can fire far more often
      // than that, and each read touches layout.
      if (frame.current) return
      frame.current = requestAnimationFrame(() => {
        frame.current = 0
        read()
      })
    }

    // The bar must not roll away while the customer is typing in the field it
    // contains: on iOS the keyboard opening scrolls the page, which would
    // otherwise take the search field with it.
    function onFocusIn(event: FocusEvent) {
      if (event.target instanceof HTMLElement && event.target.closest('header')) {
        setHidden(false)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('focusin', onFocusIn)

    return () => {
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('focusin', onFocusIn)
      if (frame.current) cancelAnimationFrame(frame.current)
    }
  }, [])

  return (
    <header
      data-hidden={hidden || undefined}
      className="app-bar sticky top-0 z-30"
    >
      {children}
    </header>
  )
}
