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

/**
 * How present a room's scene should be, given the visitor's fractional position
 * along the floor plan. 1 while standing in the room, easing to 0 across the
 * neighbouring rooms so scenes dissolve into each other instead of cutting.
 */
function weightFor(index, roomFloat) {
  const d = Math.abs(roomFloat - index)
  return d >= 1 ? 0 : smoothstep(1 - d)
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
      haze: Math.abs(rf - IDX.threshold) < 1.35,
      // A wider mount window than the visual window, so a scene has a frame or
      // two to warm up before the visitor can see it.
      sky: Math.abs(rf - IDX['saint-remy']) < 1.35,
      wheat: Math.abs(rf - IDX.auvers) < 1.35,
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
