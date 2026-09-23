## Why

Setting up a team today means working through a long README (about 12 owner steps plus 7 per member, and 9 steps per member token) and several hand-offs between owner and members. The most common failure is invisible to the owner: new GitHub organizations require administrator approval for fine-grained tokens by default, the owner's own token is approved automatically, and every member then gets an unexplained "repository cannot be accessed" error. Neither the app nor the in-app help mentions the approval page (`/organizations/<org>/settings/personal-access-token-requests`), so users get stuck without outside help. Without a server or proxy we cannot remove personal access tokens, but the app can guide every step with prefilled links, enforce the right order, and turn every sign-in error into a concrete next step.

## What Changes

- New **"Set up a team" wizard** (owner) reachable from the start page: asks for the organization name once and then personalizes every step with deep links: create the organization, create the private data repo from a prefilled `github.com/new` link, set the organization's base permission to Write, choose the token approval policy (recommend "no approval" for small trusted teams), invite members (with optional generated `gh` commands to copy), create the owner's own token from a prefilled link and sign in. It ends with a shareable invite link and a ready-to-copy invite message.
- New **"Join a team" flow** (member) opened from the invite link `#/join?repo=<owner>/<name>`: prefilled repository, and a fixed order (accept invitation → confirm you can open the repo in the browser → create the token from a prefilled link with a 3-item checklist → paste and sign in), so a token can no longer be created before access exists.
- **Sign-in diagnosis instead of dead ends**: when the repository cannot be accessed, the login check also looks up the owner account and tells apart a typo in the owner name, an organization repo (the most likely cause shown first is a token waiting for approval, with the approval link), and a repo in someone else's personal account (fine-grained tokens cannot work there). Every sign-in error shows the cause, what the user can fix themselves, and a **"Copy message for the owner"** button with the relevant links.
- **Team settings for owners**: the invite link, an "Add a member" helper (same links and `gh` commands), and a hint with a link to pending token requests.
- The token help on the login page covers resource owner, approval and order, and uses the prefilled token link.
- The "How it works" steps on the start page point to the wizard instead of only the token help.
- README setup shrinks to "open the app and click *Set up a team*", plus reference material (manual steps, classic-token fallback, troubleshooting). It no longer describes approval as optional; approval is on by default.
- Explicitly **out of scope**: OAuth or GitHub App login (needs a proxy), using `gh auth token` as the app token (access to all repos), GitHub Actions automation, userscripts, and an in-app wizard driven by a powerful owner token.

## Capabilities

### New Capabilities
- `team-onboarding`: owner setup wizard, member join flow via invite link, personalized GitHub deep links and generated `gh` commands, and the owner's team helper in settings.

### Modified Capabilities
- `auth-and-workspace`: "Token login" error cases gain a diagnosis (owner not found, organization repo with approval hint, personal repo with fine-grained token) and a copyable message for the owner; "Token setup guidance" adds resource owner, approval and order, plus the prefilled token link.
- `landing-page`: the "How it works" steps link to the setup wizard and the join flow. The "Unchanged sign-in behavior" requirement is relaxed so that error messages and token help may change.

## Impact

- Code: `src/features/auth/LoginPage.tsx`, new onboarding components (wizard, join flow, diagnosis panel) under `src/features/auth/` or `src/features/onboarding/`, `src/app/App.tsx` (logged-out routes `setup` and `join`), `src/storage/github/githubAdapter.ts` (`checkLogin` diagnosis with an extra `GET /users/{owner}`), `src/features/settings/` (team helper for owners), `src/i18n/en.ts` + `de.ts`, the static crawler copy in `index.html` if landing strings change.
- Docs: `README.md` setup and troubleshooting sections.
- No new dependencies, no server, no new token permissions. One extra GitHub API request only when the repository check fails.
- Depends on GitHub URL behavior that must be verified first: `github.com/new` query parameters, prefilled fine-grained token parameters (known `target_name` bug), and the organization settings deep-link paths.
