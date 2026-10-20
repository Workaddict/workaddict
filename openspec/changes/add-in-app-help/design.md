## Context

Workaddict is a static React app (hash routes, GitHub Pages, strict CSP with Trusted Types and no inline styles in markup). Help today is limited to ~58 native `title` attributes, the logged-out `TokenHelpPage` (`help-section` cards), the setup wizard texts, and two dismissible hints (`workaddict.rolesHintDismissed`, `workaddict.migrationDismissed`). Per-device choices live in `src/prefs.ts` (`usePref`). `Popover.tsx` already handles outside clicks and Escape; `Modal.tsx` handles focus. `EmptyState` (`components/bits.tsx`) takes `title`, `hint` and children. UI text sits in `src/i18n/de.ts`/`en.ts` (~1200 lines each). There is no analytics and must not be.

## Goals / Non-Goals

**Goals:**
- Four help layers that point to each other: self-explaining UI (labels, empty states) → info tip (one sentence) → help page (how/why) → tour (where is what).
- One switch (hint level) that turns the "chatty" parts off for experienced users without hurting accessibility.
- No new runtime dependency, no CSP change, no change to the data repository.

**Non-Goals:**
- Static, crawlable help pages (the `seo-pages` capability stays as is; help pages link to the existing Clockify import guide instead of duplicating it).
- Videos, a chat bot, or any request to a new host.
- Syncing help state (tour seen, Expert mode) across devices.
- Usage tracking of any kind; feedback stays a link the user chooses to open.

## Decisions

### D1: Hint level as a pref, two values
The hint level lives in `src/hintLevel.ts`, a small external store like `timeFormat.ts` (key `workaddict.hintLevel`, values `guided` | `expert`, default `guided`), exposed through a `useHintLevel()` hook. Components ask `isExpert` instead of reading the stored value themselves. *(Implementation note: planned as a `prefs.ts` entry; an external store was chosen so non-React code such as the welcome-dialog rule can read it and changes apply everywhere without a reload.)*

| Element | guided | expert |
|---|---|---|
| Icon-button `InfoTip` (label) | ✔ | ✔ (accessibility) |
| Glossary term underline + tip | ✔ | plain text |
| "?" buttons, help pages, `?` overlay | ✔ | ✔ |
| Welcome dialog | ✔ | ✘ |
| First steps checklist | ✔ | ✘ |
| "New" markers | ✔ | ✘ |
| Empty state | title + explanation + action | title + action |

*Alternative:* three levels (beginner/normal/expert). Rejected: the user asked for a single "less hints" mode, and every extra level multiplies the test matrix.

### D2: `InfoTip` built on the popover pattern, not on `title`
`<InfoTip content=… learnMore=topic>` wraps a trigger. It opens on pointer hover (after ~300 ms) and on keyboard focus. Touch has no hover, so: a tap on a glossary term toggles its tip (terms are not actions), and an icon button shows its tip on long-press (~500 ms) while a normal tap still runs the button's action. It closes on Escape, blur, pointer leave and outside tap. The tip is linked with `aria-describedby`; icon buttons keep `aria-label`. Position is computed in JS and applied through the CSSOM (`element.style.top = …`), which the CSP allows (only `style` attributes in markup are blocked); this is also what the existing `style={{ … }}` props already do.

"?" help buttons sit next to headings and field labels, never inside them, so the heading or label keeps a clean accessible name; the sign-in form fields therefore use `<label htmlFor>` instead of wrapping labels.

Variants: `<Term id="workspace">Workspace</Term>` reads its sentence from the glossary and renders a dotted underline (plain text in expert mode). `IconButton` gets a `tip` prop so migrating `title=` is mechanical.

`title` stays only where it reveals truncated text (header timer description, workspace chip).

*Alternative:* a tooltip library (Floating UI, Tippy). Rejected: new dependency for ~150 lines of code; positioning needs are simple (above/below, flip at viewport edge).

### D3: Help content as typed data in separate i18n files
`src/i18n/help.en.ts` and `help.de.ts` export a typed `HelpTopic[]` (`id`, `title`, `summary`, `sections: {heading, body, image?}`, `related`, `keywords`) and a `GlossaryEntry[]` (`id`, `term`, `short`, `topic`). A test asserts both languages have the same ids, every `Term id` and `learnMore` used in the code exists, and every `related` link resolves. Bodies are plain strings with a minimal paragraph/list convention rendered by React; no HTML strings (Trusted Types).

*Alternative:* Markdown files plus a parser. Rejected: new dependency, and rendering Markdown to HTML conflicts with Trusted Types.

### D4: Help routes in both route trees
`#/help` (index with search) and `#/help/:topic` are added to the public and the signed-in tree in `App.tsx`. Signed in they render inside `Layout`; signed out inside the `PublicHeader` shell like `TokenHelpPage` does today. `#/token-help` redirects to `#/help/token`; the token topic reuses `TokenChecklist`. Pages are lazy-loaded (`lazyWithReload`) so the help texts don't grow the main bundle.

### D5: Help overlay
A `HelpOverlay` modal (reuses `Modal`) opened by `?` (`keydown`, ignored when focus is in an input, textarea, select or contenteditable, or when a modal is open) and by "Help" in the avatar menu and the public header. It searches topic titles, keywords and glossary terms (simple case- and accent-insensitive substring match, no index library) and lists keyboard shortcuts from one `SHORTCUTS` table, which is also rendered on `#/help/shortcuts`.

### D6: Feedback without tracking
Each help page ends with "Was this helpful?" 👍/👎. 👍 shows "Thanks" locally. 👎 reveals a link to `https://github.com/Workaddict/workaddict/discussions/new?category=q-a&title=Help: <topic>`, opened in a new tab. Nothing is stored or sent by the app. The URL lives in `githubLinks.ts`.

