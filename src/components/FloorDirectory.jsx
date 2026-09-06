import { useRef } from 'react'
import { ROOMS } from '../lib/rooms.js'
import { scrollToRoom } from '../lib/scrollEngine.js'
import { useStore } from '../state/useStore.js'
import './FloorDirectory.css'

/**
 * The floor plan, reduced to six marks on the right-hand edge.
 *
 * It used to be a list of room names, which meant a block of text floating
 * over every painting in the building. Six dots say the same two things — how
 * many rooms there are and which one you are in — and say them without putting
 * words on top of the work.
 *
 * The names have not gone anywhere: each dot carries one for screen readers,
 * and shows it on hover or focus for everyone else. It is still the one way to
 * reach any room without performing a scroll, so it stays keyboard-operable in
 * every mode, simple mode included.
 */
export default function FloorDirectory() {
  const activeRoom = useStore((s) => s.activeRoom)
  const entered = useStore((s) => s.entered)
  const listRef = useRef(null)

  // Roving arrow keys, the convention for a vertical menu.
  const onKeyDown = (e, index) => {
    const delta = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0
    if (!delta) return
    e.preventDefault()
    const next = (index + delta + ROOMS.length) % ROOMS.length
    listRef.current?.querySelectorAll('a')[next]?.focus()
  }

  return (
    <nav
      className={`directory ${entered ? 'is-visible' : ''}`}
      aria-label="Exhibition floor plan"
    >
      <ol ref={listRef} className="directory__list">
        {ROOMS.map((room, i) => {
          const isActive = room.id === activeRoom
          return (
            <li key={room.id} className="directory__item">
              <a
                className={`directory__dot ${isActive ? 'is-active' : ''}`}
                href={`#room-${room.id}`}
                aria-current={isActive ? 'true' : undefined}
                onKeyDown={(e) => onKeyDown(e, i)}
                onClick={(e) => {
                  // Let modified clicks behave like real links.
                  if (e.metaKey || e.ctrlKey || e.shiftKey) return
                  e.preventDefault()
                  scrollToRoom(room.id)
                }}
              >
                <span className="visually-hidden">
                  {room.title} — {room.section}
                </span>
                <span className="directory__mark" aria-hidden="true" />
                <span className="directory__tip" aria-hidden="true">
                  {room.title}
                </span>
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
