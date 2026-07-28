import type {
  CreateSessionRequest,
  SessionStatus,
  SessionType,
  Visibility,
} from '../api/types.ts'

export const SESSION_STATUSES: SessionStatus[] = [
  'scheduled',
  'full',
  'cancelled',
  'completed',
]

export const SESSION_TYPES: SessionType[] = ['training', 'camp', 'private']
export const VISIBILITIES: Visibility[] = ['public', 'invite-only']

export const STATUS_LABELS: Record<SessionStatus, string> = {
  scheduled: 'Scheduled',
  full: 'Full',
  cancelled: 'Cancelled',
  completed: 'Completed',
}

export interface SessionFormValues {
  title: string
  type: SessionType
  date: string
  startTime: string
  durationMinutes: string
  coachId: string
  locationName: string
  locationAddress: string
  capacity: string
  visibility: Visibility
  description: string
  trainerNotes: string
}

export type SessionFormField = keyof SessionFormValues
export type SessionFormErrors = Partial<Record<SessionFormField, string>>

export const INITIAL_FORM_VALUES: SessionFormValues = {
  title: '',
  type: 'training',
  date: '',
  startTime: '',
  durationMinutes: '60',
  coachId: '',
  locationName: '',
  locationAddress: '',
  capacity: '12',
  visibility: 'public',
  description: '',
  trainerNotes: '',
}

function validateInteger(
  value: string,
  label: string,
  minimum: number,
  maximum: number,
): string | undefined {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    return `${label} must be a whole number from ${minimum} to ${maximum}.`
  }
  return undefined
}

export function localDateTimeToIso(
  date: string,
  time: string,
): string | null {
  if (!date || !time) {
    return null
  }

  const localDate = new Date(`${date}T${time}`)
  if (Number.isNaN(localDate.getTime())) {
    return null
  }

  return localDate.toISOString()
}

export function validateSessionForm(
  values: SessionFormValues,
  now = new Date(),
): { errors: SessionFormErrors; request?: CreateSessionRequest } {
  const errors: SessionFormErrors = {}
  const title = values.title.trim()
  const locationName = values.locationName.trim()
  const locationAddress = values.locationAddress.trim()
  const description = values.description.trim()
  const trainerNotes = values.trainerNotes.trim()
  const startsAt = localDateTimeToIso(values.date, values.startTime)

  if (title.length < 3 || title.length > 80) {
    errors.title = 'Title must be 3 to 80 characters.'
  }
  if (!startsAt || new Date(startsAt).getTime() <= now.getTime()) {
    errors.date = 'Choose a date and time in the future.'
    errors.startTime = 'Choose a date and time in the future.'
  }

  const durationError = validateInteger(
    values.durationMinutes,
    'Duration',
    30,
    240,
  )
  if (durationError) {
    errors.durationMinutes = durationError
  }
  if (!values.coachId) {
    errors.coachId = 'Select a coach.'
  }
  if (locationName.length < 2 || locationName.length > 80) {
    errors.locationName = 'Location name must be 2 to 80 characters.'
  }
  if (locationAddress.length < 3 || locationAddress.length > 120) {
    errors.locationAddress = 'Address must be 3 to 120 characters.'
  }

  const capacityError = validateInteger(values.capacity, 'Capacity', 1, 100)
  if (capacityError) {
    errors.capacity = capacityError
  }
  if (trainerNotes.length > 500) {
    errors.trainerNotes = 'Trainer notes must be 500 characters or fewer.'
  }

  if (Object.keys(errors).length > 0 || !startsAt) {
    return { errors }
  }

  return {
    errors,
    request: {
      title,
      type: values.type,
      startsAt,
      durationMinutes: Number(values.durationMinutes),
      coachId: values.coachId,
      locationName,
      locationAddress,
      capacity: Number(values.capacity),
      visibility: values.visibility,
      description: description || null,
      trainerNotes: trainerNotes || null,
    },
  }
}

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const longDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'full',
  timeStyle: 'short',
})

export function formatDateTime(value: string, long = false): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return 'Invalid date'
  }
  return (long ? longDateTimeFormatter : dateTimeFormatter).format(parsed)
}

export function titleCase(value: string): string {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
