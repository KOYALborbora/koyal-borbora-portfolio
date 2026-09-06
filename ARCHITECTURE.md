# VINCENT — build contract

This file is the interface every component is written against. The shell
(`main.jsx`, `App.jsx`, `components/Room.jsx`, `scenes/StageCanvas.jsx`,
`lib/rooms.js`, `lib/scrollEngine.js`, `state/*`, `styles/*`, `content/*`)
already exists and **must not be modified** — leaf components plug into it.

## Stack, as installed

React 18.3 · Vite 5.4 · three 0.169 · @react-three/fiber 8.18 · @react-three/drei
9.122 · gsap 3.15 (+ ScrollTrigger) · lenis 1.3 · zustand 4.5. Plain JavaScript
with JSX — **no TypeScript**, no new dependencies.

## The floor plan

`src/lib/rooms.js` is the single source of truth: six rooms in order, each with
`id`, `index`, `title`, `period`, `section`, `axis`, `length` (scroll length in
viewport heights) and a `palette`.

`length` is a **minimum height**, not a scroll budget. The two pinned corridors
decide their own scroll length at runtime from how wide their rail turned out,
so `lib/scrollEngine.js` measures the real document layout every time the page
changes height and publishes the result as `scrollState.roomFloat`. Anything
timed against the declared lengths will drift — use `progressThroughRoom(index)`.

| index | id | section | axis | scene |
| --- | --- | --- | --- | --- |
| 0 | `threshold` | Landing | vertical | DOM + SVG filter |
| 1 | `nuenen` | Origin | vertical | 2D canvas |
| 2 | `paris` | Toolkit | horizontal (pinned) | DOM + 2D canvas |
| 3 | `arles` | Selected work | horizontal (pinned) | DOM |
| 4 | `saint-remy` | Process | vertical | WebGL |
| 5 | `auvers` | Contact | vertical | WebGL |

## State

Two stores, split by update frequency. **Getting this wrong is the single
easiest way to make the site janky.**

- `src/state/scrollState.js` — a plain mutable object, written once per frame by
  the scroll engine. Read it inside `useFrame` / `requestAnimationFrame` only.
  Fields: `progress` (0→1 global), `roomProgress` (0→1 in the active room),
  `roomFloat` (fractional room index, measured from the real layout),
  `velocity`, `pointer` (NDC, y up), `pointerPx` (CSS px), `pointerSeen`,
  `time` (seconds), `dt`. Helpers exported alongside it: `lerp`,
  `damp(a, b, t, dt)`, `smoothstep`, and `progressThroughRoom(index)`.
  **Never put these in React state.**
- `src/state/useStore.js` — zustand, for discrete state only: `entered`,
  `activeRoom`, `reducedMotion`, `simpleMode`, `webglOK`, `stars`,
  `calm`, `openProject`, `announcement`. Select narrowly
  (`useStore(s => s.calm)`), never destructure the whole store.

## Room shell

```jsx
import Room, { RoomTitle } from '../components/Room.jsx'

export default function Paris() {
  return (
    <Room id="paris" autoHeight={false} className="paris">
      <RoomTitle id="paris" eyebrow={copy.eyebrow}>{copy.title}</RoomTitle>
      …
    </Room>
  )
}
```

`Room` supplies the section landmark, `data-room` (which repaints every palette
token), the `min-height` from the floor plan, the intersection observer that
marks the room active, and the screen-reader announcement. Pass
`autoHeight={false}` when the room sizes itself (the two pinned corridors).
Pass `transparent` when the WebGL stage should show through.

`RoomTitle` renders the `<h2 id="room-{id}-title">` that the section's
`aria-labelledby` points at. Threshold is the exception: it renders its own
`<h1 id="room-threshold-title">` and does not use `RoomTitle`.

## Styling

- Tokens live in `src/styles/tokens.css`; every room's palette is already
  declared under `[data-room="<id>"]`. **Use `var(--bg)`, `var(--accent)`,
  `var(--secondary)`, `var(--text)`, `var(--accent-legible)` — never hard-code a
  hex value in a component.** `--accent-legible` exists for rooms where the true
  pigment fails contrast against the wall; use it for body-size text and links,
  and reserve the raw `--accent` for large display type and decoration.
- One CSS file per room, `src/rooms/<Room>.css`, imported by the room component.
  Prefix every class with the room id (`.paris__study`) so files never collide.
- Space with `--space-*` / `--gutter`, type with `--step-*`. `.weave`,
  `.plaque`, `.btn`, `.visually-hidden` are already global.
- Respect `prefers-reduced-motion` in CSS *and* branch on `simpleMode` in JS.

## Scroll

`src/lib/scrollEngine.js` owns Lenis and registers ScrollTrigger. Rooms that pin
create their own ScrollTrigger inside a `useLayoutEffect` with a
`gsap.context()` and **must revert it on cleanup**:

```js
useLayoutEffect(() => {
  if (still) return                      // simple mode / reduced motion: plain scroll
  const ctx = gsap.context(() => {
    ScrollTrigger.create({ trigger: el, pin: inner, scrub: 1, … })
  }, root)
  return () => ctx.revert()
}, [still])
```