### D7: Tour engine, in-house
A `TourProvider` holds `{ steps, index }`. A step is `{ id, route, target, title, body, roles?, layout? }`. Targets are `data-tour="<id>"` attributes, not CSS classes, so refactors don't break the tour silently (a test renders each page and checks every step's target exists for the roles that see it).

Running a step: navigate to `route` if needed, wait for the target (MutationObserver, max 2 s; missing target → skip step), scroll it into view, draw a spotlight (a full-screen overlay with a cut-out made from four positioned blocks, so no `clip-path` styles in markup are needed) and a bubble with "Back", "Next" / "Done", "End tour" and "Step n of m". Focus moves into the bubble; Escape ends; reduced motion disables the transitions. On phone layout steps with `layout: 'desktop'` are skipped and nav targets point to the bottom navigation.

Steps: timer & manual entry → entry list (click a field to edit) → projects & tags → statistics & export → workspace chip / avatar menu → help ("?" and overlay). Editors and team leaders additionally get Team now and the member filter; team leaders get Team & roles in Settings.

The tour only reads. In a real workspace it never starts a timer or creates an entry; it shows where the buttons are.

*Alternative:* `react-joyride` / `driver.js`. Rejected: dependency and inline-style heavy (CSP), and our step count is small.

### D8: Who sees the welcome dialog
State key `workaddict.tour` (`{ status: 'new' | 'later' | 'done' | 'declined', laterCount }`) per device.
- Shown once after the first successful sign-in on a device, unless Expert mode is on.
- **Existing users**: if the signed-in member already has entries older than 7 days, the device is marked `declined` without a dialog and a one-time toast says "New: help & guided tour in Settings". This prevents the upgrade from greeting every current user.
- "Later" shows the dialog again on the next app load; after the second "Later" it behaves like "No thanks".
- "Show tips again" in Settings sets the status to `later` (with `laterCount` 0), which also skips the existing-user check, so the dialog appears on the next app load even for members with older entries.
- "I know my way around" sets Expert mode and `declined`.
- Demo mode has its own in-memory state: entering the demo offers the tour each time; it does not affect the real welcome dialog. The landing page "Try the demo" gets a secondary "Demo with tour" link (`#/…?tour=1`).

### D9: First steps checklist derived from data
A card on the Tracker computed from loaded data, nothing stored except "dismissed":
1. Tracked first time (any own entry or running timer)
2. Created a project
3. Created a tag
4. Invited the team (owners/team leaders only: more than one member in roles or entries)
5. Optional: connected an AI assistant (only shown as a link; cannot be detected, so it is ticked when the user opens `#/connect-ai`)
Hidden when all non-optional items are done, when dismissed (`workaddict.checklistDismissed`), in Expert mode, and for users who were marked as existing in D8.

### D10: "New" markers by version
A `NEW_FEATURES` table maps feature ids to the app version that introduced them (`{ id: 'project-board', since: '1.1.0', target: 'project-board-link' }`). On the first visit the device stores `workaddict.firstVersion`. A dot shows for features with `since > firstVersion` that are not in `workaddict.seenFeatures`; opening the feature adds it. New users therefore see no dots at all. Hidden in Expert mode.

### D11: Empty states
`EmptyState` gets an optional `action` (`{ label, to | onClick }`) and treats `hint` as the explanation that Expert mode hides. All current usages get a next step (5 after the implementation pass; the earlier count of 11 included lists that render no `EmptyState`) (e.g. no entries → "Start your first timer", no projects → "Create a project", empty stats period → "Pick another period").

### D12: Setup and sign-in screenshots
Screenshots of the relevant GitHub screens go to `public/img/help/<id>.webp`, one per screen (GitHub's UI is English only), with descriptive, translated `alt`. `HelpShot` (`src/features/help/HelpShot.tsx`) renders a screenshot only when its id is listed in `AVAILABLE_SHOTS` (`src/features/help/shots.ts`), so missing files never cause broken images or 404s; if a listed file fails to load, the alt text is shown as a caption. Each screenshot is cropped to the controls that matter (two crops stacked when they are far apart), stored at about twice its display size, and shown at a fixed size from `SHOT_SIZES` so GitHub's text appears at roughly the app's small text size; it only shrinks on narrow screens. They are used in the setup wizard steps, the join flow and the token topic. Glossary terms in these pages use `Term` and follow the normal Expert mode rule.

## Risks / Trade-offs

- [Help texts drift from the UI] → id consistency tests (D3), tour target test (D7), and the tasks list texts in one review pass per page.
- [Screenshots go stale when GitHub changes its UI] → keep them few, crop to the relevant control, and date them in the file name; the text must work without the image.
- [Tooltips on touch conflict with button taps] → icon buttons show tips on long-press only; terms toggle on tap (they are not actions).
- [Tour breaks on narrow screens] → step `layout` filter, phone-width test at 320 px, missing targets are skipped instead of blocking.
- [Existing users get annoyed] → D8 heuristic plus Expert mode; nothing pops up for them except one toast.
- [Help routes enlarge the bundle] → lazy-loaded help pages and texts; the glossary short texts are the only part in the main bundle.
- [Overlay key `?` collides with typing] → ignored in editable fields and when Ctrl/Alt/Meta is pressed.

## Migration Plan

Pure client-side addition; no data migration. `#/token-help` keeps working through the redirect. Rollback is a revert; leftover `localStorage` keys are harmless.

## Open Questions

- Category name in GitHub Discussions: Discussions must be enabled on `Workaddict/workaddict` with a "Q&A" category before release.
