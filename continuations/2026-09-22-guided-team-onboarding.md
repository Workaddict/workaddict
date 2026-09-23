# Continuation: guided team onboarding (setup wizard, join link, sign-in diagnosis)

Paste this file (or reference it with `@continuations/2026-09-22-guided-team-onboarding.md`) into a new session to finish the OpenSpec change `guided-team-onboarding`.

## Goal

Creating the data repo and the tokens was badly explained and needed too many GitHub steps. Users ended up stuck: nobody told them that **new GitHub organizations require an owner to approve fine-grained tokens by default** (`https://github.com/organizations/<org>/settings/personal-access-token-requests`). The owner's own token is exempt, so the owner never saw the problem, while every member got an unexplained 404. The user wants the app to save time and to **never lead into a dead end that needs outside help**.

The user writes German (sometimes English) and wants short, clear answers. **No proxy or server** for now (so no OAuth/GitHub App login). Ask before committing or pushing: a push to `main` deploys straight to production.

## State (2026-09-22)

- The change lives in `openspec/changes/guided-team-onboarding/` (proposal, design, specs, tasks). `openspec validate guided-team-onboarding --strict` passes.
- **31 of 34 tasks are done.** Everything is **uncommitted** in the working tree (see the file list below).
- `npm test` passes (422 tests), `npm run lint` has 0 errors (the 10 warnings existed before), `npm run build` passes.
- Layout was checked by script at 388 px width in light and dark mode (no horizontal overflow). The Chrome screenshot tool kept timing out, so **nobody has looked at it visually yet**.

## What was built

- **Setup wizard `#/setup`** (`src/features/onboarding/SetupPage.tsx`): the owner enters the org name once (repo defaults to `time-data`). Then 8 steps with prefilled GitHub links and "Done" checkboxes: create the organization; create the private repo (`github.com/new?owner=&name=&visibility=private`); set the base permission to Write; decide on token approval (recommended: off); invite members (optional generated `gh` commands); create your own token; invite link and message; sign in. Progress is stored in `localStorage` under `workaddict.setup` (`setupState.ts`).
- **Join flow `#/join?repo=owner/name`** (`JoinPage.tsx`): accept the invitation → check access in the browser ("I can see it" / "I get a 404") → token (locked until access is confirmed) → sign in with the repo prefilled and locked. A 404 answer shows a copyable message for the owner. An invalid link shows the start page with a notice.
- **Sign-in diagnosis**: `checkLogin` (`src/storage/github/githubAdapter.ts`) calls `GET /users/{owner}` when the repo returns 404 or 403. New errors: `ownerNotFound`, `orgRepoNotAccessible`, `ownRepoNotAccessible`, `personalRepoNotAccessible`, with `repoNotFound` as the fallback. `LoginDiagnosis.tsx` renders the cause, a numbered checklist (for an org repo with a fine-grained token, approval comes first) and a "Copy message for the owner" button (`messages.ts`; never contains the token). It also handles `noPushAccess` with both possible causes.
- **Shared pieces**: `SignInForm.tsx` (extracted from `LoginPage`, used by the start page, the wizard and the join flow), `PublicHeader.tsx`, `components/CopyText.tsx` (clipboard with a selected read-only field as fallback), `onboarding/parts.tsx` (`GitHubLink` shows the link plus the menu path, `Step`, `TokenChecklist`, `GhCommandsField`), `githubLinks.ts` (all GitHub URLs, `inviteLink`, `ghCommands`), `names.ts` (login/repo validation, `parseUsernames`, `joinTarget`).
- **Settings**: `TeamHelper.tsx` for owners of an **organization** repo (invite link and message, "Add a member" with People link and `gh` commands, pending requests link). Needs `session.ownerType`, which is new and stored at sign-in. **Old sessions don't have it, so the helper appears only after the next sign-in.**
- **Start page**: "Set up a team" button in the hero, a "New team?" link in the sign-in card, a step 1 link to the wizard, and a step 3 hint about the invite link (also in the static copy in `index.html`). The token help was rewritten: order, resource owner, approval, prefilled link.
- **README**: new "Quick start: let the app guide you", approval described as **on by default**, base-permission tip, a new troubleshooting table, and approval first in the checklist.
- **i18n**: new blocks `onboarding.*`, `login.errors.*` (with `{{repo}}` / `{{owner}}`), `login.help.*`, `common.copied/copyManually`, `landing.setupTeam/step1Link/inviteHint` in `en.ts` and `de.ts`.

