import type { Metadata, Viewport } from 'next'
import { Archivo } from 'next/font/google'
import './globals.css'

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  axes: ['wdth'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'ANAID Quality Disposables',
    template: '%s · ANAID Quality Disposables',
  },
  description:
    'Trade supplier of disposable food-service and packaging products. Wholesale prices for approved trade accounts.',
  robots: { index: false, follow: false },
  applicationName: 'ANAID',
  // Installed on a phone this runs without browser chrome, so iOS is told to
  // treat it as an application: no address bar, and a status bar with dark text
  // that continues the white header rather than fighting it.
  appleWebApp: {
    capable: true,
    title: 'ANAID',
    statusBarStyle: 'default',
  },
  icons: {
    apple: '/app/apple-touch-icon.png',
  },
  // A phone number in a price list is a phone number; a product code is not.
  // Left alone, iOS turns SKUs and pack sizes into blue "call" links.
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  // The paper, not the ink. The header is white, so the browser's own bar and
  // the phone's status bar continue it instead of drawing a dark band above it.
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  // The interface is allowed to be zoomed. Pinch-zoom is switched off often
  // enough to feel like a convention, but it is an accessibility failure and it
  // buys nothing here: the layout already holds at any width, and the tap
  // delay it used to prevent is handled by `touch-action` in the stylesheet.
  maximumScale: 5,
  userScalable: true,
  // Lets the page paint into the notch and the home-indicator strip. Everything
  // fixed to an edge pads itself back out with the safe-area insets.
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // `data-scroll-behavior` restores the pre-16 behaviour of overriding the
    // stylesheet's smooth scrolling during a route change, so following a link
    // lands at the top of the next page instantly instead of gliding there,
    // while in-page anchors keep scrolling smoothly.
    <html lang="en-GB" className={archivo.variable} data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  )
}
