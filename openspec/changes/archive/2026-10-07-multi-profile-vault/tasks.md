## 0. Prerequisites and spike

- [x] 0.1 Archive `rolling-range-and-member-entries` and `keep-draft-across-entry-modes` (both also touch `time-tracking`; different requirements, but keep spec deltas linear)
- [x] 0.2 Spike: check whether `github-authentication-token-expiration` is readable from browser JS on `api.github.com` responses (CORS `Access-Control-Expose-Headers`). Record result in design.md D16; drop the expiry parts of 3.3, 5.2, 7.3 and 8.1 if not readable → not exposed, expiry dropped

## 2. Vault crypto and format

- [x] 2.1 `src/features/profiles/vaultCrypto.ts`: PBKDF2-SHA256 (600k, 16-byte salt) → non-extractable AES-GCM-256 key; encrypt/decrypt with fresh 12-byte IV; `check` value for passphrase verification; base64 helpers (reuse `src/storage/github/base64.ts` if suitable)
- [x] 2.2 Vault types and parser (`format`, `v`, `kdf`, `check`, `iv`, `data`, `rev`; plaintext `{tokens, workspaces}`), refusing unknown format or newer `v`
- [x] 2.3 Tests: round trip, wrong passphrase rejected, fresh IV per write, no plaintext token/repo in serialized vault, KDF params read from vault (not hardcoded) on decrypt

## 3. Vault store and tab sync

- [x] 3.1 `vaultStore.ts`: create, unlock, lock, read, write (Web Lock `workaddict-vault-write`, read-modify-write, `rev`++), change passphrase (new salt), reset; storage via `localStorage` key `workaddict.vault` with try/catch like other modules
- [x] 3.2 Unlock modes: in-memory key; "stay unlocked" persists the CryptoKey in IndexedDB store `workaddict-keys`; Lock removes both
- [x] 3.3 Token/profile operations: add token (dedupe by value, store `owner`, `login`, `kind`, `scopes`), add/replace/remove workspace (one workspace per repo, case-insensitive), remove orphaned tokens, mark/clear `rejected`, update `lastUsed`, edit label
- [x] 3.4 `vaultSync.ts`: BroadcastChannel `workaddict-vault` (`key-request`, `key`, `locked`, `changed`), `storage` event fallback, ~300 ms wait for key on startup
- [x] 3.5 React hook `useVault()` exposing state (`none` | `locked` | `unlocked`), workspaces, and actions; subscribed to sync events
- [x] 3.6 Tests for store and sync with fakes (two simulated tabs: shared unlock, lock propagates, concurrent writes keep both changes, removal of last workspace removes token)

## 4. Session model in AuthContext

- [x] 4.1 `session.ts`: stop writing plaintext to `localStorage`; keep tab-only `sessionStorage` session; add `workaddict.activeProfile` (sessionStorage); keep reading the legacy `localStorage` session for migration
- [x] 4.2 `AuthProvider` startup order: tab session → active workspace → most recent workspace → legacy session → signed out / unlock / picker; `AuthState.ready` gains `profileId`
- [x] 4.3 `switchProfile(id)`: open adapter, `queryClient.clear()`, set state, update `lastUsed`, navigate to `/`; keep blob cache
- [x] 4.4 Blob cache persistence follows unlock mode (persist only with "stay unlocked"); startup cleanup rule updated
- [x] 4.5 `onAuthExpired` / startup 401: workspace session → mark token rejected, end tab session, show picker; tab-only session → today's behavior
- [x] 4.6 Lock / Sign out / Remove workspace / Forget all actions in context; Forget all broadcasts and clears vault, IDB key, legacy and tab sessions, blob cache
- [x] 4.7 Update `src/test/renderWithSession.tsx` and AuthContext tests for workspace sessions, rejected token, switch clears query cache

## 5. Sign-in, add project, fix page

