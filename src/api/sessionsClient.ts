import {
  ApiFailure,
  type ApiErrorBody,
  type CoachSummary,
  type CoachesResponse,
  type CreateSessionRequest,
  type SessionDetails,
  type SessionStatus,
  type SessionSummary,
  type SessionsResponse,
} from './types.ts'

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isCoach(value: unknown): value is CoachSummary {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isString(value.email)
  )
}

function isSessionSummary(value: unknown): value is SessionSummary {
  if (!isRecord(value) || !isRecord(value.location)) {
    return false
  }

  return (
    isString(value.id) &&
    isString(value.title) &&
    ['training', 'camp', 'private'].includes(String(value.type)) &&
    ['scheduled', 'full', 'cancelled', 'completed'].includes(
      String(value.status),
    ) &&
    isString(value.startsAt) &&
    isNumber(value.durationMinutes) &&
    isNumber(value.capacity) &&
    isNumber(value.bookedCount) &&
    ['public', 'invite-only'].includes(String(value.visibility)) &&
    isCoach(value.coach) &&
    isString(value.location.name) &&
    isString(value.location.address) &&
    isString(value.updatedAt)
  )
}

function isSessionDetails(value: unknown): value is SessionDetails {
  if (!isSessionSummary(value) || !isRecord(value)) {
    return false
  }

  const cancellationValid =
    value.cancellation === null ||
    (isRecord(value.cancellation) &&
      (value.cancellation.reason === null ||
        isString(value.cancellation.reason)) &&
      isString(value.cancellation.cancelledAt))

  return (
    (value.description === null || isString(value.description)) &&
    (value.trainerNotes === null || isString(value.trainerNotes)) &&
    isString(value.createdAt) &&
    cancellationValid
  )
}

function isSessionsResponse(value: unknown): value is SessionsResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.data) &&
    value.data.every(isSessionSummary) &&
    isRecord(value.meta) &&
    isNumber(value.meta.page) &&
    isNumber(value.meta.pageSize) &&
    isNumber(value.meta.total)
  )
}

function isCoachesResponse(value: unknown): value is CoachesResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.data) &&
    value.data.every(isCoach)
  )
}

function isApiError(value: unknown): value is ApiErrorBody {
  return (
    isRecord(value) &&
    isRecord(value.error) &&
    isString(value.error.code) &&
    isString(value.error.message) &&
    (value.error.fieldErrors === undefined ||
      (isRecord(value.error.fieldErrors) &&
        Object.values(value.error.fieldErrors).every(isString)))
  )
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function request<T>(
  url: string,
  init: RequestInit,
  guard: (value: unknown) => value is T,
): Promise<T> {
  let response: Response

  try {
    response = await fetch(url, init)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }

    throw new ApiFailure('The service could not be reached. Try again.', {
      code: 'CLIENT_UNAVAILABLE',
      status: 0,
    })
  }

  const body = await readJson(response)

  if (!response.ok) {
    if (isApiError(body)) {
      throw new ApiFailure(body.error.message, {
        code: body.error.code,
        status: response.status,
        fieldErrors: body.error.fieldErrors,
      })
    }

    throw new ApiFailure('The request could not be completed. Try again.', {
      code: 'CLIENT_UNAVAILABLE',
      status: response.status,
    })
  }

  if (!guard(body)) {
    throw new ApiFailure('The service returned an unexpected response.', {
      code: 'CLIENT_UNAVAILABLE',
      status: response.status,
    })
  }

  return body
}

export const sessionsClient = {
  listSessions(
    input: { query: string; status?: SessionStatus },
    signal?: AbortSignal,
  ) {
    const params = new URLSearchParams()
    if (input.query.trim()) {
      params.set('query', input.query.trim())
    }
    if (input.status) {
      params.set('status', input.status)
    }
    const query = params.size > 0 ? `?${params.toString()}` : ''

    return request(
      `/api/sessions${query}`,
      { method: 'GET', signal },
      isSessionsResponse,
    )
  },

  getSession(sessionId: string, signal?: AbortSignal) {
    return request(
      `/api/sessions/${encodeURIComponent(sessionId)}`,
      { method: 'GET', signal },
      isSessionDetails,
    )
  },

  listCoaches(signal?: AbortSignal) {
    return request('/api/coaches', { method: 'GET', signal }, isCoachesResponse)
  },

  createSession(input: CreateSessionRequest) {
    return request(
      '/api/sessions',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      },
      isSessionDetails,
    )
  },
}
