import { useEffect, useState } from 'react'
import { countVisit } from '../lib/visitors.js'
import copy from '../content/contact.json'

/**
 * The admissions ticket.
 *
 * A gallery knows how many people came through the door, and tells you your
 * number on the way in. This is that, at the way out — which suits a room whose
 * whole argument is that the ending is a beginning.
 *
 * Renders nothing at all until there is a real number, and nothing ever if the
 * count cannot be reached. A visitor counter showing "0" or "—" is worse than
 * no visitor counter.
 */
export default function VisitorCount() {
  const config = copy.visitors ?? {}
  const [count, setCount] = useState(null)

  useEffect(() => {
    if (!config.enabled) return
    let alive = true
    countVisit().then((value) => {
      if (alive && value) setCount(value)
    })
    return () => {
      alive = false
    }
  }, [config.enabled])

  if (!config.enabled || !count) return null

  return (
    <p className="visitors">
      <span className="visitors__label">{config.label}</span>{' '}
      <span className="visitors__number">
        {/* Grouped by the visitor's own locale — a number this size reads very
            differently in en-IN than in en-US, and this one is Indian. */}
        {new Intl.NumberFormat().format(count)}
      </span>
      {config.note && <span className="visitors__note">{config.note}</span>}
    </p>
  )
}
