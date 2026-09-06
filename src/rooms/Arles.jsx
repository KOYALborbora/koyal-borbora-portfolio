import { useState } from 'react'
import Room, { RoomTitle } from '../components/Room.jsx'
import CaseStudy from '../components/CaseStudy.jsx'
import { useHorizontalCorridor } from '../hooks/useHorizontalCorridor.js'
import { useNarrow } from '../hooks/useNarrow.js'
import { useStore } from '../state/useStore.js'
import copy from '../content/projects.json'
import './Arles.css'

/**
 * Room 3 — Arles.
 *
 * The loud room. Chrome yellow walls, cobalt frames, and the work hung along a
 * corridor in the order a gallery would hang it. Museum convention does the
 * structural work here that a portfolio usually fakes with 01/02/03 numbering:
 * a plaque carries title, medium, year and a curator's note, and a wall
 * genuinely is a sequence, so the ordering means something.
 */
export default function Arles() {
  const simpleMode = useStore((s) => s.simpleMode)
  const reducedMotion = useStore((s) => s.reducedMotion)
  const narrow = useNarrow()
  // A phone gets the stacked layout too: a pinned corridor there costs a
  // screenful of scroll per item and fights the browser's own chrome.
  const still = simpleMode || reducedMotion || narrow

  const openProject = useStore((s) => s.openProject)
  const setOpenProject = useStore((s) => s.setOpenProject)
  const [lifting, setLifting] = useState(null)

  const { rootRef, paneRef, railRef } = useHorizontalCorridor({ id: 'arles', still })
  const open = copy.works.find((w) => w.id === openProject) ?? null

  const lift = (id) => {
    if (still) {
      setOpenProject(id)
      return
    }
    // The frame comes off the wall first, then the case study opens behind it.
    // The delay is short enough to read as one gesture and long enough to see.
    setLifting(id)
    window.setTimeout(() => {
      setOpenProject(id)
      setLifting(null)
    }, 260)
  }

  return (
    <Room id="arles" autoHeight={false} className="arles" data-still={still}>
      <div className="arles__track" ref={rootRef}>
        <div className="arles__pane" ref={paneRef}>
          {/* The picture rail every gallery has, at eye height, behind the work. */}
          <span className="arles__rail-line" aria-hidden="true" />

          <ol className="arles__rail" ref={railRef}>
            <li className="arles__card arles__card--intro">
              <RoomTitle id="arles" eyebrow={copy.eyebrow}>
                {copy.title}
              </RoomTitle>
              <p className="arles__intro">{copy.intro}</p>
              <p className="arles__cue" aria-hidden="true">
                {copy.cue}
              </p>
            </li>

            {copy.works.map((work) => (
              <li key={work.id} className="arles__work">
                <button
                  type="button"
                  className={`arles__frame ${lifting === work.id ? 'is-lifting' : ''}`}
                  style={{ '--tint': work.tint }}
                  aria-haspopup="dialog"
                  onClick={() => lift(work.id)}
                >
                  <img
                    className="arles__canvas"
                    src={work.image}
                    alt={work.alt}
                    loading="lazy"
                    decoding="async"
                    width="1600"
                    height="1000"
                  />
                  <span className="arles__glass" aria-hidden="true" />
                  <span className="arles__lift" aria-hidden="true">
                    Lift it off the wall
                  </span>
                </button>

                <div className="plaque arles__plaque">
                  <p className="plaque__title">{work.title}</p>
                  <p className="plaque__meta">
                    {work.medium} · {work.year}
                  </p>
                  <p className="plaque__note">{work.note}</p>
                  <button
                    type="button"
                    className="arles__plaque-link"
                    aria-haspopup="dialog"
                    onClick={() => lift(work.id)}
                  >
                    Read the case study
                    <span className="visually-hidden"> for {work.title}</span>
                  </button>
                </div>
              </li>
            ))}

            <li className="arles__card arles__card--end">
              <p className="arles__end">
                Fifteen months in Arles. Two hundred canvases. The yellow house
                is gone; the yellow is not.
              </p>
            </li>
          </ol>
        </div>
      </div>

      {open && <CaseStudy work={open} onClose={() => setOpenProject(null)} />}
    </Room>
  )
}
