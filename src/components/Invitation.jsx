import './Invitation.css'

/**
 * The one way this building says "you can touch this".
 *
 * Every room that wants something from the visitor uses this same marker, so
 * the invitation is a thing they learn once rather than a surprise they have
 * to decode per room: a painted target that breathes, and a sentence saying
 * what it wants in the imperative.
 *
 * It retires itself. Once `done` is true the marker stops pulsing and the copy
 * switches to `after` — a hint that keeps nagging after you have taken it is
 * just decoration with an attitude.
 */
export default function Invitation({
  children,
  after,
  done = false,
  still = false,
  className = '',
  ...rest
}) {
  return (
    <p className={`invite ${done ? 'is-done' : ''} ${className}`} {...rest}>
      <span className="invite__mark" aria-hidden="true">
        <span className="invite__pulse" />
        <span className="invite__dot" />
      </span>
      <span className="invite__text">{done && after ? after : children}</span>
    </p>
  )
}
