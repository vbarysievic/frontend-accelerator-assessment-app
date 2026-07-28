import {
  SESSION_STATUSES,
  type SessionFormValues,
} from './sessionDomain.ts'
import type { SessionStatus } from '../api/types.ts'

export interface WorkspaceUrlState {
  query: string
  status?: SessionStatus
  sessionId?: string
  isCreating: boolean
}

export function parseWorkspaceUrl(url: URL): WorkspaceUrlState {
  const rawStatus = url.searchParams.get('status')
  return {
    query: url.searchParams.get('query') ?? '',
    status: SESSION_STATUSES.includes(rawStatus as SessionStatus)
      ? (rawStatus as SessionStatus)
      : undefined,
    sessionId: url.searchParams.get('session') ?? undefined,
    isCreating: url.searchParams.has('create'),
  }
}

export function updateWorkspaceUrl(
  url: URL,
  updates: Partial<{
    query: string | null
    status: SessionStatus | null
    sessionId: string | null
    isCreating: boolean
  }>,
): URL {
  const next = new URL(url)
  const mappings: Array<[string, string | null | undefined]> = [
    ['query', updates.query],
    ['status', updates.status],
    ['session', updates.sessionId],
  ]

  for (const [key, value] of mappings) {
    if (value === undefined) {
      continue
    }
    if (value === null || value === '') {
      next.searchParams.delete(key)
    } else {
      next.searchParams.set(key, value)
    }
  }

  if (updates.isCreating !== undefined) {
    if (updates.isCreating) {
      next.searchParams.set('create', '1')
      next.searchParams.delete('session')
    } else {
      next.searchParams.delete('create')
    }
  }

  return next
}

export function sessionMatchesFormQuery(
  values: SessionFormValues,
  query: string,
): boolean {
  const normalized = query.trim().toLocaleLowerCase()
  if (!normalized) {
    return true
  }
  return [values.title, values.locationName, values.locationAddress].some(
    (value) => value.toLocaleLowerCase().includes(normalized),
  )
}
