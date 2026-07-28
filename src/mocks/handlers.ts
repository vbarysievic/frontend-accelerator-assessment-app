import { delay, http, HttpResponse } from 'msw'
import type {
  ApiErrorBody,
  CreateSessionRequest,
  SessionStatus,
} from '../api/types.ts'
import { SESSION_STATUSES, SESSION_TYPES, VISIBILITIES } from '../sessions/sessionDomain.ts'
import type { RequiredScenario } from './scenarios.ts'
import { mockStore } from './store.ts'

const NORMAL_LATENCY_MS = 250

function errorResponse(
  status: number,
  code: string,
  message: string,
  fieldErrors?: Record<string, string>,
) {
  return HttpResponse.json<ApiErrorBody>(
    { error: { code, message, fieldErrors } },
    { status },
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function validateCreateRequest(
  value: unknown,
): { input?: CreateSessionRequest; fieldErrors: Record<string, string> } {
  const fieldErrors: Record<string, string> = {}
  if (!isRecord(value)) {
    return { fieldErrors: { form: 'Submit a valid session payload.' } }
  }

  const title = typeof value.title === 'string' ? value.title.trim() : ''
  const startsAt =
    typeof value.startsAt === 'string' ? new Date(value.startsAt) : new Date(NaN)
  const durationMinutes = Number(value.durationMinutes)
  const capacity = Number(value.capacity)
  const coachId = typeof value.coachId === 'string' ? value.coachId : ''
  const locationName =
    typeof value.locationName === 'string' ? value.locationName.trim() : ''
  const locationAddress =
    typeof value.locationAddress === 'string' ? value.locationAddress.trim() : ''

  if (title.length < 3 || title.length > 80) {
    fieldErrors.title = 'Title must be 3 to 80 characters.'
  }
  if (
    !SESSION_TYPES.includes(value.type as CreateSessionRequest['type'])
  ) {
    fieldErrors.type = 'Select a supported session type.'
  }
  if (Number.isNaN(startsAt.getTime())) {
    fieldErrors.startsAt = 'Provide a valid ISO start timestamp.'
  }
  if (
    !Number.isInteger(durationMinutes) ||
    durationMinutes <= 0
  ) {
    fieldErrors.durationMinutes = 'Duration must be a positive whole number.'
  }
  if (!coachId || !mockStore.coaches.some((coach) => coach.id === coachId)) {
    fieldErrors.coachId = 'Select a valid coach.'
  }
  if (locationName.length < 2) {
    fieldErrors.locationName = 'Provide a location name.'
  }
  if (locationAddress.length < 3) {
    fieldErrors.locationAddress = 'Provide a location address.'
  }
  if (!Number.isInteger(capacity) || capacity <= 0) {
    fieldErrors.capacity = 'Capacity must be a positive whole number.'
  }
  if (
    !VISIBILITIES.includes(
      value.visibility as CreateSessionRequest['visibility'],
    )
  ) {
    fieldErrors.visibility = 'Select a supported visibility.'
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors }
  }

  return {
    fieldErrors,
    input: {
      title,
      type: value.type as CreateSessionRequest['type'],
      startsAt: startsAt.toISOString(),
      durationMinutes,
      coachId,
      locationName,
      locationAddress,
      capacity,
      visibility: value.visibility as CreateSessionRequest['visibility'],
      description:
        typeof value.description === 'string' ? value.description : null,
      trainerNotes:
        typeof value.trainerNotes === 'string' ? value.trainerNotes : null,
    },
  }
}

export function createHandlers(scenario: RequiredScenario) {
  return [
    http.get('/api/sessions', async ({ request }) => {
      await delay(NORMAL_LATENCY_MS)
      if (scenario === 'list-error') {
        return errorResponse(
          500,
          'SESSIONS_UNAVAILABLE',
          'Sessions cannot be loaded right now.',
        )
      }
      if (scenario === 'empty') {
        return HttpResponse.json({
          data: [],
          meta: { page: 1, pageSize: 10, total: 0 },
        })
      }

      const url = new URL(request.url)
      const query = url.searchParams.get('query') ?? ''
      const rawStatus = url.searchParams.get('status')
      if (
        rawStatus &&
        !SESSION_STATUSES.includes(rawStatus as SessionStatus)
      ) {
        return errorResponse(
          400,
          'INVALID_FILTER',
          'Choose a supported session status.',
        )
      }
      return HttpResponse.json(
        mockStore.list(query, (rawStatus || undefined) as SessionStatus),
      )
    }),

    http.get('/api/sessions/:sessionId', async ({ params }) => {
      await delay(NORMAL_LATENCY_MS)
      const sessionId = String(params.sessionId)
      if (scenario === 'details-error' && sessionId === 'ses_101') {
        return errorResponse(
          500,
          'SESSION_DETAILS_UNAVAILABLE',
          'Session details cannot be loaded right now.',
        )
      }
      const session = mockStore.details(sessionId)
      if (!session) {
        return errorResponse(
          404,
          'SESSION_NOT_FOUND',
          'The requested session no longer exists.',
        )
      }
      return HttpResponse.json(session)
    }),

    http.get('/api/coaches', async () => {
      await delay(NORMAL_LATENCY_MS)
      if (scenario === 'coaches-error') {
        return errorResponse(
          500,
          'COACHES_UNAVAILABLE',
          'Coach choices cannot be loaded right now.',
        )
      }
      return HttpResponse.json({ data: structuredClone(mockStore.coaches) })
    }),

    http.post('/api/sessions', async ({ request }) => {
      await delay(NORMAL_LATENCY_MS)
      if (scenario === 'create-error') {
        return errorResponse(
          500,
          'CREATE_SESSION_FAILED',
          'The session could not be created.',
        )
      }

      const validation = validateCreateRequest(await request.json())
      if (!validation.input) {
        return errorResponse(
          400,
          'VALIDATION_FAILED',
          'Correct the highlighted fields and try again.',
          validation.fieldErrors,
        )
      }
      return HttpResponse.json(mockStore.create(validation.input), {
        status: 201,
      })
    }),
  ]
}