- [x] 5.1 `SignInForm`: "Save as a workspace on this device" replaces "Remember me"; when checked and no vault, run create-vault step (passphrase twice, min 10 chars, strength hint, unlock mode, no-recovery notice); when vault locked, ask to unlock first
- [x] 5.2 `checkLogin` returns user login (already); stored on token entry (expiry dropped, see D16)
- [x] 5.3 `SignInFrom` gains `add` and `profile`; `signInAttempt` holds `profileId` and save choice in memory
- [x] 5.4 `/add-project` route in signed-in tree (no chrome): repo field first, token reuse choice per D8 (owner match or classic), "Enter a new token" fallback; success saves workspace and switches
- [x] 5.5 Mount `/fix` in signed-in tree; back link returns to tracker; "Change token or repository" returns to `/add-project` or replace-token form; "Back" instead of "Back to sign-in" when signed in
- [x] 5.6 Replace-token flow (`from=profile`): repo locked, new token, success replaces token entry and clears `rejected` for all workspaces using it
- [x] 5.7 Adding an existing repo switches to it and offers replace token
- [x] 5.8 Tests: LoginPage/SignInForm (save choice, vault creation), add-project reuse and new token, fix page signed in, replace token repairs both workspaces

## 6. Start page states

- [x] 6.1 Unlock screen (passphrase, stay-unlocked checkbox, Forgot passphrase → Reset with confirmation, Import workspaces, Sign in without saving); no repo names shown
- [x] 6.2 Workspace picker (status incl. "Token rejected" → fix page, + Add project, Import, Sign in without saving)
- [x] 6.3 Tests for locked, picker and reset flows

## 7. Switcher UI

- [x] 7.1 `UserMenu` in `Layout.tsx`: workspace list with active mark, one-click switch, "+ Add workspace", Lock (or Sign out for tab-only), Remove this workspace with confirmation
- [x] 7.2 Running-timer indicator: on menu open, fetch `timers/<login>.json` for other workspaces via lightweight client (≤4 parallel, 60 s cache), accessible label; errors → no indicator
- [x] 7.3 ~~Expiry badge~~ dropped: header not readable under CORS (D16)
- [x] 7.4 Tests: switch changes data and clears queries, indicator shown for workspace with timer, rejected workspace marked

## 8. Settings, export, import, migration

- [x] 8.1 Settings "Workspaces" section: list with Remove, unlock mode toggle, Change passphrase, Export, Import, Forget all; tab-only variant (Sign out, Save as workspace); legacy variant (Protect with passphrase)
- [x] 8.2 Export: re-enter passphrase, download `workaddict-workspaces-YYYY-MM-DD.json` (vault without `rev`) with warning text; reuse existing JSON download helper from backup
- [x] 8.3 Import: file picker, format/version check, file passphrase; no vault → becomes vault + choose unlock mode; vault unlocked → merge by repo with per-repo conflict choice, dedupe tokens, local passphrase kept
- [x] 8.4 Migration notice for legacy plaintext session (in app, dismissible per tab session; persistent in Settings); accept creates vault and deletes `workaddict.session` from `localStorage`
- [x] 8.5 Tests: export→import round trip on "new device", merge with conflict, wrong file passphrase leaves vault unchanged, migration deletes plaintext

## 9. Stop on page close per workspace

- [x] 9.1 `stopOnClose.ts`: `workaddict.timerDevice` becomes map keyed by lowercase repo; read legacy single-object form once and rewrite
- [x] 9.2 Tests: timers in two workspaces both tracked; legacy record migrated

## 10. i18n, docs, verification

- [x] 10.1 All new strings in `en.ts` and `de.ts` (consistent German terminology: Profil, Passphrase, Sperren, Projekt hinzufügen)
- [x] 10.2 `SECURITY.md` threat model: vault, unlock modes, export file, XSS and weak-passphrase limits; README sign-in and security sections
- [x] 10.3 Run typecheck, lint and test suite
- [x] 10.4 Manual check in running app: create vault, add second project with reused token, add other-org project, two tabs on two workspaces, lock propagates, stay-unlocked survives browser restart, revoked token → replace, export/import into a fresh browser profile, legacy migration, timer indicator
