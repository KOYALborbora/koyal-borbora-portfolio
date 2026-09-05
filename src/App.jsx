import { Suspense, lazy, useEffect } from 'react'
import { useStore } from './state/useStore.js'
import { scrollState } from './state/scrollState.js'
import { startScrollEngine } from './lib/scrollEngine.js'
import { ROOM_BY_ID } from './lib/rooms.js'

import FloorDirectory from './components/FloorDirectory.jsx'
import ControlBar from './components/ControlBar.jsx'
import LiveRegion from './components/LiveRegion.jsx'
import BrushCursor from './interactions/BrushCursor.jsx'

import Threshold from './rooms/Threshold.jsx'
import Nuenen from './rooms/Nuenen.jsx'
import Paris from './rooms/Paris.jsx'
import Arles from './rooms/Arles.jsx'
import SaintRemy from './rooms/SaintRemy.jsx'
import Auvers from './rooms/Auvers.jsx'

// The WebGL layer is the single heaviest import in the site. It is split out so
// a visitor in simple mode, or on a machine without a working context, never
// downloads three.js at all.
const StageCanvas = lazy(() => import('./scenes/StageCanvas.jsx'))

export default function App() {
  const simpleMode = useStore((s) => s.simpleMode)
  const reducedMotion = useStore((s) => s.reducedMotion)
  const setReducedMotion = useStore((s) => s.setReducedMotion)
  const activeRoom = useStore((s) => s.activeRoom)
  const webglOK = useStore((s) => s.webglOK)

  const stillness = simpleMode || reducedMotion
  const showWebgl = webglOK && !stillness

  // Track the visitor's motion preference live — people change it mid-visit,
  // usually because a site like this one just made them queasy.
  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReducedMotion(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [setReducedMotion])

  // The vertical spine. Restarted when stillness changes, because Lenis and the
  // pinned corridors have to be torn down together or ScrollTrigger keeps stale
  // pin spacers around.
  useEffect(() => {
    const stop = startScrollEngine({ smooth: !stillness })
    return stop
  }, [stillness])

  // Paint the room palette onto the document itself, so the browser chrome,
  // overscroll gutter and any fixed overlay all agree with the current room.
  useEffect(() => {
    const room = ROOM_BY_ID[activeRoom]
    if (!room) return
    document.documentElement.setAttribute('data-room', activeRoom)
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', room.palette.bg)
  }, [activeRoom])

  useEffect(() => {
    document.documentElement.setAttribute('data-simple', String(simpleMode))
    // Rooms that let the WebGL stage show through key off this, so they still
    // paint themselves an opaque surface when the canvas is not there.
    document.documentElement.setAttribute('data-webgl', String(showWebgl))
    document.body.setAttribute('data-brush', String(!stillness))
  }, [simpleMode, stillness, showWebgl])

  // Pointer position is read every frame by the brush cursor and the WebGL
  // layer, so it is written straight to the mutable singleton, never to state.
  useEffect(() => {
    const onMove = (e) => {
      scrollState.pointerSeen = true
      scrollState.pointerPx.x = e.clientX
      scrollState.pointerPx.y = e.clientY
      scrollState.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      scrollState.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return (
    <>
      <a className="skip-link" href="#room-nuenen">
        Skip the entrance and go straight to the writing
      </a>

      {showWebgl && (
        <Suspense fallback={null}>
          <StageCanvas />
        </Suspense>
      )}

      <BrushCursor />
      <FloorDirectory />
      <ControlBar />
      <LiveRegion />

      <main id="exhibition" className="exhibition">
        <Threshold />
        <Nuenen />
        <Paris />
        <Arles />
        <SaintRemy />
        <Auvers />
      </main>

      <div className="weave-fixed" aria-hidden="true" />
    </>
  )
}
