import { useMemo } from 'react'
import ShaderPlane, { srgbVec } from './ShaderPlane.jsx'
import frag from '../shaders/haze.frag.glsl?raw'
import { ROOM_BY_ID } from '../lib/rooms.js'
import { scrollState, damp } from '../state/scrollState.js'

const P = ROOM_BY_ID.threshold.palette

/**
 * The ground under the threshold.
 *
 * The darkest room in the building gets the quietest scene: a near-black field
 * with a slow current under it and a warm glow that follows the pointer. It
 * exists so the first thing the visitor sees is already breathing.
 */
export default function AmbientHaze({ weights }) {
  const uniforms = useMemo(
    () => ({
      uBg: { value: srgbVec(P.bg) },
      uAccent: { value: srgbVec(P.accent) },
      uSecondary: { value: srgbVec(P.secondary) },
    }),
    []
  )

  return (
    <ShaderPlane
      frag={frag}
      uniforms={uniforms}
      renderOrder={0}
      onFrame={(u, _state, dt) => {
        u.uWeight.value = damp(u.uWeight.value, weights.current.haze, 0.12, dt)
        u.uPointer.value.set(scrollState.pointer.x, scrollState.pointer.y)
        u.uProgress.value = scrollState.roomProgress
        u.uDrift.value.set(
          _state.camera.position.x,
          _state.camera.position.y,
          _state.camera.position.z
        )
      }}
    />
  )
}
