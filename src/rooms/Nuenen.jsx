import Room, { RoomTitle } from '../components/Room.jsx'
import SelfPaintingCanvas from '../scenes/SelfPaintingCanvas.jsx'
import copy from '../content/bio.json'
import './Nuenen.css'

const CANVAS_ALT =
  'A dark, coarse painting building itself out of ochre and peat-coloured brushstrokes: a low table, a lamp, and two bowed figures.'

/**
 * Room 1 — Nuenen.
 *
 * The quiet room. No horizontal trickery, no WebGL: a column of honest
 * paragraphs beside a canvas that paints itself while they are read. The only
 * motion in here is the picture arriving.
 */
export default function Nuenen() {
  return (
    <Room id="nuenen" className="nuenen">
      <div className="room__inner nuenen__inner">
        <div className="nuenen__column">
          <RoomTitle id="nuenen" eyebrow={copy.eyebrow}>
            {copy.title}
          </RoomTitle>

          <div className="nuenen__prose">
            {copy.paragraphs.map((text, i) => (
              <p key={i}>{text}</p>
            ))}
          </div>

          <aside className="nuenen__aside">
            <p className="nuenen__aside-label">{copy.aside.label}</p>
            <p className="nuenen__aside-text">{copy.aside.text}</p>
          </aside>
        </div>

        <div className="nuenen__art">
          <SelfPaintingCanvas alt={CANVAS_ALT} />
        </div>
      </div>
    </Room>
  )
}
