export type SessionType = 'training' | 'camp' | 'private'
export type SessionStatus = 'scheduled' | 'full' | 'cancelled' | 'completed'
export type Visibility = 'public' | 'invite-only'

export interface CoachSummary {
  id: string
  name: string
  email: string
}

export interface LocationSummary {
  name: string
  address: string
}

export interface SessionSummary {
  id: string
  title: string
  type: SessionType
  status: SessionStatus
  startsAt: string
  durationMinutes: number
  capacity: number
  bookedCount: number
  visibility: Visibility
  coach: CoachSummary
  location: LocationSummary
  updatedAt: string
}

export interface SessionDetails extends SessionSummary {
  description: string | null
  trainerNotes: string | null
  createdAt: string
  cancellation: null | {
    reason: string | null
    cancelledAt: string
  }
}

export interface SessionsResponse {
  data: SessionSummary[]
  meta: {
    page: number
    pageSize: number
    total: number
  }
}

export interface CoachesResponse {
  data: CoachSummary[]
}

export interface CreateSessionRequest {
  title: string
  type: SessionType
  startsAt: string
  durationMinutes: number
  coachId: string
  locationName: string
  locationAddress: string
  capacity: number
  visibility: Visibility
  description?: string | null
  trainerNotes?: string | null
}

export interface ApiErrorBody {
  error: {
    code: string
    message: string
    fieldErrors?: Record<string, string>
  }
}

export class ApiFailure extends Error {
  code: string
  status: number
  fieldErrors?: Record<string, string>

  constructor(
    message: string,
    options: {
      code: string
      status: number
      fieldErrors?: Record<string, string>
    },
  ) {
    super(message)
    this.name = 'ApiFailure'
    this.code = options.code
    this.status = options.status
    this.fieldErrors = options.fieldErrors
  }
}
