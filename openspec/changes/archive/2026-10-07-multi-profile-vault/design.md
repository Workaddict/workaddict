## Context

**Today.** `src/features/auth/session.ts` stores one `Session` (`{mode, token, repo, branch, scopes?, ownerType?}`) under `workaddict.session`. It goes to `localStorage` with "Remember me" (plaintext token) and to `sessionStorage` otherwise. `AuthProvider` restores it on startup. `logout()` clears the key, the React Query cache and the whole IndexedDB blob cache. `onAuthExpired` (a 401 during use) calls `logout('sessionExpired')`, so a revoked token deletes the stored credentials. The signed-in and signed-out apps are separate route trees in `App.tsx`. `/fix` exists only in the signed-out tree, and only `/approve` exists in both.

**Constraints.** The app is a static site on GitHub Pages and has no server (SECURITY.md, README). The CSP allows `connect-src` only to `api.github.com` and `*.clockify.me`, and scripts only from the app's own origin. Trusted Types are enforced. So everything must use browser APIs: WebCrypto, IndexedDB (`idb-keyval` is already a dependency), BroadcastChannel and Web Locks.

**GitHub fact that shapes the model.** A fine-grained token has exactly one resource owner and can be limited to some of that owner's repositories. So one token can serve several workspaces of the same owner, and a different organization always needs another token.

**Device-local state.** Presence (`workaddict.lastAlive`, Web Lock `workaddict-open`) is device-wide. The timer-device record (`workaddict.timerDevice`) holds a single `timerId`. Stats state lives in sessionStorage and prunes unknown IDs. Setup wizard progress is device-wide and only used while signed out. Theme, language, time format and time zone override are device-wide by intent.

## Goals / Non-Goals

**Goals:**
- Switch between data repositories in one click, with no token re-entry.
- Tokens at rest and in the export file are encrypted under a passphrase the user chooses.
- Two tabs can work in two projects at the same time.
- Workspaces can be moved to another device with a file.
- No server, no new runtime dependency, no CSP change.

**Non-Goals:**
- Server-side accounts, cloud sync, or "Sign in with GitHub" (OAuth or GitHub App). These were discussed in exploration and deferred.
- Protection against script running in the app's origin (XSS). That stays covered by the CSP and Trusted Types, not by the vault.
- Passphrase recovery.
- Per-profile settings for theme, language, time format or time zone.
- Discovering repositories a token can reach (`GET /user/repos`). This could be a follow-up.
- Putting the demo into the switcher.

## Decisions

**D1: The vault is a single encrypted blob in `localStorage`.**
```
workaddict.vault = {
  "format": "workaddict-vault", "v": 1,
  "kdf": { "name": "PBKDF2", "hash": "SHA-256", "iterations": 600000, "salt": "<b64 16B>" },
  "check": "<b64>",            // AES-GCM of a fixed string, to verify the passphrase cheaply
  "iv": "<b64 12B>", "data": "<b64 AES-GCM ciphertext>",
  "rev": 7                     // write counter, plaintext, for cross-tab change detection
}
plaintext of data = {
  "tokens":   [{ "id", "token", "owner", "login", "kind", "scopes"?, "rejected"? }],
  "workspaces": [{ "id", "label", "repo", "branch", "ownerType"?, "tokenId", "lastUsed" }]
}
```
Everything except KDF parameters, `check` and `rev` is encrypted, including repository names. The locked screen therefore shows no repository list. That's a deliberate privacy choice: repository names can reveal clients. A fresh IV is used for every write. The KDF parameters are stored so the iteration count can be raised later (re-encrypt on the next unlock).
Alternative considered: one encrypted entry per workspace, so a single workspace can change without rewriting everything. Rejected, because a whole vault is a few KB and atomic writes are simpler.

**D2: The key comes from PBKDF2-SHA256 with 600,000 iterations (OWASP 2023), giving a non-extractable AES-GCM-256 `CryptoKey`.**
Built into WebCrypto, so no WASM. Argon2id is stronger against GPU attacks but needs a dependency and a CSP review (`wasm-unsafe-eval`). Rejected for v1. The format's `kdf.name` field leaves room to add it later. The passphrase has a minimum of 10 characters, and a strength hint is shown without blocking.

