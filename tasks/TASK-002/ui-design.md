# TASK-002 Responsive Interaction Model

## Direction

Use the supplied sessions dashboard reference for hierarchy and density and `DESIGN_TOKENS.md` for color, spacing, typography, shape, and focus. The interface is a calm operational workspace: compact header, prominent create action, one filter bar, one scan surface, restrained borders, and no decorative hero or nested-card composition.

## Information hierarchy and flow

1. Skip link to the main workspace.
2. Compact dark product rail on desktop; compact brand header on mobile.
3. Page heading and short operational description.
4. Primary “Create Session” action.
5. Search, single status filter, and clear-filters action.
6. Result count and session collection.
7. Selected session details beside the collection on desktop or as the primary content view on mobile.

Opening a row updates the URL and displays details without discarding query/status. Create is a dedicated URL-backed view with “Back to Sessions.” Neither flow behaves as a modal, so ordinary document focus and back navigation remain predictable.

## Desktop: 1440 × 900

- Fixed 224px navigation rail and fluid main region.
- Header action aligns opposite the heading.
- Filter controls sit in one bordered surface.
- Results and details form a two-column grid: flexible session table plus approximately 320px details panel.
- Use a semantic table with columns for session/location/type, start/duration, coach, capacity, and status. The title is an actual link/button target with a visible hover and focus state.
- The selected row uses background plus an accessible current-state indicator.
- Details remain independently readable when content is long and the page scrolls naturally.

## Mobile: 390 × 844

- Replace the rail with a compact top brand bar.
- Stack heading, create action, search, status, and clear action.
- Render results as full-width semantic articles/list items rather than forcing the desktop table horizontally.
- Each card shows title/status first, then type/location, local date/time/duration, coach, and booked/capacity.
- Details and create each replace the collection content while preserving the top brand bar and a first-position “Back to Sessions” control.
- Use 16px page padding and at least 44px interactive targets. Long titles, addresses, notes, and emails wrap without horizontal overflow.

## Details interaction

- Desktop: inline complementary panel with “Session Details” heading; selecting another result updates it.
- Mobile/direct view: main content details page.
- On open, move focus to the details heading. On close after an in-app selection, restore focus to the triggering session link when it still exists; direct deep links focus the page heading.
- Escape returns to the list only when details were opened during the current page session; browser Back always follows URL history.
- Show textual status, full date/time, duration, coach name/email, location/address, visibility/type, capacity progress expressed in text, description, trainer notes (or “No trainer notes”), created, and updated times.
- Details loading and failure occupy the same panel region. Failure offers “Retry Details” and “Back to Sessions.”

## Create interaction

- Use one-column grouped sections: session basics, schedule, coach/location, capacity/visibility, optional notes.
- Labels remain visible; do not rely on placeholders.
- Date and time are separate native controls and are interpreted in local time.
- Numeric fields use number inputs with appropriate min/max/step and input modes.
- Coach loading keeps the control disabled. Coach failure shows an inline alert and “Retry Coaches”; submit remains unavailable.
- On invalid submit, render inline messages, announce a summary, and focus the first invalid control.
- During submission, keep dimensions stable, change the label to “Creating…”, disable repeat submission, and leave other values visible.
- Server failure uses an alert above actions; fields remain unchanged.
- Success uses a polite status region with the created title and actions: “Open Session” and, when hidden by filters, “Show in Sessions.” A standard “Back to Sessions” action remains available.
- Warn through `beforeunload` only while the create form is dirty; in-app back uses a lightweight confirmation before discarding dirty values.

## State matrix

| State | Visible behavior | Primary recovery |
| --- | --- | --- |
| Initial loading | Skeleton-like stable rows/cards plus “Loading sessions…” live text | None |
| Populated | Count, scan collection, status labels, open actions | Search/filter/create |
| No sessions | “No sessions yet” and create action | Create session |
| No matches | Active-filter summary and “No sessions match…” | Clear filters |
| List error | Alert with useful message | Retry sessions |
| Details loading/error | Stable panel loading or alert | Retry details/back |
| Coaches loading/error | Disabled coach selector or inline alert | Retry coaches |
| Create validation | Inline associated errors and focused first invalid field | Correct values |
| Create pending | Stable disabled submit with “Creating…” | Wait |
| Create failure | Form-level alert, all values preserved | Retry |
| Create success | Announced confirmation and discoverability actions | Open/reset/back |

## Accessibility

- Semantic landmarks, one `h1`, ordered section headings, table/list semantics, buttons for actions, and links/history semantics for navigation.
- Every input has a visible label, `name`, sensible autocomplete setting, and error association using `aria-describedby`/`aria-invalid`.
- Status badges always contain text; capacity is not conveyed by a bar alone.
- A 2px offset focus ring uses the blue focus token.
- Loading/status updates use polite live regions; failures use alerts.
- Use `Intl.DateTimeFormat` and `Intl.NumberFormat`.
- Motion is unnecessary; any small transition is limited to color/background and removed under `prefers-reduced-motion`.
- Contrast follows the token intent. No hover-only actions or color-only meaning.

## Reuse candidates

- `StatusBadge`, `AsyncState`, and the shared semantic details content.
- Keep table row and mobile card as explicit compositions over the same session data rather than one boolean-heavy component.

## Resolved decisions

- Details: persistent side panel on desktop, dedicated content view on mobile/direct navigation.
- Create: dedicated content view at URL state, not a modal.
- Mobile results: cards/list; desktop results: semantic table.
- Visual direction: supplied operational reference/tokens; no additional visual choice required.

## Readiness

The responsive interaction model and all required user-visible states are implementation-ready.
