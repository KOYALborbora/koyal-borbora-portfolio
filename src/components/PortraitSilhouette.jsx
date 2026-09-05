import { useEffect, useRef } from 'react'
import { scrollState } from '../state/scrollState.js'
import { useStore } from '../state/useStore.js'

/**
 * The figure at the threshold.
 *
 * Van Gogh's self-portraits are the one subject he could always afford, and
 * they are the reason the threshold of this building has somebody standing in
 * it. This is a stylised stand-in built from brush-shaped paths rather than a
 * photograph, so it ships with no image weight and no licensing question — and
 * the eyes follow the visitor, which is the whole point of a portrait that is
 * watching the door.
 *
 * To use a real photograph instead, drop it in `public/` and swap the `<g
 * className="portrait__strokes">` block for an `<image>` with the same painterly
 * filter applied; the eye-tracking group can stay or go.
 */
export default function PortraitSilhouette({ alt }) {
  const eyesRef = useRef(null)
  const rootRef = useRef(null)
  const simpleMode = useStore((s) => s.simpleMode)
  const reducedMotion = useStore((s) => s.reducedMotion)
  const still = simpleMode || reducedMotion

  useEffect(() => {
    if (still) return
    const eyes = eyesRef.current
    const root = rootRef.current
    if (!eyes || !root) return

    let raf = 0
    let x = 0
    let y = 0

    // How far an eyeball may travel from centre, in viewBox units. The white is
    // 17 x 9.5 and the eyeball 5.4, so these leave a rim of sclera on every
    // side at full deflection rather than jamming the pupil against the lid.
    const REACH_X = 7.4
    const REACH_Y = 2.9

    const draw = () => {
      raf = requestAnimationFrame(draw)
      const box = root.getBoundingClientRect()
      if (!box.width) return
      const cx = box.left + box.width / 2
      const cy = box.top + box.height * 0.38

      // Where the pointer is, relative to the face, as a unit vector.
      let nx = (scrollState.pointerPx.x - cx) / (box.width * 0.75)
      let ny = (scrollState.pointerPx.y - cy) / (box.height * 0.6)

      // Clamped to an ellipse, not a rectangle: a rectangular clamp lets the
      // eyeball reach further on the diagonal than straight up, which is the
      // tell that makes googly eyes look like a bug.
      const reach = Math.hypot(nx, ny)
      if (reach > 1) {
        nx /= reach
        ny /= reach
      }

      const tx = nx * REACH_X
      const ty = ny * REACH_Y
      x += (tx - x) * 0.08
      y += (ty - y) * 0.08
      eyes.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})`)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [still])

  return (
    <svg
      ref={rootRef}
      className="portrait"
      viewBox="0 0 420 560"
      role="img"
      aria-label={alt}
      preserveAspectRatio="xMidYMax meet"
    >
      <defs>
        {/* Roughens every edge in one pass, so the strokes below can stay simple
            paths and still land as paint rather than as vector art. */}
        <filter id="portrait-paint" x="-12%" y="-12%" width="124%" height="124%">
          <feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="4" seed="19" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G" />
        </filter>

        {/* The sockets the eyeballs are allowed to move inside. Belt and
            braces alongside the clamp in JS: geometry cannot drift. */}
        <clipPath id="portrait-sockets">
          <ellipse cx="168" cy="228" rx="17" ry="9.5" />
          <ellipse cx="252" cy="228" rx="17" ry="9.5" />
        </clipPath>

        <radialGradient id="portrait-glow" cx="50%" cy="34%" r="62%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.32" />
          <stop offset="60%" stopColor="var(--secondary)" stopOpacity="0.12" />
          <stop offset="100%" stopColor="var(--bg)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="210" cy="230" rx="190" ry="215" fill="url(#portrait-glow)" />

      <g className="portrait__strokes" filter="url(#portrait-paint)">
        {/* Ground: short, near-vertical strokes behind the head, the way Van
            Gogh built his backgrounds out of directional dashes. */}
        <g opacity="0.5" stroke="var(--secondary)" strokeWidth="9" strokeLinecap="round">
          {Array.from({ length: 16 }, (_, i) => {
            const gx = 40 + i * 22
            const lean = (i % 3) - 1
            return (
              <path
                key={gx}
                d={`M${gx} ${120 + (i % 4) * 26} q ${lean * 14} 52 ${lean * 6} 104`}
                opacity={0.25 + ((i * 37) % 50) / 100}
              />
            )
          })}
        </g>

        {/* Shoulders and coat. */}
        <path
          d="M52 560 C 60 452 118 400 210 396 C 302 400 360 452 368 560 Z"
          fill="var(--secondary)"
          opacity="0.9"
        />
        <path
          d="M52 560 C 66 470 120 424 168 410 L 196 560 Z"
          fill="var(--bg)"
          opacity="0.35"
        />
        <path
          d="M368 560 C 354 470 300 424 252 410 L 224 560 Z"
          fill="var(--accent)"
          opacity="0.18"
        />

        {/* Neck, then the head — one closed stroke, deliberately lopsided. */}
        <path d="M178 372 h64 v56 h-64 Z" fill="var(--secondary)" opacity="0.75" />
        <path
          d="M210 96 C 288 96 322 158 320 232 C 318 312 276 386 210 388 C 144 386 102 312 100 232 C 98 158 132 96 210 96 Z"
          fill="var(--bg)"
          stroke="var(--accent)"
          strokeWidth="7"
          opacity="0.96"
        />

        {/* Cheek and brow modelling, laid in as broad dashes. */}
        <g fill="none" strokeLinecap="round" opacity="0.55">
          <path d="M126 214 C 150 196 176 192 198 200" stroke="var(--accent)" strokeWidth="8" />
          <path d="M222 200 C 246 192 272 196 294 214" stroke="var(--accent)" strokeWidth="8" />
          <path d="M132 296 C 156 330 182 348 210 352" stroke="var(--secondary)" strokeWidth="11" />
          <path d="M288 296 C 264 330 238 348 210 352" stroke="var(--secondary)" strokeWidth="11" />
        </g>

        {/* Beard: Van Gogh's, and the fastest way to make a silhouette read as
            this particular painter without reproducing a single painting. */}
        <path
          d="M150 300 C 156 356 178 392 210 396 C 242 392 264 356 270 300 C 250 332 230 344 210 344 C 190 344 170 332 150 300 Z"
          fill="var(--accent)"
          opacity="0.5"
        />

        <path d="M210 236 C 204 262 200 276 210 288" stroke="var(--accent)" strokeWidth="6" fill="none" opacity="0.7" />
        <path d="M186 312 C 198 320 222 320 234 312" stroke="var(--accent)" strokeWidth="7" fill="none" opacity="0.65" strokeLinecap="round" />
      </g>

      {/* Eyes sit outside the roughening filter so they stay legible — they are
          the one part of the picture doing conversational work.

          The whites stay put and only the eyeballs travel, which is how an eye
          actually works; moving the entire eye instead slides the socket around
          the face and reads as a glitch rather than as a glance. */}
      <g className="portrait__eyes">
        <ellipse cx="168" cy="228" rx="17" ry="9.5" fill="var(--text)" opacity="0.72" />
        <ellipse cx="252" cy="228" rx="17" ry="9.5" fill="var(--text)" opacity="0.72" />

        <g ref={eyesRef} clipPath="url(#portrait-sockets)">
          <circle cx="168" cy="228" r="5.4" fill="var(--bg)" />
          <circle cx="252" cy="228" r="5.4" fill="var(--bg)" />
          <circle cx="169.6" cy="226.4" r="1.6" fill="var(--accent)" />
          <circle cx="253.6" cy="226.4" r="1.6" fill="var(--accent)" />
        </g>
      </g>
    </svg>
  )
}