**D3: Two unlock modes, chosen when the passphrase is set and changeable in Settings.**
- *Ask on every visit* (default): the key is held only in memory. Open tabs share it (D4). When the last tab closes, the vault is locked.
- *Stay unlocked on this device*: the non-extractable `CryptoKey` is also stored in IndexedDB (`workaddict-keys` / `vault`). Structured clone keeps a CryptoKey non-extractable, so script can use it but can't read the raw key. This matches today's "Remember me" in convenience, and the token is no longer readable as plaintext on disk.
"Lock" removes the in-memory key in every tab, and in the second mode also the IndexedDB key. The next unlock asks for the passphrase and offers the "stay unlocked" checkbox again, pre-checked from the saved mode.

**D4: Tabs coordinate over BroadcastChannel `workaddict-vault`.**
Messages: `key-request`, `key` (carries the CryptoKey, which is structured-cloneable), `locked`, `changed {rev}`. A new tab in "ask every visit" mode sends `key-request` and waits about 300 ms. If an unlocked tab answers, it is unlocked without a prompt. `storage` events on `workaddict.vault` also trigger a re-read (fallback when BroadcastChannel is missing). Writes run inside the Web Lock `workaddict-vault-write`: read the latest blob, decrypt, apply the change, encrypt, write, increment `rev`, broadcast. Without Web Locks, last write wins, which is acceptable for a rare race between two tabs editing workspaces.

**D5: Session model: the per-tab active workspace replaces the stored session.**
- `sessionStorage['workaddict.activeProfile'] = <profileId>` is set per tab, so it survives a reload of that tab.
- When a tab starts with an unlocked vault and no active workspace, it opens the workspace with the newest `lastUsed`. A switch updates `lastUsed`.
- A sign-in without saving keeps today's `sessionStorage['workaddict.session']` (tab-only, never in the vault).
- `AuthState.ready` gains `profileId?: string`. `Session` (github) stays the runtime shape and is built from token + workspace, so adapter code doesn't change.
- `loadSession()` order on startup: tab session → active workspace → most recent workspace → legacy `localStorage` session (D10) → signed out.

**D6: Switching is an in-place re-open, not a reload.**
`switchProfile(id)` builds the session, calls `open()` (adapter `init` + `getCurrentUser`), then `queryClient.clear()`, sets the state, and navigates to `/`. The current page is not preserved, because entity IDs differ between repositories. The blob cache is kept: it is content-addressed by SHA, so sharing it across repositories is safe and makes switching back fast. React Query keys are not scoped by repository. The cache is cleared on switch instead. That's simpler and stays correct as long as each tab holds only one workspace.

**D7: Blob-cache persistence follows the unlock mode.**
It persists in IndexedDB only for "stay unlocked". In "ask every visit" and tab-only sessions it lives in memory. Otherwise repository content would sit unencrypted on disk while the tokens are protected, which would undermine the point of asking every visit. On startup without a stay-unlocked key, the existing "clear cache when nothing is remembered" rule applies.

**D8: Token reuse per owner.**
"+ Add workspace" shows the repository field first. When the vault holds a non-rejected token whose `owner` matches the repository owner (case-insensitive), the form offers "Use your token for <owner>" (default) or "Enter a new token". The reused token goes through the same `checkLogin`. On failure the user lands on the fix page as usual, and the form opens with "Enter a new token" selected. Tokens are deduplicated by value on save. A classic token has `owner = login` but can reach other owners' repositories, so classic tokens are offered for every owner, with the existing classic-token warning.

**D9: Rejected tokens.**
`onAuthExpired` during a workspace session marks the token `rejected: true` (a vault write), ends the tab's session and shows the workspace picker, where every workspace using that token shows "Token rejected". Clicking one goes to `#/fix?e=invalidToken&repo=…&from=profile&profile=<id>`. "Replace token for this workspace" opens the add form in replace mode: the repository is locked, a new token is entered, and on success the token entry is replaced, which repairs all workspaces that share it. The startup case (a stored token that GitHub rejects) behaves the same. Tab-only sessions keep today's behavior (cleared, "session expired").

**D10: Migration of legacy remembered sessions.**
When `localStorage['workaddict.session']` exists and there is no vault, the app signs in from it as today. It shows a dismissible notice in the app and a note in Settings: "Your token is saved unencrypted. Protect it with a passphrase and add more projects." Accepting creates the vault with that token and workspace, then deletes the legacy key. Dismissing hides the notice for this tab session only. New sign-ins never write the legacy key. Rollback: an older app version won't find `workaddict.session` after migration and shows sign-in. Users re-enter the token once. That's acceptable.

**D11: Signed-in routes for add and fix.**
`/fix` and a new `/add-project` route are mounted in the signed-in tree too, without app chrome, like `/approve`. `SignInFrom` gains `'add'` and `'workspace'`. On success from those flows, the vault is updated and the tab switches to the new workspace. "Change token or repository" returns to `/add-project`. On the signed-out start page with an unlocked vault, the workspace picker replaces the landing hero. "Sign in without saving" stays available as a link.

