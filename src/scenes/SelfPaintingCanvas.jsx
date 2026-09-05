import { useEffect, useRef } from 'react'
import { progressThroughRoom } from '../state/scrollState.js'
import { useStore } from '../state/useStore.js'
import { ROOM_BY_ID } from '../lib/rooms.js'

/** Deterministic PRNG, so the picture is the same one every visit. */
function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * The picture is described as a handful of masses rather than as an image: a
 * dim ground, a lamp, a table, two bowed figures. Strokes are scattered inside
 * those masses back-to-front, which is roughly the order a painter would lay
 * them down and — usefully — also the order that reads best when they appear
 * one at a time.
 *
 * Coordinates are in a 0→1 space and scaled to the canvas, so the composition
 * survives any aspect ratio.
 */
const MASSES = [
  // Order matters: this is the order the strokes appear in, and it is the order
  // a painter would work in — the dark of the room first, then the light in it,
  // then the things the light falls on, then the light source itself.
  { cx: 0.5, cy: 0.5, rx: 0.66, ry: 0.62, count: 230, len: [0.04, 0.11], w: [11, 22], tone: 'ground', angle: 1.35, jitter: 1.5 },
  { cx: 0.5, cy: 0.42, rx: 0.32, ry: 0.3, count: 150, len: [0.03, 0.09], w: [8, 18], tone: 'glow', angle: 0, jitter: 3.2 },
  { cx: 0.5, cy: 0.72, rx: 0.42, ry: 0.08, count: 110, len: [0.05, 0.15], w: [11, 21], tone: 'table', angle: 0.04, jitter: 0.28 },
  { cx: 0.25, cy: 0.54, rx: 0.13, ry: 0.21, count: 95, len: [0.03, 0.08], w: [11, 20], tone: 'figure', angle: 1.4, jitter: 0.7 },
  { cx: 0.75, cy: 0.52, rx: 0.12, ry: 0.22, count: 95, len: [0.03, 0.08], w: [11, 20], tone: 'figure', angle: 1.78, jitter: 0.7 },
  { cx: 0.5, cy: 0.23, rx: 0.11, ry: 0.09, count: 70, len: [0.02, 0.06], w: [6, 13], tone: 'halo', angle: 0, jitter: 3.2 },
  { cx: 0.5, cy: 0.22, rx: 0.045, ry: 0.04, count: 44, len: [0.012, 0.038], w: [4, 9], tone: 'lamp', angle: 0, jitter: 3.2 },
]

function buildStrokes(palette) {
  const rand = mulberry32(20250905)
  const tones = {
    // Nuenen is the room where Van Gogh had not found colour yet: peat, umber
    // and bitumen, with one warm light in the middle of it. The dull sage from
    // the palette is used once and sparingly — spread across the whole canvas
    // it stopped reading as a dim interior and started reading as grass.
    ground: ['#1b1410', palette.bg, '#2c2117', palette.secondary],
    glow: ['#4a3520', '#3a2b1c', palette.accent, '#5c4227'],
    table: ['#3f2f1d', palette.accent, '#241b12'],
    figure: ['#110c07', '#1a130d', '#241a11'],
    halo: ['#8a6132', '#a8793c', '#c2914d'],
    lamp: ['#e8c07a', '#f3dda8', '#d2a55e'],
  }

  const strokes = []
  for (const mass of MASSES) {
    for (let i = 0; i < mass.count; i++) {
      // Rejection-free disc sampling, biased towards the centre so masses have
      // a dense core and a ragged edge.
      const t = rand() * Math.PI * 2
      const r = Math.sqrt(rand())
      const x = mass.cx + Math.cos(t) * r * mass.rx
      const y = mass.cy + Math.sin(t) * r * mass.ry
      const pool = tones[mass.tone]
      const pick = mass.tone === 'ground' ? Math.min(pool.length - 1, Math.floor(rand() * rand() * pool.length * 1.15)) : Math.floor(rand() * pool.length)
      strokes.push({
        x,
        y,
        angle: mass.angle + (rand() - 0.5) * mass.jitter,
        len: mass.len[0] + rand() * (mass.len[1] - mass.len[0]),
        w: mass.w[0] + rand() * (mass.w[1] - mass.w[0]),
        color: pool[pick],
        alpha:
          mass.tone === 'ground'
            ? 0.16 + rand() * 0.3
            : mass.tone === 'lamp' || mass.tone === 'halo'
              ? 0.55 + rand() * 0.45
              : 0.3 + rand() * 0.5,
        bend: (rand() - 0.5) * 0.5,
      })
    }
  }
  return strokes
}

/**
 * Room 1's signature effect: a coarse dark painting that builds itself
 * stroke-by-stroke as the visitor reads past it, so the origin story and the
 * picture of where it started arrive at the same speed.
 *
 * In simple mode and under reduced motion the same picture is drawn once, in
 * full, on mount — the room is not allowed to withhold its content just because
 * somebody turned the animation off.
 */
export default function SelfPaintingCanvas({ alt }) {
  const canvasRef = useRef(null)
  const simpleMode = useStore((s) => s.simpleMode)
  const reducedMotion = useStore((s) => s.reducedMotion)
  const still = simpleMode || reducedMotion

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const palette = ROOM_BY_ID.nuenen.palette
    const strokes = buildStrokes(palette)

    let width = 0
    let height = 0
    let drawn = 0
    let raf = 0

    const paintOne = (s) => {
      const x = s.x * width
      const y = s.y * height
      const len = s.len * Math.min(width, height) * 1.6
      const dx = Math.cos(s.angle) * len
      const dy = Math.sin(s.angle) * len
      const nx = -Math.sin(s.angle) * s.bend * len
      const ny = Math.cos(s.angle) * s.bend * len

      ctx.strokeStyle = s.color
      ctx.globalAlpha = s.alpha
      ctx.lineWidth = s.w * (Math.min(width, height) / 700)
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(x - dx / 2, y - dy / 2)
      ctx.quadraticCurveTo(x + nx, y + ny, x + dx / 2, y + dy / 2)
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    const redrawTo = (count) => {
      ctx.clearRect(0, 0, width, height)
      for (let i = 0; i < count; i++) paintOne(strokes[i])
      drawn = count
    }

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      redrawTo(still ? strokes.length : drawn)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    if (still) {
      redrawTo(strokes.length)
      return () => ro.disconnect()
    }

    const tick = () => {
      raf = requestAnimationFrame(tick)
      // The picture finishes a little before the room does, so the last
      // paragraph is read against a completed canvas rather than a half-built one.
      const local = progressThroughRoom(ROOM_BY_ID.nuenen.index)
      const eased = Math.min(1, Math.max(0, (local - 0.05) / 0.72))
      const target = Math.round(eased * strokes.length)

      if (target > drawn) {
        // Scrolling forward only ever adds strokes — no clear, no redraw.
        const limit = Math.min(target, drawn + 40)
        for (let i = drawn; i < limit; i++) paintOne(strokes[i])
        drawn = limit
      } else if (target < drawn - 2) {
        // Scrolling back has to repaint, because canvas strokes cannot be
        // un-drawn. Capped batches keep even a fast reverse scroll under budget.
        redrawTo(target)
      }
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [still])

  return (
    <figure className="nuenen__figure">
      <canvas ref={canvasRef} className="nuenen__canvas" role="img" aria-label={alt} />
      <figcaption className="visually-hidden">{alt}</figcaption>
    </figure>
  )
}
