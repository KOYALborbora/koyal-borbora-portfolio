import { useEffect, useRef, useState } from 'react'
import { useStore } from '../state/useStore.js'
import { scrollState } from '../state/scrollState.js'
import Invitation from '../components/Invitation.jsx'
import './CalmTheSky.css'

/** How long the button takes to settle the sky on its own. */
const AUTO_SECONDS = 1.8

/**
 * How far the brush has to travel across the sky, in CSS pixels, scaled to the
 * screen it is travelling across. Measured at two comfortable sweeps on a
 * laptop and three swipes on a phone.
 */
const sweepDistance = () => Math.max(900, (window.innerWidth || 1200) * 1.6)

/**
 * Calm the Sky.
 *
 * The last room opens on a wheatfield under crows and does not resolve on its
 * own. The visitor brushes the storm out of it, and what is left is the blossom
 * blue Van Gogh mixed for a newborn nephew in the last spring of his life. The
 * site ends on a beginning, and it ends there because somebody did something.
 *
 * The gesture is a sweep, measured in distance travelled rather than time held.
 * It used to be a press-and-hold that took three and a half seconds and drained
 * back if your finger slipped, which turned the best moment in the building into
 * a chore — and holding still is the one thing a cursor shaped like a brush is
 * worst at expressing. Moving is free, it is what a brush is for, and the trail
 * the cursor already leaves makes the storm look like something being painted
 * away.
 *
 * There is no overlay to sweep across: the pointer is read from the shared
 * per-frame state, which means nothing sits over the room stealing clicks or
 * blocking a phone from scrolling out of it.
 */
export default function CalmTheSky({ prompt, calmedPrompt }) {
  const calm = useStore((s) => s.calm)
  const setCalm = useStore((s) => s.setCalm)
  const announce = useStore((s) => s.announce)
  const simpleMode = useStore((s) => s.simpleMode)
  const reducedMotion = useStore((s) => s.reducedMotion)
  const still = simpleMode || reducedMotion

  const fine =
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches

  const [working, setWorking] = useState(false)
  // A timestamp, not a flag: accumulating dt per frame makes the button's own
  // settle take as long as the device is slow — six seconds on a machine
  // rendering the sky at three frames a second, because dt is clamped to keep a
  // tab-out from jumping. Wall clock is the same everywhere.
  const autoStartRef = useRef(0)
  const valueRef = useRef(0)
  const settledRef = useRef(false)

  // Reduced motion and simple mode get the resolved sky immediately. The room's
  // meaning is the turn from storm to blossom, and withholding it from someone
  // who asked for less motion would be withholding the content.
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
    let px = scrollState.pointerPx.x
    let py = scrollState.pointerPx.y

    const tick = (now) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now

      const dx = scrollState.pointerPx.x - px
      const dy = scrollState.pointerPx.y - py
      px = scrollState.pointerPx.x
      py = scrollState.pointerPx.y

      if (settledRef.current) return

      // Read straight from the store rather than subscribing: this runs every
      // frame and must not re-render anything to find out where it is.
      const here = useStore.getState().activeRoom === 'auvers'

      if (here && scrollState.pointerSeen) {
        const moved = Math.hypot(dx, dy)
        // A cap per frame, so flinging the pointer off-screen and back does not
        // clear the whole sky in one jump.
        if (moved > 0.4) {
          valueRef.current = Math.min(1, valueRef.current + Math.min(moved, 90) / sweepDistance())
        }
      }

      if (autoStartRef.current) {
        const elapsed = (now - autoStartRef.current) / 1000
        valueRef.current = Math.max(valueRef.current, Math.min(1, elapsed / AUTO_SECONDS))
      }

      if (valueRef.current >= 1) {
        settledRef.current = true
        autoStartRef.current = 0
        setWorking(false)
        announce('The sky has settled. Almond blossom.')
      }
      setCalm(valueRef.current)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [still, setCalm, announce])

  const settled = calm >= 0.999
  const started = calm > 0.02

  // One press, then it finishes on its own — for anyone on a keyboard, anyone
  // who would rather not, and anyone whose pointer does not sweep.
  const settleNow = () => {
    if (autoStartRef.current) return
    // Offset the clock by whatever has already been swept away, so pressing the
    // button after half a sweep finishes from there rather than starting over.
    autoStartRef.current = performance.now() - valueRef.current * AUTO_SECONDS * 1000
    setWorking(true)
  }

  return (
    <div className="calm" data-settled={settled}>
      <div className="calm__panel">
        <Invitation className="calm__prompt" done={settled} after={calmedPrompt}>
          {settled
            ? calmedPrompt
            : started
              ? 'Keep going — the storm is lifting.'
              : fine
                ? prompt
                : 'Swipe across the sky, or use the button.'}
        </Invitation>

        {!settled && (
          <button
            type="button"
            className={`btn calm__btn ${working ? 'is-working' : ''}`}
            onClick={settleNow}
          >
            {working ? 'Settling…' : 'Calm it for me'}
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
