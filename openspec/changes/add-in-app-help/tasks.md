## 1. Foundation

- [x] 1.1 `hintLevel.ts` (external store, instead of `prefs.ts`): `hintLevel: ['guided', 'expert']`; `useHintLevel()` hook with `isExpert`; tests for default and persistence
- [x] 1.2 Help content types (`HelpTopic`, `GlossaryEntry`) and empty `help.en.ts` / `help.de.ts`, loaded on demand; glossary short texts in the main bundle
- [x] 1.3 Consistency test: same topic and glossary ids in both languages, related links resolve, every `Term id` / `learnMore` / `help` id used in `src/` exists

## 2. Info tips

- [x] 2.1 `InfoTip` component: hover delay, focus, Escape/blur/outside close, `aria-describedby`, viewport-aware positioning via CSSOM; tests incl. 320 px
- [x] 2.2 Touch behavior: tap toggles terms, long-press shows icon-button tips while a tap still runs the action; tests
- [x] 2.3 `Term` component (dotted underline + glossary sentence + "Learn more"; plain text in Expert mode)
- [x] 2.4 `tip` prop on icon buttons; replace `title=` on every icon-only button (Layout, ThemeToggle, Popover, DataProblemsNotice, MigrationNotice, tracker, stats, settings); keep `title` only for truncated text; test that no icon-only button has `title`
- [x] 2.5 Mark glossary terms (first occurrence per page) in Tracker, Stats, Projects & Tags, Settings, sign-in, setup and join

## 3. Help center

- [x] 3.1 `src/features/help/`: `HelpIndexPage`, `HelpTopicPage` (sections, images, related, feedback), unknown-topic notice; lazy-loaded
- [x] 3.2 Routes `help` and `help/:topic` in the public and signed-in trees; `token-help` redirects to `help/token`; move `TokenHelpPage` content into the `token` topic (keep `TokenChecklist`)
- [x] 3.3 Glossary page with anchors, `?term=` scroll + highlight
- [x] 3.4 Feedback block (👍 thanks, 👎 Discussions link from `githubLinks.ts`), no storage, no request; test
- [x] 3.5 `HelpButton` ("?", accessible label "Help: <topic>"); place at Team now, Team & roles, Work groups, issue field, project board link, Connect AI, Export menu, Clockify import, Time zone, Workspaces, sign-in token field (new tab there)
- [x] 3.6 Write topics EN + DE: token, workspaces, roles, work-groups, team-now, issue-links, connect-ai, export, clockify-import (link to SEO guide), time-zone, shortcuts, glossary; German per "Consistent German terminology"
- [x] 3.7 Tests: signed in/out rendering, redirect, unknown topic, 320 px German, no CSP-relevant markup (no HTML strings)

## 4. Help overlay

- [x] 4.1 `SHORTCUTS` table and `HelpOverlay` (Modal): search over titles, keywords, glossary (case- and accent-insensitive), shortcuts list, help index link, "Restart tour"
- [x] 4.2 Global `?` key handler (ignored in editable fields, open dialogs, with modifiers); "Help" in avatar menu and public header; focus return
- [x] 4.3 Tests: open/close, typing `?` in a field, German search "passwort"

## 5. Empty states

- [x] 5.1 `EmptyState` gets `action`; `hint` hidden in Expert mode
- [x] 5.2 Update all usages (5) with explanation and role-aware next step; tests for Tracker, stats period, worker without projects

## 6. Guided tour

- [x] 6.1 `TourProvider` + step model; spotlight (four blocks) and bubble with Back/Next/Done/End, step counter, focus, Escape, reduced motion
- [x] 6.2 Step runner: route change, wait for `data-tour` target (max 2 s, skip if missing), scroll into view, layout filter (desktop/phone)
- [x] 6.3 `data-tour` attributes in Layout (nav, workspace chip, avatar), TrackerPage, StatsPage, WorkGroupsPage, SettingsPage; step lists for worker, editor, team leader
- [x] 6.4 Test: every step target exists for the roles that see it; tour sends no write request; 375 px bubble inside screen

## 7. Welcome dialog and checklist

- [x] 7.1 `workaddict.tour` state; welcome dialog after first sign-in (Start / Later ×2 / No thanks / I know my way around → Expert mode)
- [x] 7.2 Existing-user rule (own entries older than 7 days → no dialog, one-time toast)
- [x] 7.3 Demo: in-memory tour state, welcome dialog in demo, "Demo with tour" link on the landing page (`?tour=1`)
- [x] 7.4 First steps checklist on the Tracker derived from data, role-aware items, progress, dismiss, hidden in Expert/demo/existing users; Connect AI opened flag
- [x] 7.5 Tests for dialog paths, existing-user rule, demo separation, checklist ticking and disappearing

## 8. "New" markers

- [x] 8.1 `NEW_FEATURES` table, `workaddict.firstVersion`, `workaddict.seenFeatures`; `NewDot` with accessible label, hidden in Expert mode
- [x] 8.2 Tests: no dots for a new device, dot for a later feature until opened

## 9. Settings

- [x] 9.1 "Help & guide" section: Expert mode switch, Restart tour, Show tips again, help center link; shown for every role and demo
- [x] 9.2 Settings and avatar-menu tests updated (spec `app-shell`)

## 10. Setup and sign-in guidance

- [x] 10.1 Cropped screenshots (`public/img/help/<id>.webp`, one per screen, ids in `SHOT_IDS`; provided by the owner; the token form is split into `token-form` and `token-permissions`) with alt text for setup, join and token steps
- [x] 10.2 Wire images (`HelpShot`, shown once listed in `AVAILABLE_SHOTS`), `Term`s and help links into setup wizard and join flow; test missing image still shows step text

## 11. Docs and release

- [x] 11.1 README: help, tour and Expert mode
- [ ] 11.2 Enable GitHub Discussions with a Q&A category on `Workaddict/workaddict` (manual, by the owner)
- [x] 11.3 Full test run, lint, build; manual check of all pages at 320 px DE, dark mode, and the production build console for CSP violations
