import { useEffect, useRef, useState } from 'react'
import { sessionsClient } from '../api/sessionsClient.ts'
import {
  ApiFailure,
  type CoachSummary,
  type SessionDetails,
} from '../api/types.ts'
import {
  INITIAL_FORM_VALUES,
  SESSION_TYPES,
  type SessionFormErrors,
  type SessionFormField,
  type SessionFormValues,
  validateSessionForm,
  VISIBILITIES,
  titleCase,
} from './sessionDomain.ts'
import { preserveFormAfterFailure } from './createFormModel.ts'

type CoachesState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; coaches: CoachSummary[] }

function FieldError({
  field,
  errors,
}: {
  field: SessionFormField
  errors: SessionFormErrors
}) {
  const message = errors[field]
  return message ? (
    <span className="field-error" id={`${field}-error`}>
      {message}
    </span>
  ) : null
}

function errorProps(field: SessionFormField, errors: SessionFormErrors) {
  return {
    'aria-invalid': Boolean(errors[field]),
    'aria-describedby': errors[field] ? `${field}-error` : undefined,
  }
}

export function CreateSessionForm({
  hasActiveFilters,
  onBack,
  onCreated,
  onOpenCreated,
  onShowCreated,
}: {
  hasActiveFilters: boolean
  onBack: () => void
  onCreated: (session: SessionDetails) => void
  onOpenCreated: (sessionId: string) => void
  onShowCreated: (sessionId: string) => void
}) {
  const [values, setValues] = useState<SessionFormValues>(INITIAL_FORM_VALUES)
  const [errors, setErrors] = useState<SessionFormErrors>({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [created, setCreated] = useState<SessionDetails>()
  const [coachesState, setCoachesState] = useState<CoachesState>({
    status: 'loading',
  })
  const [coachesRequestKey, setCoachesRequestKey] = useState(0)
  const isDirty = useRef(false)

  useEffect(() => {
    const controller = new AbortController()
    sessionsClient
      .listCoaches(controller.signal)
      .then((response) =>
        setCoachesState({ status: 'success', coaches: response.data }),
      )
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
        setCoachesState({
          status: 'error',
          message:
            error instanceof ApiFailure
              ? error.message
              : 'Coach choices could not be loaded.',
        })
      })
    return () => controller.abort()
  }, [coachesRequestKey])

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty.current || created) {
        return
      }
      event.preventDefault()
    }
    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [created])

  function updateField(field: SessionFormField, value: string) {
    isDirty.current = true
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      if (!current[field]) {
        return current
      }
      const next = { ...current }
      delete next[field]
      return next
    })
    setFormError('')
  }

  function focusFirstError(nextErrors: SessionFormErrors) {
    const firstField = Object.keys(nextErrors)[0]
    if (firstField) {
      window.requestAnimationFrame(() =>
        document.getElementById(firstField)?.focus(),
      )
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) {
      return
    }

    const validation = validateSessionForm(values)
    setErrors(validation.errors)
    setFormError('')
    if (!validation.request) {
      setFormError('Correct the highlighted fields and try again.')
      focusFirstError(validation.errors)
      return
    }

    setIsSubmitting(true)
    try {
      const session = await sessionsClient.createSession(validation.request)
      isDirty.current = false
      setCreated(session)
      onCreated(session)
    } catch (error) {
      if (error instanceof ApiFailure) {
        const failureState = preserveFormAfterFailure(values, error)
        setValues(failureState.values)
        setErrors(failureState.errors)
        setFormError(failureState.formError)
        focusFirstError(failureState.errors)
      } else {
        setFormError('The session could not be created. Try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleBack() {
    if (
      isDirty.current &&
      !created &&
      !window.confirm('Discard this unfinished session?')
    ) {
      return
    }
    onBack()
  }

  if (created) {
    return (
      <section className="create-surface success-surface" aria-labelledby="create-success-heading">
        <p className="eyebrow">Session Created</p>
        <h2 id="create-success-heading">The Session Is Ready</h2>
        <p role="status" aria-live="polite">
          {created.title} was created successfully.
        </p>
        <div className="form-actions">
          <button
            type="button"
            className="primary-button"
            onClick={() => onOpenCreated(created.id)}
          >
            Open Session
          </button>
          {hasActiveFilters ? (
            <button
              type="button"
              className="secondary-button"
              onClick={() => onShowCreated(created.id)}
            >
              Show in Sessions
            </button>
          ) : null}
          <button type="button" className="text-button" onClick={onBack}>
            Back to Sessions
          </button>
        </div>
      </section>
    )
  }

  const coaches =
    coachesState.status === 'success' ? coachesState.coaches : []

  return (
    <section className="create-surface" aria-labelledby="create-heading">
      <button type="button" className="text-button back-button" onClick={handleBack}>
        ← Back to Sessions
      </button>
      <p className="eyebrow">Schedule Work</p>
      <h2 id="create-heading">Create Session</h2>
      <p className="section-intro">
        Add the schedule, coach, location, and capacity details.
      </p>

      {formError ? (
        <div className="form-alert" role="alert" tabIndex={-1}>
          {formError}
        </div>
      ) : null}

      <form noValidate onSubmit={handleSubmit}>
        <fieldset>
          <legend>Session Basics</legend>
          <div className="form-grid">
            <div className="field field-wide">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                name="title"
                value={values.title}
                minLength={3}
                maxLength={80}
                autoComplete="off"
                {...errorProps('title', errors)}
                onChange={(event) => updateField('title', event.target.value)}
              />
              <FieldError field="title" errors={errors} />
            </div>
            <div className="field">
              <label htmlFor="type">Session Type</label>
              <select
                id="type"
                name="type"
                value={values.type}
                onChange={(event) => updateField('type', event.target.value)}
              >
                {SESSION_TYPES.map((type) => (
                  <option value={type} key={type}>
                    {titleCase(type)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="visibility">Visibility</label>
              <select
                id="visibility"
                name="visibility"
                value={values.visibility}
                onChange={(event) =>
                  updateField('visibility', event.target.value)
                }
              >
                {VISIBILITIES.map((visibility) => (
                  <option value={visibility} key={visibility}>
                    {titleCase(visibility)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Schedule</legend>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="date">Date</label>
              <input
                id="date"
                name="date"
                type="date"
                value={values.date}
                {...errorProps('date', errors)}
                onChange={(event) => updateField('date', event.target.value)}
              />
              <FieldError field="date" errors={errors} />
            </div>
            <div className="field">
              <label htmlFor="startTime">Start Time</label>
              <input
                id="startTime"
                name="startTime"
                type="time"
                value={values.startTime}
                {...errorProps('startTime', errors)}
                onChange={(event) =>
                  updateField('startTime', event.target.value)
                }
              />
              <FieldError field="startTime" errors={errors} />
            </div>
            <div className="field">
              <label htmlFor="durationMinutes">Duration (minutes)</label>
              <input
                id="durationMinutes"
                name="durationMinutes"
                type="number"
                inputMode="numeric"
                min={30}
                max={240}
                step={1}
                value={values.durationMinutes}
                {...errorProps('durationMinutes', errors)}
                onChange={(event) =>
                  updateField('durationMinutes', event.target.value)
                }
              />
              <FieldError field="durationMinutes" errors={errors} />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Coach & Location</legend>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="coachId">Coach</label>
              <select
                id="coachId"
                name="coachId"
                value={values.coachId}
                disabled={coachesState.status !== 'success'}
                {...errorProps('coachId', errors)}
                onChange={(event) => updateField('coachId', event.target.value)}
              >
                <option value="">
                  {coachesState.status === 'loading'
                    ? 'Loading coaches…'
                    : 'Select a coach'}
                </option>
                {coaches.map((coach) => (
                  <option key={coach.id} value={coach.id}>
                    {coach.name}
                  </option>
                ))}
              </select>
              <FieldError field="coachId" errors={errors} />
              {coachesState.status === 'error' ? (
                <div className="inline-error" role="alert">
                  <span>{coachesState.message}</span>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => {
                      setCoachesState({ status: 'loading' })
                      setCoachesRequestKey((current) => current + 1)
                    }}
                  >
                    Retry Coaches
                  </button>
                </div>
              ) : null}
            </div>
            <div className="field">
              <label htmlFor="capacity">Capacity</label>
              <input
                id="capacity"
                name="capacity"
                type="number"
                inputMode="numeric"
                min={1}
                max={100}
                step={1}
                value={values.capacity}
                {...errorProps('capacity', errors)}
                onChange={(event) =>
                  updateField('capacity', event.target.value)
                }
              />
              <FieldError field="capacity" errors={errors} />
            </div>
            <div className="field">
              <label htmlFor="locationName">Location Name</label>
              <input
                id="locationName"
                name="locationName"
                value={values.locationName}
                minLength={2}
                maxLength={80}
                autoComplete="off"
                {...errorProps('locationName', errors)}
                onChange={(event) =>
                  updateField('locationName', event.target.value)
                }
              />
              <FieldError field="locationName" errors={errors} />
            </div>
            <div className="field">
              <label htmlFor="locationAddress">Location Address</label>
              <input
                id="locationAddress"
                name="locationAddress"
                value={values.locationAddress}
                minLength={3}
                maxLength={120}
                autoComplete="off"
                {...errorProps('locationAddress', errors)}
                onChange={(event) =>
                  updateField('locationAddress', event.target.value)
                }
              />
              <FieldError field="locationAddress" errors={errors} />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Optional Notes</legend>
          <div className="form-grid">
            <div className="field field-wide">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={values.description}
                onChange={(event) =>
                  updateField('description', event.target.value)
                }
              />
            </div>
            <div className="field field-wide">
              <label htmlFor="trainerNotes">Trainer Notes</label>
              <textarea
                id="trainerNotes"
                name="trainerNotes"
                rows={4}
                maxLength={500}
                value={values.trainerNotes}
                {...errorProps('trainerNotes', errors)}
                onChange={(event) =>
                  updateField('trainerNotes', event.target.value)
                }
              />
              <span className="character-count">
                {values.trainerNotes.length} / 500
              </span>
              <FieldError field="trainerNotes" errors={errors} />
            </div>
          </div>
        </fieldset>

        <div className="form-actions">
          <button
            type="submit"
            className="primary-button"
            disabled={isSubmitting || coachesState.status !== 'success'}
          >
            {isSubmitting ? 'Creating…' : 'Create Session'}
          </button>
          <button type="button" className="secondary-button" onClick={handleBack}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  )
}
