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
- **Data left on shared devices.** Without "Remember me", the token lives in `sessionStorage` and repository data is cached in memory only. Logging out removes the token and all cached data.
- **Supply-chain attacks on the build.** GitHub Actions are pinned to commit SHAs, dependencies are installed without running install scripts, the deploy fails on known high-severity vulnerabilities, and dependency updates wait 7 days after release.

**What it does not protect against**

- **Members with write access.** Roles (worker, editor, team leader) are enforced by the app, not by GitHub. A member can change any file directly on GitHub or through the API. Every change is a commit naming its author, so it can be found and reverted. Only give repository access to people you trust.
- **A compromised browser or device.** A token saved with "Remember me" is stored in `localStorage` and can be read by anyone with access to the browser profile. Use fine-grained tokens limited to the data repository, with an expiration date, and revoke a token on GitHub if it may have leaked.
- **Broad classic tokens.** A classic token with the `repo` scope can access all of its owner's repositories. The app warns about classic tokens but allows them, because they are the only option for data repositories owned by another personal account.
