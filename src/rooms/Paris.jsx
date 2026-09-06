import Room, { RoomTitle } from '../components/Room.jsx'
import PointillistReveal from '../interactions/PointillistReveal.jsx'
import { useHorizontalCorridor } from '../hooks/useHorizontalCorridor.js'
import { useNarrow } from '../hooks/useNarrow.js'
import { useStore } from '../state/useStore.js'
import { ROOM_BY_ID } from '../lib/rooms.js'
import copy from '../content/skills.json'
import './Paris.css'

const PALETTE = ROOM_BY_ID.paris.palette

/**
 * Room 2 — Paris.
 *
 * The palette lifts and the brushstroke comes apart. Skills are not a grid of
 * logos; they are small studies hung along a corridor the visitor walks
 * sideways, each one resolving out of a scatter of dots as it arrives.
 */
export default function Paris() {
  const simpleMode = useStore((s) => s.simpleMode)
  const reducedMotion = useStore((s) => s.reducedMotion)
  const narrow = useNarrow()
  // A phone gets the stacked layout too: a pinned corridor there costs a
  // screenful of scroll per item and fights the browser's own chrome.
  const still = simpleMode || reducedMotion || narrow

  const { rootRef, paneRef, railRef } = useHorizontalCorridor({ id: 'paris', still })

  return (
    /* The corridor sizes itself: GSAP's pin spacer supplies the scroll length
       when pinned, and the stacked cards supply it when they are not. */
    <Room id="paris" autoHeight={false} className="paris" data-still={still}>
      <div className="paris__track" ref={rootRef}>
        <div className="paris__pane" ref={paneRef}>
          <ol className="paris__rail" ref={railRef}>
            <li className="paris__card paris__card--intro">
              <RoomTitle id="paris" eyebrow={copy.eyebrow}>
                {copy.title}
              </RoomTitle>
              {copy.intro && <p className="paris__intro">{copy.intro}</p>}
              <p className="paris__cue" aria-hidden="true">
                {copy.cue}
              </p>
            </li>

            {copy.studies.map((study, i) => (
              <li key={study.id} className="paris__card paris__study" tabIndex={0}>
                <h3 className="visually-hidden">{study.name}</h3>
                <span className="paris__frame">
                  <PointillistReveal label={study.name} seed={i + 1} palette={PALETTE} />
                </span>
              </li>
            ))}


          </ol>
        </div>
      </div>
    </Room>
  )
}
