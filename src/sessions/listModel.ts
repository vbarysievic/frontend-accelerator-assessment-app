import type { SessionsResponse } from '../api/types.ts'

export type ListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; response: SessionsResponse }

export type ListPresentation =
  | 'loading'
  | 'error'
  | 'empty'
  | 'no-matches'
  | 'populated'

export function resolveListPresentation(
  state: ListState,
  hasFilters: boolean,
): ListPresentation {
  if (state.status === 'loading') {
    return 'loading'
  }
  if (state.status === 'error') {
    return 'error'
  }
  if (state.response.data.length > 0) {
    return 'populated'
  }
  return hasFilters ? 'no-matches' : 'empty'
}
