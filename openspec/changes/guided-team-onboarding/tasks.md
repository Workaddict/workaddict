## 1. Verify GitHub behavior (before building on it)

- [x] 1.1 In a test organization, check that `https://github.com/new?owner=<org>&name=<repo>&visibility=private` prefills owner, name and private visibility; note which parameters work
- [x] 1.2 Checked live on 2026-09-23: the prefilled token URL applies only `name` and `description`. `target_name`, `expires_in` and `contents` are ignored (form opens on the personal account, 30-day default, empty permissions). Recorded in design D2; `githubLinks.newToken` now sends only the two working parameters and the checklist walks through the other four fields
- [x] 1.3 Confirm the current paths for member privileges (base permission), personal access token policy, pending token requests, people, and the invitation page; confirm the default policy of a new organization is "require approval"
- [x] 1.4 Confirm `GET /users/{owner}` with a fine-grained token returns `type` for organizations and users, and 404 for nonexistent accounts
- [x] 1.5 Confirm the `gh` commands from design D7 work (repo create, `PATCH orgs/{org}` base permission, `PUT orgs/{org}/memberships/{user}`) and which scope refresh they need

## 2. GitHub links and messages (pure modules)

- [x] 2.1 Add `src/features/onboarding/githubLinks.ts` with builders for all onboarding URLs (plan, new repo, member privileges, token policy, pending requests, people, invitation, repo, repo collaborators, prefilled token) using the parameters verified in 1.x; unit tests with encoding of names
- [x] 2.2 Add a GitHub login/name validator (org, user, repo) shared by the wizard, the join link and the `gh` generator; unit tests including shell metacharacters
- [x] 2.3 Add `ghCommands(org, repo, usernames)` returning the command lines from design D7; unit tests (valid users only, order, identical output for Bash and PowerShell)
- [x] 2.4 Add `ownerMessage({ memberLogin, repo, ownerType, errorKind, tokenKind })` and `inviteMessage({ link, org, approvalRequired })` producing localized plain text with the relevant links and no token; unit tests for each error kind and both approval choices
- [x] 2.5 Add a small `CopyButton` / copy helper using `navigator.clipboard.writeText` with a selected read-only textarea fallback; component test for both paths

## 3. Login diagnosis

- [x] 3.1 Extend `GitHubRepoInfo` with `owner: { login, type }` and `LoginCheck` failures with `owner` and `user` where known; store `ownerType` in the GitHub session so settings know whether the repo belongs to an organization
- [x] 3.2 In `checkLogin`, on 404/403 for the repo, call `GET /users/{owner}` and return `ownerNotFound`, `orgRepoNotAccessible`, `ownRepoNotAccessible`, `personalRepoFineGrained` or `personalRepoNotAccessible`; fall back to `repoNotFound` when the lookup fails; tests with `fakeGitHub`
- [x] 3.3 Add a `LoginDiagnosis` component that renders cause, self-help and the numbered checklist (approval first for organization repos with fine-grained tokens, with links), plus "Copy message for the owner" where another person must act
- [x] 3.4 Use `LoginDiagnosis` in `LoginPage` for all sign-in errors, including `noPushAccess` with both causes; component tests per error kind

## 4. Token help on the login page

- [x] 4.1 Rewrite `login.help` (en/de): order (invitation and access first), resource owner = organization, only the data repo, Contents read and write, possible approval, classic fallback; link to the prefilled token URL
- [x] 4.2 Update `LoginPage.test.tsx` and `tokenWarnings.test.tsx` for the new help content and link

## 5. Setup wizard (`#/setup`)

- [x] 5.1 Add the logged-out routes `setup` and `join` in `src/app/App.tsx`, keeping `*` → start page
- [x] 5.2 Add wizard state (org, repo defaulting to `time-data`, checked steps, approval choice) persisted under `workaddict.setup` with try/catch; tests for reload and blocked storage
- [x] 5.3 Build `SetupWizard` with the seven steps from the spec, each with link, explanation, menu-path fallback and "Done" checkbox; validation of org and repo names; base-permission caveat; approval recommendation and choice
- [x] 5.4 Invite step: optional "with GitHub CLI" section with username input, validation and copyable commands
- [x] 5.5 Invite-team step (invite link, invite message, pending requests link if approval is required) before the final owner sign-in step, which reuses the sign-in form (repo prefilled) and `LoginDiagnosis`; after sign-in the app switches to the tracker, and the invite link stays available in settings
- [x] 5.6 Component tests: personalized links, invalid names, approval on/off texts, generated commands, invite message

