/**
 * The painter.
 *
 * Turns each project into a picture of *that project* — the real screens, the
 * real mark, the real layout — rendered as though somebody had painted it.
 *
 * The rule that keeps these legible: every shape is laid in as a flat base
 * first, then brushed over at partial opacity. Strokes alone read as mush;
 * strokes over a solid base read as paint. That one decision is the difference
 * between "abstract texture" and "I can see it is a phone".
 *
 * Everything is deterministic — the same project always paints the same
 * picture — so the files are stable in git and a rebuild is a no-op.
 */

export const W = 1600
export const H = 1000

/* ── Seeded randomness ─────────────────────────────────────────────────── */

export function seeded(str) {
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

/* ── Colour ────────────────────────────────────────────────────────────── */

const clamp255 = (v) => Math.max(0, Math.min(255, Math.round(v)))

export function shade(hex, amount) {
  const n = parseInt(hex.replace('#', ''), 16)
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    clamp255(amount > 0 ? c + (255 - c) * amount : c * (1 + amount))
  )
  return `#${ch.map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

export function mix(a, b, t) {
  const pa = parseInt(a.replace('#', ''), 16)
  const pb = parseInt(b.replace('#', ''), 16)
  const ch = [16, 8, 0].map((s) =>
    clamp255((((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t))
  )
  return `#${ch.map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

export function esc(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const f = (n) => Number(n).toFixed(1)

/* ── Primitives ────────────────────────────────────────────────────────── */

/**
 * One brush stroke: a curve that bows slightly off the straight line between
 * its ends, so nothing in these pictures is ever drawn with a ruler.
 */
export function brush(rand, x1, y1, x2, y2, opts = {}) {
  const { color = '#000', width = 10, opacity = 0.8, bow = 0.12, cap = 'round' } = opts
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len
  const off = (rand() - 0.5) * len * bow
  const mx = (x1 + x2) / 2 + nx * off
  const my = (y1 + y2) / 2 + ny * off
  return `<path d="M${f(x1)} ${f(y1)} Q${f(mx)} ${f(my)} ${f(x2)} ${f(y2)}" stroke="${color}" stroke-width="${f(
    width
  )}" stroke-linecap="${cap}" fill="none" opacity="${opacity.toFixed(2)}"/>`
}

/**
 * A field of strokes over a flat base. `angle` is the direction the brush was
 * travelling, which is what gives each area of a picture its own grain.
 */
export function paint(rand, x, y, w, h, opts = {}) {
  const {
    color = '#888',
    tones = null,
    angle = -0.35,
    density = 0.055,
    width = [8, 20],
    opacity = [0.3, 0.7],
    base = 1,
    rx = 0,
  } = opts

  const pool = tones ?? [shade(color, -0.22), color, shade(color, 0.18)]
  let out = ''
  if (base > 0) {
    out += `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(
      rx
    )}" fill="${color}" opacity="${base.toFixed(2)}"/>`
  }

  // Strokes run corner to corner across the area, clipped to it, so the grain
  // continues past the edges the way a real brush would.
  const count = Math.max(4, Math.round(Math.sqrt(w * h) * density))
  const span = Math.hypot(w, h)
  const cx = x + w / 2
  const cy = y + h / 2
  const ux = Math.cos(angle)
  const uy = Math.sin(angle)
  const px = -uy
  const py = ux

  for (let i = 0; i < count; i++) {
    const t = (i / (count - 1 || 1) - 0.5) * span * 1.05
    const jitter = (rand() - 0.5) * (span / count) * 1.4
    const half = (0.28 + rand() * 0.42) * span * 0.5
    const slide = (rand() - 0.5) * span * 0.4
    const ax = cx + px * (t + jitter) + ux * (slide - half)
    const ay = cy + py * (t + jitter) + uy * (slide - half)
    const bx = cx + px * (t + jitter) + ux * (slide + half)
    const by = cy + py * (t + jitter) + uy * (slide + half)
    out += brush(rand, ax, ay, bx, by, {
      color: pool[Math.floor(rand() * pool.length)],
      width: width[0] + rand() * (width[1] - width[0]),
      opacity: opacity[0] + rand() * (opacity[1] - opacity[0]),
      bow: 0.05,
    })
  }
  return `<g clip-path="url(#clip-${clipId(x, y, w, h, rx)})">${out}</g>`
}

/* Clip paths are deduplicated by geometry so a picture with forty painted
   rectangles does not ship forty identical <clipPath> elements. */
const clips = new Map()
function clipId(x, y, w, h, rx) {
  const key = `${f(x)}_${f(y)}_${f(w)}_${f(h)}_${f(rx)}`.replace(/[.]/g, 'p').replace(/-/g, 'm')
  if (!clips.has(key)) {
    clips.set(
      key,
      `<clipPath id="clip-${key}"><rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(
        h
      )}" rx="${f(rx)}"/></clipPath>`
    )
  }
  return key
}
export function collectClips() {
  const out = [...clips.values()].join('')
  clips.clear()
  return out
}

/** A painted card: base, grain, and a hand-drawn edge. */
export function card(rand, x, y, w, h, opts = {}) {
  const { fill = '#fff', rx = 18, edge = null, edgeWidth = 3, grain = 0.045, angle = -0.3 } = opts
  let out = paint(rand, x, y, w, h, {
    color: fill,
    angle,
    density: grain,
    width: [10, 26],
    opacity: [0.16, 0.4],
    rx,
  })
  if (edge) {
    out += `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(
      rx
    )}" fill="none" stroke="${edge}" stroke-width="${edgeWidth}" opacity="0.7"/>`
  }
  return out
}

export function blob(rand, cx, cy, r, opts = {}) {
  const { color = '#fff', opacity = 1, strokes = 5 } = opts
  let out = `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${color}" opacity="${opacity}"/>`
  for (let i = 0; i < strokes; i++) {
    const a = rand() * Math.PI * 2
    out += brush(rand, cx - Math.cos(a) * r * 0.7, cy - Math.sin(a) * r * 0.7, cx + Math.cos(a) * r * 0.7, cy + Math.sin(a) * r * 0.7, {
      color: rand() > 0.5 ? shade(color, 0.25) : shade(color, -0.2),
      width: r * (0.25 + rand() * 0.3),
      opacity: 0.3 + rand() * 0.3,
      bow: 0.2,
    })
  }
  return out
}

const DISPLAY = 'Fraunces, Georgia, serif'
const UI = 'Literata, Georgia, serif'

export function text(str, x, y, opts = {}) {
  const {
    size = 28,
    color = '#fff',
    weight = 400,
    family = UI,
    anchor = 'start',
    opacity = 1,
    italic = false,
    letter = 0,
  } = opts
  return `<text x="${f(x)}" y="${f(y)}" font-family="${family}" font-size="${f(
    size
  )}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}" opacity="${opacity}"${
    italic ? ' font-style="italic"' : ''
  }${letter ? ` letter-spacing="${letter}"` : ''}>${esc(str)}</text>`
}

/** A run of painted lines standing in for body copy too small to letter. */
export function textLines(rand, x, y, w, lines, opts = {}) {
  const { color = '#fff', gap = 20, height = 7, opacity = 0.5, last = 0.6 } = opts
  let out = ''
  for (let i = 0; i < lines; i++) {
    const width = i === lines - 1 ? w * last : w * (0.82 + rand() * 0.18)
    out += brush(rand, x, y + i * gap, x + width, y + i * gap, {
      color,
      width: height,
      opacity,
      bow: 0.015,
      cap: 'butt',
    })
  }
  return out
}

/** A phone, drawn as an object in the picture rather than a screenshot frame. */
export function phone(rand, x, y, w, h, screen, opts = {}) {
  const { body = '#0f1418', radius = 34 } = opts
  let out = ''
  out += `<rect x="${f(x - 10)}" y="${f(y - 10)}" width="${f(w + 20)}" height="${f(
    h + 20
  )}" rx="${f(radius + 8)}" fill="${body}" opacity="0.92"/>`
  out += paint(rand, x - 10, y - 10, w + 20, h + 20, {
    color: body,
    angle: 1.5,
    density: 0.03,
    width: [6, 14],
    opacity: [0.2, 0.45],
    base: 0,
    rx: radius + 8,
  })
  out += `<g clip-path="url(#clip-${clipId(x, y, w, h, radius)})">${screen}</g>`
  out += `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(
    h
  )}" rx="${f(radius)}" fill="none" stroke="${shade(body, 0.3)}" stroke-width="2" opacity="0.5"/>`
  return out
}

/** The status bar every phone screenshot has, reduced to the marks that read. */
export function statusBar(rand, x, y, w, color) {
  let out = text('12:22', x + 26, y + 34, { size: 20, color, weight: 600 })
  const rx = x + w - 34
  out += `<rect x="${f(rx - 26)}" y="${f(y + 18)}" width="22" height="12" rx="3" fill="${color}" opacity="0.85"/>`
  for (let i = 0; i < 3; i++) {
    out += `<rect x="${f(rx - 62 + i * 8)}" y="${f(y + 28 - i * 4)}" width="5" height="${f(
      6 + i * 4
    )}" rx="1.5" fill="${color}" opacity="0.85"/>`
  }
  return out
}

/* ── Document ──────────────────────────────────────────────────────────── */

/**
 * Wraps a composition in the filters that do the actual painting: a
 * displacement map that roughens every edge, and a canvas tooth over the top.
 * `roughness` is dialled per picture — a logo can take more distortion than a
 * screen full of small type.
 */
export function document_(body, opts = {}) {
  const { alt = '', roughness = 7, seed = 3, tooth = 0.1 } = opts
  const defs = collectClips()
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(
    alt
  )}">
  <defs>
    ${defs}
    <filter id="paint" x="-4%" y="-4%" width="108%" height="108%">
      <feTurbulence type="fractalNoise" baseFrequency="0.014" numOctaves="4" seed="${seed}" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="${roughness}" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="tooth" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
  </defs>
  <g filter="url(#paint)">${body}</g>
  <rect width="${W}" height="${H}" filter="url(#tooth)" opacity="${tooth}" style="mix-blend-mode:overlay"/>
</svg>
`
}
