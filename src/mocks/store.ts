import sessionsFixture from '../../frontend-accelerator-assessment/fixtures/sessions.json' with {
  type: 'json',
}
import coachesFixture from '../../frontend-accelerator-assessment/fixtures/coaches.json' with {
  type: 'json',
}
import fixtureClock from '../../frontend-accelerator-assessment/fixtures/fixture-clock.json' with {
  type: 'json',
}
import details101 from '../../frontend-accelerator-assessment/fixtures/session-details/ses_101.json' with {
  type: 'json',
}
import details102 from '../../frontend-accelerator-assessment/fixtures/session-details/ses_102.json' with {
  type: 'json',
}
import details103 from '../../frontend-accelerator-assessment/fixtures/session-details/ses_103.json' with {
  type: 'json',
}
import details104 from '../../frontend-accelerator-assessment/fixtures/session-details/ses_104.json' with {
  type: 'json',
}
import details105 from '../../frontend-accelerator-assessment/fixtures/session-details/ses_105.json' with {
  type: 'json',
}
import type {
  CoachSummary,
  CreateSessionRequest,
  SessionDetails,
  SessionStatus,
  SessionSummary,
  SessionsResponse,
} from '../api/types.ts'

const TIMESTAMP_FIELDS = new Set([
  'startsAt',
  'createdAt',
  'updatedAt',
  'cancelledAt',
])

export function rebaseFixture<T>(
  value: T,
  referenceNow: Date,
  actualNow: Date,
): T {
  const delta = actualNow.getTime() - referenceNow.getTime()
  return JSON.parse(
    JSON.stringify(value, (key, nestedValue: unknown) => {
      if (TIMESTAMP_FIELDS.has(key) && typeof nestedValue === 'string') {
        return new Date(new Date(nestedValue).getTime() + delta).toISOString()
      }
      return nestedValue
    }),
  ) as T
}

export interface MockStore {
  coaches: CoachSummary[]
  list(query: string, status?: SessionStatus): SessionsResponse
  details(sessionId: string): SessionDetails | undefined
  create(input: CreateSessionRequest): SessionDetails
}

export function createMockStore(actualNow = new Date()): MockStore {
  const referenceNow = new Date(fixtureClock.referenceNow)
  const sessionSeed = sessionsFixture.data as unknown as SessionSummary[]
  const detailSeed = [
    details101,
    details102,
    details103,
    details104,
    details105,
  ] as unknown as SessionDetails[]
  const coaches = structuredClone(
    coachesFixture.data,
  ) as unknown as CoachSummary[]
  const sessions = rebaseFixture(sessionSeed, referenceNow, actualNow)
  const details = new Map(
    rebaseFixture(detailSeed, referenceNow, actualNow).map((session) => [
      session.id,
      session,
    ]),
  )
  let createdSequence = 0

  return {
    coaches,

    list(query, status) {
      const normalizedQuery = query.trim().toLocaleLowerCase()
      const filtered = sessions.filter((session) => {
        const matchesQuery =
          !normalizedQuery ||
          [
            session.title,
            session.coach.name,
            session.location.name,
            session.location.address,
          ].some((value) =>
            value.toLocaleLowerCase().includes(normalizedQuery),
          )
        return matchesQuery && (!status || session.status === status)
      })

      return {
        data: structuredClone(filtered),
        meta: {
          page: 1,
          pageSize: 10,
          total: filtered.length,
        },
      }
    },

    details(sessionId) {
      const session = details.get(sessionId)
      return session ? structuredClone(session) : undefined
    },

    create(input) {
      createdSequence += 1
      const coach = coaches.find((candidate) => candidate.id === input.coachId)
      if (!coach) {
        throw new Error('Cannot create a session without a fixture coach.')
      }

      const nowIso = new Date(actualNow.getTime() + createdSequence).toISOString()
      const created: SessionDetails = {
        id: `ses_created_${actualNow.getTime()}_${createdSequence}`,
        title: input.title.trim(),
        type: input.type,
        status: 'scheduled',
        startsAt: input.startsAt,
        durationMinutes: input.durationMinutes,
        capacity: input.capacity,
        bookedCount: 0,
        visibility: input.visibility,
        coach: structuredClone(coach),
        location: {
          name: input.locationName.trim(),
          address: input.locationAddress.trim(),
        },
        description: input.description?.trim() || null,
        trainerNotes: input.trainerNotes?.trim() || null,
        createdAt: nowIso,
        updatedAt: nowIso,
        cancellation: null,
      }

      const { description: _description, trainerNotes: _trainerNotes, createdAt: _createdAt, cancellation: _cancellation, ...summary } =
        created
      void _description
      void _trainerNotes
      void _createdAt
      void _cancellation
      sessions.unshift(summary)
      details.set(created.id, created)
      return structuredClone(created)
    },
  }
}

export const mockStore = createMockStore()
