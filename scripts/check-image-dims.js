#!/usr/bin/env node
// Verifies that the width/height attributes on every <img> still describe the
// aspect ratio of the file it points at.
//
// Those attributes exist to reserve layout space: with `height: auto` in CSS the
// browser turns the pair into an aspect-ratio and gets the box right before a
// byte of the image arrives, which is what stops content below the art from
// jumping when it lands. Nothing keeps them in sync with the assets, and the
// failure is silent — the attributes define the layout box and the bitmap is
// drawn to fill it, so a stale pair stretches the art rather than erroring.
//
// Only the RATIO is checked, not the absolute pixels. Re-exporting art at a
// higher resolution for retina keeps the same proportions and needs no code
// change; re-cropping it does, and that is what this catches.
//
// Tags carrying neither attribute are skipped on purpose — see the comment on
// Bubble_Tail.svg in VoiceAdd.jsx for the one image deliberately left bare.
//
// Dependency-free by design: no `sips` (macOS only) and no image library, so it
// runs the same on Netlify's Linux builders as it does locally.

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'src')

// Ratios rarely land on exact integers once a file is re-encoded, and a few of
// these assets are odd sizes (640x461, 54x56). 0.5% is tight enough to catch a
// re-crop and loose enough to ignore rounding.
const TOLERANCE = 0.005

/** Intrinsic size of an SVG, from the root element's width/height or viewBox. */
function svgSize(buf) {
  const head = buf.toString('utf8', 0, 2000)
  const root = head.match(/<svg\b[^>]*>/i)
  if (!root) return null
  const attr = (name) => {
    const m = root[0].match(new RegExp(`\\b${name}\\s*=\\s*"([^"]+)"`, 'i'))
    // Strip any unit suffix (px, pt); percentages are not an intrinsic size.
    if (!m || m[1].includes('%')) return null
    const n = parseFloat(m[1])
    return Number.isFinite(n) ? n : null
  }
  const w = attr('width')
  const h = attr('height')
  if (w && h) return { width: w, height: h }

  const vb = root[0].match(/\bviewBox\s*=\s*"([^"]+)"/i)
  if (vb) {
    const parts = vb[1].trim().split(/[\s,]+/).map(Number)
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      return { width: parts[2], height: parts[3] }
    }
  }
  return null
}

/**
 * Intrinsic size of a WebP, read straight out of the RIFF container.
 * Handles all three bitstream flavours: VP8 (lossy), VP8L (lossless) and VP8X
 * (extended, which carries an explicit canvas size).
 */
function webpSize(buf) {
  if (buf.length < 30) return null
  if (buf.toString('ascii', 0, 4) !== 'RIFF') return null
  if (buf.toString('ascii', 8, 12) !== 'WEBP') return null

  const chunk = buf.toString('ascii', 12, 16)

  if (chunk === 'VP8X') {
    // 4 bytes of flags/reserved, then two 24-bit little-endian canvas
    // dimensions stored as (value - 1).
    return {
      width: buf.readUIntLE(24, 3) + 1,
      height: buf.readUIntLE(27, 3) + 1,
    }
  }

  if (chunk === 'VP8 ') {
    // Key frame header: 3-byte frame tag, the 0x9d012a start code, then two
    // 16-bit fields whose low 14 bits are the dimensions.
    if (buf.toString('hex', 23, 26) !== '9d012a') return null
    return {
      width: buf.readUInt16LE(26) & 0x3fff,
      height: buf.readUInt16LE(28) & 0x3fff,
    }
  }

  if (chunk === 'VP8L') {
    if (buf[20] !== 0x2f) return null
    // 14 bits of (width - 1) then 14 bits of (height - 1), packed LSB-first.
    const bits = buf.readUInt32LE(21)
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    }
  }

  return null
}

function intrinsicSize(path) {
  const buf = readFileSync(path)
  if (path.endsWith('.svg')) return svgSize(buf)
  if (path.endsWith('.webp')) return webpSize(buf)
  return null
}

function jsxFiles(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) out.push(...jsxFiles(path))
    else if (entry.endsWith('.jsx')) out.push(path)
  }
  return out
}

const problems = []
const skipped = []
let checked = 0

for (const file of jsxFiles(SRC)) {
  const source = readFileSync(file, 'utf8')

  // Import bindings in this file, so `src={heroImage}` can be resolved back to
  // the asset on disk.
  const imports = new Map()
  for (const m of source.matchAll(/^import\s+(\w+)\s+from\s+'([^']+)'/gm)) {
    imports.set(m[1], m[2])
  }

  // [\s\S] so multi-line tags (MealDetail's winner burst) are matched too.
  for (const tag of source.matchAll(/<img\b[\s\S]*?\/>/g)) {
    const text = tag[0]
    const width = text.match(/\bwidth=\{(\d+)\}/)
    const height = text.match(/\bheight=\{(\d+)\}/)
    if (!width || !height) continue

    const line = source.slice(0, tag.index).split('\n').length
    const where = `${file.slice(ROOT.length + 1)}:${line}`

    const src = text.match(/\bsrc=\{([\w.]+)\}/)
    if (!src) {
      skipped.push(`${where} — src is not a plain identifier`)
      continue
    }
    const specifier = imports.get(src[1])
    if (!specifier) {
      // Covers dynamic sources like Account's `p.logo`, which cannot be traced
      // to one asset from here. Reported so the list stays honest.
      skipped.push(`${where} — src {${src[1]}} is not a static import`)
      continue
    }

    const asset = resolve(dirname(file), specifier)
    const actual = intrinsicSize(asset)
    if (!actual) {
      problems.push(`${where} — could not read dimensions from ${specifier}`)
      continue
    }

    checked += 1
    const declared = { width: Number(width[1]), height: Number(height[1]) }
    const declaredRatio = declared.width / declared.height
    const actualRatio = actual.width / actual.height

    if (Math.abs(declaredRatio - actualRatio) / actualRatio > TOLERANCE) {
      problems.push(
        `${where} — attrs ${declared.width}x${declared.height} ` +
          `(${declaredRatio.toFixed(3)}) vs ${specifier} ` +
          `${actual.width}x${actual.height} (${actualRatio.toFixed(3)})`,
      )
    }
  }
}

for (const note of skipped) console.log(`skipped  ${note}`)

if (problems.length) {
  console.error(`\n${problems.length} image(s) out of sync with their attributes:\n`)
  for (const p of problems) console.error(`  ${p}`)
  console.error('\nUpdate the width/height on the tag to the asset\'s real size.')
  process.exit(1)
}

console.log(`\n${checked} image dimension(s) match their assets.`)
