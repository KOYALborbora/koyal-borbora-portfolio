/**
 * The exhibition floor plan. Single source of truth for room order, palette
 * tokens, scroll axis and the ARIA/room-directory labels.
 *
 * Every room's palette is also emitted as CSS custom properties by
 * `src/styles/tokens.css` under `[data-room="<id>"]`. Keep the two in sync —
 * JS reads these values for the WebGL layer and the brush cursor, CSS reads
 * the tokens file for everything painted by the DOM.
 */

export const ROOMS = [
  {
    id: 'threshold',
    index: 0,
    title: 'Threshold',
    period: 'Self-Portraits, 1886–89',
    section: 'Landing',
    axis: 'vertical',
    mood: 'Quiet, dark, a single subject staring back',
    // Scroll length of the room, in viewport heights. This sets the section's
    // minimum height; the two pinned corridors size themselves and take the
    // value only as a floor.
    length: 1,
    palette: {
      bg: '#14110F',
      accent: '#E8B923',
      secondary: '#3C6E71',
      text: '#F5EFE6',
    },
  },
  {
    id: 'nuenen',
    index: 1,
    title: 'Nuenen',
    period: 'The Potato Eaters era, 1883–85',
    section: 'Origin',
    axis: 'vertical',
    mood: 'Earthy, dim, humble beginnings',
    length: 1.25,
    palette: {
      bg: '#241C14',
      accent: '#6B4A2F',
      secondary: '#556B4E',
      text: '#D8CFC0',
    },
  },
  {
    id: 'paris',
    index: 2,
    title: 'Paris',
    period: 'Pointillist & Impressionist period, 1886–88',
    section: 'Toolkit',
    axis: 'horizontal',
    mood: 'Lightening palette, fragmenting brushstroke, discovery',
    length: 3.2,
    palette: {
      bg: '#F2E9DC',
      accent: '#C98A8A',
      secondary: '#7FA8C9',
      text: '#2A241E',
    },
  },
  {
    id: 'arles',
    index: 3,
    title: 'Arles',
    period: 'Sunflowers, The Bedroom, The Yellow House, 1888–89',
    section: 'Selected Work',
    axis: 'horizontal',
    mood: 'Saturated chrome yellow and cobalt, prolific, confident',
    length: 4,
    palette: {
      bg: '#F4C10F',
      accent: '#1C3F73',
      secondary: '#8C5A2B',
      text: '#1A1204',
    },
  },
  {
    id: 'saint-remy',
    index: 4,
    title: 'Saint-Rémy',
    period: 'The Starry Night, cypresses, 1889–90',
    section: 'Process',
    axis: 'vertical',
    mood: 'Swirling, immersive, the emotional peak',
    // Sized to its content plus a short hold on the empty sky at the end. Much
    // more than that and the peak of the building becomes dead scroll.
    length: 2.0,
    palette: {
      bg: '#12294B',
      accent: '#F5D97B',
      secondary: '#3E7CA6',
      text: '#F5EFE6',
    },
  },
  {
    id: 'auvers',
    index: 5,
    title: 'Auvers',
    period: 'Almond Blossom, the final months, 1890',
    section: 'Let’s Connect',
    axis: 'vertical',
    mood: 'Turbulent sky giving way to blossom — hope, not an ending',
    length: 1.9,
    palette: {
      // Auvers is the one room that transitions mid-scene. `bg`/`accent` are
      // the turbulent opening state; `bgCalm`/`accentCalm` are what "Calm the
      // Sky" resolves into. `text` is chosen per state — bone on the storm,
      // crow-black on the blossom, because bone-on-blossom-blue fails contrast.
      bg: '#D9A441',
      accent: '#17140F',
      secondary: '#8C5A2B',
      text: '#F5EFE6',
      bgCalm: '#A9D6E5',
      accentCalm: '#3C6E71',
      textCalm: '#17140F',
    },
  },
]

export const ROOM_IDS = ROOMS.map((r) => r.id)

export const ROOM_BY_ID = Object.fromEntries(ROOMS.map((r) => [r.id, r]))

