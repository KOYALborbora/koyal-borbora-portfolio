import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import lib from '../shaders/lib.glsl?raw'
import vert from '../shaders/fullscreen.vert.glsl?raw'

/**
 * Phones and tablets compile a cheaper variant of every shader: fewer noise
 * octaves, and no per-fragment height gradient. Decided once at module load,
 * because nobody resizes a phone into a workstation mid-visit.
 */
export const LOW_QUALITY =
  typeof window !== 'undefined' &&
  !!(
    window.matchMedia?.('(max-width: 900px)').matches ||
    window.matchMedia?.('(pointer: coarse)').matches
  )

/**
 * Palette colours as raw sRGB triples.
 *
 * `THREE.Color` converts to the linear working space on assignment, which is
 * correct for lit materials and wrong here: these shaders write `gl_FragColor`
 * straight out with no colour-space chunk, so a converted colour would land on
 * screen visibly darker than the same hex in the stylesheet. Passing the sRGB
 * bytes through untouched is what keeps the WebGL rooms and the CSS rooms
 * mixing the same pigment.
 */
export function srgbVec(hex) {
  const h = hex.replace('#', '')
  const n = parseInt(h, 16)
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

/**
 * A full-viewport fragment shader, mounted inside the shared stage canvas.
 *
 * The geometry is a unit plane whose vertex shader writes clip space directly,
 * so the quad always covers the viewport exactly regardless of where the camera
 * rig has drifted to — and screen UV maps 1:1 onto page coordinates, which is
 * what lets the DOM interaction layers aim at points in these scenes.
 *
 * `onFrame(uniforms, state, delta)` runs every frame; put per-frame writes
 * there rather than in render.
 */
export default function ShaderPlane({
  frag,
  uniforms: extraUniforms,
  onFrame,
  renderOrder = 0,
  blending = THREE.NormalBlending,
}) {
  const meshRef = useRef(null)
  const { size } = useThree()

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uWeight: { value: 0 },
      uProgress: { value: 0 },
      uPointer: { value: new THREE.Vector2() },
      uDrift: { value: new THREE.Vector3(0, 0, 6) },
      uAspect: { value: 1 },
      ...extraUniforms,
    }),
    // Uniform objects are mutated in place, never replaced, so this is built
    // once per mount on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        // The noise toolkit is prepended rather than #included: Vite hands us
        // the shaders as plain strings and this keeps the build free of a
        // GLSL plugin.
        fragmentShader: `${lib}\n${frag}`,
        uniforms,
        defines: LOW_QUALITY ? { LOW_QUALITY: '' } : {},
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending,
      }),
    [frag, uniforms, blending]
  )

  useEffect(() => {
    uniforms.uAspect.value = size.width / Math.max(1, size.height)
  }, [size, uniforms])

  // Materials and geometries are not garbage collected by three — they hold GPU
  // resources that have to be handed back explicitly.
  useEffect(() => () => material.dispose(), [material])

  useFrame((state, delta) => {
    const dt = Math.min(0.05, delta)
    uniforms.uTime.value += dt
    onFrame?.(uniforms, state, dt)
    const mesh = meshRef.current
    if (mesh) mesh.visible = uniforms.uWeight.value > 0.004
  })

  return (
    <mesh ref={meshRef} renderOrder={renderOrder} frustumCulled={false} material={material}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  )
}
