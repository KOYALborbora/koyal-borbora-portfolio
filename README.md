# VINCENT

An interactive portfolio staged as a walk through a Van Gogh retrospective. Six
rooms on one continuous scroll, each mapped to a period of his life and a
section of yours: the dark of Nuenen for where you started, the Paris studies
for your toolkit, the Arles corridor for your work, the Saint-Rémy sky for how
you think, and Auvers — almond blossom, not an ending — for how to reach you.

Built from `van-gogh-portfolio-brief.md`.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # -> dist/
npm run preview
```

Node 18+. `predev` / `prebuild` generate the placeholder assets automatically.

## Fill in your content first

**Every word a visitor reads lives in `src/content/*.json`.** Nothing is
hard-coded in a component. Start there:

| File | Room | What it wants |
| --- | --- | --- |
| `site.json` | Threshold | Your name, role, a tagline under eight words |
| `bio.json` | Nuenen | Where you started, 2–4 honest paragraphs |
| `skills.json` | Paris | 6–10 tools, each with a one-line note |
| `projects.json` | Arles | 4–8 works: title, medium, year, curator's note, image |
| `process.json` | Saint-Rémy | 3–5 movements on *how* you work |
| `contact.json` | Auvers | Email (already yours), links, optional form endpoint |

Your name, projects, tools and links are already in — pulled from your Behance
profile (titles, tools, years and links are yours; the descriptions and the
first-person notes are drafts, because Behance carries no written descriptions).
`bio.json` and `process.json` are marked DRAFT at the top: those two rooms speak
in your voice, and right now the voice is mine. Rewrite them before this is
public. `src/content/README.md` says what each file expects.

**Project artwork.** Each project in the gallery is a painting *of that
project* — the Fraemerate mark, the Google-search-page portfolio, the three
mechanic screens — composed in `scripts/works.mjs` and brushed by the tools in
`scripts/artwork.mjs`. The rule that keeps them legible: every shape is laid in
as a flat mass first and brushed over at partial opacity. Strokes alone read as
mush; strokes over a solid base read as paint.

`npm run textures` repaints them, deterministically, and **never overwrites a
file that already exists** — so dropping a real export into `public/works/` at
the same filename replaces the painting for good. Rewrite that project's `alt`
to match if you do.

**Contact form.** Wired to `ikoyalborbora@gmail.com` and working now, with no
backend: the guestbook validates, composes the letter, and opens the visitor's
mail app. Because `mailto:` fails silently for anyone whose browser has no mail
handler, it also shows the composed letter with an *Open in Gmail* link, a copy
button (which falls back to selecting the text if the clipboard is refused), and
the plain address. Nobody writes a message here and loses it.

To have messages arrive in the inbox without the visitor needing a mail app at
all, paste a form endpoint into `formAction` in `src/content/contact.json` — the
same form posts there instead, and falls back to the letter handoff if the
request fails. Free options that need no server of your own:

| Service | Setup | `formAction` |
| --- | --- | --- |
| FormSubmit | none — confirm once by email on first submit | `https://formsubmit.co/ikoyalborbora@gmail.com` |
| Formspree | free account, gives you a form ID | `https://formspree.io/f/YOUR-ID` |
| Web3Forms | free access key tied to your address | `https://api.web3forms.com/submit` (add the key as a hidden field) |

The form also carries a honeypot field: anything that fills it is reported as
sent and quietly dropped.

## Counting visitors

The colophon tells each visitor their number, the way an admissions desk would.
It is a single integer held against a namespace on a free counter service — no
account, no API key, no request body, nothing that could identify anyone.

The first visit from a browser increments the tally; every visit after it only
reads. So the number is unique **browsers**, not unique humans: clearing storage,
a private window, or a second device all count again, and fifty visits from one
browser count once. That is the honest ceiling of a counter that stores nothing
about anybody. If it cannot be reached — an ad blocker, a dead connection — the
line simply does not render.

Turn it off, relabel it, or move it to your own namespace in the `visitors` block
of `src/content/contact.json` and the constants at the top of
`src/lib/visitors.js`. **Change the namespace if you ever fork this site**, or the
two copies share one tally.

## The six rooms

| # | Room | Section | How it moves | Signature moment |
| --- | --- | --- | --- | --- |
| 0 | Threshold | Landing | vertical | Wet-paint name, a portrait that watches, a drip you pull |
| 1 | Nuenen | Origin | vertical | A café terrace that paints itself as you read, then fills up |
| 2 | Paris | Toolkit | pinned, horizontal | Skill names resolving out of a scatter of dots |
| 3 | Arles | Selected work | pinned, horizontal | Framed work on a picture rail; frames lift to open |
| 4 | Saint-Rémy | Process | vertical | The swirling sky, and stars you light yourself |
| 5 | Auvers | Contact | vertical | A storm you calm into almond blossom |

The two horizontal rooms never ask anyone to scroll sideways: they pin to the
viewport and translate the rail as you keep scrolling down.

## Making the interactions legible

Replacing the pointer with a brush means giving up every hover state the browser
would have drawn for free, so the site has to pay that back:

- **The brush answers what is under it.** Over anything that responds to a
  click it opens into a ring and the paint brightens. One signal, everywhere,
  bound at the document level so anything added later is covered.
- **One invitation, reused.** Rooms that want something from the visitor use
  the same marker — a painted target that pulses and a sentence in the
  imperative (`components/Invitation.jsx`). It retires itself once taken, and
  the button beside it changes its own label to match.
- **Frames say what they do.** A painting on a wall has no natural signal that
  it opens, so each one states it: *Lift it off the wall*, on hover and focus,
  and permanently on touch where there is no hover.

## How it is built

React 18 + Vite. Three.js through `@react-three/fiber` for the two sky rooms,
GSAP ScrollTrigger for the pinned corridors, Lenis for smoothing, zustand for
discrete state. Type is Fraunces and Literata, and nothing else.

**One canvas for the whole visit.** `scenes/StageCanvas.jsx` mounts a single
`<Canvas>` that is never remounted; scenes fade in and out by weight as you
move through the building. That continuity is what stops six rooms feeling like
six pages.

**Both skies are screen-space shaders**, not particle systems — one draw call
each, and a click at (x, y) on the page is a point at (x, y) in the paint, which
is what makes lighting a star and calming a storm straightforward to aim.

**Two state stores, split by update frequency.** Per-frame values live in a
plain mutable object read inside `useFrame`; anything that changes on a human
timescale lives in zustand. Mixing the two is the fastest way to make a site
like this stutter.

`ARCHITECTURE.md` is the full contract — read it before changing the shell.

```
src/
├── rooms/          one component + one stylesheet per room
├── scenes/         the persistent canvas and its three scene modules
├── shaders/        GLSL, imported as strings with Vite's ?raw
├── interactions/   brush cursor, paint drip, pointillist reveal, stars, calm
├── components/     room shell, floor plan, plaques, case study, guestbook
├── content/        every visitor-facing string — edit these
├── state/          scrollState (per frame) + useStore (discrete)
├── lib/            floor plan, scroll engine
└── styles/         tokens.css, global.css
```

## Accessibility and performance

- **Simple mode**, visible from the first frame, strips every shader, the
  scroll-jacking and the brush cursor. Same rooms, same words. Persisted.
- **`prefers-reduced-motion`** does the same automatically, and is watched live
  — people turn it on mid-visit, usually because a site like this one just made
  them queasy.
- Both modes **resolve Auvers immediately** rather than withholding the ending
  from anyone who asked for less motion.
- Every drag has a keyboard equivalent. The floor plan reaches any room without
  a gesture, and appears the moment it is tabbed into.
- Rooms announce themselves to a polite live region as you pass through them.
- Every painting-styled visual carries alt text from the content JSON.
- The two skies are the only WebGL in the site, and three.js is a lazy chunk —
  simple mode never downloads it. Scenes mount only within one room of the
  visitor, and each room is sized to its content plus a deliberate hold, so
  there is no dead scroll anywhere.

### On a phone

Mobile is not the desktop build shrunk. It is a different set of decisions:

- **Both corridors stack** below 900px, which also covers tablets in portrait.
  A pinned horizontal corridor costs a screenful of scroll per item and fights
  the browser's own address-bar collapse.
- **The shaders compile a cheaper variant** — two fewer noise octaves and no
  per-fragment height gradient — and the canvas renders at 1× rather than the
  device ratio. Together that roughly halves the fragment cost.
- **The brush cursor is absent**, not idle: a full-viewport canvas that never
  draws is still a layer the phone has to composite.
- **Every tap target is at least 44px.** The paint drip shows an 18px bead and
  offers a 44px button around it.
- **No gesture is stolen.** The Auvers press-and-hold field is desktop-only,
  because a full-viewport `touch-action: none` meant a visitor could not scroll
  out of the room by dragging over the sky; on touch the button does the same
  job. The drip uses `pan-y` for the same reason.
- Form fields are 16px+, so iOS does not zoom the page on focus.

Verified in Chrome at 375, 393, 768 and 1440px: no console errors, no horizontal
overflow at any width, every interactive target ≥44px on coarse pointers, and
simple mode / reduced motion both mount zero WebGL.

## A note on the paintings

Van Gogh died in 1890, so his work is in the public domain — but **no painting
images are reproduced here**. Every surface is generated: the skies are noise
fields, the portrait is a set of brush-shaped paths, the café terrace is drawn
stroke by stroke, and the palettes are directions taken from his periods rather
than swatches lifted from anyone's photograph. If you do want real painting
images, source them from Wikimedia Commons or a museum's open-access programme;
museum photography can carry its own terms even when the artwork does not.

## Deploying

Static output. `npm run build`, publish `dist/`. Vercel and Netlify both work
with zero configuration — build `npm run build`, output `dist`.
