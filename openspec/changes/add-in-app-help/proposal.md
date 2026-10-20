## Why

New users who don't know the author find Workaddict hard to understand: it brings its own vocabulary (data repository, token, workspace, passphrase, roles, work groups, "Team now", issue links, MCP) and the UI explains almost none of it. Help exists only as `title` attributes (invisible on touch screens) and the token help page. Users who already know the app must not be slowed down by the new help, so the amount of help has to be adjustable.

## What Changes

- **Info tips**: a shared `InfoTip` that opens on hover, keyboard focus and tap. Every icon-only button gets one; terms from the glossary are shown with a dotted underline and explain themselves in one sentence with a "Learn more" link. Native `title` tooltips on icon buttons are replaced; `title` stays only where it reveals truncated text.
- **Help center**: help pages at `#/help` and `#/help/<topic>`, reachable signed in and signed out, in English and German. Topics: token & data repository, workspaces & passphrase, roles, work groups, Team now, issue links & project boards, connecting an AI assistant, export & backup, Clockify import, time zone, plus a glossary at `#/help/glossary`. Complex features get a "?" button that opens their topic. Each page ends with "Was this helpful?" 👍/👎, where 👎 offers a prefilled GitHub Discussions link (nothing is sent automatically). `#/token-help` becomes `#/help/token`.
- **Help overlay**: pressing `?` (outside text fields) or the "Help" entry in the avatar menu opens an overlay with a search over topics and glossary terms and the list of keyboard shortcuts.
- **Guided tour**: on the first sign-in a welcome dialog offers "Start tour", "Later", "No thanks" and "I know my way around" (which turns on Expert mode). The tour, built in-house without a new dependency, spotlights the main controls page by page and has extra steps for editors and team leaders. It can also be started from the demo. It never writes data.
- **First steps checklist**: a dismissible card on the Tracker that ticks itself off from the repository data (first entry, first project, first tag, team invited for owners, optional: connect AI), and disappears when done.
- **Helpful empty states**: every empty state says what will appear and offers the next step as a button.
- **"New" markers**: a small dot on features added after the user's first visit; it disappears once the feature was opened.
- **Setup and sign-in guidance**: setup, join and token steps get screenshots and info tips on their terms.
- **Expert mode**: a setting in a new "Help & guide" section in Settings. It hides glossary underlines, the checklist, "New" markers and the welcome dialog, and shortens empty-state explanations. Icon-button labels (accessibility), "?" buttons, help pages and the overlay stay. Off by default.
- **"Help & guide" settings section**: Expert mode switch, "Restart tour", "Show tips and checklist again", and a link to the help center.

## Capabilities

### New Capabilities
- `contextual-hints`: info tips, glossary terms in the UI, helpful empty states, "New" markers, and the Expert mode that controls how many hints are shown.
- `help-center`: help pages and topics, glossary page, "?" buttons, the help overlay with search and shortcuts, and per-page feedback.
- `guided-tour`: welcome dialog, role-aware guided tour (also from the demo), and the first steps checklist.

### Modified Capabilities
- `app-shell`: the Settings page gets the "Help & guide" section; the avatar menu gets a "Help" entry.
- `team-onboarding`: setup and join steps show screenshots and explain their terms with info tips.

## Impact

- New components in `src/components/` (`InfoTip`, help overlay) and a new `src/features/help/` (help pages, tour, checklist, "New" markers, hint level).
- New help texts in separate i18n files (English and German) so `de.ts`/`en.ts` stay manageable; glossary follows the "Consistent German terminology" requirement.
- `src/prefs.ts` gets the hint level; tour, checklist and "New" marker state live in `localStorage` per device.
- `data-tour` attributes on tour targets in `Layout`, `TrackerPage`, `StatsPage`, `WorkGroupsPage`, `SettingsPage`; `EmptyState` gains an action; many icon buttons switch from `title` to `InfoTip`.
- `App.tsx`: `help` routes in both the public and the signed-in tree; `token-help` redirects.
- Screenshots in `public/img/help/` (same origin, CSP unchanged). No new runtime dependency, no change to the data repository format.
