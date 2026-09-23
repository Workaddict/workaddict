# Continuation: finish verifying `guided-team-onboarding`

Reference this file with `@continuations/2026-09-23-onboarding-verification.md` in a new session. It replaces `2026-09-22-guided-team-onboarding.md`, which described the change while it was still uncommitted.

## Where things stand (2026-09-23, end of day)

The change is **implemented, committed and green**, but **not pushed**. The onboarding commits sit on local `main`, ahead of `origin/main`. They were rebased on 2026-09-23 onto the timer-feedback follow-ups, which were pushed on their own (`b4ba463`), so their hashes changed:

```
        fix: sign-in rate-limit time follows the time format setting
2d94e6a docs: continuation for the open onboarding verification
7e7530c fix: owner message names the wrong-resource-owner case
4a83f0d fix: solo setup no longer talks about an organization
33395c9 fix: token link only sends the parameters GitHub applies
43f1c41 feat: guided team and solo onboarding with sign-in diagnosis
--- origin/main ---
b4ba463 fix: timer feedback follow-ups (stop on close, start edit, time format)
94e24f9 docs: reopen timer-feedback
```

`tsc` clean, **461 tests**, `eslint` 0 errors (10 pre-existing `react-refresh` warnings), `npm run build` passes.

A push to `main` deploys straight to production. **Ask before pushing.** The user writes German or English and wants short, clear answers.

There are also the tags `backup/onboarding-7c8a70f` (pre-rebase version of the first commit) and `backup/main-before-rebase` (local `main` before the second rebase). Delete both once the work is pushed: `git tag -d backup/onboarding-7c8a70f backup/main-before-rebase`.

## What is still open

Only manual verification, all of it needing real GitHub accounts:

1. **Task 9.2 — full two-account run.** Not started. The user has a second GitHub account but ran out of time. Steps are in tasks.md and repeated below.
2. **Task 9.3, read-only case.** A fine-grained token with `Contents: Read-only` on an org repo should produce "You can read the repository … but not write to it" with both causes. Never run.

Everything else in `openspec/changes/guided-team-onboarding/tasks.md` is ticked. `openspec validate guided-team-onboarding --strict` should still pass; re-run it before archiving.

### How to run 9.2

Test against **`npm run dev` on localhost**, not workaddict.me — none of this is deployed yet.

1. Turn token approval **on** at `https://github.com/organizations/Team-Wels/settings/personal-access-tokens` (we want the failure to happen).
2. App → **Set up a team** → **A team** → org `Team-Wels`, repo `time-data` → walk every step. Note that `Team-Wels/time-data` does **not** exist yet, and the org's base permission is currently `read`, so wizard step 3 (set it to Write) actually matters here.
3. Copy the invite link; invite the second account at `https://github.com/orgs/Team-Wels/people`.
4. Sign in as the owner — this should work, because owner tokens skip approval.
5. In a different browser or a private window, as the second account: open the invite link → accept → create the token → sign in.
6. **This must fail with the approval diagnosis, not a bare 404.** That is the entire point of the change.
7. As owner, approve at `https://github.com/organizations/Team-Wels/settings/personal-access-token-requests`.
8. Second account signs in again → should work.

Delete the test tokens afterwards at `https://github.com/settings/personal-access-tokens`.

## What was verified today, and what it changed

Three live checks each turned up a real defect. Assume the remaining unverified paths hold similar surprises.

