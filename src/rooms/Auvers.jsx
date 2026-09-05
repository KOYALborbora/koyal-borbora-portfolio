import { useEffect, useRef } from 'react'
import Room, { RoomTitle } from '../components/Room.jsx'
import CalmTheSky from '../interactions/CalmTheSky.jsx'
import Guestbook from '../components/Guestbook.jsx'
import VisitorCount from '../components/VisitorCount.jsx'
import { useStore } from '../state/useStore.js'
import site from '../content/site.json'
import copy from '../content/contact.json'
import './Auvers.css'

const SKY_ALT =
  'A turbulent wheat-gold sky with crows going over a field, which settles into the pale blue of an almond branch in blossom.'

/**
 * Room 5 — Auvers, and Almond Blossom.
 *
 * The exit, and deliberately not an ending. The room opens on the storm and
 * will not resolve until the visitor calms it; what it resolves into is the
 * painting Van Gogh made for a newborn, which is the right note for a contact
 * section to close on.
 */
export default function Auvers() {
  const calm = useStore((s) => s.calm)
  const rootRef = useRef(null)

  // `--calm` drives the room's palette interpolation in CSS. It is written to
  // the element rather than kept in a class so the wall, the text and the brush
  // cursor all cross over together.
  useEffect(() => {
    const value = String(calm)
    rootRef.current?.style.setProperty('--calm', value)
    // The fixed overlays — the floor plan, the house controls — take their
    // palette from the root element rather than from this section, so the
    // value has to be written in both places or they stay stuck on the storm.
    document.documentElement.style.setProperty('--calm', value)
  }, [calm])

  return (
    <Room id="auvers" className="auvers" transparent ref={rootRef}>
      <div className="auvers__shell">
        <div className="auvers__fallback" role="img" aria-label={SKY_ALT} />

        <div className="room__inner auvers__inner">
          <div className="auvers__opening">
            <RoomTitle id="auvers" eyebrow={copy.eyebrow}>
              {copy.title}
            </RoomTitle>
            <p className="auvers__lede">{copy.lede}</p>
          </div>

          <CalmTheSky prompt={copy.calmPrompt} calmedPrompt={copy.calmedPrompt} />

          <div className="auvers__book">
            <Guestbook />

            <div className="auvers__links">
              <h3 className="auvers__links-title">Or find me here</h3>
              <ul className="auvers__link-list" role="list">
                {copy.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <footer className="auvers__colophon">
            <p className="auvers__signature">{site.signature}</p>
            <VisitorCount />
            <p className="auvers__colophon-text">{copy.colophon}</p>
            <p className="auvers__colophon-text">{site.footer}</p>
          </footer>
        </div>
      </div>
    </Room>
  )
}
