import { useStore } from '../state/useStore.js'
import './ControlBar.css'

/**
 * The gallery's house controls.
 *
 * Simple mode is the promise the rest of the site makes good on: same rooms,
 * same words, none of the theatre. It is deliberately visible from the very
 * first frame rather than tucked behind the entrance, because someone who needs
 * it needs it before the swirling starts, not after.
 */
export default function ControlBar() {
  const simpleMode = useStore((s) => s.simpleMode)
  const toggleSimpleMode = useStore((s) => s.toggleSimpleMode)
  const reducedMotion = useStore((s) => s.reducedMotion)

  return (
    <div className="controls">
      <button
        type="button"
        className="controls__btn"
        aria-pressed={simpleMode}
        onClick={toggleSimpleMode}
      >
        <span className="controls__dot" data-on={simpleMode} aria-hidden="true" />
        Simple mode
      </button>

      {reducedMotion && !simpleMode && (
        <p className="controls__note" role="note">
          Reduced motion is on, so the moving parts are already still.
        </p>
      )}
    </div>
  )
}
