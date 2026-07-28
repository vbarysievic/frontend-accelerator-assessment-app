import assert from 'node:assert/strict'
import test from 'node:test'
import {
  INITIAL_FORM_VALUES,
  localDateTimeToIso,
  validateSessionForm,
} from './sessionDomain.ts'
import { parseWorkspaceUrl, updateWorkspaceUrl } from './urlState.ts'
import { resolveListPresentation } from './listModel.ts'
import { preserveFormAfterFailure } from './createFormModel.ts'

const validValues = {
  ...INITIAL_FORM_VALUES,
  title: '  Evening Shooting Lab  ',
  date: '2030-08-03',
  startTime: '18:30',
  durationMinutes: '90',
  coachId: 'coach_01',
  locationName: ' North Court ',
  locationAddress: ' 18 Harbor Street ',
  capacity: '18',
  description: ' Small-group repetitions. ',
}

test('create validation normalizes a valid local form into the fixed request', () => {
  const result = validateSessionForm(validValues, new Date('2026-07-28T00:00:00Z'))

  assert.deepEqual(result.errors, {})
  assert.equal(result.request?.title, 'Evening Shooting Lab')
  assert.equal(result.request?.locationName, 'North Court')
  assert.equal(result.request?.startsAt, localDateTimeToIso('2030-08-03', '18:30'))
  assert.equal(result.request?.description, 'Small-group repetitions.')
  assert.equal(result.request?.trainerNotes, null)
})

test('create validation rejects required ranges and a non-future local start', () => {
  const result = validateSessionForm(
    {
      ...validValues,
      title: ' x ',
      date: '2020-01-01',
      durationMinutes: '29',
      coachId: '',
      locationName: 'x',
      locationAddress: 'x',
      capacity: '101',
      trainerNotes: 'x'.repeat(501),
    },
    new Date('2026-07-28T00:00:00Z'),
  )

  assert.deepEqual(Object.keys(result.errors).sort(), [
    'capacity',
    'coachId',
    'date',
    'durationMinutes',
    'locationAddress',
    'locationName',
    'startTime',
    'title',
    'trainerNotes',
  ])
  assert.equal(result.request, undefined)
})

test('workspace URL updates preserve infrastructure state and list context', () => {
  const initial = new URL(
    'http://example.test/?scenario=details-error&query=maya&status=scheduled',
  )
  const detailsUrl = updateWorkspaceUrl(initial, { sessionId: 'ses_101' })
  const parsed = parseWorkspaceUrl(detailsUrl)

  assert.equal(detailsUrl.searchParams.get('scenario'), 'details-error')
  assert.deepEqual(parsed, {
    query: 'maya',
    status: 'scheduled',
    sessionId: 'ses_101',
    isCreating: false,
  })

  const returned = updateWorkspaceUrl(detailsUrl, { sessionId: null })
  assert.equal(returned.searchParams.get('query'), 'maya')
  assert.equal(returned.searchParams.get('status'), 'scheduled')
  assert.equal(returned.searchParams.has('session'), false)
})

test('list presentation distinguishes loading, empty, no-match, error, and populated states', () => {
  const emptyResponse = {
    data: [],
    meta: { page: 1, pageSize: 10, total: 0 },
  }
  const populatedResponse = {
    ...emptyResponse,
    data: [{ id: 'only-record' }] as never[],
    meta: { ...emptyResponse.meta, total: 1 },
  }

  assert.equal(resolveListPresentation({ status: 'loading' }, false), 'loading')
  assert.equal(
    resolveListPresentation({ status: 'success', response: emptyResponse }, false),
    'empty',
  )
  assert.equal(
    resolveListPresentation({ status: 'success', response: emptyResponse }, true),
    'no-matches',
  )
  assert.equal(
    resolveListPresentation({ status: 'error', message: 'Unavailable' }, false),
    'error',
  )
  assert.equal(
    resolveListPresentation(
      { status: 'success', response: populatedResponse },
      false,
    ),
    'populated',
  )
})

test('create failure preserves entered values and maps server start errors', () => {
  const failure = preserveFormAfterFailure(validValues, {
    message: 'Correct the highlighted fields.',
    fieldErrors: { startsAt: 'Choose another start.', title: 'Already used.' },
  })

  assert.deepEqual(failure.values, validValues)
  assert.notEqual(failure.values, validValues)
  assert.equal(failure.errors.date, 'Choose another start.')
  assert.equal(failure.errors.startTime, 'Choose another start.')
  assert.equal(failure.errors.title, 'Already used.')
  assert.equal(failure.formError, 'Correct the highlighted fields.')
})
