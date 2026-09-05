import { useEffect, useRef } from 'react'
import { useStore } from '../state/useStore.js'

const W = 460
const H = 150
/** Sampling stride over the rendered glyphs. Smaller = more dots = more cost.
 *  Kept fine enough that the resolved word is genuinely readable — a scatter
 *  that never quite becomes a word is a puzzle, not an effect. */
const STRIDE = 3
const MAX_DOTS = 900

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
 * Paris, where the brushstroke came apart into dots.
 *
 * The tool's name is rendered once to an offscreen canvas, its glyphs sampled
 * into a cloud of points, and those points scattered. As the study reaches the
 * middle of the corridor the cloud resolves back into the word — the small
 * "aha" this room is built around.
 *
 * The word is also present as real text in the DOM (visually hidden, supplied
 * by the parent), so nothing here is load-bearing for anyone who cannot see it.
 */
export default function PointillistReveal({ label, seed = 1, palette }) {
  const canvasRef = useRef(null)
  const simpleMode = useStore((s) => s.simpleMode)
  const reducedMotion = useStore((s) => s.reducedMotion)
  const still = simpleMode || reducedMotion

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let dots = []
    let focus = still ? 1 : 0
    let visible = false
    let disposed = false
    let hovering = false

    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const build = () => {
      // Render the word, read it back as pixels, throw the pixels away and keep
      // the positions. Everything after this point is just points moving.
      const off = document.createElement('canvas')
      off.width = W
      off.height = H
      const octx = off.getContext('2d', { willReadFrequently: true })
      if (!octx) return

      let size = 74
      octx.textAlign = 'center'
      octx.textBaseline = 'middle'
      const fit = () => {
        octx.font = `900 ${size}px Fraunces, Georgia, serif`
        return octx.measureText(label).width
      }
      // Shrink until the longest tool name fits the study.
      while (fit() > W - 40 && size > 22) size -= 3
      octx.clearRect(0, 0, W, H)
      octx.fillStyle = '#fff'
      octx.fillText(label, W / 2, H / 2)

      const { data } = octx.getImageData(0, 0, W, H)
      const rand = mulberry32(seed * 7919 + 13)
      const found = []
      for (let y = 0; y < H; y += STRIDE) {
        for (let x = 0; x < W; x += STRIDE) {
          if (data[(y * W + x) * 4 + 3] > 128) found.push([x, y])
        }
      }
      // Even thinning rather than a head-slice, so short and long words keep
      // the same visual density.
      const step = Math.max(1, Math.ceil(found.length / MAX_DOTS))
      dots = []
      for (let i = 0; i < found.length; i += step) {
        const [tx, ty] = found[i]
        const angle = rand() * Math.PI * 2
        const radius = 60 + rand() * 190
        dots.push({
          tx,
          ty,
          sx: W / 2 + Math.cos(angle) * radius,
          sy: H / 2 + Math.sin(angle) * radius * 0.55,
          x: 0,
          y: 0,
          r: 0.85 + rand() * 1.35,
          hue: rand(),
          drift: rand() * Math.PI * 2,
        })
      }
      for (const d of dots) {
        d.x = d.sx
        d.y = d.sy
      }
    }

    const render = (t) => {
      ctx.clearRect(0, 0, W, H)
      for (const d of dots) {
        // Dots do not travel in straight lines; they wander in and settle.
        const wobble = (1 - focus) * 6
        const wx = Math.cos(d.drift + t * 0.0011) * wobble
        const wy = Math.sin(d.drift + t * 0.0013) * wobble
        const x = d.sx + (d.tx - d.sx) * focus + wx
        const y = d.sy + (d.ty - d.sy) * focus + wy

        ctx.globalAlpha = 0.28 + focus * 0.62
        // Weighted towards the text pigment: the two brighter tones give the
        // dab its Paris palette, the charcoal gives the word its edges.
        ctx.fillStyle = d.hue < 0.34 ? palette.accent : d.hue < 0.62 ? palette.secondary : palette.text
        ctx.beginPath()
        ctx.arc(x, y, d.r * (0.7 + focus * 0.5), 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    const start = () => {
      if (disposed) return
      build()
      if (still) {
        focus = 1
        render(0)
        return
      }

      const tick = (t) => {
        raf = requestAnimationFrame(tick)
        if (!visible) return

        const rect = canvas.getBoundingClientRect()
        const centre = rect.left + rect.width / 2
        // Focus is proximity to the middle of the corridor — the study resolves
        // as it arrives and dissolves again as it leaves.
        const d = Math.abs(centre - window.innerWidth / 2)
        const near = Math.max(0, 1 - d / (window.innerWidth * 0.42))
        const target = Math.max(hovering ? 1 : 0, near * near)
        focus += (target - focus) * 0.08
        render(t)
      }
      raf = requestAnimationFrame(tick)
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
      },
      { rootMargin: '20% 40%' }
    )
    io.observe(canvas)

    const onEnter = () => (hovering = true)
    const onLeave = () => (hovering = false)
    const host = canvas.parentElement
    host?.addEventListener('pointerenter', onEnter)
    host?.addEventListener('pointerleave', onLeave)
    host?.addEventListener('focusin', onEnter)
    host?.addEventListener('focusout', onLeave)

    // Fraunces has to be loaded before the glyphs are sampled, or the dots
    // trace a fallback serif and the word arrives in the wrong typeface.
    const ready = document.fonts?.ready ?? Promise.resolve()
    ready.then(start).catch(start)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      io.disconnect()
      host?.removeEventListener('pointerenter', onEnter)
      host?.removeEventListener('pointerleave', onLeave)
      host?.removeEventListener('focusin', onEnter)
      host?.removeEventListener('focusout', onLeave)
    }
  }, [label, seed, still, palette])

  return (
    <canvas
      ref={canvasRef}
      className="paris__dots"
      style={{ aspectRatio: `${W} / ${H}` }}
      aria-hidden="true"
    />
  )
}