## 6. Join flow (`#/join?repo=`)

- [x] 6.1 Parse and validate `repo` from the hash query; an invalid value shows the start page with an "invalid invite link" notice
- [x] 6.2 Build `JoinFlow`: accept invitation (org or personal-repo link), access check ("I can see it" / "I get a 404") with the owner message on 404, token step locked until access is confirmed, prefilled token link with checklist, sign-in with the repo prefilled and locked (with a "change" link)
- [x] 6.3 Component tests: valid link, invalid link, locked token step, 404 path with copy message, sign-in prefill; logged-in users are redirected to `/`

## 7. Team helper in settings

- [x] 7.1 Add a team helper section to Settings → Team & roles for owners of organization repos: invite link and message, "Add a member" (people link and `gh` commands), pending token requests link
- [x] 7.2 Component tests: shown for owner of an organization repo, hidden for non-owners and personal repos

## 8. Start page and docs

- [x] 8.1 Update "How it works" with the "Set up a team" link and the invite-link hint, and add the "Set up a team" action near the sign-in form; update the static crawler copy in `index.html` if landing strings change
- [x] 8.2 Add all new strings to `src/i18n/en.ts` and `src/i18n/de.ts`
- [x] 8.3 Rewrite the README setup: in-app wizard first; manual steps as reference, with approval described as on by default and the pending requests link; update troubleshooting to match the new error messages

## 10. Solo setup path (added 2026-09-23)

The wizard assumed every user sets up a team, so one person tracking their own time had to create a GitHub organization for no reason. Design question D-121 ("should the wizard cover the no-organization path?") was originally answered "link to the README only"; this reverses that for the solo case. A team on a personal repository stays out of scope, because members would need classic tokens (access to all their repositories).

- [x] 10.1 `setupState.ts`: add `mode: 'team' | 'solo' | null`, `TEAM_STEPS` / `SOLO_STEPS` and `stepsFor(mode)`; saved progress from before this change counts as a team setup when it holds a name
- [x] 10.2 `SetupPage.tsx`: ask "Who is this for?" first; in solo mode ask for the GitHub username, hide the organization, base permission, approval, invite and invite-link steps, number the remaining steps from the mode's list, and add a "Change" action
- [x] 10.3 Solo texts in `en.ts` and `de.ts` (`mode*`, `user*`, `soloIntro`, `soloRepoText`, `soloTokenText`, `soloLater`), including the note that a personal repository cannot be shared with fine-grained tokens
- [x] 10.4 Styles for the two path buttons (`.ob-modes`, `.ob-mode`)
- [x] 10.5 Tests: solo path skips the organization steps and builds the right links; switching paths; mode migration for old saved progress; `stepsFor`; existing wizard tests pick the team path first
- [ ] 10.6 Check the solo path in the browser at phone width and in dark mode
- [ ] 10.7 Update the README quick start so it names both paths

## 9. Verify

- [x] 9.1 `npm test`, `npm run lint`, `npm run build` pass
- [ ] 9.2 Manual end-to-end with a test organization and a second account: owner wizard with approval on, member joins via invite link, sees the approval diagnosis, owner approves, member signs in
- [ ] 9.3 Manual check of the diagnosis cases: misspelled owner, token with the wrong resource owner, read-only token
  - [x] Misspelled owner, API layer verified live on 2026-09-23 with `gh`: `GET /users/Team-Welsx` → 404 (drives `ownerNotFound`), `GET /users/Team-Wels` → `type: Organization`, `GET /users/BenediktLehner` → `type: User`, `GET /repos/Team-Wels/does-not-exist` → 404. Matches what `fakeGitHub` returns, so the component tests rest on real behaviour
  - [ ] Wrong resource owner and read-only token: still open, each needs a fine-grained token that only the owner can create
- [x] 9.4 Check wizard and join flow at phone width and in dark mode
