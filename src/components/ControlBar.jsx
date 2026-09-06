import { useStore } from '../state/useStore.js'
import './ControlBar.css'

/**
 * The house controls, reduced to one icon.
 *
 * Simple mode is the promise the rest of the site makes good on: same rooms,
 * same words, none of the theatre. It stays reachable from the very first frame
 * — somebody who needs it needs it before the swirling starts — but it no
 * longer sits in the bottom corner as a text button, where it landed on top of
 * a plaque in one room and a paragraph in the next.
 *
 * The icon is three brushstrokes, struck through when simple mode is on: paint
 * off. The label is still there for anyone who needs it, as the button's
 * accessible name and as a tooltip on hover or focus.
 */
export default function ControlBar() {
  const simpleMode = useStore((s) => s.simpleMode)
  const toggleSimpleMode = useStore((s) => s.toggleSimpleMode)
  const reducedMotion = useStore((s) => s.reducedMotion)

  const label = simpleMode
    ? 'Simple mode on — turn the painting back on'
    : reducedMotion
      ? 'Simple mode — the moving parts are already still'
      : 'Simple mode — turn off the painting and the movement'

  return (
    <div className="controls">
      <button
        type="button"
        className="controls__btn"
        aria-pressed={simpleMode}
        aria-label={label}
        onClick={toggleSimpleMode}
      >
        <svg className="controls__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M4 8.5c4.5-3 11-3 16 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <path
            d="M4 13c4.5-3 11-3 16 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            opacity="0.72"
          />
          <path
            d="M4 17.5c4.5-3 11-3 16 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            opacity="0.44"
          />
          {simpleMode && (
            <path
              d="M3.4 20.6 20.6 3.4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          )}
        </svg>
        <span className="controls__tip" aria-hidden="true">
          {simpleMode ? 'Painting off' : 'Simple mode'}
        </span>
      </button>
    </div>
  )
}
