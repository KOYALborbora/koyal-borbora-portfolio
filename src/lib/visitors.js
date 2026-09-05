/**
 * The admissions counter.
 *
 * Counts how many people have walked through the building, without a login, a
 * cookie banner, or anything personal leaving the browser. The whole mechanism
 * is one flag in localStorage and one request:
 *
 *   first ever visit  →  /hit/  — increments the tally, returns the new total
 *   every visit after →  /get/  — reads the tally, changes nothing
 *
 * So the number is unique *browsers*, not unique humans. Someone who clears
 * their storage, opens a private window, or arrives on a different device is
 * counted again; someone who visits fifty times from one browser is counted
 * once. That is the honest ceiling of a tracker that stores nothing about
 * anybody, and it is the right trade for a portfolio.
 *
 * The backing service (Abacus) holds a single integer against a namespace and
 * key. No account, no API key, no request body — there is nothing it could
 * learn about a visitor beyond the fact that a request happened.
 */

const BASE = 'https://abacus.jasoncameron.dev'

/** Change this if you fork the site, or the two of you will share a tally. */
const NAMESPACE = 'koyal-borbora-vincent'
const KEY = 'visits'

const STORAGE_KEY = 'vincent:counted'

/** One request per page load, whatever React does with effects. */
let inFlight = null

const hasVisitedBefore = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null
  } catch {
    // Storage refused (private mode, blocked cookies). Treat the visitor as
    // returning rather than new — over-counting is worse than under-counting.
    return true
  }
}

const rememberVisit = () => {
  try {
    window.localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    /* nothing to do — the count simply will not be exact for this visitor */
  }
}

/**
 * Returns the running total, or null if the count could not be reached — which
 * happens routinely behind ad blockers and on flaky connections, and is not
 * worth showing the visitor an error about.
 */
export function countVisit() {
  if (inFlight) return inFlight

  const returning = hasVisitedBefore()
  const url = `${BASE}/${returning ? 'get' : 'hit'}/${NAMESPACE}/${KEY}`

  inFlight = fetch(url, {
    method: 'GET',
    // Nothing is sent that could identify anyone, and nothing needs to come
    // back but a number.
    cache: 'no-store',
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
  })
    .then((response) => {
      if (!response.ok) throw new Error(String(response.status))
      return response.json()
    })
    .then((data) => {
      const value = Number(data?.value)
      if (!Number.isFinite(value)) throw new Error('unreadable')
      if (!returning) rememberVisit()
      return value
    })
    .catch(() => null)

  return inFlight
}
