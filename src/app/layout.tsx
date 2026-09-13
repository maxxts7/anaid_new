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
}

export const viewport: Viewport = {
  themeColor: '#101418',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={archivo.variable}>
      <body>{children}</body>
    </html>
  )
}
