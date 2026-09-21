# Workaddict

A private, free and simple time tracker for small teams, as an alternative to Clockify.

- **No server, no cost.** The app is a static website hosted on GitHub Pages.
- **Your data stays in your own repository.** Every entry, project and tag is stored as a JSON file in a **private GitHub repository** (the "data repo") that you control. The app reads and writes it straight from your browser through the GitHub API.
- **Features:** a live timer that syncs across devices, manual entries (including overnight ones), projects and tags, statistics with charts, and exports to PDF and Excel plus a full JSON backup. Team roles (worker, editor, team leader), and entries you can edit by clicking a field. English and German UI (switchable on the login page), light and dark themes with a one-click toggle, works on mobile.
- **Full history.** Each change is a git commit with a readable message (`entry: add 2h "Fix login" (alice)`), so the data repo doubles as an audit log that you can revert.

Try it without an account by clicking **"Try the demo"** on the login page. Demo data stays in memory and is never saved.

---

## How it works

```
Browser (this app, GitHub Pages)  ──GitHub REST API──►  private data repo
                                                         ├─ tracker.json          schema version
                                                         ├─ workspace.json        projects & tags
                                                         ├─ roles.json            member roles (optional)
                                                         ├─ entries/<login>/<YYYY-MM>.json
                                                         └─ timers/<login>.json   running timer
```

- Each member writes only their own entry and timer files, so members don't overwrite each other. `workspace.json` is shared, and its writes retry automatically on conflicts.
- Timestamps are stored in UTC and shown in local time.
- Team members are the collaborators of the data repo. Everyone sees everyone's entries. Who may change what depends on their [role](#5-assign-roles).
- `roles.json` stores the role of each member (optional; created when an owner assigns the first role).
- On the first login the app creates `tracker.json` and `workspace.json` in an empty data repo.

---

## Setup

You need two repositories:

| Repository              | Visibility                              | Contents                              |
| ----------------------- | --------------------------------------- | ------------------------------------- |
| **App repo** (this one) | public (required for free GitHub Pages) | source code only, no data, no secrets |
| **Data repo**           | **private**                             | your team's time data                 |

### 1. Create the data repo (organization recommended)

**Recommended:** create a **free GitHub organization** for your team and put the data repo inside it.

1. Go to <https://github.com/organizations/plan> and choose **Free**.
2. Invite your team members to the organization.
3. In the organization, create a new **private** repository, e.g. `my-team/time-data`. It can be empty; the app initializes it.
4. Give members write access to the repo, e.g. through a team with the **Write** role or as direct collaborators.

**Why an organization?** Fine-grained tokens (the safe kind) only work for repositories owned by **your own account** or by an **organization you belong to**. If the data repo belongs to someone else's personal account, other team members have to use a classic token, which can access _all_ of their repositories.

**Alternative:** a private repo in your personal account works too. You can use a fine-grained token, but your collaborators need classic tokens (see below).

### 2. Create a personal access token (every member)

Every team member creates their own token and pastes it into the login page together with the data repo name (`owner/name`).

#### Recommended: fine-grained token

1. Open <https://github.com/settings/personal-access-tokens/new>.
2. **Resource owner:** the organization (or account) that owns the data repo.
3. **Expiration:** choose what suits you. When the token expires, the app asks you to sign in again.
4. **Repository access:** _Only select repositories_ → pick the data repo.
5. **Permissions → Repository permissions → Contents:** _Read and write_. _Metadata: Read-only_ is added automatically.
6. Click **Generate token** and copy it.

If the organization requires approval for fine-grained tokens, an organization owner has to approve the request under _Organization settings → Personal access tokens → Pending requests_.

#### Fallback: classic token

Use this only when the data repo is owned by **another person's personal account**.

1. Open <https://github.com/settings/tokens/new>.
2. Select the **`repo`** scope and generate the token.

> ⚠️ A classic `repo` token grants read/write access to **all** repositories you can access, not just the data repo. Prefer moving the data repo into an organization.

### 3. Deploy the app to GitHub Pages

1. Push this repository to GitHub, as a **public** repo.
2. Go to **Settings → Pages → Build and deployment → Source:** select **GitHub Actions**.
3. Push to `main`. The workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs `npm ci` → `npm test` → `npm run build` and deploys `dist/`. If tests fail, nothing is deployed and the previous version stays live.
4. The app is available at `https://<user-or-org>.github.io/<app-repo>/`.

The build uses a relative base path and hash routing (`#/stats`), so it works under any repo name and page reloads never 404.

### 4. Sign in

