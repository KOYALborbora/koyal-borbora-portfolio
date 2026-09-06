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
 * The palette of a room where colour has not been found yet: peat, umber,
 * bitumen, and one warm light in the middle of it.
 */
const INK = {
  wall: '#241C14',
  wallDeep: '#160F0A',
  glow: '#6B4A2F',
  glowHot: '#9A7038',
  floor: '#140E09',
  table: '#4A3722',
  tableEdge: '#2A1E13',
  cloth: '#5E4527',
  figure: '#0E0A06',
  figureLit: '#3A2A19',
  lampShade: '#2E2317',
  lampLight: '#F0D59A',
  sage: '#556B4E',
  bowl: '#7A5A33',
}

/**
 * The picture, as a list of marks laid down in the order a painter would lay
 * them: the dark of the room, the light in it, the things the light falls on,
 * then the light source, then the texture over all of it.
 *
 * Marks come in two kinds. `shape` marks are flat masses — a table, a shoulder,
 * a lamp — and `stroke` marks are the brushwork over the top. Scattering
 * strokes alone, which is what this used to do, never resolves into anything:
 * you get a heap of sticks. Blocking in the masses first is both more legible
 * and closer to how the painting would actually have been made.
 *
 * Coordinates are 0→1 on both axes so the composition survives any canvas size.
 */
