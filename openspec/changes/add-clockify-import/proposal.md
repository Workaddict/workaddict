## Why

Workaddict is meant to replace Clockify, but a team switching over loses its history unless it can bring it along. Since April 2026 the Clockify Free plan only exports PDF (no CSV/Excel) and limits the API to 30 requests per hour per workspace, so teams need a guided, request-frugal way to pull their existing data exactly once when they start using Workaddict.

## What Changes

- New one-time **"Import from Clockify"** wizard in Settings: paste a Clockify API key, pick a workspace, map Clockify users to GitHub logins, preview, and import.
- The import reads Clockify's REST API directly from the browser (verified: CORS allows cross-origin requests, page sizes above 50 are accepted, timestamps are UTC).
- Imports projects (name, color, archived), tags (name, archived), and all completed time entries (start, end, description, project, tags) for the mapped users. Clients, tasks, billable flags, rates, and running timers are not imported.
- No merging: if the data repository already contains entries, projects, or tags, the import **replaces** them after an explicit warning and confirmation (running timers are kept; old data remains in git history).
- All imported data is written in a **single commit**, instead of one commit per entry, to stay far below GitHub rate limits.
- Clockify users without a GitHub account (e.g. former members) can be kept as read-only "former members" so yearly totals stay correct, or skipped.
- The Clockify API key is held in memory only and never stored; after the import, the user is advised to delete the key in Clockify.
- The Content Security Policy is widened to allow connections to Clockify's API hosts.

## Capabilities

### New Capabilities
- `clockify-import`: One-time import wizard that fetches a Clockify workspace via its API, maps users, converts projects/tags/entries to the Workaddict model, previews totals, and writes them to the data repository, replacing existing data after confirmation.

### Modified Capabilities
- `data-storage`: Adds an atomic multi-file write (one commit for many files) and an import operation that may write entries for several members and optionally replace all existing entries, projects, and tags.
- `app-shell`: The Content Security Policy additionally allows connections to Clockify's API hosts; the Settings page gains the import entry point.

## Impact

- **Code**: new `src/features/import/` (Clockify client, converter, wizard UI); `src/storage/types.ts` (`FileStore.writeMany`, `StorageAdapter.importData`); `src/storage/repoAdapter.ts`, `src/storage/github/githubStore.ts` (Git Data API: tree + commit + ref update), `src/storage/memoryStore.ts`; `src/features/settings/SettingsPage.tsx`; `src/i18n/en.ts`, `src/i18n/de.ts`; `vite.config.ts` (CSP).
- **External APIs**: Clockify REST API v1 (`api.clockify.me` and regional hosts), read-only. GitHub Git Data API (refs, trees, commits) in addition to the Contents API.
- **Dependencies**: none new.
- **Security**: a third-party credential (Clockify API key) is entered in the app; it must never be persisted, logged, or sent anywhere except Clockify.
