## Context

Workaddict is a static app on GitHub Pages. It talks to the GitHub REST API directly from the browser with a personal access token (PAT) per member. Setup is documented only in the README (sections 1.1–2.4). The in-app help (`login.help.*`) lists five generic token steps and does not mention the resource owner pitfalls, token approval, or the order of steps.

What we verified while exploring:

- New organizations **require administrator approval** for fine-grained PATs by default. Tokens created by organization owners are exempt. So the owner's own sign-in works, and every member's fails with a 404 that the app reports as `repoNotFound`.
- There is no public API to create an organization or a fine-grained PAT. Token approval via the REST API only works with GitHub App tokens.
- The prefilled token URL (`/settings/personal-access-tokens/new?...`) has a reported bug: `target_name` changes the dropdown visually, but the token is created under the personal account. Switching the owner in the dropdown drops the other prefilled parameters (community discussion #188111, Feb 2026).
- `checkLogin` (`src/storage/github/githubAdapter.ts`) already calls `/user` and `/repos/{owner}/{repo}` and maps 404/403 to a single `repoNotFound`.
- The router (`src/app/App.tsx`) sends every logged-out route to `LoginPage`.

Constraint from the user: **no proxy and no server** for now.

## Goals / Non-Goals

**Goals:**
- Cut the owner's manual work to one-time steps and make per-member work on the owner's side optional (with `gh`) or a single invite.
- Make the member path linear, prefilled and order-safe, so that no token can be created before the member has access.
- Make every sign-in failure end in a concrete next step: a fix the user can do, or a ready-made message for the owner.
- Keep the README as reference, not as the primary guide.

**Non-Goals:**
- OAuth / GitHub App login (needs a CORS proxy for the device flow).
- Using the `gh` OAuth token as the app token (access to all repos, no expiry).
- GitHub Actions or userscript automation.
- An in-app setup that calls GitHub with a powerful owner token (org Administration and Members write). For small teams it costs more steps than it saves, and it creates a dangerous token.
- Detecting the organization's token policy or pending requests (not possible with a member's PAT).

## Decisions

### D1: Keep PATs, move the guidance into the app
The app can't remove token creation, but it knows the organization and repo name, so it can prefill almost every link. Alternatives were a proxy with a GitHub App (rejected by the user for now) and better README text only (doesn't fix the dead ends in the app).

### D2: One pure link builder module
`src/features/onboarding/githubLinks.ts` exports pure functions that build every GitHub URL from `{ org, repo }`: plan page, `new?owner=&name=&visibility=private`, member privileges, PAT policy, pending requests, people, invitation, repo, repo collaborators, token creation (prefilled). They are unit-tested. All GitHub paths live in one place, and each link has a localized fallback text naming the menu path, so users can find their way even if GitHub moves a page.

The prefilled token link uses `name=Workaddict`, `description`, `contents=write`, `expires_in=90` and, when the owner is known, `target_name`. The checklist next to the link always tells the user to select the resource owner again and to check Contents (see the verification results below).

