/**
 * One composition per project.
 *
 * Each of these paints the actual work — the real mark, the real screens, the
 * real layout — rather than an abstract stand-in. The palettes are shifted a
 * little towards the gallery's own pigments and everything is brushed, so six
 * very different pieces still read as one exhibition, but the design underneath
 * stays recognisable. That is the whole point of hanging them.
 */

import {
  W,
  H,
  seeded,
  shade,
  mix,
  brush,
  paint,
  card,
  blob,
  text,
  textLines,
  phone,
  statusBar,
  document_,
} from './artwork.mjs'
import { outplayed } from './works-outplayed.mjs'

/* ── Fraemerate ─────────────────────────────────────────────────────────── */

/**
 * The mark is five ribbon bands stacked into a diamond, each one kinked in the
 * middle like a flag caught mid-ripple. Van Gogh would have had no trouble with
 * it — the logo is already made of brushstrokes.
 */
function ribbon(rand, x1, x2, y, thickness, drop, color) {
  const mid = x1 + (x2 - x1) * 0.48
  const back = x1 + (x2 - x1) * 0.62
  const d = `M${x1} ${y} L${mid} ${y} C${mid + 40} ${y} ${back - 40} ${y + drop} ${back} ${y + drop} L${x2} ${y + drop}`
  // Butt caps, not round: the real bands are cut square along the diamond's
  // edge, and rounding them turns the mark into a stack of sausages.
  let out = `<path d="${d}" stroke="${color}" stroke-width="${thickness}" stroke-linecap="butt" stroke-linejoin="round" fill="none"/>`
  // Brushed along its own length, so the band has grain running with the ribbon.
  for (let i = 0; i < 7; i++) {
    const off = (i / 6 - 0.5) * thickness * 0.62
    out += `<path d="${d}" stroke="${
      rand() > 0.5 ? shade(color, -0.32) : shade(color, 0.3)
    }" stroke-width="${thickness * (0.06 + rand() * 0.1)}" stroke-linecap="butt" fill="none" opacity="${(
      0.18 +
      rand() * 0.3
    ).toFixed(2)}" transform="translate(0 ${off.toFixed(1)})"/>`
  }
  return out
}

export function fraemerate() {
  const rand = seeded('fraemerate')
  const bg = '#14110F'
  const ink = '#F5EFE6'
  let s = ''

  s += paint(rand, 0, 0, W, H, {
    color: bg,
    tones: [shade(bg, -0.3), bg, '#241C14', '#25302F'],
    angle: 1.45,
    density: 0.05,
    width: [14, 40],
    opacity: [0.2, 0.5],
  })
  // A cold halo behind the mark, so it sits off the wall.
  s += `<ellipse cx="${W / 2}" cy="470" rx="430" ry="430" fill="#3C6E71" opacity="0.14"/>`
  s += `<ellipse cx="${W / 2}" cy="470" rx="270" ry="270" fill="#E8B923" opacity="0.07"/>`

  // Logo space is 799 x 866, scaled to 720 tall and centred.
  const k = 720 / 866
  const ox = W / 2 - (799 * k) / 2
  const oy = 470 - (866 * k) / 2
  const X = (v) => ox + v * k
  const Y = (v) => oy + v * k

  const bands = [
    [370, 510, 65, 95],
    [215, 650, 200, 112],
    [20, 790, 365, 122],
    [15, 785, 522, 122],
    [155, 590, 682, 112],
    [320, 440, 815, 86],
  ]
  for (const [x1, x2, y, t] of bands) {
    s += ribbon(rand, X(x1), X(x2), Y(y), t * k, 52 * k, ink)
  }

  s += text('FRAEMERATE', W / 2, 930, {
    size: 60,
    color: ink,
    weight: 900,
    family: 'Fraunces, Georgia, serif',
    anchor: 'middle',
    letter: 14,
    opacity: 0.9,
  })
  s += text('a minimal digital product studio', W / 2, 972, {
    size: 27,
    color: ink,
    anchor: 'middle',
    italic: true,
    opacity: 0.55,
  })

  return document_(s, {
    alt: 'The Fraemerate studio mark: five ribbon-like bands stacked into a diamond, each kinked in the middle, painted in bone white on a near-black ground.',
    roughness: 9,
    seed: 11,
  })
}

