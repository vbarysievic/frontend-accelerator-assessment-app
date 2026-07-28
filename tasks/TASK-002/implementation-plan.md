# TASK-002 Implementation Plan

## Current behavior

The selected application is the root Vite React starter. It has no sessions UI, API client, MSW startup, routing, or test script.

## Intended behavior

Deliver the approved sessions list/search/status flows, deep-linkable details, create form and recovery states, deterministic MSW scenarios, responsive layouts, accessibility behavior, and essential pure behavior tests.

## Ordered file plan

### 1. Domain and client contracts

- Create `src/api/types.ts`: fixed contract types plus narrowed `ApiFailure`.
- Create `src/api/sessionsClient.ts`: the only production fetch boundary, URL encoding, payload guards, error normalization, and four client methods.
- Create `src/sessions/sessionDomain.ts`: supported enums, local date/time conversion, create validation, date/number formatting helpers, and shared status labels.
- Create `src/sessions/urlState.ts`: pure parse/write helpers for query, status, details, create, and preserved scenario state.

Contract: UI receives typed domain/API values; fixture/scenario knowledge does not cross this boundary.

### 2. MSW boundary

- Create `src/mocks/store.ts`: import supplied fixtures read-only, clone/rebase timestamps once, filter list requests, validate/create records, and maintain the in-memory list/details store.
- Create `src/mocks/scenarios.ts`: narrow the supported URL scenario selector.
- Create `src/mocks/handlers.ts`: implement required endpoint handlers and fixed scenario failures.
- Create `src/mocks/browser.ts`: start the browser worker with the selected scenario.
- Modify `src/main.tsx`: await mock startup in development before rendering.
- Generate `public/mockServiceWorker.js` with the installed MSW CLI.

Contract: ordinary `/api` requests work offline; presentation imports neither MSW nor fixtures.

### 3. Application state and views

- Replace `src/App.tsx`: own URL state, list request lifecycle, retry/refresh behavior, selection/create navigation, and view composition.
- Create `src/sessions/SessionWorkspace.tsx`: page header, filters, async list states, desktop table, mobile cards, result count, and selected row state.
- Create `src/sessions/SessionDetails.tsx`: keyed request lifecycle, loading/error/retry, full detail content, focus movement, and return action.
- Create `src/sessions/CreateSessionForm.tsx`: coaches lifecycle, form state/validation, pending lock, server error mapping, dirty-navigation protection, success/discoverability actions.
- Create `src/sessions/StatusBadge.tsx`: explicit textual status presentation.

Contracts:

- URL is the sole owner of filters and selected view.
- Create success returns `SessionDetails`, refreshes list, and exposes the created identifier even when filters hide it.
- Aborted reads never replace current UI with an error.

### 4. Styling and document shell

- Replace `src/index.css`: tokens, reset, layout shell, form/control/focus/live state primitives, and reduced-motion behavior.
- Replace `src/App.css`: responsive desktop rail/table/details grid and mobile header/card/detail/form reflow.
- Modify `index.html`: product title, description, theme color, and correct language.
- Remove unused starter asset imports; leave unrelated physical assets untouched unless the final diff shows they are generated-only clutter.

### 5. Essential tests

- Create `src/sessions/sessionDomain.test.ts`: title/range/future validation and local-to-UTC request mapping.
- Create `src/mocks/store.test.ts`: case-insensitive title/coach/location filtering, status filtering/total, uniform clock rebasing, and stateful create visibility.
- Add package script `test` using `node --test` on the explicit test files with Node 24 TypeScript stripping.

These tests protect boundary behavior. DOM interaction and responsive accessibility remain covered by the required real-browser evidence.

## Verification commands discovered

Run from the repository root:

- `npm test`
- `npm run lint`
- `npm run build`

Browser verification must first run `node toolchain/bin/doctor.mjs --json`, then use only `node toolchain/bin/agent-browser.mjs` against the emitted dev-server URL.

## Browser verification targets

- Normal: desktop 1440 × 900 and mobile 390 × 844, screenshots and accessibility snapshots.
- Search/status, details open/return, and create validation/pending/success/discoverability.
- Empty/no-match distinction.
- List error plus details or coaches error recovery.
- Create server failure with preserved input.
- Console, page errors, relevant request statuses, navigation, and horizontal overflow.

## Dependency and rollback considerations

- No dependency changes are planned.
- All production changes are confined to the root app plus `public/mockServiceWorker.js`; rollback is a normal file-level revert.
- Scenario selection is URL-based assessment infrastructure and can be removed independently of the client/presentation boundaries.

## Readiness

Architecture, API, UI, dependency, test, and verification decisions are resolved. The plan is ready for `coder`.
