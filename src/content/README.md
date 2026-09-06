# Content

Edit these files, not the components. Every string a visitor reads lives here.

**The rule for this portfolio: facts and labels only.** No invented voice, no
philosophy, no metaphor. If a line does not state something true about you or
your work, or label something on screen, cut it. Several fields are optional and
render nothing when empty (`intro`, `lede`, `aside`, `footer`) - leaving them
blank is a valid answer.

| File | Room | What it wants |
| --- | --- | --- |
| `site.json` | Threshold | Name, role, one short line |
| `bio.json` | Nuenen | Who, where, what. Two short paragraphs at most |
| `skills.json` | Paris | Tool names. Nothing else - the reveal is the content |
| `projects.json` | Arles | Per work: title, medium, year, role, `summary`, `description` |
| `process.json` | Saint-Remy | Three one-line statements on how you work |
| `contact.json` | Auvers | Email, links, optional form endpoint |

In `projects.json`, `summary` is the single line on the museum plaque and
`description` is the two or three sentences inside the case study. There is no
`outcome` field: do not claim a result you cannot back.

## Project images

`projects.json` points `image` at a path under `public/`. Placeholder painted
"canvases" are generated into `public/works/` by `npm run textures`, which never
overwrites a file that already exists. Drop real screenshots in at the same
paths (1600x1000 or thereabouts) and update the `alt` text - it is read aloud in
place of the image, so describe what the work *is*, not that it is a screenshot.

## The contact form

`email` is already set. With `formAction` empty the guestbook validates the
message, composes the letter, and opens the visitor's mail app - no backend
needed. If that silently fails (plenty of browsers have no mail handler) it
shows the letter with an "Open in Gmail" link, a copy button and the plain
address, so the message is never lost.

To have messages land in the inbox without the visitor needing a mail app, put a
form endpoint in `formAction`:

- `https://formsubmit.co/ikoyalborbora@gmail.com` - no signup; the first
  submission sends a one-time confirmation link to that address
- `https://formspree.io/f/YOUR-ID` - free account, gives you a form ID
- `https://api.web3forms.com/submit` - free access key, added as a hidden field

The same form posts to whichever you choose, and falls back to the letter
handoff if the request fails. A honeypot field catches bots: anything that fills
it is reported as sent and dropped.

## The visitor counter

The `visitors` block in `contact.json` controls the line in the colophon. Set
`enabled` to false to remove it entirely. It counts unique browsers, not unique
people, and stores nothing about anyone - the wording in `note` says so, so keep
it honest if you reword it. The namespace lives in `src/lib/visitors.js`; change
it if you fork the site.
