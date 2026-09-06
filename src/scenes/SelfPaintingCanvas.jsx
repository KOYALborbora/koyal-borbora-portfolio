import { useEffect, useRef } from 'react'
import { progressThroughRoom } from '../state/scrollState.js'
import { useStore } from '../state/useStore.js'
import { ROOM_BY_ID } from '../lib/rooms.js'

/** Deterministic PRNG, so the terrace is the same one every visit. */
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

/** Café Terrace at Night, Arles, September 1888 — after, not reproduced. */
const C = {
  night: '#0C1636',
  skyDeep: '#152C74',
  sky: '#2148A8',
  skyLift: '#3A63C4',
  star: '#F6E58A',
  starHot: '#FFF9D2',
  tree: '#143A26',
  treeLift: '#245A3A',
  blockDark: '#141F45',
  blockLift: '#243059',
  window: '#E9B742',
  facade: '#0D1A28',
  doorRed: '#A8382A',
  awning: '#F3C317',
  awningHot: '#FFE469',
  awningShade: '#B98C10',
  wall: '#DFA52C',
  wallShade: '#A0711A',
  terrace: '#E09A34',
  terraceHot: '#F7C862',
  cobbleWarm: '#8C6733',
  cobbleBlue: '#2C3A6E',
  cobbleViolet: '#4B4478',
  iron: '#0E1626',
  waiter: '#F4EDDA',
  lamp: '#FFE9A8',
}

/**
 * The tables on the terrace, in a 0→1 space with y running down. They shrink
 * and rise as they recede, which is the whole of the perspective in this
 * picture — the painting has no vanishing lines to speak of, just tables
 * getting smaller as the street goes away.
 */
const TABLES = [
  { x: 0.118, y: 0.822, r: 0.056 },
  { x: 0.232, y: 0.792, r: 0.05 },
  { x: 0.152, y: 0.744, r: 0.044 },
  { x: 0.268, y: 0.726, r: 0.041 },
  { x: 0.352, y: 0.758, r: 0.045 },
  { x: 0.362, y: 0.700, r: 0.037 },
  { x: 0.448, y: 0.722, r: 0.037 },
  { x: 0.460, y: 0.678, r: 0.032 },
  { x: 0.532, y: 0.698, r: 0.029 },
]

/**
 * Two chairs to a table, set behind it rather than beside it. The table top is
 * drawn over the top of whoever is sitting there, which is the only thing that
 * makes a figure read as seated *at* a table rather than standing next to one.
 */
const SEATS = TABLES.flatMap((t, i) => [
  { x: t.x - t.r * 0.92, y: t.y - t.r * 0.5, s: t.r / 0.056, id: `${i}a` },
  { x: t.x + t.r * 0.92, y: t.y - t.r * 0.62, s: t.r / 0.056, id: `${i}b` },
])

/** The coats people are wearing. Van Gogh's crowd is mostly dark. */
const COATS = ['#101A2E', '#1B2440', '#2E1C22', '#3A2A18', '#14243A', '#4A2A2A']
const HEADS = ['#E2B98C', '#D6A87C', '#C99B72', '#EBCDA6']

/* ── The scene ───────────────────────────────────────────────────────────── */

