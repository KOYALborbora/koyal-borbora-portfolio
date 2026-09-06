import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { getLenis } from '../lib/scrollEngine.js'
import './CaseStudy.css'

const FOCUSABLE =
  'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'

/**
 * The lifted canvas.
 *
 * Clicking a frame takes the work off the wall and opens it, so the case study
 * arrives as a consequence of a physical action rather than as a route change.
 * It is a modal dialog and behaves like one: focus moves in, focus is trapped,
 * Escape closes it, focus goes back where it came from, and the smooth-scroll
 * engine is stopped so the gallery behind does not drift while it is open.
 */
export default function CaseStudy({ work, onClose }) {
  const panelRef = useRef(null)
  const returnFocusTo = useRef(null)

  useEffect(() => {
    returnFocusTo.current = document.activeElement
    const lenis = getLenis()
    lenis?.stop()

    const panel = panelRef.current
    panel?.querySelector('.case__close')?.focus()

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panel) return
      const items = [...panel.querySelectorAll(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null
      )
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.body.style.overflow = prevOverflow
      lenis?.start()
      // Returning focus to the frame is what makes a keyboard visitor's place
      // in the corridor survive the detour.
      if (returnFocusTo.current instanceof HTMLElement) returnFocusTo.current.focus()
    }
  }, [onClose])

  if (!work) return null

  // Portalled to the document body on purpose. Rendered in place it would sit
  // inside `.exhibition`, which is a stacking context of its own, so the floor
  // directory floated over the backdrop and the modal could never actually get
  // on top of the room it came from.
  return createPortal(
    <div className="case" role="presentation" onClick={onClose}>
      <div className="case__backdrop" aria-hidden="true" />

      <div
        ref={panelRef}
        className="case__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="case-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="case__close" onClick={onClose}>
          Hang it back up
          <span aria-hidden="true"> ×</span>
        </button>

        <div className="case__art" style={{ '--tint': work.tint }}>
          <img src={work.image} alt={work.alt} loading="lazy" decoding="async" />
        </div>

        <div className="case__body">
          <p className="case__year">{work.year}</p>
          <h3 id="case-title" className="case__title">
            {work.title}
          </h3>
          <p className="case__medium">{work.medium}</p>
          <p className="case__summary">{work.summary}</p>

          <p className="case__description">{work.description}</p>

          <dl className="case__facts">
            <div>
              <dt>Role</dt>
              <dd>{work.role}</dd>
            </div>
          </dl>

          {work.link && (
            <a
              className="btn case__link"
              href={work.link}
              target="_blank"
              rel="noreferrer noopener"
            >
              Visit {work.title}
              <span className="visually-hidden"> (opens in a new tab)</span>
            </a>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
