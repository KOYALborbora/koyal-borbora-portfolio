import { useEffect, useState } from 'react'
import { useStore } from '../state/useStore.js'

/**
 * A single polite live region for the whole exhibition.
 *
 * Rooms announce themselves here as the visitor passes through them, which is
 * the only way someone using a screen reader can tell that a horizontal
 * corridor has moved them from one work to the next. Announcements are debounced
 * because a fast scroll through the building would otherwise queue six of them.
 */
export default function LiveRegion() {
  const announcement = useStore((s) => s.announcement)
  const [spoken, setSpoken] = useState('')

  useEffect(() => {
    if (!announcement) return
    const id = setTimeout(() => setSpoken(announcement), 350)
    return () => clearTimeout(id)
  }, [announcement])

  return (
    <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
      {spoken}
    </div>
  )
}
