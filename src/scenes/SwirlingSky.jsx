import { useMemo } from 'react'
import * as THREE from 'three'
import ShaderPlane, { srgbVec } from './ShaderPlane.jsx'
import frag from '../shaders/sky.frag.glsl?raw'
import { ROOM_BY_ID } from '../lib/rooms.js'
import { scrollState, damp, progressThroughRoom } from '../state/scrollState.js'
import { useStore } from '../state/useStore.js'

const P = ROOM_BY_ID['saint-remy'].palette
const MAX_STARS = 32

/**
 * Room 4's sky.
 *
 * The heavy one. A screen-space shader rather than a particle system: the
 * swirls, the impasto lighting, the cypresses and the stars are all one
 * fragment program, which keeps the whole room to a single draw call and means
 * a click on the page maps straight onto a point in the paint.
 *
 * Stars the visitor lights are handed down as a uniform array. Only the most
 * recent 32 reach the shader — beyond that the loop cost stops being free and,
 * more to the point, a sky with sixty stars in it stops being a night sky.
 */
export default function SwirlingSky({ weights }) {
  const stars = useStore((s) => s.stars)

  const uniforms = useMemo(
    () => ({
      uNight: { value: srgbVec(P.bg) },
      uSwirl: { value: srgbVec(P.secondary) },
      uStar: { value: srgbVec(P.accent) },
      uStars: {
        value: Array.from({ length: MAX_STARS }, () => new THREE.Vector3()),
      },
      uStarCount: { value: 0 },
    }),
    []
  )

  return (
    <ShaderPlane
      frag={frag}
      uniforms={uniforms}
      renderOrder={1}
      onFrame={(u, state, dt) => {
        u.uWeight.value = damp(u.uWeight.value, weights.current.sky, 0.1, dt)
        u.uPointer.value.set(scrollState.pointer.x, scrollState.pointer.y)

        u.uProgress.value = progressThroughRoom(ROOM_BY_ID['saint-remy'].index)

        const cam = state.camera.position
        u.uDrift.value.set(cam.x, cam.y, cam.z)

        // Ages are recomputed every frame from one shared clock, so a star's
        // ignition flare plays out at the same rate no matter when it was lit.
        const recent = stars.length > MAX_STARS ? stars.slice(-MAX_STARS) : stars
        for (let i = 0; i < recent.length; i++) {
          const s = recent[i]
          u.uStars.value[i].set(s.x, s.y, Math.max(0, scrollState.time - s.t))
        }
        u.uStarCount.value = recent.length
      }}
    />
  )
}
