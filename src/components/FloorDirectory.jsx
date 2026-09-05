import { useEffect, useRef, useState } from 'react'
import { ROOMS } from '../lib/rooms.js'
import { scrollToRoom } from '../lib/scrollEngine.js'
import { scrollState } from '../state/scrollState.js'
import { useStore } from '../state/useStore.js'
import './FloorDirectory.css'

/**
 * The floor directory — the little plan of the building every gallery hands you
 * at the door.
 *
 * It is also the accessibility spine of the site: it is the one way to reach
 * any room without performing a scroll or a drag, so it stays keyboard-operable
 * and visible in every mode, including simple mode.
 */
export default function FloorDirectory() {
  const activeRoom = useStore((s) => s.activeRoom)
  const entered = useStore((s) => s.entered)
  const [open, setOpen] = useState(false)
  const barRef = useRef(null)
  const listRef = useRef(null)

  // The progress rule is drawn from the mutable scroll singleton rather than
  // React state — it changes every frame and must not re-render this list.
  useEffect(() => {
    let raf = 0
    const el = barRef.current
    if (!el) return
    const tick = () => {
      raf = requestAnimationFrame(tick)
      el.style.setProperty('--walked', scrollState.progress.toFixed(4))
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // Close the mobile sheet on Escape, and put focus back where it came from.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        listRef.current?.querySelector('button')?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Roving arrow-key navigation, the convention for a vertical menu.
  const onKeyDown = (e, index) => {
    const delta = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0
    if (!delta) return
    e.preventDefault()
    const next = (index + delta + ROOMS.length) % ROOMS.length
    listRef.current?.querySelectorAll('a')[next]?.focus()
  }

  return (
    <nav
      ref={barRef}
      className={`directory ${entered ? 'is-visible' : ''} ${open ? 'is-open' : ''}`}
      aria-label="Exhibition floor plan"
    >
      <button
        type="button"
        className="directory__toggle"
        aria-expanded={open}
        aria-controls="floor-directory-list"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="directory__toggle-rule" aria-hidden="true" />
        {open ? 'Close plan' : 'Floor plan'}
      </button>

      <ol id="floor-directory-list" ref={listRef} className="directory__list">
        {ROOMS.map((room, i) => {
          const isActive = room.id === activeRoom
          return (
            <li key={room.id} className={`directory__item ${isActive ? 'is-active' : ''}`}>
              <a
                href={`#room-${room.id}`}
                aria-current={isActive ? 'true' : undefined}
                onKeyDown={(e) => onKeyDown(e, i)}
                onClick={(e) => {
                  // Let modified clicks behave like real links.
                  if (e.metaKey || e.ctrlKey || e.shiftKey) return
                  e.preventDefault()
                  scrollToRoom(room.id)
                  setOpen(false)
                }}
              >
                <span className="directory__index" aria-hidden="true">
                  {room.index}
                </span>
                <span className="directory__labels">
                  <span className="directory__room">{room.title}</span>
                  <span className="directory__section">{room.section}</span>
                </span>
              </a>
            </li>
          )
        })}
      </ol>

      <span className="directory__progress" aria-hidden="true" />
    </nav>
  )
}