**Verification results (task 1):**
- `github.com/new?name=&owner=&description=&visibility=private` is documented by GitHub ("Creating a new repository", query parameters).
- Token prefill parameters (`name`, `description`, `target_name`, `expires_in`, permission names such as `contents=write`) are documented by GitHub ("Managing your personal access tokens"). The `target_name` bug (#188111) could not be reproduced live: the token page asks for sudo re-authentication (GitHub Mobile or password) before it shows the form, and we don't sign in on the user's behalf. **Decision:** keep `target_name` (so the right owner is shown and approval-relevant), and make the checklist robust against both bug variants: "Select `<org>` as resource owner again, even if it is already shown", then "Check that Contents is set to Read and write". The token step also mentions the sudo confirmation.
- `GET /users/{owner}` returns `type: "Organization"` or `"User"`, and 404 for nonexistent accounts (verified live).
- `PUT /orgs/{org}/memberships/{user}` sends an invitation to non-members (docs). `PATCH /orgs/{org}` with `default_repository_permission` and `gh repo create --private` are standard. The commands need `admin:org`.
- Settings paths: `organizations/<org>/settings/member_privileges` (Settings → Access → Member privileges), `organizations/<org>/settings/personal-access-tokens`, `organizations/<org>/settings/personal-access-token-requests`, `orgs/<org>/people`, `orgs/<org>/invitation`. The menu paths shown next to each link cover a moved page.

### D3: Wizard steps are self-reported checklists
The owner wizard (`#/setup`) runs before any token exists, so it can't verify the org, repo or settings. Each step has a link, a short explanation and a "Done" checkbox. The org name is entered once; the repo name defaults to `time-data` and can be edited. Wizard state (org, repo, checked steps, approval choice) is kept in `localStorage` under `workaddict.setup`, wrapped in try/catch, so a tab reload or a trip to GitHub doesn't lose progress. The real verification happens at the final sign-in step, which reuses the login form and the diagnosis from D5.

Alternative: verify each step with the owner's token. Rejected: the token is only valid once the repo exists, and it would force the token step to come first.

### D4: Join link as a logged-out route
`#/join?repo=<owner>/<name>` is a logged-out route. The repo is validated with `parseRepo`. An invalid value falls back to the normal start page with a notice. The flow is linear:
1. Accept the invitation (link `github.com/orgs/<org>/invitation`; for a personal repo, the repo invitations page).
2. Access check: "Open the repository". The member answers "I can see it" or "I get a 404". A 404 answer shows the copyable owner message (D6) and does **not** unlock the token step. There is a "check again" button.
3. Create the token: prefilled link plus a checklist (resource owner = `<org>`, only select repositories → `<repo>`, Contents read and write).
4. Paste the token and sign in (repo field locked to the join value, with a "change" link).

The access check can't be automated: a request without a token always gets 404 for a private repo. So we rely on the member's own answer, which is the same test the README already recommends.

Logged-in users who open a join link are redirected to `/` like any other unknown route (unchanged behavior).

### D5: Diagnosis in `checkLogin`
When `/repos/{owner}/{repo}` returns 404 or 403, `checkLogin` makes one more call, `GET /users/{owner}`, with the same token, and returns a more specific error:

| Condition | New error |
|---|---|
| `/users/{owner}` returns 404 | `ownerNotFound` |
| owner `type === 'Organization'` | `orgRepoNotAccessible` (UI checks token kind: fine-grained → approval first) |
| owner is a user, equal to the token's login | `ownRepoNotAccessible` (repo name or token repository selection) |
| owner is another user | `personalRepoNotAccessible`; the UI checks the token kind: fine-grained → can't work (org or classic fallback), otherwise invitation not accepted / not a collaborator |
| lookup itself fails | `repoNotFound` (as today) |

`LoginCheck` gains `owner?: { login: string; type: 'User' | 'Organization' }` and `user` on failures so the UI can build links and the owner message. The extra request only happens on failure. For the organization case the UI shows a numbered checklist, most likely cause first: token waiting for approval → invitation not accepted → wrong resource owner → token created before access → repo name.

Alternative: parse GitHub error bodies or headers to detect a pending approval. There is no documented signal, so we don't do that.

### D6: "Copy message for the owner"
A pure function builds a plain-text message in the current UI language from `{ memberLogin, repo, ownerType, errorKind, tokenKind }`, with the relevant owner links (pending requests, people, repo collaborators). Copying uses `navigator.clipboard.writeText`, with a fallback to a selected read-only textarea. The message never includes the token.

### D7: Generated `gh` commands, no script files
The wizard's invite step and the team helper in settings have an optional "with GitHub CLI" section. The user types usernames (comma or space separated, validated against the GitHub login pattern), and the app renders commands that work unchanged in Bash and PowerShell:

```
gh auth refresh -h github.com -s admin:org
gh repo create ORG/REPO --private
gh api -X PATCH orgs/ORG -f default_repository_permission=write
gh api -X PUT orgs/ORG/memberships/USER -f role=member
```

This saves the per-member clicks for owners who have `gh`, without us shipping and maintaining `.sh` and `.ps1` files. Usernames are validated so the rendered commands can't contain shell metacharacters.

### D8: Team helper in settings for owners
In **Settings → Team & roles**, owners (repo admins) of an organization repo see the invite link with a copy button, the invite message, "Add a member" (people link plus `gh` commands) and "Pending token requests" (link). The owner type comes from `/repos/{owner}/{repo}` (`owner.type`), which we already fetch; `GitHubRepoInfo` gains `owner`.

### D9: Approval policy recommendation
The wizard recommends **"Do not require administrator approval"** for small trusted teams and explains the trade-off in one sentence. If the owner keeps approval on, the wizard's final step and the invite message mention that the owner has to approve each token, with the link.

### D10: Docs
The README setup becomes a short "Use the in-app wizard" section, followed by the manual steps as reference (fixed to say that approval is on by default), the classic fallback and troubleshooting. The landing "How it works" steps get "Set up a team" and "I have an invite link? Open it" wording. `index.html`'s crawler copy is updated if the landing strings change.

## Risks / Trade-offs

- [GitHub changes URLs or query parameters] → All links live in `githubLinks.ts`, each has a menu-path fallback text, and task 1 verifies them before building on them.
- [Prefilled token bug creates a token under the wrong owner] → Don't prefill `target_name` unless verified. The checklist always names the owner. The diagnosis catches the mistake at sign-in.
- [Members skip or lie about the access check] → The diagnosis at sign-in covers the same causes, and "token created before access" is one of its checklist items.
- [Self-reported wizard steps can be ticked without doing them] → Acceptable. Sign-in verifies the result, and the diagnosis points back to the right step.
- [Settings don't know the owner type for sessions from before this change] → `ownerType` is stored at sign-in; the team helper appears after the next sign-in.
- [Extra `/users/{owner}` request uses rate limit] → Only on failed sign-ins, one request.
- [Base permission Write gives members write access to all repos of the org] → The wizard states this and recommends a dedicated organization for the data.
- [Recommending "no approval" weakens control] → Explained, optional, and the approval path stays fully supported.

## Migration Plan

Additive UI and docs change. Existing sessions and data are unaffected. The new error kinds replace `repoNotFound` only in the cases they detect. Rollback = revert the change.

## Open Questions

- Do `github.com/new` query parameters (`owner`, `name`, `visibility`) and the fine-grained token parameters still work as expected? (Task 1)
- What are the exact current paths for member privileges and the PAT policy pages? (Task 1)
- Should the wizard also cover the "no organization" path (personal repo plus classic tokens), or only link to the README? Proposed: link only.
