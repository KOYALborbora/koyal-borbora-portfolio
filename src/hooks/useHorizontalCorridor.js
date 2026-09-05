import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * A corridor you walk sideways without ever scrolling sideways.
 *
 * The pane is pinned to the viewport and the rail inside it is translated in X
 * in proportion to how far the visitor has scrolled down — the standard GSAP
 * pin-and-scrub, but worth stating plainly because it is the trick the whole
 * gallery wing depends on. The visitor keeps using the one gesture they already
 * know; the building is what turns.
 *
 * Returns three refs to attach, plus a `progress` ref (0→1 along the corridor)
 * for anything that needs to know where in the corridor it is.
 *
 * When `still` is true this does nothing at all — the room falls back to the
 * plain vertical stack its CSS describes, which is the correct behaviour for
 * reduced motion and the only honest one for simple mode.
 */
export function useHorizontalCorridor({ id, still, deps = [] }) {
  const rootRef = useRef(null)
  const paneRef = useRef(null)
  const railRef = useRef(null)
  const progressRef = useRef(0)

  useLayoutEffect(() => {
    if (still) {
      progressRef.current = 0
      if (railRef.current) gsap.set(railRef.current, { clearProps: 'transform' })
      return
    }

    const root = rootRef.current
    const pane = paneRef.current
    const rail = railRef.current
    if (!root || !pane || !rail) return

    const ctx = gsap.context(() => {
      // Measured in a function so `invalidateOnRefresh` re-reads it after a
      // resize, a font swap or an orientation change rather than pinning to a
      // width that stopped being true three layouts ago.
      const distance = () => Math.max(0, rail.scrollWidth - window.innerWidth)

      ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: () => `+=${distance() + window.innerHeight * 0.5}`,
        pin: pane,
        pinSpacing: true,
        anticipatePin: 1,
        scrub: 1,
        invalidateOnRefresh: true,
        onRefresh: (self) => {
          gsap.set(rail, { x: -distance() * self.progress })
        },
        onUpdate: (self) => {
          progressRef.current = self.progress
          gsap.set(rail, { x: -distance() * self.progress })
        },
      })
    }, root)

    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [still, id, ...deps])

  return { rootRef, paneRef, railRef, progressRef }
}
