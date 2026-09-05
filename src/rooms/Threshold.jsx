import Room from '../components/Room.jsx'
import ImpastoText from '../components/ImpastoText.jsx'
import PortraitSilhouette from '../components/PortraitSilhouette.jsx'
import PaintDrip from '../interactions/PaintDrip.jsx'
import copy from '../content/site.json'
import './Threshold.css'

/**
 * Room 0 — the threshold.
 *
 * Dark, quiet, one subject looking back. Everything the site can do is
 * announced here in miniature: the type is wet, the figure watches, and the
 * only way in is something you touch.
 */
export default function Threshold() {
  return (
    <Room id="threshold" className="threshold">
      <div className="threshold__stage">
        <div className="threshold__portrait">
          <PortraitSilhouette alt={copy.portraitAlt} />
        </div>

        <div className="threshold__type">
          <p className="threshold__kicker">An exhibition in six rooms</p>

          <ImpastoText as="h1" id="room-threshold-title" className="threshold__name">
            {copy.name}
          </ImpastoText>

          <p className="threshold__tagline">
            {copy.role}. {copy.tagline}
          </p>
        </div>

        <div className="threshold__enter">
          <PaintDrip label={copy.scrollCue} />
        </div>
      </div>
    </Room>
  )
}
