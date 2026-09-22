## Context

Workaddict is a static SPA on GitHub Pages. Each user pastes a GitHub token with push access to a private data repo. The token lives in `sessionStorage` or, with "Remember me", in `localStorage`. File contents are cached by blob SHA in IndexedDB (`blobCache.ts`). A strict CSP is injected into the production `index.html` as a `<meta>` tag, because Pages cannot set response headers.

Two attackers matter:

```
 outsider ──► steal the token      (XSS, clickjacking, shared device, malicious dependency)
 insider  ──► member with push     (writes any file in the data repo, bypassing roles)
```

Roles are app-enforced only, and that is already disclosed (`roles-and-permissions`: "Enforcement limitation disclosed"). This change does not try to stop an insider from editing files. It makes sure that what an insider writes cannot crash the app, lie about attribution in obvious ways, or reach a dangerous sink.

## Goals / Non-Goals

**Goals:**
- Treat every file from the data repo as untrusted input.
- Leave no private data on disk after a session the user did not ask to remember.
- Make the app unframeable and tighten the CSP as far as the libraries allow.
- Make a supply-chain compromise harder to ship and faster to notice.
- Give users honest, actionable warnings about token scope and shared devices.

**Non-Goals:**
- Server-side role enforcement or commit-history tamper detection.
- Encrypting the stored token. The key would have to live next to it.
- A token-expiry warning. GitHub's `github-authentication-token-expiration` header is not in `Access-Control-Expose-Headers`, so the browser cannot read it (verified 2026-09-22).
- CSV formula injection (handled in `multi-format-export`).

## Decisions

### 1. Validation at the store boundary, with pass-through on write

`RepoAdapter` reads and writes every data file through a codec per file kind (`readFile`/`writeFile` wrappers around `FileStore.read`/`write`, so the `FileStore` contract is unchanged and both the GitHub and the memory store are covered):

```ts
interface Codec<T> {
  /** Splits raw JSON into what the app may use and what it must leave alone. */
  decode(raw: unknown, path: string): { value: T; rest: R; issues: number; unreadable: boolean }
  /** Puts untouched invalid records (`rest`) back next to the app's new value. */
  encode(value: T, rest: R): unknown
}
```

Codecs live in a new `src/storage/validate.ts`, written by hand. The rules:

| File | Valid when | Invalid handling |
|------|-----------|------------------|
| `entries/<login>/<YYYY-MM>.json` | array. Each entry has string `id`, `login` equal to the path's login, parseable ISO `start`/`end` with `end >= start`, string `description`, `projectId` string or null, `tagIds` string array, `createdAt`/`updatedAt` strings (bookkeeping only, so any string). Optional `stoppedBy` is a valid login | bad records go to `invalid` and are appended again on write. A non-array root makes the read return `[]` with a notice, and writes to that file are refused (`corruptData`) |
| `timers/<login>.json` | `null` or a timer with the same field rules, `login` equal to the path's login | read as `null` with a notice. Writing (stopping or starting) replaces it |
| `workspace.json` | object with `projects` and `tags` arrays. Project color is `#rgb` or `#rrggbb`. Unknown top-level keys and unknown project fields are kept | a bad color is replaced with the first palette color, which is saved on the next workspace write (harmless). Records failing other checks pass through on write |
| `roles.json` | existing `parseRoles`, plus login format | unchanged behavior |
| `tracker.json` | integer `schemaVersion` | treated as a newer schema, so the app goes read-only |

Logins taken from file paths must match the app's login format: GitHub logins plus the `clockify.<name>` pseudo-logins of imported former members (`^[A-Za-z0-9][A-Za-z0-9.-]{0,99}$`). Other paths are ignored. Invalid JSON and oversized files surface from the store as a `corruptData` error, which the adapter records as an unreadable file.

*Why pass-through:* dropping invalid records on write would let one bad record silently delete data on the next edit. That is worse than showing it. *Alternative:* refuse every write to a file with any invalid record. Rejected, because it would block a member from tracking time for a whole month over one broken record.

*Why the login check:* without it, `bob` can put entries with `"login": "alice"` into his own file and they would count as Alice's hours. This is one line of code and closes the cheapest attribution lie.

*Why no schema library:* five small shapes do not justify zod's size, and the project already validates by hand (`parseRoles`).

The memory store (demo) goes through the same codecs. Its data is app-written, so this costs nothing and keeps one code path.

### 2. File size cap from the tree listing

Recursive tree entries include `size`. Blobs larger than 2 MB are not fetched. The file reads as empty or invalid with a notice. A month of one member's entries is a few KB, so this limit never hits real data but stops a multi-MB blob from freezing the tab or filling IndexedDB.

### 3. Notices, not toasts per file

Validation problems are collected per refresh into one "Some data in the repository could not be read" notice. It lists the file paths (not their content) and does not repeat on every poll for the same blob SHA. The paths let an owner fix the file on GitHub.

### 4. Cache persistence follows "Remember me"

