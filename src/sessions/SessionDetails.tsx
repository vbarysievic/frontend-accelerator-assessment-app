import { useEffect, useRef, useState } from 'react'
import { ApiFailure, type SessionDetails as SessionDetailsType } from '../api/types.ts'
import { sessionsClient } from '../api/sessionsClient.ts'
import { formatDateTime, titleCase } from './sessionDomain.ts'
import { StatusBadge } from './StatusBadge.tsx'

type DetailsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; session: SessionDetailsType }

export function SessionDetails({
  sessionId,
  onClose,
}: {
  sessionId: string
  onClose: () => void
}) {
  const [state, setState] = useState<DetailsState>({ status: 'loading' })
  const [requestKey, setRequestKey] = useState(0)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [sessionId])

  useEffect(() => {
    const controller = new AbortController()
    sessionsClient
      .getSession(sessionId, controller.signal)
      .then((session) => setState({ status: 'success', session }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
        setState({
          status: 'error',
          message:
            error instanceof ApiFailure
              ? error.message
              : 'Session details could not be loaded.',
        })
      })
    return () => controller.abort()
  }, [requestKey, sessionId])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <aside className="details-panel" aria-labelledby="details-heading">
      <div className="details-topline">
        <p className="eyebrow">Session Details</p>
        <button type="button" className="text-button" onClick={onClose}>
          Back to Sessions
        </button>
      </div>
      <h2 id="details-heading" ref={headingRef} tabIndex={-1}>
        {state.status === 'success' ? state.session.title : 'Session Details'}
      </h2>

      {state.status === 'loading' ? (
        <div className="details-loading" aria-live="polite">
          Loading session details…
        </div>
      ) : null}

      {state.status === 'error' ? (
        <div className="state-panel compact" role="alert">
          <h3>Details Couldn’t Load</h3>
          <p>{state.message}</p>
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setState({ status: 'loading' })
              setRequestKey((current) => current + 1)
            }}
          >
            Retry Details
          </button>
        </div>
      ) : null}

      {state.status === 'success' ? (
        <div className="details-content">
          <StatusBadge status={state.session.status} />
          <dl className="details-list">
            <div>
              <dt>Start</dt>
              <dd>{formatDateTime(state.session.startsAt, true)}</dd>
            </div>
            <div>
              <dt>Duration</dt>
              <dd>{state.session.durationMinutes} minutes</dd>
            </div>
            <div>
              <dt>Type & Visibility</dt>
              <dd>
                {titleCase(state.session.type)} ·{' '}
                {titleCase(state.session.visibility)}
              </dd>
            </div>
            <div>
              <dt>Coach</dt>
              <dd>
                {state.session.coach.name}
                <a href={`mailto:${state.session.coach.email}`}>
                  {state.session.coach.email}
                </a>
              </dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>
                {state.session.location.name}
                <span>{state.session.location.address}</span>
              </dd>
            </div>
            <div>
              <dt>Capacity</dt>
              <dd>
                {state.session.bookedCount} booked of {state.session.capacity}{' '}
                places
                <progress
                  value={state.session.bookedCount}
                  max={state.session.capacity}
                  aria-label={`${state.session.bookedCount} of ${state.session.capacity} places booked`}
                />
              </dd>
            </div>
            <div>
              <dt>Description</dt>
              <dd>{state.session.description || 'No description provided.'}</dd>
            </div>
            <div>
              <dt>Trainer Notes</dt>
              <dd>{state.session.trainerNotes || 'No trainer notes.'}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatDateTime(state.session.createdAt)}</dd>
            </div>
            <div>
              <dt>Last Updated</dt>
              <dd>{formatDateTime(state.session.updatedAt)}</dd>
            </div>
          </dl>
        </div>
      ) : null}
    </aside>
  )
}