**D12: Running-timer indicator.**
When the avatar menu opens, the app fetches `timers/<login>.json` for every other workspace (one contents GET each, at most 4 at a time, cached for 60 s). It uses a lightweight client that bypasses the adapter so no full `init` is needed. The `login` is stored on the token entry at sign-in. Errors show nothing. An accessible label reads "Timer running".

**D13: Stop-on-close per workspace.**
`workaddict.timerDevice` becomes a map `{ [repoLowercase]: {timerId, keep} }`. The old single-object form is read as belonging to the first workspace opened after the update, then rewritten. Presence (heartbeat and Web Lock) stays device-wide: any open Workaddict tab counts as "open". This is conservative. With a globex tab open, closing the acme tab does not trigger the question for acme. The only effect is a missed question, never a wrong stop.

**D14: Export and import.**
Export downloads the vault blob as is (`workaddict-workspaces-YYYY-MM-DD.json`, same format, `rev` dropped) after the passphrase is re-entered. The re-entry confirms intent and that the user knows the passphrase the file needs. Import:
- *No vault on this device:* the file becomes the vault after its passphrase verifies (`check`). The unlock mode is asked.
- *Vault exists and is unlocked:* the user enters the file's passphrase. Workspaces merge by `repo` (case-insensitive). New ones are added. For an existing repository with a different token, the user chooses per conflict: "keep this device's" or "use the imported". Tokens are deduplicated by value. The local passphrase stays.
Files with an unknown `format` or a newer `v` are refused with a message.

**D15: Forget all / Reset.**
"Forget all workspaces on this device" (Settings) and "Reset workspaces" (locked screen, for a forgotten passphrase) both remove `workaddict.vault`, the IndexedDB key, the legacy session, the tab session and the blob cache, then broadcast `locked` and sign every tab out. Both need confirmation that names the consequence: tokens must be entered again, nothing on GitHub changes.

**D16: Token expiry.**
Dropped. Spike (task 0.2, 2026-10-07): `api.github.com` sends `Access-Control-Expose-Headers: ETag, Link, Location, Retry-After, X-GitHub-OTP, X-RateLimit-*, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval, X-GitHub-Media-Type, X-GitHub-SSO, X-GitHub-Request-Id, Deprecation, Sunset`. `github-authentication-token-expiration` is not in the list, so browser JS cannot read it. No `expiresAt` is stored and no expiry is shown; there is no fallback guess. Can be revisited if GitHub exposes the header.

## Risks / Trade-offs

- [XSS can still use an unlocked key or read decrypted tokens from memory] → Stated in SECURITY.md. The vault protects at rest and in transit as a file. The CSP and Trusted Types remain the XSS defense.
- [A weak passphrase plus a stolen export file allows offline brute force] → 600k PBKDF2 iterations, a 10-character minimum, a strength hint, and a warning on export. Argon2 could come later.
- [Forgotten passphrase means lost workspaces] → Stated when the passphrase is created and on the locked screen. Tokens still exist on GitHub, and the user can create new ones. Export is not a backup if the passphrase is forgotten too, and the app says so.
- [Concurrent vault writes from two tabs] → Web Lock around read-modify-write, plus `rev` and broadcast. Without Web Locks, last write wins.
- [BroadcastChannel unavailable (old Safari) means each tab in "ask every visit" mode prompts] → Acceptable degradation. "Stay unlocked" works without it.
- [PBKDF2 at 600k takes about 0.3–1 s on phones] → Shown with a spinner, and run only on unlock, change, export and import, never on switch.
- [Presence stays device-wide, so the close question is missed while another workspace's tab is open] → Documented in D13. It errs toward not stopping.
- [Legacy plaintext sessions linger for users who ignore the prompt] → They keep working as before, and the Settings note stays. A later change can enforce migration.

## Migration Plan

1. Ship the vault, the switcher and migration together. Legacy sessions keep working until the user accepts.
2. No data-repository changes. Everything is browser-local.
3. Rollback: an older version ignores `workaddict.vault` and the new keys. Migrated users sign in again once. Tab-only sessions are unaffected.

## Open Questions

- Is `github-authentication-token-expiration` exposed to browser JavaScript? Resolved by spike task 0.2: no, so expiry display is dropped (D16).
- Should workspaces get a user-editable label in v1, or is `owner/name` enough? Current answer: editable, defaulting to `owner/name`.
