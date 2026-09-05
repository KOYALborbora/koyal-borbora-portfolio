/**
 * High-frequency scroll state.
 *
 * This is a deliberately un-reactive mutable singleton. It is written once per
 * frame by the Lenis/ScrollTrigger driver and read inside `useFrame` by the
 * WebGL layer and by the brush cursor. Putting these numbers in React state
 * would re-render the whole tree 120 times a second, so anything that changes
 * every frame lives here and anything discrete lives in `useStore`.
 */

export const scrollState = {
  /** Global 0→1 progress along the whole exhibition. */
  progress: 0,
  /** Signed scroll velocity, normalised roughly to -1…1. */
  velocity: 0,
  /** 0→1 progress within the currently active room. */
  roomProgress: 0,
  /** Index of the active room, as a float, so scenes can crossfade between two. */
  roomFloat: 0,
  /** Pointer in normalised device coords (-1…1), y up. Updated on pointermove. */
  pointer: { x: 0, y: 0 },
  /** Pointer in CSS pixels. */
  pointerPx: { x: 0, y: 0 },
  /** False until the visitor actually moves a pointer. The brush stays dry
   *  until then, rather than parking a blob of paint in the top-left corner. */
  pointerSeen: false,
  /** Seconds since the app mounted — a clock every scene can share. */
  time: 0,
  /** Seconds elapsed since the previous frame, clamped so tab-outs cannot jump. */
  dt: 0.016,
}

/** Linear interpolation helper shared by scenes. */
export const lerp = (a, b, t) => a + (b - a) * t

/** Frame-rate independent damping. `t` is the fraction to close per 60fps frame. */
export const damp = (a, b, t, dt) => lerp(a, b, 1 - Math.pow(1 - t, dt * 60))

/** Smootherstep, for easing scene transitions without importing a tweener. */
export const smoothstep = (t) => {
  const x = Math.min(1, Math.max(0, t))
  return x * x * (3 - 2 * x)
}

/**
 * How far the visitor has moved through room `index`: 0 before they reach it,
 * 0 to 1 while they are inside it, 1 once they are past.
 *
 * Scenes use this rather than the global progress because the two pinned
 * corridors decide their own scroll length at runtime, from how wide their rail
 * turned out to be. Anything timed against the declared room lengths drifts.
 */
export const progressThroughRoom = (index) =>
  Math.min(1, Math.max(0, scrollState.roomFloat - index))
