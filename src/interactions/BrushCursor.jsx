import { useEffect, useRef } from 'react'
import { scrollState } from '../state/scrollState.js'
import { useStore } from '../state/useStore.js'
import { ROOM_BY_ID } from '../lib/rooms.js'

/** Bristles are laid down at fixed offsets, so a stroke has grain rather than being one flat line. */
const BRISTLES = [
  { offset: -3.4, width: 2.6, alpha: 0.5, tone: 'secondary' },
  { offset: -1.2, width: 4.2, alpha: 0.85, tone: 'accent' },
  { offset: 1.1, width: 3.4, alpha: 0.7, tone: 'accent' },
  { offset: 3.6, width: 2.0, alpha: 0.45, tone: 'text' },
]

const hexToRgb = (hex) => {
  const h = hex.replace('#', '')
  const n = parseInt(
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h,
    16
  )
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/**
 * The brush cursor.
 *
 * The site's first promise: this place is wet. The pointer is replaced by a
 * loaded brush that leaves a short-lived impasto trail in whatever pigment the
 * current room is mixed from, so the palette shift between rooms is something
 * the visitor feels in their own hand rather than only sees on the wall.
 *
 * Everything here is drawn on a single 2D canvas driven by one rAF loop and
 * reads the pointer straight from `scrollState`, so it costs no React renders.
 * It disables itself entirely for coarse pointers, reduced motion and simple
 * mode — and in every one of those cases the real system cursor comes back.
 */
/** A brush cursor only makes sense where there is a cursor to replace. */
const hasFinePointer = () =>
  typeof window !== 'undefined' &&
  !!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches

export default function BrushCursor() {
  const canvasRef = useRef(null)
  const simpleMode = useStore((s) => s.simpleMode)
  const reducedMotion = useStore((s) => s.reducedMotion)
  const activeRoom = useStore((s) => s.activeRoom)
  const calm = useStore((s) => s.calm)

  // Palette is read into a ref so the draw loop never restarts on a room change.
  const paletteRef = useRef(null)
  useEffect(() => {
    const room = ROOM_BY_ID[activeRoom]
    if (!room) return
    const p = room.palette
    // Auvers travels between two palettes as the sky calms; the brush travels
    // with it rather than staying stubbornly wheat-gold on a blossom-blue wall.
    const mix = (a, b) => {
      if (!b) return hexToRgb(a)
      const [r1, g1, b1] = hexToRgb(a)
      const [r2, g2, b2] = hexToRgb(b)
      return [
        Math.round(r1 + (r2 - r1) * calm),
        Math.round(g1 + (g2 - g1) * calm),
        Math.round(b1 + (b2 - b1) * calm),
      ]
    }
    paletteRef.current = {
      accent: mix(p.accent, p.accentCalm),
      secondary: hexToRgb(p.secondary ?? p.accent),
      text: mix(p.text, p.textCalm),
    }
  }, [activeRoom, calm])

  const still = simpleMode || reducedMotion

  useEffect(() => {
    if (still || !hasFinePointer()) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let dpr = Math.min(2, window.devicePixelRatio || 1)
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.floor(window.innerWidth * dpr)
      canvas.height = Math.floor(window.innerHeight * dpr)
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
    resize()
    window.addEventListener('resize', resize)

    // The brush lags the pointer slightly — a real brush has mass, and the lag
    // is most of what makes the trail read as paint rather than as a mouse path.
    let bx = scrollState.pointerPx.x
    let by = scrollState.pointerPx.y
    let woken = false
    let px = bx
    let py = by
    let pressure = 0
    let raf = 0

    const onDown = () => (pressure = 1)
    const onUp = () => (pressure = 0)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)

    const draw = () => {
      raf = requestAnimationFrame(draw)
      const pal = paletteRef.current
      // Nothing is painted until the visitor has actually moved a pointer, so
      // the page never loads with a stray dab sitting at the origin.
      if (!pal || !scrollState.pointerSeen) return

      const w = window.innerWidth
      const h = window.innerHeight

      // Wipe the trail back towards transparent a little each frame. Erasing
      // rather than painting the background over it keeps the canvas usable on
      // both the near-black and the cream rooms.
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = 'rgba(0,0,0,0.055)'
      ctx.fillRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'source-over'

      if (!woken) {
        // Snap to wherever the pointer first appeared instead of sweeping a
        // stroke across the page from the corner.
        woken = true
        bx = scrollState.pointerPx.x
        by = scrollState.pointerPx.y
      }

      px = bx
      py = by
      bx += (scrollState.pointerPx.x - bx) * 0.28
      by += (scrollState.pointerPx.y - by) * 0.28

      const dx = bx - px
      const dy = by - py
      const speed = Math.hypot(dx, dy)

      if (speed > 0.35) {
        // Perpendicular to travel, so bristles spread across the stroke rather
        // than along it — the direction a real brush loads paint.
        const nx = -dy / speed
        const ny = dx / speed
        const load = Math.min(1, speed / 26)
        const spread = 1 + load * 2.2 + pressure * 1.4

        for (const bristle of BRISTLES) {
          const [r, g, b] = pal[bristle.tone]
          const ox = nx * bristle.offset * spread
          const oy = ny * bristle.offset * spread
          ctx.strokeStyle = `rgba(${r},${g},${b},${bristle.alpha * (0.35 + load * 0.65)})`
          ctx.lineWidth = bristle.width * (0.6 + load * 0.9 + pressure * 0.5)
          ctx.beginPath()
          ctx.moveTo(px + ox, py + oy)
          ctx.lineTo(bx + ox, by + oy)
          ctx.stroke()
        }
      }

      // The brush tip itself, so there is always something under the hand even
      // when it is completely still.
      const [tr, tg, tb] = pal.accent
      const tip = 5 + pressure * 3
      const grad = ctx.createRadialGradient(bx, by, 0, bx, by, tip * 2.2)
      grad.addColorStop(0, `rgba(${tr},${tg},${tb},0.95)`)
      grad.addColorStop(0.45, `rgba(${tr},${tg},${tb},0.45)`)
      grad.addColorStop(1, `rgba(${tr},${tg},${tb},0)`)
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(bx, by, tip * 2.2, 0, Math.PI * 2)
      ctx.fill()
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [still])

  // Not merely idle on a touch device — absent. A full-viewport canvas that
  // never draws anything is still a compositing layer the phone has to carry.
  if (still || !hasFinePointer()) return null

  return <canvas ref={canvasRef} className="brush-layer" aria-hidden="true" />
}