/* ── Google-themed portfolio ────────────────────────────────────────────── */

export function googlePortfolio() {
  const rand = seeded('google-portfolio')
  const bg = '#1E1F21'
  const panel = '#2A2C2F'
  const ink = '#E8E6E1'
  const dim = '#9AA0A6'
  const accent = '#E8B923'
  let s = ''

  s += paint(rand, 0, 0, W, H, {
    color: bg,
    tones: [shade(bg, -0.35), bg, shade(bg, 0.16), '#241C14'],
    angle: 1.5,
    density: 0.045,
    width: [16, 44],
    opacity: [0.18, 0.44],
  })

  // Search row. One text element with coloured spans, so the browser kerns the
  // wordmark instead of me guessing a fixed advance per letter.
  const gl = ['#4285F4', '#EA4335', '#FBBC05', '#4285F4', '#34A853', '#EA4335']
  s += `<text x="60" y="92" font-family="Fraunces, Georgia, serif" font-size="44" font-weight="700">${'Google'
    .split('')
    .map((ch, i) => `<tspan fill="${gl[i]}">${ch}</tspan>`)
    .join('')}</text>`
  s += card(rand, 246, 56, 620, 52, { fill: panel, rx: 26, grain: 0.04 })
  s += text('koyal borbora', 278, 91, { size: 26, color: ink })
  s += blob(rand, 1060, 82, 13, { color: dim, opacity: 0.5, strokes: 2 })
  s += blob(rand, 1520, 82, 26, { color: accent, opacity: 0.9, strokes: 3 })
  s += text('K', 1520, 92, { size: 28, color: '#1E1F21', weight: 900, anchor: 'middle', family: 'Fraunces, Georgia, serif' })

  // Result tabs.
  const tabs = ['All', 'Images', 'Shopping', 'Videos', 'News', 'Maps', 'Books', 'More', 'Tools']
  let tx = 246
  tabs.forEach((t, i) => {
    s += text(t, tx, 150, { size: 22, color: i === 0 ? '#8AB4F8' : dim })
    if (i === 0) s += brush(rand, tx - 4, 166, tx + 30, 166, { color: '#8AB4F8', width: 4, opacity: 0.9, bow: 0.01 })
    tx += t.length * 13 + 44
  })
  s += brush(rand, 60, 186, W - 60, 186, { color: dim, width: 2, opacity: 0.22, bow: 0.004 })

  // Name block.
  s += text('Koyal Borbora', 74, 262, { size: 62, color: ink, weight: 900, family: 'Fraunces, Georgia, serif' })
  s += text('UI/UX Designer', 76, 300, { size: 25, color: dim })

  // The tab pills that make this read as a portfolio rather than a search page.
  // On their own row: at display size the name is far too wide to share one.
  const pills = [
    ['Overview', true],
    ['Projects', false],
    ['Skills', false],
    ['Achievements', false],
    ['Contact Me', false],
  ]
  let px = 74
  for (const [label, active] of pills) {
    const pw = label.length * 14 + 58
    s += card(rand, px, 328, pw, 54, {
      fill: active ? shade(panel, 0.1) : panel,
      rx: 27,
      grain: 0.05,
      edge: active ? ink : null,
      edgeWidth: 2,
    })
    s += text(label, px + pw / 2, 363, { size: 22, color: ink, anchor: 'middle', opacity: active ? 1 : 0.82 })
    px += pw + 20
  }

  // The photo, as a painting rather than a photograph.
  const py = 406
  const pH = 366
  s += card(rand, 74, py, 600, pH, { fill: '#3A2A1E', rx: 20, grain: 0.05, angle: -0.5 })
  s += paint(rand, 74, py, 600, pH, {
    color: '#5C4327',
    tones: ['#7A5A33', '#3C2C1C', '#8C5A2B', '#2A2018'],
    angle: -0.5,
    density: 0.07,
    width: [12, 34],
    opacity: [0.3, 0.6],
    base: 0,
    rx: 20,
  })
  // A figure and a spray of blossom, which is what the real photograph holds.
  // Built shoulders-first so the head sits on a body rather than floating.
  const fx = 286
  const fy = py + 158
  // Order matters: shoulders, then hair falling over them, then the face, then
  // the fringe. Painted the other way round the hair reads as two dark wings
  // stuck on either side of a floating head.
  s += `<path d="M${fx - 34} ${fy + 30} h 68 v 62 h -68 Z" fill="#C08A5E" opacity="0.95"/>`
  s += `<path d="M${fx - 152} ${py + pH} q ${26} ${-152} ${152} ${-170} q ${126} ${18} ${152} ${170} Z" fill="#DDE7E6" opacity="0.92"/>`
  s += `<path d="M${fx - 100} ${py + pH} q ${-22} ${-206} ${100} ${-212} q ${122} ${6} ${100} ${212} q ${-30} ${-136} ${-100} ${-142} q ${-70} ${6} ${-100} ${142} Z" fill="#1E1610" opacity="0.96"/>`
  s += blob(rand, fx, fy, 62, { color: '#D6A87C', opacity: 1, strokes: 6 })
  s += `<path d="M${fx - 63} ${fy - 12} q ${63} ${-62} ${126} 0 q ${-16} ${-52} ${-63} ${-52} q ${-47} 0 ${-63} ${52} Z" fill="#1E1610" opacity="0.96"/>`
  s += `<circle cx="${fx - 23}" cy="${fy + 2}" r="6" fill="#241C14"/>`
  s += `<circle cx="${fx + 23}" cy="${fy + 2}" r="6" fill="#241C14"/>`
  s += `<path d="M${fx - 25} ${fy + 30} q ${25} ${21} ${50} 0" stroke="#7A4A38" stroke-width="7" fill="none" stroke-linecap="round"/>`
  for (let i = 0; i < 26; i++) {
    const bx = 430 + rand() * 224
    const by = py + 150 + rand() * 200
    const r = 11 + rand() * 19
    s += blob(rand, bx, by, r, { color: rand() > 0.35 ? '#D2456B' : '#E8B923', opacity: 0.9, strokes: 2 })
    s += blob(rand, bx, by, r * 0.34, { color: '#F5D97B', opacity: 0.9, strokes: 0 })
  }

  // The Diffusion.img result card.
  s += card(rand, 700, py, 330, pH, { fill: '#EDEAE4', rx: 18, grain: 0.05 })
  s += text('Diffusion.img', 726, py + 48, { size: 29, color: '#1E1F21', weight: 900, family: 'Fraunces, Georgia, serif' })
  s += textLines(rand, 726, py + 76, 278, 3, { color: '#5A5651', gap: 16, height: 5, opacity: 0.5 })
  s += card(rand, 726, py + 140, 278, 116, { fill: '#15181C', rx: 10, grain: 0.06 })
  s += text('Welcome to Diffusion.img', 736, py + 172, { size: 16, color: '#E8E6E1', opacity: 0.9 })
  for (let i = 0; i < 6; i++) {
    s += card(rand, 878 + (i % 3) * 42, py + 184 + Math.floor(i / 3) * 34, 34, 26, {
      fill: mix('#3E7CA6', '#E8B923', rand()),
      rx: 4,
      grain: 0.08,
    })
  }
  s += brush(rand, 726, py + 276, 1004, py + 276, { color: '#B9B4AC', width: 2, opacity: 0.5, bow: 0.006 })
  s += text('An AI image generation website', 726, py + 306, { size: 18, color: '#1E1F21', opacity: 0.9 })
  s += textLines(rand, 726, py + 326, 278, 2, { color: '#5A5651', gap: 15, height: 4, opacity: 0.45 })

  // The knowledge-panel cards down the right.
  s += card(rand, 1056, py, 210, 200, { fill: panel, rx: 16, grain: 0.05 })
  s += text('Born', 1082, py + 46, { size: 22, color: dim })
  s += text('2 Mar', 1082, py + 104, { size: 46, color: ink, weight: 900, family: 'Fraunces, Georgia, serif' })
  s += text('2002', 1082, py + 152, { size: 46, color: ink, weight: 900, family: 'Fraunces, Georgia, serif' })
  s += text('Jorhat, Assam', 1082, py + 192, { size: 20, color: dim })

  s += card(rand, 1288, py, 238, 200, { fill: panel, rx: 16, grain: 0.05 })
  s += text('Education', 1314, py + 46, { size: 22, color: ink })
  s += text('Jorhat', 1314, py + 92, { size: 26, color: '#8AB4F8' })
  s += text('Engineering', 1314, py + 126, { size: 26, color: '#8AB4F8' })
  s += text('College', 1314, py + 160, { size: 26, color: '#8AB4F8' })
  s += text('(2021–present)', 1314, py + 192, { size: 20, color: '#8AB4F8', opacity: 0.85 })

  s += card(rand, 1056, py + 222, 470, 144, { fill: '#B9C7F0', rx: 16, grain: 0.05 })
  s += text('Behance · Image Classification', 1080, py + 254, { size: 17, color: '#22304F', opacity: 0.9 })
  s += text('Imagination Into', 1080, py + 296, { size: 32, color: '#22304F', weight: 900, family: 'Fraunces, Georgia, serif' })
  s += text('Pictures', 1080, py + 334, { size: 32, color: '#22304F', weight: 900, family: 'Fraunces, Georgia, serif' })

  // Footer headings.
  s += brush(rand, 74, 828, W - 74, 828, { color: dim, width: 2, opacity: 0.22, bow: 0.004 })
  s += text('Projects ›', 74, 906, { size: 44, color: ink, weight: 900, family: 'Fraunces, Georgia, serif' })
  s += text('Profiles', 900, 906, { size: 44, color: ink, weight: 900, family: 'Fraunces, Georgia, serif' })

  return document_(s, {
    alt: 'A portfolio built to look like a Google search results page: the search field reads "koyal borbora", and the results are a name, a role, tab pills for Overview, Projects, Skills, Achievements and Contact, a photograph, a project card and knowledge-panel cards for birth date and education.',
    roughness: 4,
    seed: 23,
    tooth: 0.08,
  })
}

