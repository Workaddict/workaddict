## Why

Commercial time trackers like Clockify are closed, hosted by a third party, and gate features behind paid plans. We want a private, free, and easy-to-understand alternative that a small team can run forever at zero cost, with full ownership of its data. Hosting the app on GitHub Pages and storing data in a private GitHub repository achieves that without operating any server.

## What Changes

- New single-page web app (React + Vite + TypeScript) deployed to GitHub Pages via GitHub Actions.
- Login via a GitHub fine-grained Personal Access Token; the app is pointed at a private data repository (owner/name) that holds all team data as JSON files.
- Pluggable storage layer: a `StorageAdapter` interface with a GitHub-repo implementation, so a future backend (e.g. Supabase) can replace it without touching UI code.
- Time tracking: live timer (synced across devices, one running timer per user) and manual entry creation/editing, each entry with a short description.
- Work groups: projects (one per entry) and tags (many per entry), manageable by any team member.
- Team: members are the collaborators of the data repository; all members see all entries.
- Statistics page: hours by project, tag, member, and time range, with charts.
- Export: PDF report, Excel (.xlsx), and full JSON backup.
- Bilingual UI (English / German), switchable at runtime.
- Clean, responsive, mobile-friendly interface.
- Out of scope for v1: billing/rates, invoicing, approvals, idle detection, calendar view, real server-side permissions.

## Capabilities

### New Capabilities
- `auth-and-workspace`: Token-based login, data-repository selection/validation, session persistence, logout, and the team member list derived from repo collaborators.
- `data-storage`: Storage adapter contract and the GitHub-repo implementation (file layout, reads/writes via the GitHub API, conflict handling, caching).
- `time-tracking`: Live synced timer and manual time entries (create, edit, delete, list) with description, project, and tags.
- `work-groups`: Projects and tags — create, rename, recolor, archive, delete, and assignment to entries.
- `statistics`: Stats page with filters (date range, members, projects, tags), totals, breakdowns, and charts.
- `data-export`: PDF report, Excel workbook, and JSON backup export of filtered or complete data.
- `app-shell`: Layout, navigation, responsive design, English/German i18n, and GitHub Pages deployment.

### Modified Capabilities
<!-- None: no existing specs. -->

## Impact

- New codebase at the repo root (`src/`, `index.html`, `vite.config.ts`, `package.json`).
- New GitHub Actions workflow for building and deploying to GitHub Pages; the app repo must be public (free Pages), the data repo private.
- External dependency: GitHub REST API (authenticated rate limit 5,000 requests/hour/user).
- New npm dependencies: React, React Router, a charting library, a PDF library, an xlsx library, an i18n library.
- Security surface: user tokens stored in browser storage; mitigated by fine-grained tokens scoped to the single data repo and a strict Content Security Policy.
