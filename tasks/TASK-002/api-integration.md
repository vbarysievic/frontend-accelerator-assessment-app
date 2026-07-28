# TASK-002 API Integration

## Contract classification

### Confirmed

- Base path `/api`.
- Types, required request/response fields, endpoint methods, status codes, error codes, filtering semantics, fixture sources, and fixture clock policy in `API_CONTRACT.md`.
- Required endpoints: list sessions, get session details, list coaches, and create session.
- Required scenarios: `normal`, `empty`, `list-error`, `details-error`, `coaches-error`, and `create-error`.
- A successful create is stateful in memory and must be returned by later list and details requests.

### Frontend decisions

- Use a small `fetch` client; no generated client or request library exists.
- Treat all success payloads as `unknown` and narrow them with local runtime guards before exposing typed data.
- Normalize all non-success responses to `ApiFailure { code, message, fieldErrors?, status }`.
- Map malformed JSON, invalid success data, and network failure to `CLIENT_UNAVAILABLE` with safe user-facing copy.
- Do not retry automatically, cache persistently, or claim idempotency. Abort only superseded GET requests.
- Pass `query` and `status` to the list endpoint. Do not filter the fixture collection in presentation code.
- Convert local create date/time to an ISO UTC `startsAt` at the form/domain boundary.
- Use `?scenario=<name>` as the mock-startup selector. The selector is provisional assessment infrastructure, not an API field or end-user feature.

### Assumed

- Location search covers both location name and address inside the MSW handler.
- Empty optional strings normalize to `null` in create requests.
- The new session begins with `scheduled` status and `bookedCount: 0`; these response-only fields are assigned by the mock because the fixed request contains neither.

### Proposed or blocked

- None. Optional cancellation, permissions, pagination, type filtering, and conflict scenarios are excluded from TASK-002.

## Client boundary

`sessionsClient` exposes:

```ts
listSessions(input: { query: string; status?: SessionStatus }, signal?: AbortSignal)
getSession(sessionId: string, signal?: AbortSignal)
listCoaches(signal?: AbortSignal)
createSession(input: CreateSessionRequest)
```

Only this module calls `fetch`. It:

- constructs fixed `/api` URLs;
- sends and accepts JSON;
- parses `ApiError`;
- narrows successful payloads;
- throws `ApiFailure`;
- lets `AbortError` remain distinguishable for effect cleanup.

UI modules depend on domain types and these methods, never on response internals or MSW.

## Mock boundary

- `src/mocks/browser.ts` starts the service worker and reads the supported scenario from the URL once at startup.
- `src/mocks/handlers.ts` owns request handlers and scenario-specific responses.
- `src/mocks/store.ts` clones imported fixtures, computes one startup clock delta, recursively shifts the four contracted timestamp fields, and maintains a details map plus list.
- List requests validate query parameters, perform case-insensitive search across title, coach name, location name, and location address, apply exact status filtering, then calculate `meta.total`.
- Create validates the contract again at the server boundary, resolves `coachId` against the coach fixture, generates an identifier and timestamps, stores summary/details, and returns `201`.
- Mock failures return the exact supplied error bodies. Presentation code is unaware of which scenario produced them.

## State and error matrix

| Operation | Pending UI | Success | Empty/validation | Contract/server failure | Recovery |
| --- | --- | --- | --- | --- | --- |
| List sessions | Stable loading rows and “Loading sessions…” announcement | Render returned rows and total | `data: []` with no filters → no sessions; with filters → no matches | `INVALID_FILTER` or `SESSIONS_UNAVAILABLE` → list error panel | Retry; clear filters for no matches |
| Session details | Details panel/view loading state | Render complete details | `SESSION_NOT_FOUND` → unavailable details message | `SESSION_DETAILS_UNAVAILABLE` or client failure → details error | Retry or back to preserved list |
| Coaches | Disable coach selection and submit while loading | Populate options | Empty coach data → no coach choices, submit unavailable | `COACHES_UNAVAILABLE` or client failure → inline form section error | Retry coaches request; preserve other values |
| Create session | Disable submit only after request starts; announce “Creating…” | Announce success, refresh list, expose “Open session” | Client validation blocks request; `VALIDATION_FAILED` maps `fieldErrors` and form error | `CREATE_SESSION_FAILED` or client failure preserves all values | Correct fields or retry |

## Error-to-copy rules

- Prefer the contracted safe `error.message`.
- Field errors appear beside matching controls and the first invalid control receives focus after client/server validation.
- Unknown fields never produce raw JSON in the UI; retain a form-level message.
- Abort errors caused by navigation or superseded GETs produce no alert.
- Failed responses remain visible until retry, navigation, or a new request begins.

## Test strategy

- Pure tests: create validation/local-to-UTC mapping, fixture clock rebasing, list query/status filtering, and API error normalization.
- Mock integration tests: stateful creation becomes visible to list/details and required scenario mappings return fixed codes.
- Real browser: request URLs/statuses, loading/empty/error states, pending duplicate prevention, create preservation/success/discoverability, and console/page-error checks.

## External confirmation

No backend confirmation is required because the assessment contract is explicitly fixed. Any implementation-time desire to alter it must be recorded as a proposal and stopped for evaluator approval.
