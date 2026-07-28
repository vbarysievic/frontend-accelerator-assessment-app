export type RequiredScenario =
  | 'normal'
  | 'empty'
  | 'list-error'
  | 'details-error'
  | 'coaches-error'
  | 'create-error'

const REQUIRED_SCENARIOS = new Set<RequiredScenario>([
  'normal',
  'empty',
  'list-error',
  'details-error',
  'coaches-error',
  'create-error',
])

export function readScenario(
  search = window.location.search,
): RequiredScenario {
  const value = new URLSearchParams(search).get('scenario')
  return REQUIRED_SCENARIOS.has(value as RequiredScenario)
    ? (value as RequiredScenario)
    : 'normal'
}
