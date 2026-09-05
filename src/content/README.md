# Content

Edit these files, not the components. Every string the visitor reads lives here.

| File | Room | What to fill in |
| --- | --- | --- |
| `site.json` | Threshold | Your name, role, an 8-word tagline |
| `bio.json` | Nuenen | Your origin story, 2-4 honest paragraphs |
| `skills.json` | Paris | 6-10 tools, each with a one-line note |
| `projects.json` | Arles | 4-8 works: title, medium (tech stack), year, curator's note, image |
| `process.json` | Saint-Remy | 3-5 movements on *how* you work, not *what* you built |
| `contact.json` | Auvers | Email, links, and a form endpoint if you want a live form |

Every file carries an `_edit` key describing what that room expects. The key is
ignored by the app - it exists so this file and the data never drift apart.

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
