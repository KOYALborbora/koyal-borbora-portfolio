import { useCallback, useRef } from 'react'
import { useStore } from '../state/useStore.js'
import { scrollState } from '../state/scrollState.js'
import Invitation from '../components/Invitation.jsx'
import './LightTheStars.css'

/**
 * Light the Stars.
 *
 * The site's largest consequence. Clicking the sky ignites a star that stays
 * lit for the rest of the visit, so by the time the visitor leaves Saint-Rémy
 * they are looking at a constellation that was not there before they arrived
 * and will not be there for anyone else.
 *
 * The sky is a screen-space shader, so a click at (x, y) on the page is a point
 * at (x, y) in the paint — no unprojection, and no drift between where the
 * visitor aimed and where the star appears.
 *
 * The catch a mechanic like this usually has is that it is mouse-only. Here the
 * same action is a real button: it lights a star too, stepping through the sky
 * on a golden-ratio walk so repeated presses spread out instead of stacking.
 */
export default function LightTheStars({ prompt, countLabel }) {
  const stars = useStore((s) => s.stars)
  // The field below is fixed to the viewport, and this room never unmounts.
  // Without this gate it would hang over the whole exhibition intercepting
  // clicks meant for other rooms.
  const inRoom = useStore((s) => s.activeRoom === 'saint-remy')
  const lightStar = useStore((s) => s.lightStar)
  const announce = useStore((s) => s.announce)
  const simpleMode = useStore((s) => s.simpleMode)
  const reducedMotion = useStore((s) => s.reducedMotion)
  const still = simpleMode || reducedMotion
  const seq = useRef(0)

  const light = useCallback(
    (x, y) => {
      lightStar({ x, y, t: scrollState.time })
      announce(`Star lit. ${stars.length + 1} ${countLabel}.`)
    },
    [lightStar, announce, stars.length, countLabel]
  )

  const onClick = (e) => {
    if (still) return
    light(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight)
  }

  const lightNext = () => {
    // A low-discrepancy walk: consecutive presses land far apart, which is what
    // you want from a button that is standing in for aiming.
    const i = seq.current++
    const x = 0.12 + ((i * 0.6180339887) % 1) * 0.76
    const y = 0.34 + ((i * 0.7548776662) % 1) * 0.52
    light(x, y)
  }

  return (
    <>
      {/* The aimable sky. Decorative and hidden from assistive technology —
          the button below is the accessible route to the same action. */}
      {!still && inRoom && (
        <div className="stars__field" onClick={onClick} aria-hidden="true" role="presentation" />
      )}

      <div className="stars__panel">
        <Invitation className="stars__prompt" done={stars.length > 0} after="Keep going — they all stay lit.">
          {still ? 'Add a star to the sky.' : prompt}
        </Invitation>
        <div className="stars__row">
          <button type="button" className="btn stars__btn" onClick={lightNext}>
            {stars.length > 0 ? 'Light another' : 'Light a star'}
          </button>
          <p className="stars__count">
            <span className="stars__count-num">{stars.length}</span> {countLabel}
          </p>
        </div>
      </div>
    </>
  )
}