Open the Pages URL, paste your token, enter the data repo as `owner/name`, and optionally tick **"Remember me on this device"**.

### 5. Assign roles

Every member has one of three roles:

| Permission                                                      | Worker | Editor | Team leader |
| --------------------------------------------------------------- | :----: | :----: | :---------: |
| Track time, run own timer, edit and delete own entries          |   ✓    |   ✓    |      ✓      |
| See all entries and statistics, export                          |   ✓    |   ✓    |      ✓      |
| Edit and delete other members' entries                          |        |   ✓    |      ✓      |
| Create, rename, recolor, archive, and delete projects and tags  |        |   ✓    |      ✓      |
| Import from Clockify                                            |        |        |      ✓      |

- **Owners** are everyone with **admin** permission on the data repo. For a personal repo that is the account owner; in an organization it is the repo or organization admins. Owners are always team leaders, and **only owners assign roles** (under **Settings → Team & roles**), including making other members team leaders.
- Members without an assigned role are **workers**. **Upgrading from an earlier version:** after the update, everyone except the owners is a worker until an owner assigns roles. The app shows owners a reminder until the first role is assigned.
- Roles are enforced by the app, **not by GitHub**. See [Security notes](#security-notes).

### 6. Optional: import your Clockify history

Switching from Clockify? A team leader opens **Settings → Data → Import from Clockify**. The wizard imports projects (name, color, archived), tags, and all completed time entries of the users you select, in a **single commit**.

- **Replaces existing data.** If the data repo already has entries, projects, or tags, the wizard shows how many and asks for confirmation; the import then **replaces all of them** (running timers are kept). There is no merging. The old data stays in the data repo's git history and can be restored by reverting the import commit.
- **API key.** Create one in Clockify under _Profile settings → API_. To import the whole team, it must be the key of a **Clockify workspace admin**; other keys can only read their own entries. The key is kept in memory only, sent only to Clockify, and never saved. **Delete it in Clockify after the import.**
- **User mapping.** Map each Clockify user to a GitHub login of the team, keep them as a **former member** (read-only pseudo-login `clockify.<name>`, so yearly totals stay correct), or skip them.
- **Free plan limits.** Clockify Free allows only 30 API requests per hour. The import uses large pages (about 5 requests plus 1–2 per user), shows a request counter, and if the limit is hit it pauses and lets you **continue later** without re-fetching what was already loaded. Keep the tab open until the import is done.
- **Not imported:** clients, tasks, billable flags, rates, custom fields, and running timers. The preview shows how many entries are affected and lists hours per member and project so you can compare them with Clockify's summary report.

---

## Security notes

Read this before you use the app with real data.

- **Roles are not a security boundary.** Anyone with write access to the data repo can read and change _all_ data through the GitHub API or the GitHub website, including other members' entries, projects, and `roles.json` itself. The app checks roles before every change it makes, but it cannot stop direct edits to the repository. Only add people you trust. Every change is a commit that names the acting user (for example `entry: delete "Standup" for bob (carol)`, `role: set bob to editor (alice)`), so you can find and revert unwanted changes in the git history.
- **Your token is stored in your browser.** With "Remember me" it is kept in `localStorage`; without it, in `sessionStorage`, which is cleared when the tab closes. Anyone with access to your browser profile, or any script that runs on the page, could read it. To limit the risk:
  - use a **fine-grained token** limited to the data repo, with an expiration date;
  - don't use "Remember me" on shared computers;
  - **log out** (Settings → Log out) to remove the token and cached data;
  - if a token leaks, revoke it on GitHub right away.
- **Content Security Policy.** The production build ships a strict CSP: scripts only from the app's own origin, and network requests only to `https://api.github.com` and, for the one-time Clockify import, `https://*.clockify.me`. Nothing is sent anywhere else: no analytics, no third-party scripts at runtime.
- **The app repo contains no data or secrets.** It is safe for it to be public.

---

## Development

Requirements: Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev        # dev server at http://localhost:5173 (use "Try the demo" to skip login)
npm test           # unit tests (Vitest)
npm run lint       # ESLint
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build (with CSP) locally
```

### Project layout

```
src/
  domain/        types, time/duration helpers, month keys (pure, unit-tested)
  storage/       StorageAdapter interface, memory adapter, GitHub adapter
  features/      auth, tracker, workgroups, stats, export, settings
  i18n/          English and German texts
  styles/        design tokens, light/dark themes
```

All data access goes through the `StorageAdapter` interface (`src/storage/types.ts`). UI code never calls GitHub directly. That makes it possible to swap the backend later (e.g. for Supabase), and the JSON backup format serves as the migration path.