function buildScene() {
  const rand = mulberry32(18880916)
  const marks = []

  const shape = (draw) => marks.push(draw)
  const poly = (points, fill, alpha = 1) =>
    shape((ctx, W, H) => {
      ctx.globalAlpha = alpha
      ctx.fillStyle = fill
      ctx.beginPath()
      points.forEach(([x, y], i) => (i ? ctx.lineTo(x * W, y * H) : ctx.moveTo(x * W, y * H)))
      ctx.closePath()
      ctx.fill()
      ctx.globalAlpha = 1
    })
  const oval = (cx, cy, rx, ry, fill, alpha = 1) =>
    shape((ctx, W, H) => {
      ctx.globalAlpha = alpha
      ctx.fillStyle = fill
      ctx.beginPath()
      ctx.ellipse(cx * W, cy * H, rx * W, ry * H, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    })
  const stroke = (x1, y1, x2, y2, color, width, alpha = 1) =>
    shape((ctx, W, H) => {
      ctx.strokeStyle = color
      ctx.globalAlpha = alpha
      ctx.lineWidth = width * (Math.min(W, H) / 700)
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(x1 * W, y1 * H)
      ctx.lineTo(x2 * W, y2 * H)
      ctx.stroke()
      ctx.globalAlpha = 1
    })

  // 1. Night, then the sky over the right-hand half.
  poly([[0, 0], [1, 0], [1, 1], [0, 1]], C.night)
  shape((ctx, W, H) => {
    // Down to the rooftops, not to an arbitrary line: cutting it at half height
    // left a hard horizontal edge across the middle of the sky.
    const g = ctx.createLinearGradient(0, 0, 0, 0.68 * H)
    g.addColorStop(0, C.skyDeep)
    g.addColorStop(0.5, C.sky)
    g.addColorStop(1, C.skyLift)
    ctx.fillStyle = g
    ctx.fillRect(0.2 * W, 0, 0.8 * W, 0.68 * H)
  })

  // 2. The stars. Each is a dab with a halo, which is the only reason they
  //    read as light rather than as dots of paint.
  for (let i = 0; i < 24; i++) {
    const sx = 0.3 + rand() * 0.68
    const sy = 0.015 + rand() * 0.33
    // Small. At the size they were before they read as moons, and there is
    // only one moon in this picture and it is not in it.
    const r = 0.004 + rand() * rand() * 0.011
    oval(sx, sy, r * 2.4, r * 2.4 * 0.78, C.star, 0.15)
    oval(sx, sy, r, r * 0.84, C.starHot, 0.95)
  }

  // 4. The blocks down the right-hand side of the street, and their windows.
  poly([[0.62, 0.2], [1, 0.1], [1, 0.78], [0.62, 0.72]], C.blockDark)
  poly([[0.62, 0.2], [0.78, 0.16], [0.78, 0.75], [0.62, 0.72]], C.blockLift, 0.55)
  for (let i = 0; i < 9; i++) {
    const wx = 0.66 + (i % 3) * 0.1
    const wy = 0.26 + Math.floor(i / 3) * 0.13
    poly(
      [[wx, wy], [wx + 0.035, wy - 0.008], [wx + 0.035, wy + 0.05], [wx, wy + 0.056]],
      i % 4 === 0 ? C.window : '#1B2952',
      i % 4 === 0 ? 0.9 : 1
    )
  }

  // 4b. The plane tree hanging into the top right corner, painted after the
  //      blocks so it overhangs the roofline. Painted before them it was
  //      clipped square along the top of the buildings and read as a flat pool
  //      of green rather than a canopy.
  //      Foliage at night is nearly black; the lift is a rim, not a fill.
  const canopy = []
  for (let i = 0; i < 26; i++) {
    const a = rand()
    // Weighted into the corner, thinning down and to the left.
    const tx = 1.06 - a * a * 0.36
    const ty = rand() * (0.05 + a * 0.19)
    const r = 0.015 + rand() * 0.028 * (1 - a * 0.5)
    canopy.push([tx, ty, r])
    oval(tx, ty, r, r * 0.82, C.tree, 0.94)
  }
  for (let i = 0; i < 24; i++) {
    const [tx, ty, r] = canopy[Math.floor(rand() * canopy.length)]
    const ang = rand() * Math.PI * 2
    const len = r * (0.7 + rand() * 0.9)
    stroke(
      tx,
      ty,
      tx + Math.cos(ang) * len,
      ty + Math.sin(ang) * len * 1.3,
      i % 3 ? C.treeLift : C.tree,
      2.2,
      0.55
    )
  }

  // 5. The dark facade the terrace is built against, and its lit doorway.
  poly([[0, 0], [0.1, 0], [0.1, 1], [0, 1]], C.facade)
  poly([[0.005, 0.44], [0.062, 0.44], [0.062, 0.9], [0.005, 0.9]], C.doorRed, 0.85)
  poly([[0.012, 0.47], [0.055, 0.47], [0.055, 0.86], [0.012, 0.86]], '#D9A03A', 0.75)

  // 6. The café wall behind the terrace.
  poly([[0.06, 0.3], [0.44, 0.32], [0.44, 0.74], [0.06, 0.78]], C.wall)
  poly([[0.06, 0.3], [0.16, 0.31], [0.16, 0.77], [0.06, 0.78]], C.wallShade, 0.45)
  // The café door and the window beside it.
  poly([[0.18, 0.4], [0.27, 0.405], [0.27, 0.7], [0.18, 0.705]], C.wallShade, 0.9)
  poly([[0.3, 0.42], [0.38, 0.425], [0.38, 0.5], [0.3, 0.495]], C.awningHot, 0.5)

  // 7. The awning — the brightest shape in the painting, and the one that
  //    turns a street corner into a room.
  poly([[0.055, 0.125], [0.425, 0.152], [0.545, 0.318], [0.5, 0.375], [0.06, 0.33]], C.awning)
  poly([[0.055, 0.125], [0.425, 0.152], [0.44, 0.202], [0.06, 0.18]], C.awningHot, 0.8)
  poly([[0.425, 0.152], [0.545, 0.318], [0.5, 0.375], [0.435, 0.27]], C.awningShade, 0.55)
  // The ribs.
  for (let i = 0; i < 7; i++) {
    const t = i / 6
    stroke(0.07 + t * 0.33, 0.14 + t * 0.02, 0.085 + t * 0.4, 0.315 + t * 0.05, C.awningShade, 3, 0.4)
  }

  // 8. The terrace floor, lit by the awning.
  poly([[0.06, 0.66], [0.6, 0.6], [0.66, 0.9], [0.05, 1]], C.terrace)
  poly([[0.08, 0.68], [0.5, 0.63], [0.54, 0.8], [0.08, 0.88]], C.terraceHot, 0.4)

  // 9. The street, and the cobbles the painting spends half its surface on.
  poly([[0.6, 0.6], [1, 0.7], [1, 1], [0.62, 1]], C.cobbleBlue)
  poly([[0.05, 1], [0.66, 0.9], [1, 1]], C.cobbleViolet, 0.5)
  for (let i = 0; i < 150; i++) {
    const cx = 0.05 + rand() * 0.95
    const cy = 0.72 + rand() * 0.28
    if (cy < 0.86 && cx < 0.6) continue
    const pick = rand()
    oval(
      cx,
      cy,
      0.012 + rand() * 0.014,
      0.005 + rand() * 0.006,
      pick < 0.4 ? C.cobbleBlue : pick < 0.72 ? C.cobbleViolet : C.cobbleWarm,
      0.5 + rand() * 0.4
    )
  }

  // 10. The lamp further down the street. Kept low and small: level with the
  //      first-floor windows it read as an egg stuck to the building.
  oval(0.648, 0.502, 0.042, 0.042, C.lamp, 0.14)
  oval(0.648, 0.502, 0.011, 0.014, C.lamp, 0.85)

  // 11. Tables are not here. They live on the people layer, drawn over the top
  //      of whoever is sitting at them — see `drawTables`.

  // 12. The waiter in white, the one figure everybody sees first.
  poly([[0.409, 0.598], [0.434, 0.598], [0.441, 0.7], [0.402, 0.7]], C.waiter, 0.96)
  oval(0.4215, 0.585, 0.0135, 0.016, '#E7C79A', 1)
  stroke(0.434, 0.622, 0.458, 0.632, C.waiter, 4, 0.9)

  // 13. People further down the street, small and dark.
  // Evenly spaced and man-sized they read as chess pieces, so they are small,
  // clustered and paired the way people on a street actually are.
  const passers = [
    [0.606, 0.618, 0.62],
    [0.632, 0.606, 0.55],
    [0.702, 0.626, 0.6],
    [0.752, 0.598, 0.46],
    [0.771, 0.602, 0.5],
    [0.86, 0.63, 0.44],
  ]
  for (const [px, py, sc] of passers) {
    poly(
      [
        [px - 0.013 * sc, py + 0.07 * sc],
        [px - 0.009 * sc, py],
        [px + 0.009 * sc, py],
        [px + 0.013 * sc, py + 0.07 * sc],
      ],
      rand() > 0.5 ? C.iron : '#2A2038',
      0.92
    )
    oval(px, py - 0.011 * sc, 0.008 * sc, 0.0095 * sc, '#D8C39A', 0.85)
  }

  // 14. Brushwork over all of it, so nothing reads as a flat digital fill.
  const regionAt = (x, y) => {
    if (x < 0.06) return 'facade'
    if (y > 0.86 || (x > 0.6 && y > 0.7)) return 'cobble'
    if (y > 0.6 && x < 0.66) return 'terrace'
    if (y < 0.42 && x > 0.06 && y > 0.1 && x < 0.6) return 'awning'
    if (y > 0.28 && x < 0.46) return 'wall'
    if (x > 0.62 && y > 0.18) return 'block'
    return 'sky'
  }
  const TONES = {
    sky: [C.sky, C.skyDeep, C.skyLift, '#4A72D0'],
    awning: [C.awning, C.awningHot, C.awningShade],
    wall: [C.wall, C.wallShade, '#EEBE4E'],
    terrace: [C.terrace, C.terraceHot, C.cobbleWarm],
    cobble: [C.cobbleBlue, C.cobbleViolet, C.cobbleWarm, '#6B5A8C'],
    block: [C.blockDark, C.blockLift, '#0F1836'],
    facade: [C.facade, '#16303C', '#0A1018'],
  }
  const ANGLE = { sky: 0.15, awning: 0.32, wall: 1.5, terrace: 0.1, cobble: 0.12, block: 1.4, facade: 1.5 }

  const strokes = []
  for (let i = 0; i < 520; i++) {
    const x = rand()
    const y = rand()
    const region = regionAt(x, y)
    const pool = TONES[region]
    strokes.push({
      x,
      y,
      angle: ANGLE[region] + (rand() - 0.5) * 0.6,
      len: 0.018 + rand() * 0.045,
      w: 4 + rand() * 11,
      color: pool[Math.floor(rand() * pool.length)],
      alpha: 0.12 + rand() * 0.26,
      bend: (rand() - 0.5) * 0.5,
    })
  }
  strokes.sort((a, b) => a.y - b.y)
  for (const s of strokes) {
    shape((ctx, W, H) => {
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
    })
  }

  return marks
}

/* ── The people ──────────────────────────────────────────────────────────── */

/** One seated figure: a coat, a head, and an elbow on the table. */
function drawPatron(ctx, W, H, seat, patron, appear) {
  const k = Math.min(W, H)
  const s = seat.s
  const x = seat.x * W
  const base = seat.y * H
  // They rise into the chair rather than blinking into it.
  const lift = (1 - appear) * 0.03 * H * s
  const y = base + lift

  ctx.globalAlpha = appear
  ctx.fillStyle = patron.coat
  ctx.beginPath()
  ctx.moveTo(x - 0.021 * k * s, y + 0.05 * k * s)
  ctx.quadraticCurveTo(x - 0.019 * k * s, y - 0.014 * k * s, x, y - 0.019 * k * s)
  ctx.quadraticCurveTo(x + 0.019 * k * s, y - 0.014 * k * s, x + 0.021 * k * s, y + 0.05 * k * s)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = patron.head
  ctx.beginPath()
  ctx.ellipse(x, y - 0.029 * k * s, 0.0105 * k * s, 0.0125 * k * s, 0, 0, Math.PI * 2)
  ctx.fill()

  // A shoulder catching the awning's light, which is what stops them reading
  // as silhouettes cut out of card.
  ctx.strokeStyle = 'rgba(247,200,98,0.45)'
  ctx.lineWidth = 0.005 * k * s
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x - 0.016 * k * s, y - 0.002 * k * s)
  ctx.lineTo(x - 0.008 * k * s, y - 0.013 * k * s)
  ctx.stroke()
  ctx.globalAlpha = 1
}

