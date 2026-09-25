## Why

The "Set up a team" wizard (`#/setup`) looks unfinished: the "Just me" / "A team" choice is two mismatched buttons (one primary, one plain) that vanish after a click and come back only through a small "Change" link, and every step below is fully open before the owner has typed a usable GitHub name, so people start ticking off steps whose links cannot be built yet. The page is the first thing a new owner sees, so it should look deliberate and guide the order.

## What Changes

- The path choice ("Just me" / "A team") becomes a permanent, two-option selector at the top of the wizard. Clicking an option marks it as selected; the rest of the wizard opens below it. The choice stays visible and can be switched at any time. The separate "Change" link goes away.
- Every setup step (and sign-in) stays locked until the name field holds a valid GitHub login and the repository name is valid. Locked steps show their number and title but no content, links or "Done" checkbox, and say what to enter first. Progress count and "Start over" stay available.
- Visual cleanup of the page: selectable option cards with a clear selected state, a labelled "names" section, a progress bar instead of bare text, consistent spacing and headings, and correct behavior on phone width and in dark mode. No change to step content, links or copy of the individual steps.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `team-onboarding`: the path choice stays visible as a selector instead of disappearing; steps are locked until valid names are entered (previously the steps were shown with links hidden).

## Impact

- `src/features/onboarding/SetupPage.tsx` (layout, selector, locking)
- `src/features/onboarding/parts.tsx` (`Step` already supports `locked`; may need small tweaks)
- `src/styles/global.css` (`.ob-*` onboarding styles)
- `src/i18n/en.ts`, `src/i18n/de.ts` (drop `modeChange`, add locked-step / names-section strings)
- `src/features/onboarding/onboardingPages.test.tsx` (tests that click "Change" or expect open steps before a name)
- No change to saved progress format (`workaddict.setup` in localStorage), routes or GitHub links.
