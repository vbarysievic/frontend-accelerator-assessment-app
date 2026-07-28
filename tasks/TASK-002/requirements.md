# TASK-002 — Training Sessions Workspace Requirements

## Goal

Give a busy training-business operator one responsive, accessible workspace in which they can quickly find scheduled work, inspect complete session information without losing list context, and create a session with clear validation and outcome feedback.

## Users and outcomes

- Primary user: a trainer operating multiple basketball programs across coaches and locations.
- Problem: session information and scheduling actions are currently split across calendars, spreadsheets, and chat.
- Desired outcome: the trainer can scan session state and capacity, locate a specific session, inspect its details, and create a valid session without ambiguity about failures or success.

## Scope

### Sessions workspace

- Provide a route or equivalent navigable sessions view.
- For every result, show title, type, status, local start time, duration, coach, location, capacity, and booked count.
- Search sessions by title, coach name, or location.
- Filter by one status: scheduled, full, cancelled, or completed.
- Clear all active filters in one action.
- Communicate every status with text or another non-color cue.
- Allow a session to be opened while retaining the current list context for return.

### Session details

- Show all list information plus description, trainer notes, capacity summary, coach contact summary, created timestamp, and last-updated timestamp.
- Make the details experience keyboard accessible.
- Make details deep-linkable when supported by the selected router.
- Returning from details restores the prior list state.

### Create session

- Collect title, session type, date, start time, duration, coach, location name, location address, capacity, visibility, and optional description and trainer notes.
- Load coach choices from the contracted coaches endpoint.
- Do not allow the UI to imply that a valid coach can be selected or submitted when coaches cannot be loaded.
- Validate:
  - title after trimming: 3–80 characters;
  - combined date and time: a valid future instant in the user's local timezone;
  - duration: integer, 30–240 minutes;
  - capacity: integer, 1–100;
  - coach: required;
  - location name after trimming: 2–80 characters;
  - location address after trimming: 3–120 characters;
  - trainer notes: at most 500 characters.
- Prevent accidental duplicate submission while the create request is pending.
- Associate field errors programmatically with their controls and place them near the relevant controls.
- Show a useful form-level error when a failure is not adequately represented by field errors.
- Preserve entered values after an API failure.
- Announce mutation feedback appropriately.
- On success, clearly confirm creation and make the new session available through subsequent list and details reads.
- If active filters hide the new session, offer a clear action to open it or reset the relevant filters.

### Mock API boundary

- Use `msw@2.14.6` to serve ordinary HTTP requests to the fixed `/api` contract.
- Implement:
  - `GET /api/sessions` with case-insensitive `query` matching across title, coach name, and location, exact supported `status` filtering, and filtered `meta.total`;
  - `GET /api/sessions/:sessionId`;
  - `GET /api/coaches`;
  - `POST /api/sessions` with contract validation and stateful in-memory creation.
- Keep transport calls behind a replaceable frontend client boundary; presentation components must not import fixtures or branch on mock scenario names.
- Preserve the supplied endpoint paths, required request fields, response shapes, and error codes.
- At mock startup, shift every fixture `startsAt`, `createdAt`, `updatedAt`, and `cancelledAt` by the difference between the actual current instant and `fixtures/fixture-clock.json` `referenceNow`.
- Keep fixture rebasing inside the mock boundary. Production-facing code receives valid ISO 8601 UTC strings and displays them in the user's local timezone.
- Support deterministic selection of `normal`, `empty`, `list-error`, `details-error`, `coaches-error`, and `create-error` at the mock boundary.

## Acceptance criteria

