import { useRef, useState } from 'react'
import { getLenis } from '../lib/scrollEngine.js'
import { useStore } from '../state/useStore.js'
import copy from '../content/contact.json'

const labels = copy.formLabels
const errorText = copy.formErrors
const handoff = copy.mailtoHandoff

/** Deliberately loose. The only thing worth rejecting here is an obvious typo. */
const looksLikeEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())

function validate(data) {
  const errors = {}
  if (!data.name.trim()) errors.name = errorText.name
  if (!looksLikeEmail(data.email)) errors.email = errorText.email
  if (data.message.trim().length < 4) errors.message = errorText.message
  return errors
}

/** The letter itself, used by every route out of this form. */
function compose(data) {
  const subject = `${copy.subjectPrefix} ${data.name.trim() || 'a visitor'}`
  const body = `${data.message.trim()}\n\n— ${data.name.trim()}\n${data.email.trim()}`
  return { subject, body }
}

/**
 * The guestbook.
 *
 * A museum leaves a book by the door, so this is a book by the door rather than
 * a "get in touch" card.
 *
 * Two delivery routes, chosen by whether `contact.json` carries a `formAction`:
 * post to that endpoint, or — with no backend at all — hand the visitor a
 * pre-addressed letter. The second is the default, because a portfolio should
 * not need a server to be reachable.
 *
 * The catch with the second route is that `mailto:` fails silently for anyone
 * whose browser has no mail app registered, and the visitor is left staring at
 * a form that appears to have eaten their message. So the handoff is explicit:
 * the letter is composed, the mail app is offered, and the same text is also
 * available as a Gmail compose link and as something they can copy. Nobody
 * writes a message here and loses it.
 */
