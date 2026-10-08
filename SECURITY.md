# Security policy

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Report them privately through GitHub: open the repository's **Security** tab and click **Report a vulnerability** ([direct link](https://github.com/Workaddict/workaddict/security/advisories/new)). Include steps to reproduce and, if you can, the affected version (commit).

Once a fix is deployed, the advisory is published and you are credited unless you prefer otherwise.

## Supported versions

Only the latest version on `main`, as deployed to GitHub Pages, receives fixes. If you host your own copy, update it from `main`.

## Threat model

Workaddict is a static website. It has no server of its own: the browser talks directly to the GitHub API with each member's personal access token, and all data lives in a private repository the team controls.

**What the app protects against**

- **Script injection (XSS).** A strict Content Security Policy allows scripts only from the app's own origin and network requests only to `api.github.com` and `*.clockify.me`. Trusted Types are enforced, so no string can reach an HTML or script sink, and inline styles are not allowed. React escapes all rendered data.
- **Clickjacking.** The app does not render inside a frame. (The usual `frame-ancestors` header is not available on GitHub Pages, so this is enforced in the app.)
- **Malformed or malicious repository data.** Any member with push access can write anything into the data repository. The app validates every file: invalid records are not shown and are kept unchanged on write, an entry must belong to the member whose file it is in, colors and logins must have a safe format, and files over 2 MB are not loaded. Problems are listed in a notice instead of breaking the app for the team.
- **Tokens at rest.** "Save as a workspace on this device" stores tokens only in an encrypted workspace vault in `localStorage`. The key is derived from a passphrase the user chooses (PBKDF2-SHA256, 600,000 iterations, random salt) and the vault is encrypted with AES-GCM-256 under a fresh IV on every write. Tokens, repository names, labels and logins are all inside the ciphertext; only the key derivation parameters, a passphrase check value and a write counter are plaintext. The passphrase, the key and the vault never leave the browser. The passphrase cannot be recovered; "Reset workspaces" deletes the vault.
- **Unlock modes.** "Ask for the passphrase on every visit" (the default) keeps the key in the memory of open tabs only; open tabs share it over a `BroadcastChannel`, and the vault is locked when the last tab closes. "Stay unlocked on this device" also stores the key in IndexedDB as a non-extractable WebCrypto key, so script in the app can use it but cannot read the raw key bytes. Cached repository data is kept on disk only in this mode; otherwise it lives in memory. "Lock" removes the key from every tab and from IndexedDB.
- **Exported workspaces.** The export file is the encrypted vault itself and needs the passphrase to be imported. It contains no plaintext token or repository name.
- **Data left on shared devices.** Signing in without saving keeps the token in `sessionStorage` for that tab only, and repository data is cached in memory only. "Sign out" removes the token and cached data; "Forget all workspaces on this device" removes the vault, the stored key and all cached data, and signs out every open tab.
- **Supply-chain attacks on the build.** GitHub Actions are pinned to commit SHAs, dependencies are installed without running install scripts, the deploy fails on known high-severity vulnerabilities, and dependency updates wait 7 days after release.

**What it does not protect against**

- **Members with write access.** Roles (worker, editor, team leader) are enforced by the app, not by GitHub. A member can change any file directly on GitHub or through the API. Every change is a commit naming its author, so it can be found and reverted. Only give repository access to people you trust.
- **Script running in the app (XSS).** While the vault is unlocked, its key can be used and decrypted tokens are in memory, so script running in the app's origin could read them. The vault protects tokens at rest and in export files; the Content Security Policy and Trusted Types remain the defense against XSS.
- **A weak passphrase.** Anyone who has the vault (from the browser profile) or an export file can try passphrases offline. The 10-character minimum, the strength hint and 600,000 PBKDF2 iterations slow this down but cannot make a guessable passphrase safe.
- **A compromised browser or device.** In "Stay unlocked on this device" mode, anyone using the browser profile can open the saved workspaces without the passphrase. Sessions remembered in plaintext by earlier versions stay readable in `localStorage` until the user accepts "Protect with a passphrase". Use fine-grained tokens limited to the data repository, with an expiration date, and revoke a token on GitHub if it may have leaked.
- **Broad classic tokens.** A classic token with the `repo` scope can access all of its owner's repositories. The app warns about classic tokens but allows them, because they are the only option for data repositories owned by another personal account.