/**
 * The tables, drawn on the people layer after the people, so a figure sits
 * behind their own table instead of in front of it.
 */
function drawTables(ctx, W, H) {
  const k = Math.min(W, H)
  for (const t of TABLES) {
    const cx = t.x * W
    const cy = t.y * H
    ctx.strokeStyle = C.iron
    ctx.lineCap = 'round'
    ctx.globalAlpha = 0.85
    ctx.lineWidth = 3.5 * (k / 700)
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx, cy + t.r * 1.5 * H)
    ctx.stroke()

    ctx.globalAlpha = 0.96
    ctx.fillStyle = '#F0E4C8'
    ctx.beginPath()
    ctx.ellipse(cx, cy, t.r * W, t.r * 0.34 * H, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 0.7
    ctx.fillStyle = '#FFF6DE'
    ctx.beginPath()
    ctx.ellipse(cx, cy - t.r * 0.08 * H, t.r * 0.86 * W, t.r * 0.24 * H, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }
}

/**
 * A ResizeObserver never sees a monitor swap: the element's CSS box does not
 * move, so the backing store keeps the old ratio, `setTransform` stays stale,
 * and the picture goes soft — the people layer at a different scale from the
 * scene under it. A resolution media query does see it. It has to be re-armed
 * after every change, because the ratio it matches on is the one it was built
 * with.
 */
function watchDpr(onChange) {
  let mq = null
  let stopped = false
  const fire = () => {
    onChange()
    arm()
  }
  const arm = () => {
    if (stopped || !window.matchMedia) return
    mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
    mq.addEventListener('change', fire, { once: true })
  }
  arm()
  return () => {
    stopped = true
    mq?.removeEventListener('change', fire)
  }
}

const ARRIVE_EVERY = 1250
const FADE_MS = 700

/**
 * Room 1's picture: the café terrace at night, painting itself as the visitor
 * reads past it — and then filling up.
 *
 * Two canvases rather than one. The scene is append-only: it is six hundred
 * marks and repainting it every frame would be absurd, so it is drawn once,
 * progressively, and never cleared. The people sit on a second canvas that is
 * cleared and redrawn each frame, because they arrive, stay a while and leave,
 * and canvas marks cannot be un-drawn.
 *
 * The terrace keeps filling for as long as anyone is in the room. Somebody sits
 * down every second or so until the tables are full, and after that there is a
 * slow turnover — one leaves, another arrives — so the café is never finished
 * and never static.
 *
 * Simple mode and reduced motion get the same picture with every table already
 * occupied, drawn once, with no loop running.
 */
export default function SelfPaintingCanvas({ alt, stillAlt }) {
  const sceneRef = useRef(null)
  const peopleRef = useRef(null)
  const simpleMode = useStore((s) => s.simpleMode)
  const reducedMotion = useStore((s) => s.reducedMotion)
  const still = simpleMode || reducedMotion

  // ── The scene, drawn once and added to as the visitor scrolls ────────────
  useEffect(() => {
    const canvas = sceneRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const marks = buildScene()
    let width = 0
    let height = 0
    let drawn = 0
    let raf = 0

    const redrawTo = (count) => {
      ctx.clearRect(0, 0, width, height)
      for (let i = 0; i < count; i++) marks[i](ctx, width, height)
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
    const stopDpr = watchDpr(resize)
    resize()

    if (still) {
      redrawTo(marks.length)
      return () => {
        ro.disconnect()
        stopDpr()
      }
    }

    // A mark cannot be un-drawn, so scrolling back up means replaying the
    // picture from a cleared canvas — several hundred closures at once. The
    // forward path is capped at 34 marks a frame; the backward one had no cap,
    // and at roughly a mark per pixel of scroll the guard below re-armed on
    // every frame of an upward flick. This gives the rewind a matching budget.
    // The picture still lands on the right state: the guard is re-tested every
    // frame and fires as soon as the cooldown is up.
    const REWIND_MS = 120
    let lastRewind = -Infinity

    const tick = (now) => {
      raf = requestAnimationFrame(tick)
      // The picture finishes before the room does, so the last paragraph is
      // read against a terrace that is open rather than half-built.
      const local = progressThroughRoom(ROOM_BY_ID.nuenen.index)
      const eased = Math.min(1, Math.max(0, (local - 0.03) / 0.55))
      const target = Math.round(eased * marks.length)

      if (target > drawn) {
        const limit = Math.min(target, drawn + 34)
        for (let i = drawn; i < limit; i++) marks[i](ctx, width, height)
        drawn = limit
      } else if (target < drawn - 2 && now - lastRewind >= REWIND_MS) {
        lastRewind = now
        redrawTo(target)
      }
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      stopDpr()
    }
  }, [still])

  // ── The people, arriving ─────────────────────────────────────────────────
  useEffect(() => {
    const canvas = peopleRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rand = mulberry32(2718281)
    const occupants = new Map()
    let width = 0
    let height = 0
    let raf = 0
    let visible = false
    let nextArrival = 0
    // The terrace keeps its own clock, advanced only by frames it actually
    // draws and clamped per frame. On wall-clock time, a minute spent in
    // another room — or another tab — aged every seat past its dwell at once,
    // so coming back emptied a full café between two frames and then took
    // twenty seconds to look busy again.
    let clock = 0
    let last = 0

    const newcomer = (now) => ({
      coat: COATS[Math.floor(rand() * COATS.length)],
      head: HEADS[Math.floor(rand() * HEADS.length)],
      at: now,
      // Long, varied stays — a café empties slowly or not at all.
      dwell: 16000 + rand() * 34000,
    })

    /** The finished terrace: every table taken. Used by the no-animation path. */
    const paintStill = () => {
      if (!width) return
      ctx.clearRect(0, 0, width, height)
      for (const seat of SEATS) drawPatron(ctx, width, height, seat, occupants.get(seat.id), 1)
      drawTables(ctx, width, height)
    }

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Assigning canvas.width wipes the surface. The animated path repaints
      // every frame and heals itself; the still path draws exactly once, so
      // without this the observer's first callback left an empty terrace.
      if (still) paintStill()
    }

    if (still) for (const seat of SEATS) occupants.set(seat.id, newcomer(0))

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    const stopDpr = watchDpr(resize)
    resize()

    if (still) {
      paintStill()
      return () => {
        ro.disconnect()
        stopDpr()
      }
    }

    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), {
      rootMargin: '15% 0px',
    })
    io.observe(canvas)

    const tick = (now) => {
      raf = requestAnimationFrame(tick)
      // `last` moves on every frame, including the ones that bail, so time
      // spent off-screen contributes nothing to `clock`.
      const dt = last ? now - last : 0
      last = now
      if (!visible || !width) return
      clock += Math.min(dt, 50)

      // Nobody sits down until there is a terrace to sit on.
      const local = progressThroughRoom(ROOM_BY_ID.nuenen.index)
      const ready = local > 0.18

      if (ready && clock >= nextArrival) {
        const free = SEATS.filter((s) => !occupants.has(s.id))
        if (free.length) {
          occupants.set(free[Math.floor(rand() * free.length)].id, newcomer(clock))
        }
        nextArrival = clock + ARRIVE_EVERY * (0.7 + rand() * 0.8)
      }

      ctx.clearRect(0, 0, width, height)
      if (!ready) return

      for (const seat of SEATS) {
        const patron = occupants.get(seat.id)
        if (!patron) continue
        const age = clock - patron.at
        let appear = Math.min(1, age / FADE_MS)
        if (age > patron.dwell) {
          const going = (age - patron.dwell) / FADE_MS
          if (going >= 1) {
            occupants.delete(seat.id)
            continue
          }
          appear = 1 - going
        }
        drawPatron(ctx, width, height, seat, patron, appear)
      }

      drawTables(ctx, width, height)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      stopDpr()
    }
  }, [still])

  // One name, not two. The figcaption that used to sit here said exactly what
  // the canvas's own label says, so the whole description was read out twice in
  // a row. And the description itself has to tell the truth about what the
  // visitor is getting: on the still path nothing paints and nobody arrives,
  // so promising both would describe a picture that is not there.
  const label = (still && stillAlt) || alt

  return (
    <figure className="nuenen__figure">
      <canvas ref={sceneRef} className="nuenen__canvas" role="img" aria-label={label} />
      <canvas ref={peopleRef} className="nuenen__canvas nuenen__canvas--people" aria-hidden="true" />
    </figure>
  )
}
