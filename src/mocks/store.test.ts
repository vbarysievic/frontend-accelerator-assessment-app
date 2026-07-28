import assert from 'node:assert/strict'
import test from 'node:test'
import { createMockStore, rebaseFixture } from './store.ts'

const fixedNow = new Date('2026-07-28T12:00:00Z')

test('list search is case-insensitive across title, coach, and location fields', () => {
  const store = createMockStore(fixedNow)

  assert.deepEqual(
    store.list('SHOOTING').data.map((session) => session.id),
    ['ses_101'],
  )
  assert.equal(store.list('ethan cole').meta.total, 2)
  assert.equal(store.list('market avenue').meta.total, 2)
})

test('list status filtering happens before total is calculated', () => {
  const response = createMockStore(fixedNow).list('', 'scheduled')

  assert.equal(response.meta.total, 2)
  assert.ok(response.data.every((session) => session.status === 'scheduled'))
})

test('fixture rebasing shifts all timestamp fields by one uniform delta', () => {
  const rebased = rebaseFixture(
    {
      startsAt: '2026-07-27T13:00:00Z',
      nested: {
        updatedAt: '2026-07-27T11:00:00Z',
        untouched: '2026-07-27T11:00:00Z',
      },
    },
    new Date('2026-07-27T12:00:00Z'),
    fixedNow,
  )

  assert.equal(rebased.startsAt, '2026-07-28T13:00:00.000Z')
  assert.equal(rebased.nested.updatedAt, '2026-07-28T11:00:00.000Z')
  assert.equal(rebased.nested.untouched, '2026-07-27T11:00:00Z')
})

test('successful create becomes available through list and details reads', () => {
  const store = createMockStore(fixedNow)
  const created = store.create({
    title: '  New Skills Lab ',
    type: 'training',
    startsAt: '2030-01-01T10:00:00.000Z',
    durationMinutes: 60,
    coachId: 'coach_01',
    locationName: ' South Court ',
    locationAddress: ' 7 Lake Road ',
    capacity: 10,
    visibility: 'public',
    description: '',
    trainerNotes: ' Set out cones. ',
  })

  assert.equal(store.list('new skills').data[0]?.id, created.id)
  assert.equal(store.details(created.id)?.trainerNotes, 'Set out cones.')
  assert.equal(created.coach.name, 'Maya Brooks')
  assert.equal(created.bookedCount, 0)
})
