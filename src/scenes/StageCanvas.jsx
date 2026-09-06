import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState, damp, smoothstep } from '../state/scrollState.js'
import { useStore } from '../state/useStore.js'
import { ROOMS } from '../lib/rooms.js'

// Each room's scene is its own chunk. Nothing downloads until the visitor is
// within one room of it.
const AmbientHaze = lazy(() => import('./AmbientHaze.jsx'))
const SwirlingSky = lazy(() => import('./SwirlingSky.jsx'))
const WheatSky = lazy(() => import('./WheatSky.jsx'))

const IDX = Object.fromEntries(ROOMS.map((r) => [r.id, r.index]))

/** How much of a room either side of a boundary the crossfade occupies. */
const FADE = 0.12

/**
 * How present a room's scene should be, given the visitor's fractional position
 * along the floor plan.
 *
 * Room `index` occupies roomFloat [index, index+1). Its scene is at full
 * strength across that whole span and only dissolves in a narrow band around
 * each boundary. The obvious version — falling off linearly from the room's
 * start — is wrong in a way that is easy to miss and awful to see: it puts the
 * next room's scene at half strength by the time you are halfway through this
 * one, so Auvers' wheatfield was rising behind Saint-Remy's last paragraph.
 */
function weightFor(index, roomFloat) {
  const start = index - FADE
  const end = index + 1 + FADE
  if (roomFloat <= start || roomFloat >= end) return 0
  if (roomFloat < index + FADE) return smoothstep((roomFloat - start) / (FADE * 2))
  if (roomFloat > index + 1 - FADE) return smoothstep((end - roomFloat) / (FADE * 2))
  return 1
}

/** Mounted a little before it is needed, so a scene has time to warm up. */
function nearby(index, roomFloat) {
  return roomFloat > index - 0.55 && roomFloat < index + 1.55
}

/**
 * The camera walks the building. Rather than a hard cut per room it drifts
 * continuously along the global 0→1 spine, which is what makes six separate
 * rooms feel like one space the visitor is moving through.
 */
function CameraRig() {
  const { camera } = useThree()
  const target = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, delta) => {
    const p = scrollState.progress
    const dt = Math.min(0.05, delta)

    // Drift forward through the whole exhibition, dipping into the Saint-Rémy
    // swirl at the emotional peak and pulling back out into Auvers' open sky.
    const z = 6 - p * 2.2 - smoothstep((p - 0.55) / 0.25) * 2.4
    const y = Math.sin(p * Math.PI * 1.6) * 0.5
    const x = scrollState.pointer.x * 0.28

    camera.position.x = damp(camera.position.x, x, 0.06, dt)
    camera.position.y = damp(camera.position.y, y, 0.08, dt)
    camera.position.z = damp(camera.position.z, z, 0.08, dt)

    target.set(scrollState.pointer.x * 0.12, scrollState.pointer.y * 0.08, 0)
    camera.lookAt(target)
  })

  return null
}

/** Mounts each scene only while it is near, and hands it a 0→1 presence weight. */
function Stage() {
  const [near, setNear] = useState({ haze: true, sky: false, wheat: false })
  const weights = useRef({ haze: 1, sky: 0, wheat: 0 })

  useFrame(() => {
    const rf = scrollState.roomFloat
    weights.current.sky = weightFor(IDX['saint-remy'], rf)
    weights.current.wheat = weightFor(IDX.auvers, rf)
    // The haze belongs to the threshold alone. Rooms 1 to 3 paint their own
    // surfaces in the DOM and sit opaquely on top of the canvas, so rendering
    // anything underneath them would be pure cost for no pixels.
    weights.current.haze = weightFor(IDX.threshold, rf)

    const next = {
      haze: nearby(IDX.threshold, rf),
      sky: nearby(IDX['saint-remy'], rf),
      wheat: nearby(IDX.auvers, rf),
    }
    setNear((prev) =>
      prev.haze === next.haze && prev.sky === next.sky && prev.wheat === next.wheat
        ? prev
        : next
    )
  })

  return (
    <Suspense fallback={null}>
      {near.haze && <AmbientHaze weights={weights} />}
      {near.sky && <SwirlingSky weights={weights} />}
      {near.wheat && <WheatSky weights={weights} />}
    </Suspense>
  )
}

/**
 * The persistent canvas. Mounted once for the life of the visit and never
 * remounted per room — that continuity is what stops the site feeling like six
 * separate pages stitched together.
 */
export default function StageCanvas() {
  const setWebglOK = useStore((s) => s.setWebglOK)
  const [dpr, setDpr] = useState(1)

  useEffect(() => {
    // These rooms are full-screen fragment shaders, so cost scales with pixels
    // and nothing else. A 3× phone would do nine times the work for an effect
    // that is soft-edged by construction, so the ratio is capped hard — and on
    // a touch device it is pinned to 1, where the GPU budget is smallest and
    // the screen is closest to the eye but also the smallest.
    const coarse = window.matchMedia?.('(pointer: coarse)').matches
    setDpr(Math.min(coarse ? 1 : 1.25, window.devicePixelRatio || 1))
  }, [])

  return (
    <div className="stage" aria-hidden="true">
      <Canvas
        dpr={dpr}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        camera={{ fov: 48, near: 0.1, far: 100, position: [0, 0, 6] }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault()
            // A lost context on a page like this is almost always a device
            // saying it has had enough. Fall back rather than fight it.
            setWebglOK(false)
          })
        }}
        frameloop="always"
      >
        <CameraRig />
        <Stage />
      </Canvas>
    </div>
  )
}
