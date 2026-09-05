import { useEffect, useId, useRef } from 'react'
import { scrollState } from '../state/scrollState.js'
import { useStore } from '../state/useStore.js'

/**
 * Wet-paint type.
 *
 * An SVG `feTurbulence` feeding an `feDisplacementMap` pushes the glyph edges
 * around, so heavy Fraunces stops being a clean digital outline and starts
 * behaving like pigment that has been pushed with a knife. The displacement
 * scale rises as the pointer gets close, which is what makes the headline feel
 * like it is reacting to the visitor rather than looping an animation at them.
 *
 * This costs nothing in WebGL and works on every browser that ships SVG
 * filters, which is all of them — it is by some distance the cheapest way to
 * buy the expressionist feel the rest of the site is built around.
 */
export default function ImpastoText({
  as: Tag = 'h1',
  children,
  className = '',
  /** Peak displacement in pixels when the pointer is right on top of the text. */
  amount = 11,
  /** Baseline displacement when the pointer is far away. */
  rest = 3.5,
  ...props
}) {
  const uid = useId().replace(/:/g, '')
  const filterId = `impasto-${uid}`
  const ref = useRef(null)
  const turbRef = useRef(null)
  const dispRef = useRef(null)

  const simpleMode = useStore((s) => s.simpleMode)
  const reducedMotion = useStore((s) => s.reducedMotion)
  const still = simpleMode || reducedMotion

  useEffect(() => {
    if (still) return
    const el = ref.current
    const turb = turbRef.current
    const disp = dispRef.current
    if (!el || !turb || !disp) return

    let raf = 0
    let scale = rest
    let phase = 0

    const draw = () => {
      raf = requestAnimationFrame(draw)
      const box = el.getBoundingClientRect()
      const cx = box.left + box.width / 2
      const cy = box.top + box.height / 2
      const dist = Math.hypot(scrollState.pointerPx.x - cx, scrollState.pointerPx.y - cy)
      // Proximity falls off over roughly the width of the headline itself.
      const near = Math.max(0, 1 - dist / (box.width * 0.85 + 260))
      const target = rest + (amount - rest) * near * near

      scale += (target - scale) * 0.09
      disp.setAttribute('scale', scale.toFixed(2))

      // A very slow drift on the noise field so the paint keeps breathing even
      // when the pointer is nowhere near it. Fast enough to notice, slow enough
      // not to read as a wobble effect.
      phase += 0.0016
      const fx = 0.011 + Math.sin(phase) * 0.0035
      const fy = 0.024 + Math.cos(phase * 0.7) * 0.006
      turb.setAttribute('baseFrequency', `${fx.toFixed(5)} ${fy.toFixed(5)}`)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [still, amount, rest])

  return (
    <>
      {!still && (
        <svg className="visually-hidden" aria-hidden="true" focusable="false">
          <defs>
            {/* Generous filter region: displaced glyphs spill well outside the
                text box, and a tight region would clip the paint off. */}
            <filter
              id={filterId}
              x="-18%"
              y="-30%"
              width="136%"
              height="160%"
              colorInterpolationFilters="sRGB"
            >
              <feTurbulence
                ref={turbRef}
                type="fractalNoise"
                baseFrequency="0.011 0.024"
                numOctaves="3"
                seed="7"
                result="noise"
              />
              <feDisplacementMap
                ref={dispRef}
                in="SourceGraphic"
                in2="noise"
                scale={rest}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
      )}

      <Tag
        ref={ref}
        className={className}
        style={still ? undefined : { filter: `url(#${filterId})` }}
        {...props}
      >
        {children}
      </Tag>
    </>
  )
}
