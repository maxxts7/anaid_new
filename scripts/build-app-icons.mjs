/**
 * Build the home-screen icon set from ANAID's mark.
 *
 * The platform installs the app as a tile on a phone's home screen, so it needs
 * the mark on a real ground rather than the transparent PNG the site uses: both
 * Android and iOS paint their own colour behind a transparent icon, and neither
 * picks white.
 *
 *   node scripts/build-app-icons.mjs
 *
 * Re-run it when public/brand/logo-mark.png changes. The output is committed —
 * this is not part of the build, because the icons change about once a decade.
 */
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

const MARK = 'public/brand/logo-mark.png'
const OUT = 'public/app'

/** The paper the interface is printed on, so the tile matches the app it opens. */
const GROUND = { r: 255, g: 255, b: 255, alpha: 1 }

/**
 * The mark, centred on a square of ANAID's paper.
 *
 * `inset` is the margin left on each side as a share of the width. The mark is
 * wider than it is tall, so it is fitted by width and the margin above and
 * below comes out larger — which is what it wants, since the "A" reads as a
 * horizontal object.
 */
async function tile(size, inset, file) {
  const inner = Math.round(size * (1 - inset * 2))
  const mark = await sharp(MARK).resize({ width: inner, fit: 'inside' }).toBuffer()
  const { width, height } = await sharp(mark).metadata()

  await sharp({ create: { width: size, height: size, channels: 4, background: GROUND } })
    .composite([
      { input: mark, left: Math.round((size - width) / 2), top: Math.round((size - height) / 2) },
    ])
    .png()
    .toFile(join(OUT, file))

  console.log(`${file}  ${size}×${size}`)
}

await mkdir(OUT, { recursive: true })

// Android and the desktop installers. A twelfth of the tile as margin is enough
// air that the mark is not jammed against the corner rounding.
await tile(192, 0.12, 'icon-192.png')
await tile(512, 0.12, 'icon-512.png')

// Maskable. The platform may crop this to a circle, and only the middle 80% of
// the width is guaranteed to survive — so the mark is drawn well inside that,
// which is why this one is not simply the 512 with a different name.
await tile(512, 0.22, 'icon-maskable-512.png')

// iOS, which rounds the corners itself and ignores any transparency.
await tile(180, 0.14, 'apple-touch-icon.png')
