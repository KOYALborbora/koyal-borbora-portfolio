/**
 * Outplayed.in — the case study cover, turned on its side.
 *
 * The original is a tall poster and a gallery frame is landscape, so the type
 * block takes the left and the three screens take the right. Same content,
 * re-set for the wall it is hanging on, which is what a designer would do with
 * it anyway rather than shrinking the whole poster to fit.
 *
 * Kept in its own module because it is the largest composition in the set and
 * `works.mjs` was getting long.
 */

import {
  W,
  H,
  seeded,
  brush,
  paint,
  card,
  blob,
  text,
  phone,
  statusBar,
  document_,
} from './artwork.mjs'

const BLUE = '#2B3AE8'
const DEEP = '#141B8C'
const LIFT = '#5566FF'
const LIME = '#E9FF57'
const PAPER = '#FFFFFF'
const SCREEN = '#0B0D14'
const PANEL = '#151A26'

/** Splash: the promise, before anything has been asked of anybody. */
function splashScreen(rand, x, y, pw, ph) {
  let sc = ''
  sc += paint(rand, x, y, pw, ph, {
    color: '#1A1F3C',
    tones: ['#0E1226', '#232A52', '#3A3F72'],
    angle: -0.7,
    density: 0.06,
    width: [12, 34],
    opacity: [0.2, 0.5],
  })
  sc += statusBar(rand, x, y, pw, PAPER)
  sc += card(rand, x + 20, y + 296, 108, 26, { fill: '#2A3050', rx: 13, grain: 0.06 })
  sc += text('Outplayed.in', x + 74, y + 314, { size: 13, color: PAPER, anchor: 'middle' })
  const lines = ['The Ultimate Hub For', 'Gamers And', 'Tournament Hosts.']
  lines.forEach((line, i) => {
    sc += text(line, x + 20, y + 354 + i * 27, {
      size: 21,
      color: PAPER,
      weight: 900,
      family: 'Fraunces, Georgia, serif',
    })
  })
  sc += text('Where every player finds', x + 20, y + 444, { size: 13, color: PAPER, opacity: 0.75 })
  sc += text('their match.', x + 20, y + 462, { size: 13, color: PAPER, opacity: 0.75 })
  return sc
}

/** Communities: the screen the product actually lives on. */
function communitiesScreen(rand, x, y, pw, h) {
  let sc = ''
  sc += paint(rand, x, y, pw, h, {
    color: SCREEN,
    tones: ['#050710', SCREEN, '#1B2133'],
    angle: 1.5,
    density: 0.05,
    width: [10, 26],
    opacity: [0.18, 0.4],
  })
  sc += statusBar(rand, x, y, pw, PAPER)
  sc += text('Welcome back', x + 18, y + 62, { size: 13, color: PAPER, opacity: 0.6 })
  sc += text('to Communities', x + 18, y + 85, {
    size: 20,
    color: PAPER,
    weight: 700,
    family: 'Fraunces, Georgia, serif',
  })
  sc += blob(rand, x + pw - 34, y + 70, 17, { color: '#7ADF8A', opacity: 1, strokes: 3 })

  sc += card(rand, x + 18, y + 102, pw - 74, 34, { fill: PANEL, rx: 17, grain: 0.06 })
  sc += text('Search community', x + 40, y + 124, { size: 12, color: PAPER, opacity: 0.5 })
  sc += card(rand, x + pw - 50, y + 102, 34, 34, { fill: PANEL, rx: 17, grain: 0.06 })
  sc += text('+', x + pw - 33, y + 126, { size: 22, color: LIME, anchor: 'middle' })

  const tabs = [
    ['ALL', false],
    ['MY COMMUNITIES', false],
    ['MEMBER', true],
  ]
  let tx = x + 18
  for (const [label, on] of tabs) {
    const tw = label.length * 5.4 + 20
    sc += card(rand, tx, y + 148, tw, 24, { fill: on ? '#2A2E12' : PANEL, rx: 12, grain: 0.08 })
    sc += text(label, tx + tw / 2, y + 164, {
      size: 9,
      color: on ? LIME : PAPER,
      anchor: 'middle',
      opacity: on ? 1 : 0.75,
    })
    tx += tw + 7
  }

  // The grid, two up, running off the bottom of the screen exactly as it does
  // in the real thing — a directory is never finished.
  const names = ['Memes Room', 'Meme Room', 'Upcoming Tourn.', 'Pro BGMI Tips']
  const dots = ['#B04FE0', '#4FA8E0', '#E0B84F']
  const faces = ['#7ADF8A', '#E0B84F', '#B04FE0', '#4FA8E0']
  for (let i = 0; i < 10; i++) {
    const cx = x + 16 + (i % 2) * 104
    const cy = y + 186 + Math.floor(i / 2) * 66
    sc += card(rand, cx, cy, 96, 58, { fill: PANEL, rx: 9, grain: 0.07 })
    sc += blob(rand, cx + 13, cy + 14, 7, { color: dots[i % 3], opacity: 1, strokes: 2 })
    sc += text(names[i % 4], cx + 25, cy + 17, { size: 8.5, color: PAPER, weight: 600 })
    sc += text('2 new posts · 14 new', cx + 25, cy + 28, { size: 7, color: PAPER, opacity: 0.5 })
    for (let a = 0; a < 4; a++) {
      sc += blob(rand, cx + 14 + a * 8, cy + 45, 6, { color: faces[a], opacity: 1, strokes: 0 })
    }
    sc += card(rand, cx + 56, cy + 38, 34, 15, { fill: '#242A3A', rx: 7, grain: 0.1 })
    sc += text('View', cx + 73, cy + 49, { size: 8, color: PAPER, anchor: 'middle', opacity: 0.85 })
  }
  return sc
}