Never call `startScrollEngine` from a room, and never kill ScrollTriggers you
did not create — a room's layout effect runs before the engine's parent effect,
so a blanket `ScrollTrigger.getAll().kill()` unpins both corridors on mount.
Use `scrollToRoom(id)` for jumps.

Both corridors also fall back to the stacked layout below 900px
(`hooks/useNarrow.js`), which covers tablets in portrait as well as phones: a
pinned corridor there costs a screenful of scroll per item and fights the
browser's own chrome.

Room `length` is a minimum height and should be sized to the room's content plus
a deliberate hold — no room should end in a screenful of empty wall.

## WebGL scenes

`scenes/StageCanvas.jsx` mounts one `<Canvas>` for the whole visit and lazily
mounts three scene modules, each of which must exist and default-export a
component with this exact signature:

```jsx
export default function SwirlingSky({ weights }) { … }
```

`weights` is a **ref** — `weights.current.haze | .sky | .wheat` are 0→1 presence
values recomputed every frame. Read them inside `useFrame`, never in render.
Scenes render three.js objects only (no DOM), must dispose geometries/materials
on unmount, and must not create per-frame allocations.

Required modules: `scenes/AmbientHaze.jsx` (`weights.current.haze`),
`scenes/SwirlingSky.jsx` (`.sky`), `scenes/WheatSky.jsx` (`.wheat`).

GLSL lives in `src/shaders/*.glsl` and is imported as a string with Vite's
`?raw` suffix: `import frag from '../shaders/swirl.frag.glsl?raw'`.

`weightFor(index, roomFloat)` in `StageCanvas` holds a scene at full strength
across its whole room and dissolves it only in a narrow band around each
boundary. Do not "simplify" it to a distance falloff from the room's centre:
that puts the next room's scene at half strength halfway through this one, and
Auvers' wheatfield ends up rising behind Saint-Rémy's last paragraph.

`ShaderPlane` exports `LOW_QUALITY`, decided once at module load from viewport
width and pointer type, and compiles the fragment shader with a matching
`#define`. Guard anything expensive with `#ifdef LOW_QUALITY`: the noise octave
counts in `lib.glsl` and the per-fragment height gradients in both skies already
are. The stage also drops to 1× device pixel ratio on coarse pointers.

## Artwork

`scripts/artwork.mjs` is the brush kit — seeded randomness, `paint` (a flat base
plus a field of strokes), `card`, `phone`, `blob`, `text`. `scripts/works.mjs`
composes one picture per project from it, keyed by the basename of that
project's `image`. Add a project, add a composition under the same key.

Two rules: **mass first, brushwork over it** — scattered strokes never resolve
into a subject — and **deterministic**, so a rebuild is byte-identical and git
stays quiet. `SelfPaintingCanvas` follows the same shape in 2D canvas, which is
what lets it block the room in early and find the texture later.

## Interaction affordances

The brush cursor replaces the pointer, which means the browser's own hover
states are gone. Anything interactive must therefore either match the
`INTERACTIVE` selector in `BrushCursor` (so the brush opens into a ring over it)
or state its own affordance in words. Rooms that ask something of the visitor
use `components/Invitation.jsx` rather than inventing a new hint.

## Content

Every visitor-facing string comes from `src/content/*.json`, imported directly
(`import copy from '../content/skills.json'`). Never hard-code copy in a
component. Each file carries an `_edit` key describing what it expects; ignore
it at runtime.

## Accessibility floor — non-negotiable

- Every interactive thing is reachable and operable by keyboard, with a visible
  focus ring. Drag-only interactions must have a click/Enter equivalent — the
  paint drip, Light the Stars and Calm the Sky each ship one.
- Anything `position: fixed` and viewport-sized inside a room must be gated on
  that room being active. Every room stays mounted for the whole visit, so an
  ungated overlay hangs over the rest of the building swallowing clicks.
- **Never take a gesture the browser needs.** A full-viewport press target with
  `touch-action: none` stops a phone scrolling past it. Use `pan-y`, or gate the
  target to fine pointers and give touch the button instead.
- Interactive targets are ≥44px under `(pointer: coarse)`; there is a block in
  `global.css` that does this. Form fields stay ≥16px so iOS does not zoom.
- Modals belong in a portal to `document.body`. `.exhibition` is its own
  stacking context, so a modal rendered in place cannot cover the fixed chrome.
- Every painting-styled visual carries real alt text (from the content JSON).
- Decorative canvases get `aria-hidden="true"`.
- Simple mode and reduced motion produce the **same content**, statically laid
  out: no pinning, no scroll-jacking, no rAF loops, no WebGL.
- Contrast: check text against the room's actual wall colour. Add a scrim
  (`--scrim`) or switch to `--accent-legible` rather than shipping 3:1 body text.
  Auvers deliberately departs from the brief's palette table here: bone white on
  wheat gold is about 1.9:1, so that room's ink stays dark across the whole
  storm-to-blossom transition.
- Audio never autoplays and always has a visible control.