## Decisions (don't reopen without reason)

- Keep personal access tokens. No proxy, no `gh auth token` as the app token (access to all repos), no Actions or userscripts, no wizard driven by a powerful owner token.
- The token link keeps `target_name=<org>`. Because of GitHub bug #188111 (the owner is only preselected visually, and other parameters are lost when the owner changes), the checklist always says "select the owner again, even if it is already shown", then "check Contents: Read and write". It also mentions GitHub's sudo confirmation (password or GitHub Mobile).
- `personalRepoFineGrained` was not added as its own error. `personalRepoNotAccessible` plus the token kind in the UI covers it (design D5 is updated).
- The invite link comes **before** the final sign-in step, because after login the router switches to the logged-in pages and the wizard is gone. Spec and tasks were adjusted.

## Open tasks (need the user and real GitHub accounts)

1. **1.2** Open `https://github.com/settings/personal-access-tokens/new?name=Workaddict&target_name=Team-Wels&expires_in=90&contents=write` while signed in (it needs the sudo confirmation, which Claude must not do). Generate a test token and check: is the resource owner really `Team-Wels`? Do the other fields survive when the owner is picked again? Record the result in design.md D2; if needed, change `githubLinks.newToken` or the checklist texts (`onboarding.token.*`).
2. **9.2** End to end with the test org (`Team-Wels` or `Workaddict`, both exist under the user's account `BenediktLehner`) and a second GitHub account: wizard with approval **on** → invite → member uses the join link → sign-in shows the approval diagnosis → owner approves → member signs in.
3. **9.3** Diagnosis cases by hand: misspelled owner, token with the wrong resource owner, token with Contents read-only.
4. Look at `#/setup`, `#/join?repo=Team-Wels/time-data` and the diagnosis visually (desktop and phone, light and dark), because no screenshot was taken.

After that: commit (the user must approve; conventional commit, e.g. `feat: guided team setup, join link and sign-in diagnosis`), then `/opsx:archive`. Pushing to `main` deploys, so ask first.

## Changed files (uncommitted)

```
README.md, index.html
src/app/App.tsx                          routes setup / join (logged out)
src/components/CopyText.tsx (new), Icon.tsx (+copy)
src/features/auth/LoginPage.tsx          uses SignInForm, new help, setup links
src/features/auth/SignInForm.tsx (new), PublicHeader.tsx (new), Landing.tsx, session.ts (+ownerType)
src/features/onboarding/ (new)           githubLinks, names, messages, setupState, parts,
                                         LoginDiagnosis, SetupPage, JoinPage, TeamHelper + tests
src/features/settings/SettingsPage.tsx   mounts TeamHelper
src/storage/github/githubAdapter.ts      checkLogin diagnosis, owner on repo info
src/storage/github/fakeGitHub.ts         /users/{login}, owner.type
src/storage/index.ts                     exports GitHubOwnerType, LoginError
src/i18n/en.ts, de.ts, src/styles/global.css (onboarding section)
src/test/renderWithSession.tsx           optional session parameter
openspec/changes/guided-team-onboarding/
```

## Gotchas

- The app has a **FrameGuard**, so iframe tricks for layout tests show only the frame notice. A popup opened by a real click (`window.open` with a width) works.
- `toHaveValue(expect.stringMatching(...))` does not work in these tests; read `.value` and use `toMatch`.
- A hint inside a `<label>` changes its accessible name, so keep hints outside the label (see the wizard's name fields).
