import { useMemo } from 'react'
import ShaderPlane, { srgbVec } from './ShaderPlane.jsx'
import frag from '../shaders/wheat.frag.glsl?raw'
import { ROOM_BY_ID } from '../lib/rooms.js'
import { scrollState, damp, progressThroughRoom } from '../state/scrollState.js'
import { useStore } from '../state/useStore.js'

const P = ROOM_BY_ID.auvers.palette

/**
 * Room 5's sky.
 *
 * Two paintings in one shader, and the visitor holds the dial between them. The
 * `calm` value comes from the store rather than from scroll on purpose: this is
 * the one transition in the building that only happens because somebody did
 * something.
 */
export default function WheatSky({ weights }) {
  const calm = useStore((s) => s.calm)

  const uniforms = useMemo(
    () => ({
      uCalm: { value: 0 },
      uWheat: { value: srgbVec(P.bg) },
      uCrow: { value: srgbVec(P.accent) },
      uBlossom: { value: srgbVec(P.bgCalm) },
      uTeal: { value: srgbVec(P.accentCalm) },
    }),
    []
  )

  return (
    <ShaderPlane
      frag={frag}
      uniforms={uniforms}
      renderOrder={2}
      onFrame={(u, state, dt) => {
        u.uWeight.value = damp(u.uWeight.value, weights.current.wheat, 0.1, dt)
        // Eased rather than set: the storm settles, it does not snap.
        u.uCalm.value = damp(u.uCalm.value, calm, 0.045, dt)
        u.uPointer.value.set(scrollState.pointer.x, scrollState.pointer.y)

        u.uProgress.value = progressThroughRoom(ROOM_BY_ID.auvers.index)

        const cam = state.camera.position
        u.uDrift.value.set(cam.x, cam.y, cam.z)
      }}
    />
  )
}
