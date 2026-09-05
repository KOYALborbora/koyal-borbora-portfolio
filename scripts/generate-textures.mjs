#!/usr/bin/env node
/**
 * Generates the placeholder assets the site needs to look finished before any
 * real screenshots exist: one painted "canvas" per project, plus a favicon.
 *
 * Everything it writes is skipped if the file is already there, so dropping a
 * real screenshot into `public/works/` and re-running is safe — the generator
 * will never overwrite your work. Delete a file to have it regenerated.
 *
 * Run automatically before `npm run dev` and `npm run build`.
 */

import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import { constants } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const worksDir = join(root, 'public', 'works')
const publicDir = join(root, 'public')

const exists = async (path) =>
  access(path, constants.F_OK).then(
    () => true,
    () => false
  )

/** Deterministic PRNG so a given project always paints the same placeholder. */
function seeded(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h += 0x6d2b79f5
    let t = h
    t = Math.imul(t ^ (t >>> 15), 1 | t)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const W = 1600
const H = 1000

function shade(hex, amount) {
  const n = parseInt(hex.replace('#', ''), 16)
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.max(0, Math.min(255, Math.round(amount > 0 ? c + (255 - c) * amount : c * (1 + amount))))
  )
  return `#${ch.map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

/**
 * A placeholder painting: bands of directional strokes over the project's tint,
 * with the title lettered across it. Deliberately abstract — it should read as
 * "a work hangs here" and never as a fake product screenshot.
 */
function paint(work) {
  const rand = seeded(work.id)
  const base = work.tint || '#1C3F73'
  const palette = [shade(base, -0.4), base, shade(base, 0.28), '#F4C10F', '#E8DFCC']

  let strokes = ''
  for (let i = 0; i < 260; i++) {
    const x = rand() * W
    const y = rand() * H
    const angle = -22 + rand() * 44 + (y / H) * 30
    const len = 60 + rand() * 260
    const width = 6 + rand() * 26
    const color = palette[Math.floor(rand() * palette.length)]
    const opacity = (0.18 + rand() * 0.5).toFixed(2)
    strokes +=
      `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${len.toFixed(1)}" ` +
      `height="${width.toFixed(1)}" rx="${(width / 2).toFixed(1)}" fill="${color}" ` +
      `opacity="${opacity}" transform="rotate(${angle.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${escapeXml(work.alt || work.title)}">
  <defs>
    <filter id="rough" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="4" seed="${Math.floor(rand() * 500)}" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="26" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="tooth" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
    <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${shade(base, 0.18)}"/>
      <stop offset="100%" stop-color="${shade(base, -0.5)}"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#ground)"/>
  <g filter="url(#rough)">${strokes}</g>
  <rect width="${W}" height="${H}" filter="url(#tooth)" opacity="0.09" style="mix-blend-mode:overlay"/>

  <text x="80" y="${H - 96}" font-family="Fraunces, Georgia, serif" font-size="104" font-weight="900"
        fill="#F5EFE6" opacity="0.94">${escapeXml(work.title)}</text>
  <text x="84" y="${H - 46}" font-family="Literata, Georgia, serif" font-size="34" font-style="italic"
        fill="#F5EFE6" opacity="0.7">${escapeXml(work.medium)} · ${escapeXml(work.year)}</text>
</svg>
`
}

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#12294B"/>
  <circle cx="44" cy="20" r="7" fill="#F5D97B"/>
  <path d="M4 46c8-14 20-14 28 0s20 14 28 0" stroke="#3E7CA6" stroke-width="7" fill="none" stroke-linecap="round"/>
  <path d="M14 64c0-16 3-26 6-26s6 10 6 26z" fill="#0A1526"/>
</svg>
`

async function main() {
  await mkdir(worksDir, { recursive: true })

  const projects = JSON.parse(await readFile(join(root, 'src/content/projects.json'), 'utf8'))

  let written = 0
  let kept = 0

  for (const work of projects.works) {
    // `image` may point anywhere under public/; only generate the ones that
    // live where this script owns.
    const name = work.image?.startsWith('/works/') ? work.image.slice('/works/'.length) : null
    if (!name) continue
    const target = join(worksDir, name)
    if (await exists(target)) {
      kept++
      continue
    }
    await writeFile(target, paint(work), 'utf8')
    written++
  }

  const favicon = join(publicDir, 'favicon.svg')
  if (!(await exists(favicon))) {
    await writeFile(favicon, FAVICON, 'utf8')
    written++
  }

  console.log(
    `[vincent] placeholder assets: ${written} written, ${kept} left alone (delete a file to regenerate it).`
  )
}

main().catch((error) => {
  console.error('[vincent] asset generation failed:', error)
  process.exit(1)
})