export default function Guestbook() {
  const [status, setStatus] = useState('idle')
  const [errors, setErrors] = useState({})
  const [letter, setLetter] = useState(null)
  const [copied, setCopied] = useState('idle')
  const formRef = useRef(null)
  const handoffRef = useRef(null)
  const letterRef = useRef(null)
  const announce = useStore((s) => s.announce)

  const readForm = () => {
    const raw = Object.fromEntries(new FormData(formRef.current).entries())
    return {
      name: String(raw.name ?? ''),
      email: String(raw.email ?? ''),
      message: String(raw.message ?? ''),
      trap: String(raw._trap ?? ''),
    }
  }

  const focusFirstError = (found) => {
    const first = ['name', 'email', 'message'].find((key) => found[key])
    if (first) formRef.current?.elements[first]?.focus()
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    const data = readForm()

    // Anything that fills the honeypot is a bot. Report success and drop it —
    // telling a scraper it was caught only teaches it to try again.
    if (data.trap) {
      setStatus('sent')
      return
    }

    const found = validate(data)
    setErrors(found)
    if (Object.keys(found).length) {
      focusFirstError(found)
      announce('The guestbook needs a little more before it can be signed.')
      return
    }

    if (copy.formAction) {
      setStatus('sending')
      try {
        const response = await fetch(copy.formAction, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(formRef.current),
        })
        if (!response.ok) throw new Error(String(response.status))
        formRef.current.reset()
        setStatus('sent')
        announce(labels.sent)
      } catch {
        // Falling back rather than dead-ending: the letter is already written,
        // so hand over the other routes instead of losing it.
        setLetter({ ...compose(data), data })
        setStatus('error')
        announce(labels.error)
      }
      return
    }

    const composed = { ...compose(data), data }
    setLetter(composed)
    setStatus('mail')
    setCopied('idle')
    announce(handoff.heading)

    const mailto = `mailto:${copy.email}?subject=${encodeURIComponent(
      composed.subject
    )}&body=${encodeURIComponent(composed.body)}`
    // `location.assign` rather than a new tab: a mail handler is not a page, and
    // a popup blocker should not be able to swallow it.
    window.location.assign(mailto)

    // Move focus to the handoff so a keyboard visitor is not left at a button
    // whose meaning just changed underneath them, and bring it into view —
    // it renders below the submit button, which on a tall guestbook can be off
    // the bottom of the screen. Routed through Lenis where Lenis is running,
    // because a native scroll and a smooth-scroll engine will argue otherwise.
    window.setTimeout(() => {
      const node = handoffRef.current
      if (!node) return
      node.focus({ preventScroll: true })
      const lenis = getLenis()
      if (lenis) lenis.scrollTo(node, { offset: -140, duration: 0.8 })
      else node.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 60)
  }

  const gmailHref = letter
    ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
        copy.email
      )}&su=${encodeURIComponent(letter.subject)}&body=${encodeURIComponent(letter.body)}`
    : '#'

  const onCopy = async () => {
    if (!letter) return
    try {
      await navigator.clipboard.writeText(`${letter.subject}\n\n${letter.body}`)
      setCopied('done')
      announce(handoff.copied)
      return
    } catch {
      // The clipboard API is refused in plenty of ordinary situations — an
      // unfocused document, an insecure origin, a browser locked down by
      // policy. Fall through and select the letter instead, so the visitor's
      // own copy shortcut still works.
      setCopied('failed')
      announce(handoff.copyFailed)
    }

    const node = letterRef.current
    const selection = window.getSelection?.()
    if (!node || !selection) return
    const range = document.createRange()
    range.selectNodeContents(node)
    selection.removeAllRanges()
    selection.addRange(range)
    node.focus?.()
  }

  const fieldProps = (key) => ({
    id: `guest-${key}`,
    name: key,
    'aria-invalid': errors[key] ? 'true' : undefined,
    'aria-describedby': errors[key] ? `guest-${key}-error` : undefined,
    onChange: () =>
      setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev)),
  })

  const Error = ({ name }) =>
    errors[name] ? (
      <p className="auvers__error" id={`guest-${name}-error`}>
        {errors[name]}
      </p>
    ) : null

  return (
    <div className="auvers__guestbook">
      <form ref={formRef} className="auvers__form" onSubmit={onSubmit} noValidate>
        <div className="auvers__field">
          <label htmlFor="guest-name">{labels.name}</label>
          <input type="text" autoComplete="name" {...fieldProps('name')} />
          <Error name="name" />
        </div>

        <div className="auvers__field">
          <label htmlFor="guest-email">{labels.email}</label>
          <input type="email" autoComplete="email" {...fieldProps('email')} />
          <Error name="email" />
        </div>

        <div className="auvers__field">
          <label htmlFor="guest-message">{labels.message}</label>
          <textarea rows={4} {...fieldProps('message')} />
          <Error name="message" />
        </div>

        {/* Honeypot. Hidden from sight and from screen readers, and skipped in
            the tab order — only something filling in every field will touch it. */}
        <div className="auvers__trap" aria-hidden="true">
          <label htmlFor="guest-trap">Leave this empty</label>
          <input id="guest-trap" name="_trap" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="auvers__submit">
          <button type="submit" className="btn" disabled={status === 'sending'}>
            {status === 'sending' ? labels.sending : labels.submit}
          </button>

          {status === 'sent' && <p className="auvers__status">{labels.sent}</p>}
        </div>
      </form>

      {/* The handoff. Shown when the letter is written but delivery is now in
          the visitor's hands — either because there is no backend, or because
          the backend just failed. */}
      {(status === 'mail' || status === 'error') && letter && (
        <div className="auvers__handoff" role="group" aria-labelledby="guest-handoff-heading">
          <h4 className="auvers__handoff-heading" id="guest-handoff-heading" ref={handoffRef} tabIndex={-1}>
            {status === 'error' ? labels.error : handoff.heading}
          </h4>
          <p className="auvers__handoff-body">{handoff.body}</p>

          <pre className="auvers__letter" ref={letterRef} tabIndex={0}>
            {letter.body}
          </pre>

          <div className="auvers__handoff-actions">
            <a className="btn" href={gmailHref} target="_blank" rel="noreferrer noopener">
              {handoff.gmail}
              <span className="visually-hidden"> (opens in a new tab)</span>
            </a>
            <button type="button" className="btn btn--ghost" onClick={onCopy}>
              {copied === 'done' ? handoff.copied : handoff.copy}
            </button>
            <a className="auvers__handoff-address" href={`mailto:${copy.email}`}>
              {copy.email}
            </a>
          </div>

          {copied === 'failed' && (
            <p className="auvers__status" role="status">
              {handoff.copyFailed}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