/** The tournament page: the thing an organiser hands round. */
function tournamentScreen(rand, x, y, pw, ph) {
  let sc = ''
  sc += paint(rand, x, y, pw, ph, {
    color: SCREEN,
    tones: ['#050710', SCREEN, '#1B2133'],
    angle: 1.5,
    density: 0.05,
    width: [10, 26],
    opacity: [0.18, 0.4],
  })

  // The hero photograph, painted as a team under stage light rather than
  // reproduced — it is somebody else's photograph.
  sc += paint(rand, x, y, pw, 176, {
    color: '#6B3A8C',
    tones: ['#3A1F52', '#8C4FB0', '#D06BA8', '#2A1638'],
    angle: -0.35,
    density: 0.09,
    width: [10, 30],
    opacity: [0.3, 0.65],
  })
  sc += blob(rand, x + 118, y + 92, 26, { color: '#E8C08A', opacity: 0.92, strokes: 5 })
  sc += `<path d="M${x + 96} ${y + 176} q ${22} ${-58} ${44} 0 Z" fill="#1B1026" opacity="0.92"/>`
  sc += blob(rand, x + 58, y + 122, 20, { color: '#2A1638', opacity: 0.85, strokes: 3 })
  sc += blob(rand, x + 178, y + 124, 20, { color: '#2A1638', opacity: 0.85, strokes: 3 })
  sc += `<path d="M${x + 104} ${y + 66} l ${14} ${-18} l ${14} ${18} Z" fill="#E8C08A" opacity="0.9"/>`

  sc += statusBar(rand, x, y, pw, PAPER)
  sc += text('‹  Weekend warmup 1.0', x + 18, y + 62, { size: 12, color: PAPER, weight: 600 })
  sc += card(rand, x + pw - 76, y + 146, 58, 18, { fill: '#0B0D14', rx: 9, grain: 0 })
  sc += text('12/100', x + pw - 47, y + 159, { size: 9, color: PAPER, anchor: 'middle' })

  sc += card(rand, x + 16, y + 190, 42, 18, { fill: '#1E7A3A', rx: 9, grain: 0.1 })
  sc += text('Open', x + 37, y + 203, { size: 9, color: PAPER, anchor: 'middle' })
  sc += text('Weekend warmup 1.0', x + 16, y + 234, {
    size: 17,
    color: PAPER,
    weight: 700,
    family: 'Fraunces, Georgia, serif',
  })
  sc += text('26 – 28 Jun 2025 · Round Robin · Online', x + 16, y + 252, {
    size: 8.5,
    color: PAPER,
    opacity: 0.55,
  })

  const faces = ['#7ADF8A', '#E0B84F', '#B04FE0', '#4FA8E0', '#D06BA8']
  for (let a = 0; a < 5; a++) {
    sc += blob(rand, x + 26 + a * 13, y + 278, 10, { color: faces[a], opacity: 1, strokes: 0 })
  }
  sc += text('View all', x + 100, y + 282, { size: 9, color: PAPER, opacity: 0.7 })
  sc += card(rand, x + pw - 86, y + 266, 72, 24, { fill: '#1B2A6B', rx: 12, grain: 0.08 })
  sc += text('₹ 10,000', x + pw - 50, y + 282, { size: 11, color: LIME, anchor: 'middle', weight: 600 })

  const tabs = [
    ['ABOUT', true],
    ['RULES', false],
    ['SCHEDULE', false],
    ['SCOREBOARD', false],
  ]
  // Sized so all four fit inside the phone. At a comfortable reading size they
  // do not, and SCOREBOARD ends up hanging off the edge of the glass.
  let dx = x + 14
  for (const [label, on] of tabs) {
    const tw = label.length * 4.4 + 14
    sc += card(rand, dx, y + 302, tw, 21, { fill: on ? LIME : PANEL, rx: 10, grain: 0.08 })
    sc += text(label, dx + tw / 2, y + 316, {
      size: 7.5,
      color: on ? DEEP : PAPER,
      anchor: 'middle',
      opacity: on ? 1 : 0.75,
    })
    dx += tw + 5
  }

  sc += text('Sponsors', x + 16, y + 350, { size: 10, color: PAPER, opacity: 0.6, italic: true })
  sc += card(rand, x + 16, y + 362, 118, 94, { fill: '#243048', rx: 8, grain: 0.07 })
  sc += blob(rand, x + 100, y + 410, 15, { color: '#E8C08A', opacity: 0.9, strokes: 3 })
  sc += blob(rand, x + 74, y + 410, 11, { color: PAPER, opacity: 0.85, strokes: 2 })
  sc += card(rand, x + 142, y + 362, 118, 94, { fill: '#1E2740', rx: 8, grain: 0.07 })
  sc += blob(rand, x + 200, y + 410, 13, { color: '#4FA8E0', opacity: 0.85, strokes: 2 })
  return sc
}