1. Given the normal scenario, when the sessions workspace finishes loading, five supplied sessions are available and each result exposes every required list field with timestamps formatted in the user's local timezone.
2. Given a search term matching a session title, coach name, or location with different letter casing, when the query is applied, only matching sessions are returned and the displayed result count reflects the filtered `meta.total`.
3. Given one selected status, when filtering completes, only sessions with that exact status are shown; clearing filters restores the unfiltered result.
4. Scheduled, full, cancelled, and completed states remain distinguishable when color is unavailable.
5. Given a matching session, when the user opens it and then returns, all required detail fields are available and the prior search/filter list context is restored.
6. Details can be opened, operated, and exited using a keyboard; when routing permits, a details URL can be loaded directly.
7. The workspace exposes distinct, useful, and recoverable UI for initial loading, a populated result, no sessions existing, filters producing no matches, list failure, and details failure.
8. The create form exposes every required and optional field and uses coaches returned from `GET /api/coaches`.
9. Each invalid create value described in the validation rules blocks submission and produces an associated field-level message; a local date/time that does not resolve to a future instant is rejected.
10. Given the coaches-error scenario, the form communicates that coach choices could not be loaded and does not permit a seemingly valid coach submission.
11. While creation is pending, repeated activation does not send duplicate requests and the pending state remains understandable without layout instability.
12. Given a successful valid submission, the user receives announced success feedback and can discover the created session through both the list and its details; when current filters hide it, an explicit open/reset action is available.
13. Given validation returned by the API, field errors are shown at the relevant controls and any remaining useful message is shown at form level.
14. Given the create-error scenario, all entered values remain present, a useful recovery message is shown, and the user can retry.
15. Each required deterministic scenario is selectable outside presentation components and produces its contracted success or error response.
16. Search and status filtering occur in the `GET /api/sessions` mock handler before `meta.total` is calculated rather than by filtering the complete fixture list only in the UI.
17. After successful creation, the in-memory mock returns normalized submitted values, the selected fixture coach, generated identifiers/timestamps, and the new record from later list and details requests.
18. Fixture timestamps preserve their relative ordering after one uniform startup shift; automated tests can freeze time and apply the same transformation.
19. At 1440 × 900 and 390 × 844, all required content and actions remain reachable, do not overlap, and do not require horizontal page scrolling; mobile uses at least 44px targets for its controls.
20. The required flows support complete keyboard operation, visible focus, semantic controls and labels, useful headings, programmatically associated validation errors, announced status/mutation feedback, sufficient contrast, and reduced motion when motion is used.
21. Focused behavior tests cover search/status filtering, create validation and success, create server failure with preserved input, initial loading, empty/no-match distinctions, and at least one list or details request error.
22. The project remains runnable with mocked responses and no network access after setup, and no backend, secrets, real personal data, analytics, or production credentials are introduced.

## Required evidence constraints

- Production implementation must not begin until requirements, material architecture/API/UI decisions, and a file-level implementation plan have been recorded in this task workspace.
- Later verification must follow `frontend-accelerator-assessment/EVIDENCE_PROTOCOL.md`, including automated command evidence, the required desktop/mobile browser matrix, deterministic scenario evidence, runtime error observations, workflow STOP boundaries, and developer-reported timing.
- The assessment input directory `frontend-accelerator-assessment/` must remain unchanged.

## Constraints

- React 19, TypeScript 5.9 or newer, Vite 7 or newer, npm, and `msw@2.14.6`.
- Frontend only; do not implement a backend.
- Avoid unrelated source or configuration rewrites.
- Any additional dependency requires a recorded reason and trade-off.
- Server/request state must have a deliberate owner and no duplicated source of truth.
- Date parsing and normalization must occur at a clear boundary.
- Use the supplied visual reference for hierarchy and density and the design tokens as the fallback palette/spacing direction.
- Optimize for an operational, calm, scan-friendly tool rather than marketing composition or decorative presentation.

## Non-goals

- Backend implementation, authentication, registration, payments, real notifications, analytics, or production deployment.
- Drag-and-drop scheduling, recurring rules, attendee management, or organization administration.
- Cancellation, read-only permissions, background refresh, tablet-specific behavior, session-type filtering, URL-synchronized filters, pagination, optimistic updates, calendar views, saved filters, or optional mock scenarios.
- Introducing internationalization; centralizing UI copy remains optional.
- Pixel-perfect reproduction of the supplied SVG reference.

## Facts

- The external API contract and its error codes are fixed by `frontend-accelerator-assessment/API_CONTRACT.md`.
- The supplied fixture set contains five default sessions and matching details.
- Search and status filtering are server-boundary behaviors in the MSW handler.
- A successful create must be stateful in memory and visible to subsequent list/details reads.
- The current application is the only frontend candidate in the repository and is still the Vite starter UI.
- The installed package versions satisfy or exceed the required React, TypeScript, Vite, and MSW versions.

## Assumptions

- “Location” search matches both the supplied location name and address because both represent the session's location; the API/UI specialist should record the final interpretation.
- Description has no specified maximum length beyond what the fixed contract accepts.
- Authentication and permissions are absent, so required create controls are available to the primary trainer.
- English copy is acceptable because i18n is explicitly out of scope.
- The normal fixture list order may be retained unless a specialist records a clearer deterministic ordering; no sort behavior is required.

## Open questions and decision owners

- `architect`: choose routing and state ownership, including how list context survives details navigation and how a deep link behaves when there is no prior list history.
- `api-integration`: define client/view-model boundaries, error normalization, create cache/list refresh behavior, mock scenario selection, and the precise location search fields without changing the contract.
- `ui-designer`: choose route, drawer, or modal details composition; create-flow placement; responsive list representation; focus restoration; and the exact empty/error/success recovery interactions.
- `writing-plans`: after the specialist decisions above are recorded, produce the file-level implementation and verification plan.

## Readiness

The product scope and independently testable behavior are defined. The task is ready for architecture, API-integration, and UI-design decisions, but not yet ready for production implementation. After those decisions are recorded, invoke `writing-plans` manually.
