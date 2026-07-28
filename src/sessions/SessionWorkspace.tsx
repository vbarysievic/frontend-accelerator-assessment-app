import type { SessionStatus, SessionSummary } from '../api/types.ts'
import {
  formatDateTime,
  SESSION_STATUSES,
  STATUS_LABELS,
  titleCase,
} from './sessionDomain.ts'
import {
  resolveListPresentation,
  type ListState,
} from './listModel.ts'
import { StatusBadge } from './StatusBadge.tsx'

interface SessionWorkspaceProps {
  query: string
  status?: SessionStatus
  selectedSessionId?: string
  listState: ListState
  onQueryChange: (query: string) => void
  onStatusChange: (status?: SessionStatus) => void
  onClearFilters: () => void
  onRetry: () => void
  onOpenSession: (sessionId: string) => void
  details?: React.ReactNode
}

function SessionLink({
  session,
  onOpenSession,
}: {
  session: SessionSummary
  onOpenSession: (sessionId: string) => void
}) {
  const url = new URL(window.location.href)
  url.searchParams.set('session', session.id)
  url.searchParams.delete('create')

  return (
    <a
      className="session-link"
      data-session-id={session.id}
      href={`${url.pathname}${url.search}`}
      onClick={(event) => {
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return
        }
        event.preventDefault()
        onOpenSession(session.id)
      }}
    >
      {session.title}
    </a>
  )
}

function DesktopTable({
  sessions,
  selectedSessionId,
  onOpenSession,
}: {
  sessions: SessionSummary[]
  selectedSessionId?: string
  onOpenSession: (sessionId: string) => void
}) {
  return (
    <div className="desktop-table">
      <table>
        <thead>
          <tr>
            <th scope="col">Session</th>
            <th scope="col">Start</th>
            <th scope="col">Coach</th>
            <th scope="col">Capacity</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr
              key={session.id}
              className={
                session.id === selectedSessionId ? 'selected-row' : undefined
              }
              aria-current={
                session.id === selectedSessionId ? 'true' : undefined
              }
            >
              <td>
                <SessionLink
                  session={session}
                  onOpenSession={onOpenSession}
                />
                <span className="secondary-line">
                  {titleCase(session.type)} · {session.location.name}
                </span>
                <span className="secondary-line">
                  {session.location.address}
                </span>
              </td>
              <td>
                <span className="primary-cell">
                  {formatDateTime(session.startsAt)}
                </span>
                <span className="secondary-line">
                  {session.durationMinutes} minutes
                </span>
              </td>
              <td>{session.coach.name}</td>
              <td className="numeric">
                {session.bookedCount} / {session.capacity}
              </td>
              <td>
                <StatusBadge status={session.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MobileList({
  sessions,
  selectedSessionId,
  onOpenSession,
}: {
  sessions: SessionSummary[]
  selectedSessionId?: string
  onOpenSession: (sessionId: string) => void
}) {
  return (
    <ul className="mobile-session-list">
      {sessions.map((session) => (
        <li
          key={session.id}
          className={
            session.id === selectedSessionId ? 'selected-card' : undefined
          }
        >
          <div className="card-heading">
            <SessionLink session={session} onOpenSession={onOpenSession} />
            <StatusBadge status={session.status} />
          </div>
          <p>
            {titleCase(session.type)} · {session.location.name}
          </p>
          <p>{session.location.address}</p>
          <dl>
            <div>
              <dt>Start</dt>
              <dd>{formatDateTime(session.startsAt)}</dd>
            </div>
            <div>
              <dt>Duration</dt>
              <dd>{session.durationMinutes} min</dd>
            </div>
            <div>
              <dt>Coach</dt>
              <dd>{session.coach.name}</dd>
            </div>
            <div>
              <dt>Capacity</dt>
              <dd>
                {session.bookedCount} / {session.capacity}
              </dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  )
}

export function SessionWorkspace({
  query,
  status,
  selectedSessionId,
  listState,
  onQueryChange,
  onStatusChange,
  onClearFilters,
  onRetry,
  onOpenSession,
  details,
}: SessionWorkspaceProps) {
  const hasFilters = Boolean(query.trim() || status)
  const presentation = resolveListPresentation(listState, hasFilters)
  const response =
    listState.status === 'success' ? listState.response : undefined
  const sessions = response?.data ?? []

  return (
    <>
      <section className="filters" aria-labelledby="filters-heading">
        <h2 id="filters-heading" className="visually-hidden">
          Filter Sessions
        </h2>
        <div className="field search-field">
          <label htmlFor="session-search">Search Sessions</label>
          <input
            id="session-search"
            name="session-search"
            type="search"
            value={query}
            placeholder="Search title, coach, or location…"
            autoComplete="off"
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>
        <div className="field status-field">
          <label htmlFor="status-filter">Status</label>
          <select
            id="status-filter"
            name="status-filter"
            value={status ?? ''}
            onChange={(event) =>
              onStatusChange(
                (event.target.value || undefined) as SessionStatus | undefined,
              )
            }
          >
            <option value="">All statuses</option>
            {SESSION_STATUSES.map((option) => (
              <option key={option} value={option}>
                {STATUS_LABELS[option]}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="text-button clear-button"
          disabled={!hasFilters}
          onClick={onClearFilters}
        >
          Clear Filters
        </button>
      </section>

      <div
        className={`workspace-grid${selectedSessionId ? ' has-details' : ''}`}
      >
        <section className="session-surface" aria-labelledby="results-heading">
          <header className="surface-header">
            <h2 id="results-heading">
              {response
                ? `${response.meta.total} ${response.meta.total === 1 ? 'session' : 'sessions'}`
                : 'Sessions'}
            </h2>
            <span className="live-copy" aria-live="polite">
              {listState.status === 'loading' ? 'Loading sessions…' : ''}
            </span>
          </header>

          {presentation === 'loading' ? (
            <div className="loading-rows" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
          ) : null}

          {presentation === 'error' && listState.status === 'error' ? (
            <div className="state-panel" role="alert">
              <h3>Sessions Couldn’t Load</h3>
              <p>{listState.message}</p>
              <button type="button" className="secondary-button" onClick={onRetry}>
                Retry Sessions
              </button>
            </div>
          ) : null}

          {presentation === 'empty' || presentation === 'no-matches' ? (
            <div className="state-panel">
              <h3>
                {presentation === 'no-matches'
                  ? 'No Sessions Match'
                  : 'No Sessions Yet'}
              </h3>
              <p>
                {presentation === 'no-matches'
                  ? 'Try a different search or clear the active filters.'
                  : 'Create the first session to start building the schedule.'}
              </p>
              {presentation === 'no-matches' ? (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={onClearFilters}
                >
                  Clear Filters
                </button>
              ) : null}
            </div>
          ) : null}

          {presentation === 'populated' && response ? (
            <>
              <DesktopTable
                sessions={sessions}
                selectedSessionId={selectedSessionId}
                onOpenSession={onOpenSession}
              />
              <MobileList
                sessions={sessions}
                selectedSessionId={selectedSessionId}
                onOpenSession={onOpenSession}
              />
            </>
          ) : null}
        </section>
        {details}
      </div>
    </>
  )
}
