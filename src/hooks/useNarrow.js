import { useEffect, useState } from 'react'

/** Below this the pinned corridors stack instead. */
export const NARROW_QUERY = '(max-width: 900px)'

/**
 * True on viewports too narrow to walk a corridor sideways.
 *
 * A horizontal pin costs a phone roughly a screen of scroll per work, fights
 * the browser's own address-bar collapse, and puts a full-bleed painting behind
 * a plaque that has nowhere to go. The room's stacked layout already exists for
 * simple mode and reduced motion; narrow screens get the same thing, which is
 * the same content in the order it was written.
 */
export function useNarrow() {
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.(NARROW_QUERY).matches
  )

  useEffect(() => {
    const mq = window.matchMedia?.(NARROW_QUERY)
    if (!mq) return
    const onChange = () => setNarrow(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return narrow
}
