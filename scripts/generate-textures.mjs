#!/usr/bin/env node
/**
 * Paints one picture per project into `public/works/`, plus the favicon.
 *
 * The compositions live in `works.mjs` and the brushes in `artwork.mjs`. Each
 * painting shows the actual design — the real mark, the real screens — brushed
 * so it hangs alongside everything else in the building.
 *
 * Deterministic: the same project always paints the same picture, so a rebuild
 * produces byte-identical files and git stays quiet. Delete a file to have it
 * repainted, or drop a real export in at the same path and this will leave it
 * alone for ever.
 *
 * Runs automatically before `npm run dev` and `npm run build`.
 */

import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import { constants } from 'node:fs'
import { dirname, join, basename, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { WORKS } from './works.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const worksDir = join(root, 'public', 'works')
const publicDir = join(root, 'public')

const exists = async (path) =>
  access(path, constants.F_OK).then(
    () => true,
    () => false
  )

const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#12294B"/>
  <circle cx="44" cy="20" r="7" fill="#F5D97B"/>
  <path d="M4 46c8-14 20-14 28 0s20 14 28 0" stroke="#3E7CA6" stroke-width="7" fill="none" stroke-linecap="round"/>
  <path d="M14 64c0-16 3-26 6-26s6 10 6 26z" fill="#0A1526"/>
</svg>
`

async function main() {
  await mkdir(worksDir, { recursive: true })

  const projects = JSON.parse(await readFile(join(root, 'src/content/projects.json'), 'utf8'))

  let painted = 0
  let kept = 0
  const missing = []

  for (const work of projects.works) {
    // Only paint the files this script owns; anything pointed elsewhere is
    // somebody's real export and none of our business.
    if (!work.image?.startsWith('/works/')) continue
    const name = work.image.slice('/works/'.length)
    const target = join(worksDir, name)

    if (await exists(target)) {
      kept++
      continue
    }

    const key = basename(name, extname(name))
    const compose = WORKS[key]
    if (!compose) {
      missing.push(key)
      continue
    }

    await writeFile(target, compose(), 'utf8')
    painted++
  }

  const favicon = join(publicDir, 'favicon.svg')
  if (!(await exists(favicon))) {
    await writeFile(favicon, FAVICON, 'utf8')
    painted++
  }

  console.log(
    `[vincent] artwork: ${painted} painted, ${kept} left alone (delete a file to repaint it).`
  )
  if (missing.length) {
    console.warn(
      `[vincent] no composition for: ${missing.join(', ')} — add one in scripts/works.mjs, or point that project's "image" at a real export.`
    )
  }
}

main().catch((error) => {
  console.error('[vincent] artwork generation failed:', error)
  process.exit(1)
})
