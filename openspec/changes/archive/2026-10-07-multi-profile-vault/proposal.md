## Why

People often track time for several teams or clients, each with its own data repository, and often in different organizations. A fine-grained token covers only one resource owner. Today Workaddict keeps exactly one session, so switching projects means logging out and pasting another token, which most users don't have saved anywhere. "Remember me" also stores that one token in plaintext in `localStorage`.

## What Changes

- New **workspace vault**: an encrypted list of tokens and workspaces (one workspace per data repository), kept in this browser. It is protected by a passphrase the user chooses. Keys come from PBKDF2-SHA256 via WebCrypto and the data is encrypted with AES-GCM. There is no server and nothing leaves the browser.
- Each token is stored once and can serve several workspaces. When the user adds a repository whose owner already has a stored token, the app offers to reuse it, and checks it before saving.
- **Workspace switcher** in the avatar menu. It lists all workspaces, switches with one click and no confirmation, marks workspaces where the user's timer is running, and offers "+ Add workspace", which reuses the sign-in form and the fix-page flow.
- **Per-tab active workspace.** Two tabs can show two different projects at the same time. A new tab opens the most recently used workspace.
- **Unlock modes**, chosen by the user: "Ask for the passphrase on every visit", or "Stay unlocked on this device". The second keeps a non-extractable WebCrypto key in IndexedDB. Open tabs share the unlocked state, and "Lock" locks every tab.
- **Forgotten passphrase:** there is no recovery. "Reset workspaces" deletes the vault on this device. The app says so when the passphrase is created.
- **Export and import.** The vault can be downloaded as an encrypted file and imported on another device with the same passphrase. Import merges workspaces by repository and asks when the two sides hold different tokens for the same repository.
- **BREAKING (behavior):** "Remember me" now means "Save as a workspace on this device" and requires the vault. Signing in without it stays a tab-only session, as before. New plaintext tokens are no longer written to `localStorage`.
- **Migration:** existing users with a remembered plaintext session keep working. They are offered "Protect with a passphrase and enable workspaces", and the plaintext session is deleted once they accept.
- **A rejected token no longer wipes saved credentials.** The affected workspaces are marked "token rejected", and the fix page offers "Replace token for this workspace".
- **Logout** splits into "Lock", "Remove this workspace" and, in Settings, "Forget all workspaces on this device". The last one also clears cached repository data.
- "This device started the timer" (stop on page close) is remembered per workspace, so timers in two repositories don't overwrite each other.

## Capabilities

### New Capabilities
- `profile-vault`: the encrypted vault (format, passphrase, key derivation, unlock modes, lock, reset), the token and workspace model with token reuse, the workspace switcher, per-tab active workspace, adding and removing workspaces, export and import, and migration of remembered plaintext sessions.

### Modified Capabilities
- `auth-and-workspace`: "Session persistence" (Remember me saves to the vault; no new plaintext storage; a rejected token marks workspaces instead of clearing them), "Logout" (lock / remove workspace / forget all), and "Token login" (adding a project while signed in).
- `sign-in-recovery`: the fix page is also reachable while signed in, for adding a project and for replacing a rejected token, and offers "Replace token for this workspace".
- `app-shell`: "Navigation" (the avatar menu holds the workspace switcher and Lock), "Settings page" (a Workspaces section with unlock mode, change passphrase, export, import and forget all), and "Security policy" (the threat model covers the vault).
- `time-tracking`: "Stop on page close" remembers the timer device per workspace.

## Impact

- `src/features/auth/session.ts`, `AuthContext.tsx`, `useSignIn.ts`, `signInAttempt.ts`, `SignInForm.tsx`, `LoginPage.tsx`, `FixPage.tsx`: session restore, login, logout and auth-expired handling move to profile-based sessions.
- New module `src/features/profiles/` (vault crypto, vault store, BroadcastChannel sync, switcher UI, unlock and create-passphrase screens, export and import).
- `src/app/App.tsx`: routes for adding a project and the fix page inside the signed-in app.
- `src/app/Layout.tsx` `UserMenu`: switcher, Lock, Remove.
- `src/features/settings/SettingsPage.tsx`: Workspaces section.
- `src/storage/github/githubAdapter.ts` / `client.ts`: the user's login from `checkLogin` is stored with the token.
- `src/storage/github/blobCache.ts`: the persistent cache follows the unlock mode, not "Remember me".
- `src/features/tracker/stopOnClose.ts`: timer-device record keyed by workspace.
- `src/i18n/en.ts`, `de.ts`, `SECURITY.md`, `README.md`.
- No new runtime dependencies (WebCrypto, IndexedDB via the existing `idb-keyval`, BroadcastChannel, Web Locks). The CSP is unchanged.
