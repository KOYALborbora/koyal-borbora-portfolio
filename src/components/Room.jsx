import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { useStore } from '../state/useStore.js'
import { ROOM_BY_ID } from '../lib/rooms.js'

/**
 * The wall a room hangs on.
 *
 * Every room renders exactly one of these. It owns four things so no individual
 * room has to re-solve them: the scroll-length of the section, the `data-room`
 * attribute that repaints the palette tokens, the intersection observer that
 * marks the room active (which drives the floor directory, the brush colour and
 * the screen-reader announcement), and the landmark/heading wiring.
 */
const Room = forwardRef(function Room(
  {
    id,
    children,
    className = '',
    transparent = false,
    /** Override the scroll length from the floor plan, in viewport heights. */
    length,
    /** Set false for rooms that size themselves (pinned horizontal corridors). */
    autoHeight = true,
    ...rest
  },
  forwardedRef
) {
  const room = ROOM_BY_ID[id]
  const ref = useRef(null)
  // Rooms that need to write to their own section — Auvers sets the `--calm`
  // custom property on it, which has to be the element the palette tokens are
  // scoped to, not a child.
  useImperativeHandle(forwardedRef, () => ref.current, [])
  const setActiveRoom = useStore((s) => s.setActiveRoom)
  const announce = useStore((s) => s.announce)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          setActiveRoom(id)
          announce(`${room.title}. ${room.section}. ${room.period}.`)
        }
      },
      // The active room is whichever one owns the middle of the viewport.
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [id, room, setActiveRoom, announce])

  return (
    <section
      ref={ref}
      id={`room-${id}`}
      data-room={id}
      aria-labelledby={`room-${id}-title`}
      className={`room weave ${transparent ? 'room--transparent' : ''} ${className}`}
      style={autoHeight ? { minHeight: `${(length ?? room.length) * 100}vh` } : undefined}
      {...rest}
    >
      {children}
    </section>
  )
})

export default Room

/**
 * The heading every room needs: a period eyebrow and the room title, wired to
 * the section's `aria-labelledby`. Visually it is the exhibition's wall text.
 */
export function RoomTitle({ id, eyebrow, children, className = '', ...rest }) {
  const room = ROOM_BY_ID[id]
  return (
    <header className={`room__header ${className}`} {...rest}>
      <p className="room__eyebrow">{eyebrow ?? `${room.title} — ${room.period}`}</p>
      <h2 id={`room-${id}-title`}>{children}</h2>
    </header>
  )
}
