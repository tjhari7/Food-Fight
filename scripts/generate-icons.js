#!/usr/bin/env node
// Renders the home screen / PWA icon set into public/icons from the one source
// of truth for the mark: src/assets/Favicon_Food_Fight.svg.
//
// A script rather than four checked-in PNGs someone drew once. The mark, the
// plate colour and the padding are all decisions with reasons, and this file is
// where those reasons live — regenerating after a brand tweak is `npm run
// icons` instead of an archaeology exercise in a design tool.
//
// Not part of `npm run build`. sharp ships prebuilt platform binaries, and
// making Netlify's Linux builder fetch and run one to re-derive bytes that
// already exist in git buys nothing. The outputs are committed; run this by
// hand when the mark changes.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = join(ROOT, 'src/assets/Favicon_Food_Fight.svg')
const OUT_DIR = join(ROOT, 'public/icons')

// The plate is --color-bg and the mark is --color-accent, so the icon, the iOS
// launch screen (which iOS paints from the manifest's background_color) and the
// app's own background are one continuous cream surface with no seam at any
// stage of launch. Keep in sync with those two tokens in src/index.css.
//
// Note the source SVG fills with #E62E2E, which is NOT --color-accent. That
// mismatch predates this script and is left alone in the favicon itself; here
// the fill is overridden so the home screen icon matches the app it opens.
const PLATE = '#FAF6E8'
const MARK = '#DF2121'

// The source viewBox is 0 0 32 32, but the path only occupies y 4.82..27.18 —
// it is a wordmark sitting on the baseline, not a centred glyph. Scaling the
// viewBox would leave the mark visibly low in the square, so the real ink
// bounds are measured here and centred explicitly.
const VIEWBOX = 32
const INK_TOP = 4.81995
const INK_BOTTOM = 27.1822

const source = readFileSync(SOURCE, 'utf8')
const path = source.match(/<path\b[^>]*\bd="([^"]+)"/)?.[1]
if (!path) {
  // Guard rather than emit four cream squares with nothing on them, which is
  // exactly what a silent regex miss would produce.
  throw new Error(`No <path d="..."> found in ${SOURCE}`)
}

/**
 * @param size    output edge in px
 * @param inkPct  fraction of the edge the mark's WIDTH may occupy. Width is the
 *                limiting dimension (the ink is wider than it is tall), so this
 *                is what actually sets the visual weight.
 */
function icon(size, inkPct) {
  const scale = (size * inkPct) / VIEWBOX
  const dx = (size - VIEWBOX * scale) / 2
  const dy = size / 2 - ((INK_TOP + INK_BOTTOM) / 2) * scale

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
      `<rect width="${size}" height="${size}" fill="${PLATE}"/>` +
      `<g transform="translate(${dx} ${dy}) scale(${scale})"><path d="${path}" fill="${MARK}"/></g>` +
      `</svg>`
  )
}

const OUTPUTS = [
  // The two `any` icons. 0.62 leaves a margin that reads as deliberate padding
  // at 60px on a home screen rather than a mark jammed against the corners.
  { file: 'icon-192.png', size: 192, ink: 0.62 },
  { file: 'icon-512.png', size: 512, ink: 0.62 },

  // `maskable`: Android crops this to whatever shape the launcher wants —
  // circle, squircle, teardrop — and only the centre 80% is guaranteed to
  // survive. 0.5 keeps the whole wordmark inside that circle. It looks
  // over-padded viewed as a flat square; that is the format working correctly.
  { file: 'icon-512-maskable.png', size: 512, ink: 0.5 },

  // iOS home screen. Must be opaque and square: iOS applies its own rounding,
  // and any alpha in the source composites against black, giving a dark ring
  // in the corners the plate was supposed to fill.
  { file: 'apple-touch-icon.png', size: 180, ink: 0.62 },
]

mkdirSync(OUT_DIR, { recursive: true })

for (const { file, size, ink } of OUTPUTS) {
  // flatten() against the plate colour guarantees no alpha channel survives
  // even if the composed SVG somehow leaves one, which is the apple-touch-icon
  // requirement above.
  const png = await sharp(icon(size, ink))
    .flatten({ background: PLATE })
    .png({ compressionLevel: 9 })
    .toBuffer()

  writeFileSync(join(OUT_DIR, file), png)
  console.log(`${file.padEnd(24)} ${size}x${size}  ${(png.length / 1024).toFixed(1)}KB`)
}
