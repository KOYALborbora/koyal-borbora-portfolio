import { create } from 'zustand'
import { ROOMS } from '../lib/rooms.js'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Persisted-across-reload preferences. Wrapped in try/catch because Safari
 * private mode throws on localStorage access rather than returning null.
 */
const readPref = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key)
    return raw === null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}
const writePref = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable — preference simply does not persist */
  }
}

/**
 * Discrete application state. Anything here triggers React re-renders, so it
 * must only hold values that change on a human timescale — never per frame.
 * Per-frame values live in `scrollState`.
 */
export const useStore = create((set, get) => ({
  // ── Visitor entry ────────────────────────────────────────────────────────
  /** The exhibition holds the visitor at the threshold until they pull the curtain. */
  entered: false,
  enter: () => set({ entered: true }),

  // ── Room tracking ────────────────────────────────────────────────────────
  activeRoom: ROOMS[0].id,
  setActiveRoom: (id) => {
    if (get().activeRoom === id) return
    set({ activeRoom: id })
  },

  // ── Accessibility & performance preferences ──────────────────────────────
  reducedMotion: prefersReducedMotion(),
  setReducedMotion: (v) => set({ reducedMotion: v }),

  /** "Simple mode" strips all WebGL and scroll-jacking. Persisted. */
  simpleMode: readPref('vincent:simpleMode', false),
  toggleSimpleMode: () => {
    const next = !get().simpleMode
    writePref('vincent:simpleMode', next)
    set({ simpleMode: next })
  },

  /** Set false once the device proves it cannot hold a frame budget. */
  webglOK: true,
  setWebglOK: (v) => set({ webglOK: v }),

  // ── Signature interactions ───────────────────────────────────────────────
  /** Saint-Rémy: stars the visitor has lit, in room-local UV space. Session only. */
  stars: [],
  lightStar: (star) =>
    set((s) => (s.stars.length >= 60 ? s : { stars: [...s.stars, star] })),

  /** Auvers: 0 = turbulent wheat-gold storm, 1 = calm blossom blue. */
  calm: 0,
  setCalm: (v) => set({ calm: Math.min(1, Math.max(0, v)) }),

  /** Arles: id of the project whose frame has been lifted off the wall. */
  openProject: null,
  setOpenProject: (id) => set({ openProject: id }),

  // ── Announcements for screen readers ─────────────────────────────────────
  announcement: '',
  announce: (message) => set({ announcement: message }),
}))