`createBlobCache({ persist })`: when `persist` is false, the memory map is the only layer. `AuthProvider` passes `persist = remember`. On startup, if no remembered session exists in `localStorage`, `clearBlobCache()` runs before anything else. That cleans up after closed non-remembered tabs, including data left by older app versions.

*Alternative:* encrypt the cache with a per-session key in `sessionStorage`. Rejected: more code, and the gain over "don't write it" is nil.

### 5. Frame protection in `main.tsx`

Before `createRoot`, check `window.top !== window.self` (in a try/catch, since cross-origin access can throw, which also means "framed"). When framed, render a minimal static message with a `target="_blank"` link to the app instead of `<App />`. A frame sandboxed without scripts cannot run the app at all, so no interactive UI is exposed.

*Alternative:* `frame-ancestors` in a CSP. Not possible, because browsers ignore it in `<meta>` and Pages cannot send headers.

### 6. CSP: Trusted Types and style-src

Add `require-trusted-types-for 'script'; trusted-types 'none'`. React 19 does not need a policy for normal rendering, and the codebase has no `dangerouslySetInnerHTML`. Verify every page and both exports in `vite preview` with the console open. If a library trips a sink, allow one named policy for it rather than dropping the directive.

Try removing `'unsafe-inline'` from `style-src`. React `style` props go through CSSOM, which CSP does not block. Only `<style>` tags and `style=""` markup are blocked. Keep `'unsafe-inline'` only if a library (e.g. Recharts or jsPDF) is shown to need it, and note which one in `vite.config.ts`.

### 7. Token warnings

Login switches to the tracker right after validation, so a warning shown only after submit would never be read. Instead:
- The login form detects a classic token by its `ghp_` prefix while the user types (fine-grained tokens start with `github_pat_`) and shows a non-blocking warning next to the field, linking to the fine-grained setup steps.
- `GitHubClient` records the `X-OAuth-Scopes` response header, which GitHub exposes via CORS. `checkLogin` returns the scopes and they are stored with the session (not secret), so the settings page needs no extra request. The settings page shows the warning for classic tokens for the whole session. When the scopes include `repo`, it says the token can read and write *all* of the user's private repositories.

Classic tokens are not blocked. The README documents a legitimate case (a data repo owned by another personal account) where they are the only option.

The "Remember me" label gets a helper line: the token is saved on this device, use it only on your own device.

### 8. CI supply chain

In `deploy.yml`:
- Pin each action to a full commit SHA, with the version as a trailing comment (`actions/checkout@<sha> # v4.x.y`).
- `actions/checkout` with `persist-credentials: false`.
- Move `pages: write` and `id-token: write` from the workflow to the `deploy` job. `build` gets `contents: read` only.
- `npm ci --ignore-scripts`, kept only if `npm test` and `npm run build` pass without install scripts (esbuild/rolldown ship prebuilt binaries as optional dependencies). If they fail, keep scripts and note why in the workflow.
- `npm audit --omit=dev --audit-level=high` before the build.

New `.github/dependabot.yml` for `npm` and `github-actions`: weekly, minor and patch updates grouped, `cooldown` of 7 days so brand-new (possibly malicious) releases wait before being proposed.

### 9. SECURITY.md

Contents: how to report (GitHub private vulnerability reporting, to be enabled in repo settings), supported version (latest `main` on Pages), and a short threat model: token in browser storage, app-enforced roles, what CSP and frame protection cover. The README gets a short "Security" section linking to it.

## Risks / Trade-offs

- [A validator stricter than the writer rejects legitimate old data] → Codecs accept exactly what the app has ever written, including optional `stoppedBy`. Tests run every fixture of the existing adapter tests through the codecs. Invalid records are never deleted.
- [Trusted Types breaks a lazy-loaded export path that is only tested manually] → Manual check list in tasks covers PDF, XLSX and Clockify import in `vite preview`. Unit tests cannot catch it.
- [The audit gate blocks a deploy when an advisory is published for a dependency without a fix] → A failing audit is fixed by a Dependabot update or a documented `overrides` entry (as already done for `uuid`). The deploy of the previous version stays live.
- [Non-remembered users lose the persistent cache and pay a slower cold load each visit] → Accepted: this is the privacy promise of not remembering. `scale-with-history` bounds cold-load concurrency.
- [Frame check breaks legitimate embedding] → No such use case exists. The message links to the real app.
- [Pinned SHAs go stale] → Dependabot's `github-actions` ecosystem updates SHA pins.

## Migration Plan

No data migration. Deploy as usual. On first load after deploy, users without a remembered session have their persisted cache wiped once. Rollback = revert the commit. Validation only affects reads and never rewrites files by itself.

## Open Questions

- Does any bundled library need `'unsafe-inline'` styles or a Trusted Types policy? Answer during implementation (task 5.x).
- Does `npm ci --ignore-scripts` work with the current Vite/Rolldown toolchain on `ubuntu-latest`? Answer in CI (task 7.x).
