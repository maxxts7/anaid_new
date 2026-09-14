import type { MetadataRoute } from 'next'

/**
 * What a phone needs to keep ANAID on a home screen.
 *
 * The people this is built for reorder from a kitchen or a stockroom, and they
 * do it often enough that going through a browser every time is friction worth
 * removing. Installed, it opens in `standalone` — no address bar, no browser
 * chrome — and the interface below already carries its own header and bottom
 * navigation, so there is nothing missing once the browser's furniture goes.
 *
 * `theme_color` is the paper, not the ink. The header is white, so a white
 * status bar continues it; the near-black we used before drew a band across the
 * top of every screen that belonged to nothing on the page.
 *
 * The shortcuts are the three things a returning customer opens the app to do.
 * They appear on a long press of the icon on Android and in the jump list on
 * desktop.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ANAID Quality Disposables',
    short_name: 'ANAID',
    description:
      'Trade ordering for ANAID Quality Disposables — your own prices, your order history, and a basket that travels with you.',
    id: '/',
    start_url: '/products',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    categories: ['business', 'shopping', 'productivity'],
    icons: [
      { src: '/app/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/app/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/app/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Shop', short_name: 'Shop', url: '/products' },
      { name: 'Your basket', short_name: 'Basket', url: '/basket' },
      { name: 'Your orders', short_name: 'Orders', url: '/orders' },
    ],
  }
}
