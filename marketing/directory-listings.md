# Directory listing copy (EN)

Drafts for submitting Workaddict to directories that already rank for "clockify alternative".
Written 2026-09-23. Facts match `clockify-alternative/index.html` (Clockify facts as of September 2026).

**Before submitting:** read [Facts and rules](#facts-and-rules) at the bottom. Do not claim GDPR
compliance, EU hosting, or that Clockify is expensive.

---

## Reusable blocks

Copy these into whatever field a site asks for.

### Name

```
Workaddict
```

### Tagline (60 chars)

```
Time tracking that lives in your own private GitHub repo
```

Alternates:

```
The open-source Clockify alternative you don't have to host
Free team time tracking, no server, no user limit
```

### Short description (~120 chars)

```
Free, open-source time tracker for small teams. No user limit, no server: your hours stay in your own private GitHub repo.
```

### Medium description (~250 chars)

```
Workaddict is a free, open-source time tracker for small teams. It runs as a static website, so there is no server to host and no subscription. Your team's entries are stored as JSON files in a private GitHub repository you own, and every change is a git commit.
```

### Long description (~900 chars)

```
Workaddict is a free, open-source time tracker for small teams, built as an alternative to Clockify for teams that outgrew its free plan.

It is a static website: your browser talks to the GitHub API directly, with no Workaddict server, account, or analytics in between. Your team's time entries live as plain JSON files (one per person and month) in a private GitHub repository that you own. Every change is a git commit with a readable message, so the repo doubles as an audit log you can read, revert, or back up with normal git tools.

Features: a live timer that syncs across devices, manual and overnight entries, projects and tags, inline editing, statistics with charts for any date range, worker/editor/team leader roles, a live "Team now" view, and exports to PDF, Excel, OpenDocument and CSV plus a full JSON backup. A built-in importer brings Clockify projects, tags and entries over in one step. English and German, light and dark, works on mobile.

There is no user limit and there are no paid plans. Each team member needs a GitHub account.
```

### Feature list (bullets)

```
- Live timer that syncs across devices (start on laptop, stop on phone)
- Manual entries, including overnight ones
- Projects and tags, editable inline
- Statistics and charts by project, tag and member, for any date range
- Exports: PDF, Excel (.xlsx), OpenDocument (.ods), CSV, plus a full JSON backup
- Roles: worker, editor, team leader
- Live "Team now" view for editors and team leaders
- Built-in Clockify import (projects, tags, entries, with user mapping and a preview)
- Full change history: every edit is a git commit you can revert
- English and German, light and dark mode, works in mobile browsers
- No user limit, no paid plans, no analytics or tracking
```

### Honest limitations (use where a site asks for cons)

```
- No native desktop or mobile apps, and no offline tracking
- No integrations with project tools, calendars or accounting software
- No invoicing, time off, approvals, scheduling or GPS tracking
- Every team member needs a GitHub account and a fine-grained token to sign in
- Built for small teams; no SSO
```

### Links

| Field         | Value                                              |
| ------------- | -------------------------------------------------- |
| Website       | `https://workaddict.me`                            |
| Repository    | `https://github.com/Workaddict/workaddict`         |
| License       | AGPL-3.0                                           |
| Demo          | `https://workaddict.me` → "Try the demo" (no sign-up) |
| Pricing       | Free / open source, no paid tiers                  |
| Platforms     | Web (any modern browser), self-hostable static site |
| Author        | Benedikt Lehner (`https://github.com/BenediktLehner`) |
| First release | 2026                                               |

### Tags / categories

```
time-tracking, timesheet, time-tracker, team, open-source, self-hosted,
productivity, clockify-alternative, github, static-site, privacy
```

---

## Per-site drafts

### 1. alternativeto.net

Submit as an **alternative to Clockify**. The site wants a short "what is it" plus platform and
license facets; the comparison happens through user votes, not copy.

- **Platforms:** Web, Self-Hosted
- **License:** Open Source (AGPL-3.0)
- **Pricing:** Free
- **Categories:** Office & Productivity → Time Tracking

Description field:

```
Workaddict is a free, open-source time tracker for small teams. It is a static website with no
server to host and no subscription: your browser talks to the GitHub API directly, and your team's
time entries are stored as JSON files in a private GitHub repository that you own. Every change is
a git commit, so you keep a full, revertible history.

It has a live timer that syncs across devices, manual entries, projects and tags, statistics for
any date range, worker/editor/team leader roles, a live team view, and exports to PDF, Excel,
OpenDocument and CSV. A built-in importer brings Clockify projects, tags and entries across. There
is no user limit. Each member needs a GitHub account.
```

Then add the "Alternative to" entries: Clockify, Toggl Track, Harvest, Kimai, solidtime.

> **Note:** alternativeto asks you to explain *why* it is an alternative when you link it to
> Clockify. Use: "Same core job (team time tracking with reports and exports), but free with no user
> limit and the data stays in your own private GitHub repository instead of a vendor's servers."

### 2. openalternative.co

This one is repo-driven — it reads stars, license and topics from GitHub, so the repo metadata
matters more than the copy. Check before submitting that the repo has the topics
`clockify-alternative, time-tracker, time-tracking, timesheet, open-source, timer, team,
github-pages` (it does as of 2026-09-22) and a Website field of `https://workaddict.me`.

- **Repository:** `https://github.com/Workaddict/workaddict`
- **Website:** `https://workaddict.me`
- **Alternative to:** Clockify, Toggl Track, Harvest
- **Categories:** Time Tracking, Productivity

Description field (they prefer one tight paragraph):

```
Free, open-source time tracking for small teams. Workaddict is a static site with no backend: your
team's hours are stored as JSON files in your own private GitHub repository, and every change is a
git commit. Timer, projects, tags, roles, statistics, PDF/Excel/ODS/CSV exports and a built-in
Clockify importer. No user limit, no paid plans.
```

### 3. pickyourtech.com

Listicle-style; they want a paragraph plus pros/cons plus a pricing line. Reuse the long
description, the feature bullets and the honest-limitations list above.

- **Pricing line:** `Free. Open source (AGPL-3.0). No paid plans.`
- **Best for:** `Small teams of 2–20 who want their time data under their own control, and teams that hit Clockify's 5-user free limit.`

Pitch paragraph (shorter, more editorial than the long description):

```
Most open-source time trackers hand you a server to run. Workaddict doesn't: it's a static website,
and it stores your team's hours in a private GitHub repository you already own. Each entry is a JSON
file, each edit a git commit, so you get a complete, revertible audit trail for free and can pull
the data out with plain git at any time. It covers the everyday basics well — a cross-device timer,
projects and tags, statistics for any date range, PDF/Excel/ODS/CSV exports, and roles for workers,
editors and team leaders — and it imports your Clockify projects, tags and entries in one step. The
trade-off is deliberate: no native apps, no offline mode, no integrations, and everyone on the team
needs a GitHub account.
```

### 4. saasworthy.com

Form-heavy, with character limits per field. Use:

- **Product name:** `Workaddict`
- **Tagline (max ~60):** `Time tracking that lives in your own private GitHub repo`
- **Short description:** the ~120 char block above
- **Full description:** the ~900 char long description above
- **Pricing:** Free — single free plan, no paid tiers, no trial needed
- **Deployment:** SaaS / Web, plus self-hosted (fork and host the static files)
- **Customer types:** Freelancers, Small Businesses, Startups
- **Categories:** Time Tracking Software, Timesheet Software, Employee Monitoring (closest fit)
- **Features to tick:** Timesheets, Reporting, Data Export, Multiple Users, Project Tracking, Offline
  Time Tracking → **no**, Mobile App → **no**, Integrations → **no**

---

## Screenshots

Captured 2026-09-23 from the demo (no real data), English UI, in `marketing/screenshots/`. They are
**not** in `public/`, so they are not published with the site — upload them to each directory by hand.

| File                          | Shows                                                      | Size     |
| ----------------------------- | ---------------------------------------------------------- | -------- |
| `1-tracker-running-timer.jpg` | Running timer with a project, plus the "Team now" live view | 1440×715 |
| `2-statistics.jpg`            | Statistics: totals, tracked-time bars, share by project     | 1440×715 |
| `3-export-menu.jpg`           | Export menu open: PDF, Excel, OpenDocument, CSV             | 1440×715 |
| `4-team-entries.jpg`          | Tracker in "Everyone" mode, entries per member              | 1568×779 |
| `5-statistics-dark.jpg`       | Dark mode: by project / member / tag, plus the entry table  | 1568×779 |

Suggested order when a site takes several: 1, 2, 4, 3, 5. If a site wants exactly one, use 1.

Retake them whenever the UI changes noticeably. The demo seeds its own data, so nothing private can
leak — but check the window before shooting, because a signed-in session would show real repo data.
The import wizard already has its own shots in `public/img/import/{en,de}/` (those *are* published,
because the import guides embed them), and `assets/social-preview.png` works as a banner image.

---

## Facts and rules

Pulled from `clockify-alternative/index.html`, `README.md` and the `landing-page` spec.

**Safe to claim:**

- Free, no paid plans, no user limit (each member needs a GitHub account)
- Static website, no server to host, no Workaddict account, no analytics or tracking
- Data as JSON files in the user's own private GitHub repository; every change is a git commit
- Open source, AGPL-3.0
- Exports: PDF, Excel (.xlsx), OpenDocument (.ods), CSV, full JSON backup
- Built-in Clockify import: projects, tags, entries, with user mapping and a preview
- Clockify Free was limited to 5 active users in April 2026; its reports cover one month at a time
  and CSV/Excel export needs a paid plan (as of September 2026, from clockify.me)

**Never claim:**

- GDPR compliance or EU hosting — the data sits on GitHub, a US company
- That Clockify is expensive, or any value judgement about competitors
- Ratings, review counts or user numbers we don't have
- Any feature from the limitations list above

**Always include:** `Clockify is a trademark of its owner. Workaddict is an independent project and
is not affiliated with Clockify.` — wherever the site allows a note.

**Re-verify Clockify's free-plan facts** before each submission; they change. If they do, update
`clockify-alternative/index.html`, its German twin, and this file together.