function buildPicture() {
  const rand = mulberry32(20260906)
  const marks = []

  const shape = (draw) => marks.push({ kind: 'shape', draw })
  const poly = (points, fill, alpha = 1) =>
    shape((ctx, W, H) => {
      ctx.globalAlpha = alpha
      ctx.fillStyle = fill
      ctx.beginPath()
      points.forEach(([x, y], i) =>
        i ? ctx.lineTo(x * W, y * H) : ctx.moveTo(x * W, y * H)
      )
      ctx.closePath()
      ctx.fill()
      ctx.globalAlpha = 1
    })
  const ellipse = (cx, cy, rx, ry, fill, alpha = 1) =>
    shape((ctx, W, H) => {
      ctx.globalAlpha = alpha
      ctx.fillStyle = fill
      ctx.beginPath()
      ctx.ellipse(cx * W, cy * H, rx * W, ry * H, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    })

  // 1. The room itself.
  poly([[0, 0], [1, 0], [1, 1], [0, 1]], INK.wall)

  // 2. The lamplight, before anything it falls on — the whole picture is built
  //    around where this reaches.
  shape((ctx, W, H) => {
    const g = ctx.createRadialGradient(0.5 * W, 0.28 * H, 0, 0.5 * W, 0.28 * H, 0.52 * W)
    g.addColorStop(0, 'rgba(154,112,56,0.75)')
    g.addColorStop(0.45, 'rgba(107,74,47,0.34)')
    g.addColorStop(1, 'rgba(36,28,20,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
  })

  // 3. Floor, and the corners the light never gets to.
  poly([[0, 0.84], [1, 0.84], [1, 1], [0, 1]], INK.floor)
  shape((ctx, W, H) => {
    const g = ctx.createRadialGradient(0.5 * W, 0.45 * H, 0.28 * W, 0.5 * W, 0.45 * H, 0.85 * W)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(1, 'rgba(0,0,0,0.72)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
  })

  // 4. The table, receding away from the viewer.
  poly([[0.05, 0.80], [0.95, 0.80], [0.80, 0.685], [0.20, 0.685]], INK.table)
  poly([[0.05, 0.80], [0.95, 0.80], [0.95, 0.875], [0.05, 0.875]], INK.tableEdge)
  poly([[0.20, 0.685], [0.80, 0.685], [0.72, 0.655], [0.28, 0.655]], INK.cloth, 0.55)

  // 5. Three figures round it. Bodies first, then heads, so a head sits on a
  //    pair of shoulders rather than hovering over them.
  const figure = (cx, cy, w, h, headR, tone) => {
    poly(
      [
        [cx - w, cy + h],
        [cx - w * 0.72, cy - h * 0.5],
        [cx + w * 0.72, cy - h * 0.5],
        [cx + w, cy + h],
      ],
      tone
    )
    ellipse(cx, cy - h * 0.62, headR, headR * 1.2, tone)
  }
  figure(0.215, 0.60, 0.115, 0.20, 0.055, INK.figure)
  figure(0.785, 0.59, 0.112, 0.20, 0.053, INK.figure)
  figure(0.5, 0.545, 0.086, 0.16, 0.043, '#181109')

  // A rim of lamplight down the near edge of each figure.
  shape((ctx, W, H) => {
    ctx.strokeStyle = INK.figureLit
    ctx.lineWidth = Math.min(W, H) * 0.012
    ctx.lineCap = 'round'
    ctx.globalAlpha = 0.75
    ctx.beginPath()
    ctx.moveTo(0.29 * W, 0.44 * H)
    ctx.lineTo(0.315 * W, 0.62 * H)
    ctx.moveTo(0.712 * W, 0.43 * H)
    ctx.lineTo(0.688 * W, 0.61 * H)
    ctx.stroke()
    ctx.globalAlpha = 1
  })

  // 6. The lamp, hung over the middle of the table.
  shape((ctx, W, H) => {
    ctx.strokeStyle = INK.wallDeep
    ctx.lineWidth = Math.min(W, H) * 0.008
    ctx.beginPath()
    ctx.moveTo(0.5 * W, 0)
    ctx.lineTo(0.5 * W, 0.14 * H)
    ctx.stroke()
  })
  poly([[0.415, 0.205], [0.585, 0.205], [0.545, 0.14], [0.455, 0.14]], INK.lampShade)
  ellipse(0.5, 0.222, 0.028, 0.024, INK.lampLight)
  ellipse(0.5, 0.222, 0.075, 0.062, INK.lampLight, 0.22)

  // 7. What is on the table.
  ellipse(0.5, 0.742, 0.088, 0.026, INK.bowl)
  ellipse(0.5, 0.732, 0.088, 0.024, '#A07A46')
  shape((ctx, W, H) => {
    ctx.strokeStyle = '#C9B48A'
    ctx.lineWidth = Math.min(W, H) * 0.007
    ctx.lineCap = 'round'
    ctx.globalAlpha = 0.4
    for (let i = 0; i < 3; i++) {
      const x = (0.46 + i * 0.04) * W
      ctx.beginPath()
      ctx.moveTo(x, 0.72 * H)
      ctx.quadraticCurveTo(x + (i - 1) * 0.03 * W, 0.66 * H, x + (i - 1) * 0.05 * W, 0.6 * H)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  })

  // ── 8. Brushwork over all of it ──────────────────────────────────────────
  // Which mass a point belongs to decides its colour and the direction the
  // brush was travelling, so the texture reinforces the forms instead of
  // fighting them.
  const regionAt = (x, y) => {
    if (y > 0.875) return 'floor'
    if (y > 0.655 && y < 0.875) return 'table'
    if (Math.hypot((x - 0.5) * 1.4, y - 0.19) < 0.11) return 'lamp'
    for (const [fx, fy] of [
      [0.215, 0.58],
      [0.785, 0.57],
      [0.5, 0.52],
    ]) {
      if (Math.hypot((x - fx) * 1.6, y - fy) < 0.2) return 'figure'
    }
    if (Math.hypot((x - 0.5) * 1.2, y - 0.28) < 0.4) return 'glow'
    return 'wall'
  }

  const TONES = {
    wall: ['#2C2117', '#1A130D', INK.wall, INK.sage],
    glow: [INK.glow, '#7E5A32', '#3A2C1C', INK.glowHot],
    floor: ['#1B130C', '#0E0904', '#2A1E13'],
    table: ['#5A4227', INK.table, '#332516', '#8A6636'],
    figure: ['#0B0805', '#191108', '#2C2016'],
    lamp: [INK.lampLight, '#D8B571', '#8A6636'],
  }
  const ANGLE = {
    wall: 1.42,
    glow: 0.2,
    floor: 0.06,
    table: 0.05,
    figure: 1.5,
    lamp: 0.9,
  }

  const strokes = []
  for (let i = 0; i < 460; i++) {
    const x = rand()
    const y = rand()
    const region = regionAt(x, y)
    const pool = TONES[region]
    strokes.push({
      x,
      y,
      region,
      angle: ANGLE[region] + (rand() - 0.5) * 0.75,
      len: 0.02 + rand() * 0.055,
      w: 5 + rand() * 13,
      color: pool[Math.floor(rand() * rand() * pool.length)],
      alpha: region === 'lamp' ? 0.4 + rand() * 0.5 : 0.14 + rand() * 0.32,
      bend: (rand() - 0.5) * 0.6,
    })
  }
  // Back to front, so the foreground texture lands last.
  strokes.sort((a, b) => a.y - b.y)
  for (const s of strokes) {
    marks.push({
      kind: 'stroke',
      draw: (ctx, W, H) => {
        const px = s.x * W
        const py = s.y * H
        const len = s.len * Math.min(W, H) * 2.2
        const dx = Math.cos(s.angle) * len
        const dy = Math.sin(s.angle) * len
        const nx = -Math.sin(s.angle) * s.bend * len
        const ny = Math.cos(s.angle) * s.bend * len
        ctx.strokeStyle = s.color
        ctx.globalAlpha = s.alpha
        ctx.lineWidth = s.w * (Math.min(W, H) / 700)
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(px - dx / 2, py - dy / 2)
        ctx.quadraticCurveTo(px + nx, py + ny, px + dx / 2, py + dy / 2)
        ctx.stroke()
        ctx.globalAlpha = 1
      },
    })
  }

  return marks
}

/**
 * Room 1's signature effect: a dark interior that paints itself as the visitor
 * reads past it, so the origin story and the picture of where it started
 * arrive at the same speed.
 *
 * Because the masses are laid in before the brushwork, the early part of the
 * scroll blocks the room in and the rest of it finds the texture — which is the
 * order a painting actually happens in, and reads far better than a picture
 * that assembles itself out of unrelated dashes.
 *
 * In simple mode and under reduced motion the same picture is drawn once, in
 * full, on mount.
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

    const marks = buildPicture()
    let width = 0
    let height = 0
    let drawn = 0
    let raf = 0

    const redrawTo = (count) => {
      ctx.clearRect(0, 0, width, height)
      for (let i = 0; i < count; i++) marks[i].draw(ctx, width, height)
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
      redrawTo(still ? marks.length : drawn)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    if (still) {
      redrawTo(marks.length)
      return () => ro.disconnect()
    }

    const tick = () => {
      raf = requestAnimationFrame(tick)
      // The picture finishes a little before the room does, so the last
      // paragraph is read against a completed canvas rather than a half-built one.
      const local = progressThroughRoom(ROOM_BY_ID.nuenen.index)
      const eased = Math.min(1, Math.max(0, (local - 0.04) / 0.7))
      const target = Math.round(eased * marks.length)

      if (target > drawn) {
        // Scrolling forward only ever adds marks — no clear, no redraw.
        const limit = Math.min(target, drawn + 30)
        for (let i = drawn; i < limit; i++) marks[i].draw(ctx, width, height)
        drawn = limit
      } else if (target < drawn - 2) {
        // Scrolling back has to repaint, because canvas marks cannot be
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