export function outplayed() {
  const rand = seeded('outplayed')
  let s = ''

  s += paint(rand, 0, 0, W, H, {
    color: BLUE,
    tones: [DEEP, BLUE, LIFT, '#7C86FF'],
    angle: -0.55,
    density: 0.055,
    width: [20, 60],
    opacity: [0.2, 0.5],
  })
  // The bloom the original has behind its headline.
  s += `<ellipse cx="1180" cy="230" rx="520" ry="380" fill="${LIFT}" opacity="0.2"/>`
  s += `<ellipse cx="280" cy="840" rx="420" ry="320" fill="${DEEP}" opacity="0.28"/>`

  // The wordmark, in its outlined box.
  s += `<rect x="80" y="66" width="228" height="66" fill="none" stroke="${LIME}" stroke-width="3"/>`
  s += text('Outplayed.in', 194, 112, {
    size: 33,
    color: LIME,
    weight: 900,
    family: 'Fraunces, Georgia, serif',
    anchor: 'middle',
  })

  const headline = ['The ultimate hub', 'for gamers and', 'tournament hosts.']
  headline.forEach((line, i) => {
    s += text(line, 80, 234 + i * 74, {
      size: 66,
      color: PAPER,
      weight: 900,
      family: 'Fraunces, Georgia, serif',
    })
  })

  const body = [
    "A mobile app for India's competitive gaming scene, where",
    'players find communities, teams and tournaments, and',
    'organisers run an event from registration to payout in',
    'one place.',
  ]
  body.forEach((line, i) => {
    s += text(line, 82, 490 + i * 34, { size: 23, color: PAPER, opacity: 0.88 })
  })

  // The credits row, which is the part that says whose work this is.
  s += brush(rand, 80, 658, 700, 658, { color: PAPER, width: 2, opacity: 0.45, bow: 0.004 })
  const meta = [
    ['Role', 'Product & UI/UX design'],
    ['Platform', 'iOS & Android'],
    ['Year', '2025'],
    ['Company', 'Fraemerate Pvt. Ltd.'],
  ]
  meta.forEach(([label, value], i) => {
    const mx = 80 + (i % 2) * 340
    const my = 706 + Math.floor(i / 2) * 94
    s += text(label, mx, my, { size: 19, color: PAPER, opacity: 0.62 })
    s += text(value, mx, my + 33, { size: 24, color: PAPER, weight: 600 })
  })

  const pw = 236
  const ph = 470
  s += phone(rand, 828, 500, pw, ph, splashScreen(rand, 828, 500, pw, ph), { radius: 26 })
  s += phone(rand, 1084, 452, pw, ph + 46, communitiesScreen(rand, 1084, 452, pw, ph + 46), {
    radius: 26,
  })
  s += phone(rand, 1332, 500, pw, ph, tournamentScreen(rand, 1332, 500, pw, ph), { radius: 26 })

  return document_(s, {
    alt: 'The Outplayed.in case study cover: the headline "The ultimate hub for gamers and tournament hosts" on an electric blue ground, credited as product and UI/UX design at Fraemerate, beside three app screens — a splash screen, a communities directory, and a tournament page for Weekend Warmup 1.0 with a ten thousand rupee prize pool.',
    roughness: 4,
    seed: 83,
    tooth: 0.08,
  })
}
