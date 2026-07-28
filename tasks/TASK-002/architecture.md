# TASK-002 Frontend Architecture

## Decision

Implement the assessment as one feature-oriented React application with four boundaries:

1. `src/api/`: fixed transport types, fetch client, and normalized API errors.
2. `src/mocks/`: MSW-only fixture loading, clock rebasing, scenario selection, validation, and in-memory mutation.
3. `src/sessions/`: session domain formatting/validation plus list, details, and create UI.
4. `src/App.tsx`: application wiring, URL-backed navigation state, and remote-state ownership.

Dependencies point inward from application wiring and UI to the client/domain boundaries. Production-facing UI never imports fixtures, MSW, or scenario identifiers.

## Routing and list context

- Do not add a routing dependency for this single-workspace assessment.
- Use the browser History API through a small `useUrlState` adapter.
- Shareable URL state:
  - `query`: search text;
  - `status`: one supported status;
  - `session`: selected session identifier;
  - `create`: present only while the create view is open;
  - `scenario`: assessment infrastructure read only by mock startup, never by presentation components.
- The list remains the base route. Selecting a session adds `session`; opening create adds `create`; closing either calls history back when opened in-app and otherwise removes the view parameter. Query and status remain intact.
- A direct details URL loads the list shell and selected details. A direct create URL loads the create view. This provides deep links without inventing additional server routes or requiring Vite history fallback configuration.

## State ownership

- URL state owns search, status, selected session, create visibility, and the infrastructure scenario token.
- `App` owns remote request state for the list and coordinates refresh after creation.
- `SessionDetails` owns only the selected details request lifecycle keyed by `sessionId`.
- `CreateSessionForm` owns form values, client validation errors, submission status, and returned API errors.
- The MSW handler module owns rebased fixture data and successfully created sessions for the lifetime of the page.
- Derived values such as “filters active,” “created session hidden,” capacity percentage, formatted times, and empty-state kind are computed, not synchronized into duplicate state.

## Data and failure flow

```text
URL/user event → App/feature controller → sessionsClient → fetch /api/*
                                             ↓
                                      normalized ApiFailure

Browser request → MSW scenario boundary → rebased/stateful fixture store
```

- Each request uses `AbortController`; effects abort superseded list/details reads and ignore aborts as user-visible failures.
- No automatic retries. Errors expose explicit retry actions so deterministic scenarios remain observable.
- List failure is contained within the list work surface; details and coaches failures are contained within their own views.
- Create failure preserves local form state. A successful create triggers one list reload and retains the created details returned by the API for the success action.
- Malformed success payloads are treated as a generic integration failure at the client boundary rather than allowed to spread unchecked values through the UI.

## Module and component implications

- Prefer feature-local components over a generic design-system layer.
- Use semantic links/buttons and explicit view components instead of boolean-heavy “mode” components.
- The desktop details panel and mobile details view render the same semantic details content with CSS reflow; they are not separate stateful implementations.
- The create form is a dedicated URL-backed view, not a modal, avoiding focus trapping and unsaved modal teardown complexity. Closing it returns to the preserved list query/status.
- No global context or state library is justified for one workspace. Props and feature hooks keep ownership visible.

## Performance, security, and testability

- Five default rows do not justify virtualization, memoization infrastructure, or a server-state library.
- Search requests are debounced briefly; superseded requests are aborted.
- User-entered and fixture content is rendered as text only. No HTML injection, credentials, persistence, analytics, or external network calls are introduced.
- Pure domain functions cover validation, timestamp rebasing, filter semantics, and URL transitions under Node's built-in TypeScript-capable test runner.
- Browser verification supplies rendered behavior and accessibility evidence that the dependency-free unit harness cannot provide.

## Dependency decision

- Add no runtime or test dependency.
- Use the already-required React, Vite, TypeScript, and MSW packages.
- Use Node 24's built-in `node:test` runner for essential pure behavior tests. Trade-off: it does not provide DOM-level component tests, so the required real-browser matrix remains essential evidence.

## Risks and mitigations

- History API code can drift from UI state: centralize parse/write logic and test it as pure functions.
- Strict Mode can duplicate initial effects: abort cleanup and request identity checks prevent stale commits; POST is initiated only by a user submit event.
- Scenario query state could leak into presentation: only mock bootstrap reads it; UI receives ordinary HTTP results.
- Directly loaded details may have no previous in-app entry: the close action deterministically removes `session` while preserving list filters.

## Rejected alternatives

- React Router: useful at larger route scale, but a new dependency for two parameterized views is unnecessary.
- A global/server-state library: adds a difficult-to-justify abstraction for four endpoints and five rows.
- Client-only fixture filtering: violates the fixed mock contract.
- Modal details/create: increases focus-trap and mobile complexity without improving the required flow.

## Readiness

The architecture decisions required for TASK-002 are resolved. No human dependency choice remains.
