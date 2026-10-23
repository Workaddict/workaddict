## Why

"+ Add workspace" (`#/add-project`) only offers the sign-in form for an existing data repository. A signed-in user who wants to start a second team or a new client repository has no way to get there: the setup wizard (`#/setup`) and the join flow (`#/join`) are only routed while logged out, and a signed-in user is sent back to the tracker. On top of that the page has visible styling errors: the form card has no padding, so fields and the button sit on the card border, and the card stretches to the full 760px column.

## What Changes

- **Three ways on "Add workspace"**: the page offers "Existing data repository" (the current repository + token form, default), "Set up a new data repository" (opens the setup wizard) and "I have an invite link" (a field that accepts an invite link or `owner/name` and opens the join flow).
- **Setup wizard and join flow while signed in**: `#/setup` and `#/join` are also routed in the signed-in app, without app chrome like the add page. Their last step always saves the repository as a workspace and switches this tab to it, exactly like "Add workspace"; the current profile is never replaced by an unsaved session. The "Save as a profile" checkbox is not shown there, an already saved repository shows "Open workspace" / "Replace token", and a token from the vault can be reused like on the add page.
- **"Back" when signed in**: the back link on the add page, the setup wizard and the join flow returns to the add page (setup, join) or the tracker (add page) instead of the public start page.
- **Styling fix**: the form cards on "Add workspace" and "Replace token" get the padding and the narrower width of the sign-in card; the path choice uses the existing option-card look of the wizard.
- **Copy**: new texts for the three paths in English and German; the intro of the add page no longer only talks about "another team's repository".

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `profile-vault`: "Adding a project" offers the three paths, and the add page's form card is laid out like the sign-in card.
- `team-onboarding`: the setup wizard and the join flow are reachable while signed in, and their sign-in step then adds a workspace instead of signing in anew; a signed-in user opening a join link no longer lands on the tracker.

## Impact

- `src/app/App.tsx`: `setup` and `join` routes in the signed-in tree.
- `src/features/profiles/ProfilePages.tsx`: path choice on `AddProjectPage`, card classes on both pages, back target.
- `src/features/auth/SignInForm.tsx`, `src/features/auth/useSignIn.ts`: from `setup`/`join` while signed in, saving is mandatory and the checks of the add flow (existing profile, token reuse) apply.
- `src/features/onboarding/SetupPage.tsx`, `src/features/onboarding/JoinPage.tsx`: back link target when signed in.
- `src/features/auth/FixPage.tsx`: "Change token or repository" from `setup`/`join` works signed in (routes now exist).
- `src/styles/global.css`: width/padding for the task-page card, path choice.
- `src/i18n/en.ts`, `src/i18n/de.ts`: new strings.
- Tests: `profiles.test.tsx`, `onboardingPages.test.tsx`. No new dependency, no change to the data repository format, no new token permissions: the app still never creates repositories itself.