- **Task 1.2, the prefilled token URL.** Opened with `name`, `description`, `target_name`, `expires_in` and `contents`. **Only `name` and `description` are applied.** The form opened on the personal account, showed GitHub's 30-day default, and had empty permissions. This is worse than community discussion #188111, which claimed the owner was at least preselected visually — so the old checklist line "select the owner again, even if it is already shown" rested on a false premise, and nothing told the user to fix the expiry or add the repo. `githubLinks.newToken()` now sends only the two working parameters and takes no owner argument; the checklist says up front that GitHub fills in the name only and walks all four remaining fields, with expiration as a new step. Recorded in `design.md` D2 with instructions for reverting if GitHub ever honours the parameters.
- **Task 10.6, the solo path in a browser.** Two leftovers from when the wizard was team-only: the heading still read "Set up a team", and step 1's menu-path fallback said "Organization page → Repositories → New repository", which does not exist for a personal-account repo. Both fixed in EN and DE, with a test asserting the solo heading and that "Organization page" appears nowhere on that path. Phone width (390 px) was confirmed by the user; dark mode and 1440 px by the assistant.
- **Task 9.3, wrong resource owner.** The diagnosis fired correctly, but the copyable owner message was a dead end: it asked the owner to check membership, write access and approval, all three of which are already correct in that case. A fine-grained token made for the member's own account returns the same 404 as a missing invitation and the app cannot tell them apart. Added `ownerMsg.elseResourceOwner`, appended only for an organization repo with a fine-grained token and no access.

## The solo path (added today, was not in the original proposal)

The wizard used to assume every user sets up a team, so one person tracking their own time had to create a GitHub organization for no reason. `#/setup` now asks "Who is this for?" first:

- **Just me** — GitHub username instead of an organization name, then create the private repo, create the token, sign in. No organization, base permission, approval policy, invitations or invite link. It states that a personal repository cannot be shared with fine-grained tokens, so working with others later means moving it to an organization.
- **A team** — the original eight-step flow, unchanged.

Design note, **do not reopen without reason**: a *team* on a personal repository stays out of scope, because every member would need a classic token, which grants access to all of their repositories. `design.md` line 121 originally answered "should the wizard cover the no-organization path?" with "link to the README only"; today reverses that for the solo case only.

State lives in `setupState.ts` (`mode: 'team' | 'solo' | null`, `TEAM_STEPS` / `SOLO_STEPS`, `stepsFor`). Progress saved before this change is treated as a team setup when it holds a name.

## Coordinating with the other session

A second Claude session (`workaddict-61`) worked in this repo today on `timer-feedback` and pushed it. If two sessions run again, `ListAgents` shows the peer and `SendMessage` reaches it. What made it work: agree who owns which files before editing, and split shared files by hunk rather than by whole file. `src/i18n/en.ts`, `src/i18n/de.ts`, `src/features/settings/SettingsPage.tsx` and `src/styles/global.css` were touched by both.

One trap worth remembering: running `prettier --write` on a shared file reflows the *other* session's lines too, which then show up inside their hunks. Say so if it happens.

## Known tooling problem

The Chrome extension's `resize_window` **reports success while the viewport stays unchanged**. Three attempts to reach 390 px all returned "Successfully resized" with `window.innerWidth` still 1440. Screenshots also time out on the first call fairly often and succeed on a retry. For layout checks prefer `javascript_tool` and read `document.documentElement.scrollWidth` vs `clientWidth`, or ask the user to look in their own devtools.

## Useful files

```
openspec/changes/guided-team-onboarding/{proposal,design,tasks}.md   design D2 holds the token-URL result
openspec/changes/guided-team-onboarding/specs/team-onboarding/spec.md
src/features/onboarding/                SetupPage, JoinPage, LoginDiagnosis, TeamHelper,
                                        githubLinks, messages, names, parts, setupState
src/features/auth/SignInForm.tsx        shared by start page, wizard and join flow
src/storage/github/githubAdapter.ts     checkLogin with the owner lookup
src/i18n/en.ts, de.ts                   onboarding.*, login.errors.*, login.help.*
marketing/                              SEO listing and launch drafts (separate thread)
```

## Suggested opening prompt

> Read `@continuations/2026-09-23-onboarding-verification.md`. The onboarding commits are waiting on local main. Guide me through task 9.2 (the two-account run) and the read-only token case, then we decide about pushing.
