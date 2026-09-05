import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from '../state/useStore.js'
import { scrollToRoom } from '../lib/scrollEngine.js'
import './PaintDrip.css'

const PULL_DISTANCE = 130

/**
 * The curtain pull.
 *
 * Not a bouncing chevron. A bead of wet paint hanging off the bottom of the
 * threshold that the visitor drags downward until it runs — the site's first
 * promise that things here answer to the hand. Completing the pull walks them
 * into Nuenen.
 *
 * It is a real `<button>` first and a drag target second, so pressing Enter,
 * Space or Down does exactly what the drag does. A gesture nobody can perform
 * with a keyboard is a gesture that locks people out of the front door.
 */
export default function PaintDrip({ label }) {
  const enter = useStore((s) => s.enter)
  const entered = useStore((s) => s.entered)
  const simpleMode = useStore((s) => s.simpleMode)
  const reducedMotion = useStore((s) => s.reducedMotion)
  const still = simpleMode || reducedMotion

  const [pull, setPull] = useState(0)
  const dragging = useRef(false)
  const startY = useRef(0)
  const moved = useRef(false)

  const open = useCallback(() => {
    enter()
    scrollToRoom('nuenen')
  }, [enter])

  const onPointerDown = (e) => {
    if (still) return
    dragging.current = true
    moved.current = false
    startY.current = e.clientY
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e) => {
    if (!dragging.current) return
    const dy = Math.max(0, e.clientY - startY.current)
    if (dy > 4) moved.current = true
    const next = Math.min(1, dy / PULL_DISTANCE)
    setPull(next)
    if (next >= 1) {
      dragging.current = false
      setPull(1)
      open()
    }
  }

  const release = () => {
    if (!dragging.current) return
    dragging.current = false
    // Short of the full pull, the paint snaps back up — the drag is a
    // commitment, not a scrub bar.
    setPull(0)
  }

  // Scrolling past the threshold counts as entering too, so a visitor who
  // simply spins the wheel is never held at the door by a gesture they missed.
  useEffect(() => {
    if (entered) return
    const onScroll = () => {
      if (window.scrollY > window.innerHeight * 0.25) enter()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [entered, enter])

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault()
      open()
    }
  }

  return (
    <div className="drip" style={{ '--pull': pull }}>
      <span className="drip__line" aria-hidden="true">
        <span className="drip__run" />
      </span>

      <button
        type="button"
        className="drip__bead"
        aria-label={label}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={release}
        onKeyDown={onKeyDown}
        onClick={(e) => {
          // A plain click still opens the room — holding people hostage to a
          // drag would be exactly the kind of cleverness this site should not
          // ship. But an abandoned drag must not count as one, or the paint
          // snapping back would mean nothing.
          if (!moved.current) {
            e.preventDefault()
            open()
          }
          moved.current = false
        }}
      >
        <span className="visually-hidden">{label}</span>
      </button>

      <span className="drip__label" aria-hidden="true">
        {label}
      </span>
    </div>
  )
}