/* ── On-Demand Mechanic ─────────────────────────────────────────────────── */

function mechanicFigure(rand, cx, cy, scale, skin, cloth, capColor) {
  const k = scale
  const cap = capColor ?? cloth
  let s = ''

  // Body first, so the head sits on shoulders instead of floating.
  s += `<path d="M${cx - 58 * k} ${cy + 176 * k} q 0 ${-98 * k} ${58 * k} ${-118 * k} q ${58 * k} ${20 * k} ${58 * k} ${118 * k} Z" fill="${cloth}"/>`
  s += `<rect x="${cx - 30 * k}" y="${cy + 52 * k}" width="${60 * k}" height="${56 * k}" rx="${10 * k}" fill="#F1EDE4" opacity="0.95"/>`
  s += `<path d="M${cx - 30 * k} ${cy + 58 * k} l ${-20 * k} ${-14 * k} M${cx + 30 * k} ${cy + 58 * k} l ${20 * k} ${-14 * k}" stroke="${cloth}" stroke-width="${9 * k}" stroke-linecap="round" fill="none"/>`

  s += blob(rand, cx, cy, 40 * k, { color: skin, opacity: 1, strokes: 4 })

  // The cap is a dome sitting ON the skull plus a brim in front of it. Drawn as
  // an arc floating above the head — which is what a stroked curve gives you —
  // it reads as a halo, and the mechanic starts looking beatified.
  s += `<path d="M${cx - 41 * k} ${cy - 12 * k} a ${41 * k} ${41 * k} 0 0 1 ${82 * k} 0 Z" fill="${cap}"/>`
  s += `<path d="M${cx - 52 * k} ${cy - 12 * k} q ${52 * k} ${18 * k} ${104 * k} 0 l 0 ${-10 * k} q ${-52 * k} ${14 * k} ${-104 * k} 0 Z" fill="${shade(cap, -0.24)}"/>`

  s += `<circle cx="${cx - 15 * k}" cy="${cy + 4 * k}" r="${5 * k}" fill="#1B2A2E"/>`
  s += `<circle cx="${cx + 15 * k}" cy="${cy + 4 * k}" r="${5 * k}" fill="#1B2A2E"/>`
  s += `<path d="M${cx - 19 * k} ${cy + 17 * k} q ${19 * k} ${-9 * k} ${38 * k} 0" stroke="#3A2C1C" stroke-width="${7 * k}" fill="none" stroke-linecap="round"/>`
  s += `<path d="M${cx - 17 * k} ${cy + 27 * k} q ${17 * k} ${12 * k} ${34 * k} 0" stroke="#8A5A42" stroke-width="${5 * k}" fill="none" stroke-linecap="round"/>`

  // A raised arm with a spanner in it.
  s += brush(rand, cx + 46 * k, cy + 78 * k, cx + 88 * k, cy + 40 * k, { color: skin, width: 19 * k, opacity: 1, bow: 0.1 })
  s += brush(rand, cx + 88 * k, cy + 42 * k, cx + 110 * k, cy + 16 * k, { color: '#9AA6AA', width: 12 * k, opacity: 1, bow: 0.05 })
  return s
}

