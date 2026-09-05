import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scrollState } from '../state/scrollState.js'
import { ROOMS } from './rooms.js'

gsap.registerPlugin(ScrollTrigger)

const ID_PREFIX = 'room-'

let lenis = null
let rafId = 0
let started = 0
let teardown = []
let bounds = []
let measuredHeight = 0

/**
 * Where each room actually sits, in document pixels.
 *
 * A room's declared `length` says how tall it asks to be. It does NOT say how
 * much scroll it ends up owning: GSAP's pin spacers hand the two corridors
 * several thousand extra pixels apiece, decided at runtime by how wide their
 * rails turned out. Deriving the active room from the declared lengths put
 * every scene weight in the wrong place — Auvers' wheatfield was rendering on
 * top of the Saint-Remy sky — so the layout is measured instead.
 *
 * Re-measured whenever the document changes height, which covers every case
 * that matters: pin spacers appearing, fonts landing, a resize, an image
 * arriving late.
 */
function measureRooms() {
  const scrollY = window.scrollY
  bounds = ROOMS.map((room) => {
    const el = document.getElementById(ID_PREFIX + room.id)
    if (!el) return { index: room.index, top: 0, height: 1 }
    const rect = el.getBoundingClientRect()
    return {
      index: room.index,
      top: rect.top + scrollY,
      height: Math.max(1, rect.height),
    }
  })
  measuredHeight = document.documentElement.scrollHeight
}

/** Fractional room index for a scroll offset: 4.5 means halfway through room 4. */
function roomFloatAt(y) {
  if (!bounds.length) return 0
  // The visitor "is" wherever the middle of their viewport is, not the top,
  // or every room would change over a full screen-height too early.
  const focus = y + window.innerHeight * 0.5
  for (const b of bounds) {
    if (focus < b.top) return b.index
    if (focus < b.top + b.height) return b.index + (focus - b.top) / b.height
  }
  return bounds.length - 1
}

/** The live Lenis instance, or null in simple/reduced-motion mode. */
export const getLenis = () => lenis

/**
 * Starts the vertical spine: Lenis smoothing, the per-frame write into
 * `scrollState`, and GSAP's ScrollTrigger wired to the same ticker.
 *
 * `smooth: false` skips Lenis entirely (simple mode / reduced motion) but keeps
 * the per-frame state write, so the WebGL layer and the floor directory still
 * track a plain native scroll.
 *
 * Returns a disposer. Safe to call again after disposing.
 */
export function startScrollEngine({ smooth = true } = {}) {
  stopScrollEngine()

  if (smooth) {
    lenis = new Lenis({
      duration: 1.15,
      // A long, slightly lazy ease — the visitor is walking, not clicking.
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 0.9,
      touchMultiplier: 1.6,
      // Native touch scrolling stays native; smoothing a phone scroll costs
      // more in jank than it buys in feel.
      syncTouch: false,
    })
    document.documentElement.classList.add('lenis', 'lenis-smooth')

    // Drive ScrollTrigger from Lenis rather than letting both poll the scroller.
    lenis.on('scroll', ScrollTrigger.update)
    teardown.push(() => {
      document.documentElement.classList.remove('lenis', 'lenis-smooth')
      lenis.destroy()
      lenis = null
    })
  }

  const tick = (now) => {
    rafId = requestAnimationFrame(tick)
    if (!started) started = now
    const time = (now - started) / 1000
    const dt = Math.min(0.05, time - scrollState.time || 0.016)
    scrollState.time = time

    if (lenis) lenis.raf(now)

    const doc = document.documentElement
    const max = doc.scrollHeight - window.innerHeight
    const y = lenis ? lenis.scroll : window.scrollY || doc.scrollTop
    const progress = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0

    scrollState.velocity = lenis
      ? (lenis.velocity || 0) / 40
      : (progress - scrollState.progress) * 60
    scrollState.progress = progress

    if (doc.scrollHeight !== measuredHeight) measureRooms()
    const roomFloat = roomFloatAt(y)
    scrollState.roomFloat = roomFloat
    scrollState.roomProgress = roomFloat - Math.floor(roomFloat)
    scrollState.dt = dt
  }
  rafId = requestAnimationFrame(tick)
  teardown.push(() => cancelAnimationFrame(rafId))

  // No scrollerProxy: Lenis moves the real document scroll position rather than
  // transforming a wrapper, so ScrollTrigger reads it natively. All it needs is
  // to be told when Lenis has moved, which the `scroll` listener above does.
  const onResize = () => ScrollTrigger.refresh()
  window.addEventListener('resize', onResize)
  teardown.push(() => window.removeEventListener('resize', onResize))

  // Fonts land after first paint and change every pinned section's height.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready
      .then(() => {
        ScrollTrigger.refresh()
        measureRooms()
      })
      .catch(() => {})
  }

  // Pinning changes the height of the document, so the measurement has to
  // happen again after every refresh, not only on the first one.
  ScrollTrigger.addEventListener('refresh', measureRooms)
  teardown.push(() => ScrollTrigger.removeEventListener('refresh', measureRooms))

  ScrollTrigger.refresh()
  measureRooms()
  return stopScrollEngine
}

export function stopScrollEngine() {
  teardown.forEach((fn) => {
    try {
      fn()
    } catch {
      /* a disposer failing must not block the rest */
    }
  })
  teardown = []
  // Deliberately does NOT kill every ScrollTrigger on the page. Rooms create
  // their own inside a `gsap.context()` and revert them on their own cleanup;
  // killing them from here would unpin both corridors the instant they mounted,
  // because a child's layout effect runs before this parent effect does.
  started = 0
}

/**
 * Walk to a room. Used by the floor directory and by the threshold curtain, so
 * a keyboard visitor never has to perform a drag to move through the building.
 */
export function scrollToRoom(id, { immediate = false } = {}) {
  const el = document.getElementById(ID_PREFIX + id)
  if (!el) return
  if (lenis) {
    lenis.scrollTo(el, { offset: 0, duration: immediate ? 0 : 1.5, immediate })
  } else {
    el.scrollIntoView({ behavior: immediate ? 'auto' : 'smooth', block: 'start' })
  }
}

