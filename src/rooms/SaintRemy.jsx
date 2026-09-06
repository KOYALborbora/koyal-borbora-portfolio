import Room, { RoomTitle } from '../components/Room.jsx'
import LightTheStars from '../interactions/LightTheStars.jsx'
import copy from '../content/process.json'
import './SaintRemy.css'

const SKY_ALT =
  'A swirling night sky in midnight blue and cyan, lit by a haloed moon, with dark cypresses rising in the foreground.'

/**
 * Room 4 — Saint-Rémy.
 *
 * The emotional peak, and the room that argues for itself by being quiet. The
 * sky does the work; the writing keeps out of its way, arriving in four short
 * movements with a lot of dark between them.
 *
 * The section is transparent so the shared stage shows through, and it says so
 * to assistive technology through a described image rather than pretending a
 * decorative canvas is content.
 */
export default function SaintRemy() {
  return (
    <Room id="saint-remy" className="remy" transparent>
      {/* Without WebGL this stands in for the sky: a still, textured night that
          carries the same room without a single shader. */}
      <div className="remy__fallback" role="img" aria-label={SKY_ALT} />

      <div className="room__inner remy__inner">
        <div className="remy__opening">
          <RoomTitle id="saint-remy" eyebrow={copy.eyebrow}>
            {copy.title}
          </RoomTitle>
          {copy.lede && <p className="remy__lede">{copy.lede}</p>}
        </div>

        <ol className="remy__movements">
          {copy.movements.map((movement, i) => (
            <li key={movement.id} className="remy__movement">
              <span className="remy__movement-mark" aria-hidden="true">
                {i + 1}
              </span>
              <h3 className="remy__movement-heading">{movement.heading}</h3>
              <p className="remy__movement-body">{movement.body}</p>
            </li>
          ))}
        </ol>

        <div className="remy__interaction">
          <LightTheStars prompt={copy.starPrompt} countLabel={copy.starCount} />
        </div>
      </div>
    </Room>
  )
}
