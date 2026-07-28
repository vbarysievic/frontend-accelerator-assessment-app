import { useCallback, useEffect, useState } from 'react'
import './App.css'
import { ApiFailure, type SessionStatus } from './api/types.ts'
import { sessionsClient } from './api/sessionsClient.ts'
import { CreateSessionForm } from './sessions/CreateSessionForm.tsx'
import { SessionDetails as SessionDetailsView } from './sessions/SessionDetails.tsx'
import {
  SessionWorkspace,
} from './sessions/SessionWorkspace.tsx'
import type { ListState } from './sessions/listModel.ts'
import {
  parseWorkspaceUrl,
  updateWorkspaceUrl,
  type WorkspaceUrlState,
} from './sessions/urlState.ts'

function readUrlState() {
  return parseWorkspaceUrl(new URL(window.location.href))
}

function App() {
  const [urlState, setUrlState] = useState<WorkspaceUrlState>(readUrlState)
  const [listState, setListState] = useState<ListState>({ status: 'loading' })
  const [listRequestKey, setListRequestKey] = useState(0)

  useEffect(() => {
    const handlePopState = () => setUrlState(readUrlState())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = useCallback(
    (
      updates: Parameters<typeof updateWorkspaceUrl>[1],
      options?: { replace?: boolean },
    ) => {
      const nextUrl = updateWorkspaceUrl(
        new URL(window.location.href),
        updates,
      )
      window.history[options?.replace ? 'replaceState' : 'pushState'](
        {},
        '',
        nextUrl,
      )
      setUrlState(parseWorkspaceUrl(nextUrl))
    },
    [],
  )

  useEffect(() => {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => {
      setListState({ status: 'loading' })
      sessionsClient
        .listSessions(
          { query: urlState.query, status: urlState.status },
          controller.signal,
        )
        .then((response) => setListState({ status: 'success', response }))
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') {
            return
          }
          setListState({
            status: 'error',
            message:
              error instanceof ApiFailure
                ? error.message
                : 'Sessions could not be loaded.',
          })
        })
    }, 180)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [listRequestKey, urlState.query, urlState.status])

  const closeDetails = useCallback(() => {
    const previousSessionId = urlState.sessionId
    navigate({ sessionId: null })
    window.requestAnimationFrame(() => {
      const links = document.querySelectorAll<HTMLElement>(
        `[data-session-id="${CSS.escape(previousSessionId ?? '')}"]`,
      )
      for (const link of links) {
        if (link.offsetParent !== null) {
          link.focus()
          break
        }
      }
    })
  }, [navigate, urlState.sessionId])

  function handleCreated() {
    setListRequestKey((current) => current + 1)
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to Main Content
      </a>
      <aside className="product-rail" aria-label="Product">
        <span className="brand">COURTSIDE</span>
        <span className="rail-label">OPERATIONS</span>
        <span className="active-nav" aria-current="page">
          Sessions
        </span>
      </aside>
      <header className="mobile-brand">
        <span className="brand">COURTSIDE</span>
        <span>Sessions</span>
      </header>

      <main id="main-content">
        <header className="page-header">
          <div>
            <h1>Training Sessions</h1>
            <p>
              Find scheduled work, review capacity, and create new sessions.
            </p>
          </div>
          {!urlState.isCreating ? (
            <button
              type="button"
              className="primary-button create-button"
              onClick={() =>
                navigate({ isCreating: true, sessionId: null })
              }
            >
              Create Session
            </button>
          ) : null}
        </header>

        {urlState.isCreating ? (
          <CreateSessionForm
            hasActiveFilters={Boolean(urlState.query || urlState.status)}
            onBack={() => navigate({ isCreating: false })}
            onCreated={handleCreated}
            onOpenCreated={(sessionId) =>
              navigate({ isCreating: false, sessionId })
            }
            onShowCreated={(sessionId) =>
              navigate({
                isCreating: false,
                query: null,
                status: null,
                sessionId,
              })
            }
          />
        ) : (
          <SessionWorkspace
            query={urlState.query}
            status={urlState.status}
            selectedSessionId={urlState.sessionId}
            listState={listState}
            onQueryChange={(query) =>
              navigate({ query: query || null }, { replace: true })
            }
            onStatusChange={(status?: SessionStatus) =>
              navigate({ status: status ?? null })
            }
            onClearFilters={() => navigate({ query: null, status: null })}
            onRetry={() => setListRequestKey((current) => current + 1)}
            onOpenSession={(sessionId) => navigate({ sessionId })}
            details={
              urlState.sessionId ? (
                <SessionDetailsView
                  key={urlState.sessionId}
                  sessionId={urlState.sessionId}
                  onClose={closeDetails}
                />
              ) : undefined
            }
          />
        )}
      </main>
    </div>
  )
}

export default App
