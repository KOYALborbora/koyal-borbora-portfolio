import { useStore } from '../state/useStore.js'
import './ControlBar.css'

/**
 * The house control, and the smallest painting in the building.
 *
 * Simple mode is the promise the rest of the site makes good on: same rooms,
 * same words, none of the theatre. The button shows what the visitor currently
 * has rather than an abstract symbol for it — the night sky with its swirl, its
 * halo and its stars while the painting is on, and the same scene flattened to
 * bare shapes once it is off. The icon *is* the demonstration.
 *
 * It is the favicon, which means the tab and the toggle are the same picture,
 * and the mark that stands for the whole site is also the mark that turns it
 * down.
 */
export default function ControlBar() {
  const simpleMode = useStore((s) => s.simpleMode)
  const toggleSimpleMode = useStore((s) => s.toggleSimpleMode)
  const reducedMotion = useStore((s) => s.reducedMotion)

  // Two palettes rather than one palette at two opacities: dimming the whole
  // icon lets the room's wall colour bleed through it, which turned a midnight
  // blue disc olive on the chrome-yellow room and something else again on the
  // next one. Draining the colour inside the artwork looks the same everywhere.
  const ground = simpleMode ? '#2B3440' : '#12294B'
  const moon = simpleMode ? '#8E8B7E' : '#F5D97B'
  const cypress = simpleMode ? '#171C22' : '#0A1526'

  const label = simpleMode
    ? 'Simple mode is on. Turn the painting back on.'
    : reducedMotion
      ? 'Simple mode. The moving parts are already still, but this also removes the painting.'
      : 'Simple mode. Turn off the painting and the movement.'

  return (
    <div className="controls">
      <button
        type="button"
        className="controls__btn"
        aria-pressed={simpleMode}
        aria-label={label}
        onClick={toggleSimpleMode}
      >
        <svg className="controls__icon" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
          <defs>
            <clipPath id="controls-round">
              <circle cx="32" cy="32" r="32" />
            </clipPath>
          </defs>

          <g clipPath="url(#controls-round)">
            <rect width="64" height="64" fill={ground} />

            {/* The painting: currents in the sky, a haloed moon, two stars.
                All of it goes when the visitor asks for less. */}
            {!simpleMode && (
              <>
                <path
                  d="M-4 44c9-15 21-15 30 0s21 15 30 0"
                  fill="none"
                  stroke="#3E7CA6"
                  strokeWidth="7"
                  strokeLinecap="round"
                  opacity="0.95"
                />
                <path
                  d="M-4 27c8-11 19-11 27 0s19 11 27 0"
                  fill="none"
                  stroke="#3E7CA6"
                  strokeWidth="4"
                  strokeLinecap="round"
                  opacity="0.5"
                />
                <circle cx="44" cy="20" r="13" fill="#F5D97B" opacity="0.22" />
                <circle cx="13" cy="15" r="2.4" fill="#F5D97B" opacity="0.9" />
                <circle cx="27" cy="9" r="1.7" fill="#F5D97B" opacity="0.7" />
              </>
            )}

            <circle cx="44" cy="20" r="7" fill={moon} />
            <path d="M14 64c0-16 3-26 6-26s6 10 6 26z" fill={cypress} />
          </g>
        </svg>

        <span className="controls__tip" aria-hidden="true">
          {simpleMode ? 'Painting off' : 'Simple mode'}
        </span>
      </button>
    </div>
  )
}
