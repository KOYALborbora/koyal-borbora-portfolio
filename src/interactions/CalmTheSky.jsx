import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from '../state/useStore.js'
import './CalmTheSky.css'

const HOLD_SECONDS = 3.4
const DECAY_PER_SECOND = 0.09

/**
 * Calm the Sky.
 *
 * The last room opens on the wheatfield under crows and does not resolve on its
 * own. The visitor presses and holds, the turbulence drains out of the paint,
 * and what is left is the blossom blue Van Gogh mixed for a newborn nephew in
 * the last spring of his life. The site ends on a beginning, and it ends there
 * because somebody held on.
 *
 * Letting go early lets the storm creep back, so reaching the end takes a
 * sustained act rather than a scrub. Once it arrives it stays: nobody should be
 * made to earn the ending twice.
 */
export default function CalmTheSky({ prompt, calmedPrompt }) {
  const calm = useStore((s) => s.calm)
  const setCalm = useStore((s) => s.setCalm)
  // Same reason as the star field: fixed, viewport-sized, and this room is
  // always mounted, so it only exists while the visitor is standing in it.
  const inRoom = useStore((s) => s.activeRoom === 'auvers')
  const announce = useStore((s) => s.announce)
  const simpleMode = useStore((s) => s.simpleMode)
  const reducedMotion = useStore((s) => s.reducedMotion)
  const still = simpleMode || reducedMotion

  // The field is a full-viewport press target with `touch-action: none`, which
  // on a phone means the visitor cannot scroll out of this room by dragging
  // over the sky. Rather than weaken the gesture, the field is desktop-only —
  // on touch the button below does the same job with a proper tap target.
  const fine =
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches

  const [holding, setHolding] = useState(false)
  const holdingRef = useRef(false)
  const autoRef = useRef(false)
  const valueRef = useRef(0)
  const settledRef = useRef(false)

  const hold = useCallback((on) => {
    holdingRef.current = on
    setHolding(on)
  }, [])

  // Reduced motion and simple mode get the resolved sky immediately. The room's
  // meaning is the turn from storm to blossom, and withholding it from someone
  // who has asked for less motion would be withholding the content.
  useEffect(() => {
    if (!still) return
    valueRef.current = 1
    settledRef.current = true
    setCalm(1)
  }, [still, setCalm])

  useEffect(() => {
    if (still) return
    let raf = 0
    let last = performance.now()

    const tick = (now) => {
      raf = requestAnimationFrame(tick)
      // Clamped generously: a tight clamp turns the hold into a frame counter,
      // so a device rendering the sky at 10fps would take three times as long
      // in wall-clock seconds as one running at 60.
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now

      if (settledRef.current) return

      if (holdingRef.current || autoRef.current) {
        valueRef.current = Math.min(1, valueRef.current + dt / HOLD_SECONDS)
      } else if (valueRef.current > 0) {
        valueRef.current = Math.max(0, valueRef.current - dt * DECAY_PER_SECOND)
      }

      if (valueRef.current >= 1 && !settledRef.current) {
        settledRef.current = true
        autoRef.current = false
        announce('The sky has settled. Almond blossom.')
      }
      setCalm(valueRef.current)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [still, setCalm, announce])

  const settled = calm >= 0.999

  const onKeyDown = (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    // A keyboard press starts the settle and lets it run to the end. Asking
    // someone to physically hold a key for three seconds is not an equivalent.
    autoRef.current = true
  }

  return (
    <div className="calm" data-settled={settled}>
      {!still && !settled && inRoom && fine && (
        <div
          className="calm__field"
          aria-hidden="true"
          role="presentation"
          onPointerDown={() => hold(true)}
          onPointerUp={() => hold(false)}
          onPointerLeave={() => hold(false)}
          onPointerCancel={() => hold(false)}
        />
      )}

      <div className="calm__panel">
        <p className="calm__prompt">{settled ? calmedPrompt : prompt}</p>

        {!settled && (
          <button
            type="button"
            className={`btn calm__btn ${holding ? 'is-holding' : ''}`}
            onPointerDown={() => hold(true)}
            onPointerUp={() => hold(false)}
            onPointerLeave={() => hold(false)}
            onPointerCancel={() => hold(false)}
            onKeyDown={onKeyDown}
          >
            Calm the sky
          </button>
        )}

        <div
          className="calm__meter"
          role="progressbar"
          aria-label="How settled the sky is"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(calm * 100)}
        >
          <span className="calm__meter-fill" style={{ transform: `scaleX(${calm})` }} />
        </div>
      </div>
    </div>
  )
}