function timelineRow(rand, x, y, w, label, ink, dim, ring, filled) {
  let s = ''
  s += `<circle cx="${x + 16}" cy="${y}" r="15" fill="none" stroke="${ring}" stroke-width="3.5"/>`
  if (filled) s += `<circle cx="${x + 16}" cy="${y}" r="7" fill="${ring}"/>`
  s += text(label, x + 48, y + 8, { size: 21, color: ink, weight: 600 })
  s += textLines(rand, x + 48, y + 30, w - 60, 2, { color: dim, gap: 16, height: 4.5, opacity: 0.55 })
  return s
}

export function mechanic() {
  const rand = seeded('mechanic')
  const teal = '#0E6E68'
  const deep = '#0A4F4B'
  const paper = '#F4F1E8'
  const ink = '#12312F'
  const dim = '#5E7A78'
  let s = ''

  s += paint(rand, 0, 0, W, H, {
    color: teal,
    tones: [deep, teal, shade(teal, 0.22), '#1C3F73'],
    angle: -0.32,
    density: 0.05,
    width: [16, 46],
    opacity: [0.22, 0.5],
  })

  const pw = 400
  const ph = 810
  const py = 96
  const xs = [96, 600, 1104]

  /* Screen 1 — tracking the mechanic on a map. */
  {
    const x = xs[0]
    let sc = ''
    sc += paint(rand, x, py, pw, ph, { color: '#E9EFEC', angle: 0.4, density: 0.05, width: [12, 30], opacity: [0.15, 0.35] })
    // Roads.
    for (let i = 0; i < 9; i++) {
      const gy = py + 90 + i * 52
      sc += brush(rand, x, gy, x + pw, gy, { color: '#D2DAD6', width: 7, opacity: 0.75, bow: 0.01 })
    }
    for (let i = 0; i < 6; i++) {
      const gx = x + 30 + i * 68
      sc += brush(rand, gx, py + 60, gx, py + 470, { color: '#D2DAD6', width: 7, opacity: 0.75, bow: 0.01 })
    }
    // The route, which is the whole point of the screen.
    sc += `<path d="M${x + 300} ${py + 152} L${x + 300} ${py + 206} L${x + 176} ${py + 206} L${x + 176} ${py + 262} L${
      x + 108
    } ${py + 262} L${x + 108} ${py + 300}" stroke="${teal}" stroke-width="11" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
    sc += blob(rand, x + 300, py + 146, 17, { color: paper, opacity: 1, strokes: 2 })
    sc += `<circle cx="${x + 300}" cy="${py + 146}" r="17" fill="none" stroke="${ink}" stroke-width="3"/>`
    // The destination, which has to stay clear of the card that slides up.
    sc += blob(rand, x + 108, py + 306, 32, { color: '#D2456B', opacity: 0.22, strokes: 0 })
    sc += blob(rand, x + 108, py + 306, 15, { color: '#D2456B', opacity: 1, strokes: 2 })
    sc += statusBar(rand, x, py, pw, ink)
    sc += text('‹', x + 26, py + 96, { size: 40, color: ink, weight: 700 })
    sc += text('Tracking Mechanic', x + pw / 2, py + 92, { size: 26, color: ink, weight: 700, anchor: 'middle' })

    // The card that slides up from the bottom. Its top is placed from the
    // phone's bottom edge, not guessed, so the button inside always lands on
    // the glass rather than below it.
    const cy = py + 336
    sc += card(rand, x + 14, cy, pw - 28, ph - (cy - py) - 14, { fill: paper, rx: 26, grain: 0.045 })
    sc += text('Your Mechanic', x + 44, cy + 52, { size: 27, color: ink, weight: 700, family: 'Fraunces, Georgia, serif' })
    sc += blob(rand, x + 70, cy + 106, 26, { color: '#2E6F86', opacity: 1, strokes: 3 })
    sc += text('Rajat Sarma', x + 108, cy + 98, { size: 21, color: ink, weight: 600 })
    sc += text('• En Route · 4.0 ★', x + 108, cy + 122, { size: 15, color: '#C7522A' })
    // The call and message buttons sit on the name row, so everything to their
    // left has to stop short of them.
    sc += blob(rand, x + 300, cy + 106, 22, { color: teal, opacity: 1, strokes: 2 })
    sc += blob(rand, x + 352, cy + 106, 22, { color: teal, opacity: 1, strokes: 2 })
    sc += text('Arriving in 12 mins · 3.2 km away', x + 108, cy + 148, { size: 15, color: dim })
    sc += brush(rand, x + 44, cy + 184, x + pw - 44, cy + 184, { color: dim, width: 2, opacity: 0.3, bow: 0.006 })
    sc += text('Vehicle Info', x + 78, cy + 220, { size: 16, color: dim })
    sc += text('Hyundai i10 · DL 9C XXXX', x + 78, cy + 250, { size: 19, color: ink })
    sc += text('Tools Carried', x + 78, cy + 296, { size: 16, color: dim })
    sc += text('Jack, battery, tyre pump etc.', x + 78, cy + 326, { size: 19, color: ink })
    sc += card(rand, x + 44, cy + 364, pw - 88, 62, { fill: teal, rx: 31, grain: 0.06 })
    sc += text('Call Now', x + pw / 2, cy + 404, { size: 24, color: paper, weight: 600, anchor: 'middle' })
    s += phone(rand, x, py, pw, ph, sc)
  }

  /* Screen 2 — arrived, on paper. */
  {
    const x = xs[1]
    let sc = ''
    sc += paint(rand, x, py, pw, ph, { color: paper, angle: -0.3, density: 0.05, width: [12, 32], opacity: [0.12, 0.3] })
    sc += statusBar(rand, x, py, pw, ink)
    sc += text('‹', x + 26, py + 96, { size: 40, color: ink, weight: 700 })
    sc += text('Mechanic has arrived!', x + pw / 2, py + 168, {
      size: 33,
      color: teal,
      weight: 900,
      anchor: 'middle',
      family: 'Fraunces, Georgia, serif',
    })
    sc += text('Your mechanic is at your location and', x + pw / 2, py + 202, { size: 17, color: dim, anchor: 'middle' })
    sc += text('ready to begin the inspection.', x + pw / 2, py + 226, { size: 17, color: dim, anchor: 'middle' })
    // The card overlaps the figure's legs, exactly as the real screen does.
    sc += mechanicFigure(rand, x + pw / 2, py + 300, 0.86, '#E0A87E', '#2E6F86')

    const cy = py + 366
    sc += card(rand, x + 14, cy, pw - 28, ph - (cy - py) - 14, { fill: '#FFFFFF', rx: 26, grain: 0.04 })
    sc += blob(rand, x + 62, cy + 52, 24, { color: '#2E6F86', opacity: 1, strokes: 3 })
    sc += text('Rajat Sarma', x + 98, cy + 46, { size: 21, color: ink, weight: 600 })
    sc += text('• Arrived', x + 232, cy + 46, { size: 16, color: teal })
    sc += text('Hyundai i10 · DL 9C XXXX', x + 98, cy + 70, { size: 15, color: dim })
    sc += text('4.0 ★', x + 98, cy + 94, { size: 15, color: '#C7912A' })
    sc += blob(rand, x + 340, cy + 52, 20, { color: teal, opacity: 1, strokes: 2 })
    sc += brush(rand, x + 60, cy + 122, x + pw - 60, cy + 122, { color: dim, width: 2, opacity: 0.28, bow: 0.006 })
    sc += brush(rand, x + 60, cy + 156, x + 60, cy + 292, { color: dim, width: 2, opacity: 0.35, bow: 0.004 })
    sc += timelineRow(rand, x + 44, cy + 158, pw - 110, 'Reached', ink, dim, teal, true)
    sc += timelineRow(rand, x + 44, cy + 228, pw - 110, 'Inspection', ink, dim, teal, false)
    sc += timelineRow(rand, x + 44, cy + 296, pw - 110, 'Repair', dim, dim, dim, false)
    sc += card(rand, x + 44, cy + 344, pw - 88, 62, { fill: '#FFFFFF', rx: 31, grain: 0.05, edge: teal, edgeWidth: 3 })
    sc += text('Proceed with Diagnosis', x + pw / 2, cy + 384, { size: 22, color: teal, weight: 600, anchor: 'middle' })
    s += phone(rand, x, py, pw, ph, sc)
  }

  /* Screen 3 — the same moment, inverted. */
  {
    const x = xs[2]
    let sc = ''
    sc += paint(rand, x, py, pw, ph, {
      color: teal,
      tones: [deep, teal, shade(teal, 0.18)],
      angle: -0.3,
      density: 0.05,
      width: [14, 34],
      opacity: [0.18, 0.42],
    })
    sc += statusBar(rand, x, py, pw, paper)
    sc += text('‹', x + 26, py + 96, { size: 40, color: paper, weight: 700 })
    sc += text('Mechanic has arrived!', x + pw / 2, py + 168, {
      size: 33,
      color: paper,
      weight: 900,
      anchor: 'middle',
      family: 'Fraunces, Georgia, serif',
    })
    sc += text('Your mechanic is at your location and', x + pw / 2, py + 202, { size: 17, color: '#BFD8D5', anchor: 'middle' })
    sc += text('ready to begin the inspection.', x + pw / 2, py + 226, { size: 17, color: '#BFD8D5', anchor: 'middle' })

    // A pickup behind the figure, painted flat like the illustration it is.
    sc += `<path d="M${x + 32} ${py + 372} l 0 -66 l 108 0 l 34 -48 l 96 0 l 0 114 Z" fill="${shade(teal, 0.14)}"/>`
    sc += blob(rand, x + 96, py + 378, 25, { color: deep, opacity: 1, strokes: 2 })
    sc += blob(rand, x + 228, py + 378, 25, { color: deep, opacity: 1, strokes: 2 })
    sc += mechanicFigure(rand, x + pw / 2 + 40, py + 292, 0.82, '#E0A87E', '#2E6F86', '#7A5AB8')

    const cy = py + 366
    sc += card(rand, x + 14, cy, pw - 28, ph - (cy - py) - 14, { fill: '#E4EEEC', rx: 26, grain: 0.045 })
    sc += blob(rand, x + 62, cy + 52, 24, { color: '#2E6F86', opacity: 1, strokes: 3 })
    sc += text('Rajat Sarma', x + 98, cy + 46, { size: 21, color: ink, weight: 600 })
    sc += text('• Arrived', x + 232, cy + 46, { size: 16, color: teal })
    sc += text('Hyundai i10 · DL 9C XXXX', x + 98, cy + 70, { size: 15, color: dim })
    sc += text('4.0 ★', x + 98, cy + 94, { size: 15, color: '#C7912A' })
    sc += blob(rand, x + 340, cy + 52, 20, { color: teal, opacity: 1, strokes: 2 })
    sc += brush(rand, x + 60, cy + 122, x + pw - 60, cy + 122, { color: dim, width: 2, opacity: 0.28, bow: 0.006 })
    sc += brush(rand, x + 60, cy + 156, x + 60, cy + 292, { color: dim, width: 2, opacity: 0.35, bow: 0.004 })
    sc += timelineRow(rand, x + 44, cy + 158, pw - 110, 'Reached', ink, dim, teal, true)
    sc += timelineRow(rand, x + 44, cy + 228, pw - 110, 'Inspection', ink, dim, teal, false)
    sc += timelineRow(rand, x + 44, cy + 296, pw - 110, 'Repair', dim, dim, dim, false)
    sc += card(rand, x + 44, cy + 344, pw - 88, 62, { fill: paper, rx: 31, grain: 0.05 })
    sc += text('Proceed with Diagnosis', x + pw / 2, cy + 384, { size: 22, color: ink, weight: 600, anchor: 'middle' })
    s += phone(rand, x, py, pw, ph, sc)
  }

  return document_(s, {
    alt: 'Three phone screens for an on-demand mechanic app on a teal ground: a live map tracking the mechanic to your location with a call button, and two versions of the arrival screen showing the mechanic, a job timeline of Reached, Inspection and Repair, and a button to proceed with diagnosis.',
    roughness: 4,
    seed: 31,
    tooth: 0.08,
  })
}

/* ── Weather ────────────────────────────────────────────────────────────── */

export function weather() {
  const rand = seeded('weather')
  const top = '#2E5E8E'
  const bottom = '#8FB4CE'
  const paper = '#F5EFE6'
  let s = ''

  s += paint(rand, 0, 0, W, H, {
    color: top,
    tones: [shade(top, -0.3), top, mix(top, bottom, 0.5), bottom],
    angle: 1.5,
    density: 0.055,
    width: [18, 52],
    opacity: [0.22, 0.5],
  })
  s += blob(rand, 1240, 220, 116, { color: '#F5D97B', opacity: 0.9, strokes: 8 })
  s += blob(rand, 1240, 220, 190, { color: '#F5D97B', opacity: 0.14, strokes: 0 })

  const pw = 470
  const ph = 830
  const px = 180
  const py = 86
  let sc = ''
  sc += paint(rand, px, py, pw, ph, {
    color: top,
    tones: [shade(top, -0.25), top, mix(top, bottom, 0.6)],
    angle: 1.5,
    density: 0.05,
    width: [14, 40],
    opacity: [0.2, 0.44],
  })
  sc += statusBar(rand, px, py, pw, paper)
  sc += text('Jorhat, Assam', px + pw / 2, py + 120, { size: 30, color: paper, anchor: 'middle', opacity: 0.9 })
  sc += text('27°', px + pw / 2, py + 262, { size: 148, color: paper, weight: 900, anchor: 'middle', family: 'Fraunces, Georgia, serif' })
  sc += text('Light rain · feels like 29°', px + pw / 2, py + 306, { size: 22, color: paper, anchor: 'middle', opacity: 0.75 })

  // The hourly strip, which is the question people actually came with.
  sc += card(rand, px + 30, py + 350, pw - 60, 180, { fill: shade(top, -0.2), rx: 22, grain: 0.05 })
  const hours = ['now', '14', '15', '16', '17']
  hours.forEach((h, i) => {
    const hx = px + 62 + i * 78
    sc += text(h, hx, py + 392, { size: 17, color: paper, anchor: 'middle', opacity: 0.7 })
    sc += blob(rand, hx, py + 434, 17, { color: i < 2 ? '#F5D97B' : '#D6E2EC', opacity: 0.95, strokes: 2 })
    sc += text(`${27 - i}°`, hx, py + 496, { size: 22, color: paper, anchor: 'middle' })
  })

  // Seven days, as a chart rather than a list.
  sc += card(rand, px + 30, py + 552, pw - 60, 246, { fill: shade(top, -0.2), rx: 22, grain: 0.05 })
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  days.forEach((d, i) => {
    const dy = py + 596 + i * 44
    sc += text(d, px + 62, dy, { size: 19, color: paper, opacity: 0.85 })
    const lo = 20 + ((i * 5) % 4)
    const hi = 28 + ((i * 3) % 4)
    sc += brush(rand, px + 170, dy - 6, px + 170 + (hi - lo) * 22, dy - 6, {
      color: '#F5D97B',
      width: 9,
      opacity: 0.9,
      bow: 0.01,
    })
    sc += text(`${hi}°`, px + pw - 62, dy, { size: 19, color: paper, anchor: 'end' })
  })
  s += phone(rand, px, py, pw, ph, sc)

  s += text('Weather', 800, 300, { size: 82, color: paper, weight: 900, family: 'Fraunces, Georgia, serif', opacity: 0.95 })
  s += text('Built around the forecast,', 806, 366, { size: 30, color: paper, opacity: 0.7, italic: true })
  s += text('not the thermometer.', 806, 406, { size: 30, color: paper, opacity: 0.7, italic: true })

  return document_(s, {
    alt: 'A mobile weather app interface: a large 27 degrees over Jorhat, Assam, an hourly strip along the middle, and a five-day forecast shown as temperature bars rather than a list.',
    roughness: 5,
    seed: 61,
  })
}

export const WORKS = {
  outplayed,
  fraemerate,
  'google-portfolio': googlePortfolio,
  mechanic,
  weather,
}
