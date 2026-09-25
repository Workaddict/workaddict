## 1. Validation module

- [x] 1.1 Create `src/storage/validate.ts` with `isLogin`, `isIsoTimestamp`, `isHexColor` and a `Codec<T>` type (`decode(raw, path) → { value, invalid }`, `encode(value, invalid)`)
- [x] 1.2 Add codecs for entry files (login from path must match, `end >= start`, optional `stoppedBy` is a login), timer files, `workspace.json` (bad color → first palette color, other bad records pass through), `tracker.json`, and `roles.json` (reuse `parseRoles`, add login check)
- [x] 1.3 Unit tests per codec: valid data round-trips unchanged; each rule rejects its bad case; invalid records come back from `encode` unchanged and in their original order after the valid ones; a non-array/non-object root is reported as unreadable

## 2. Store integration

- [x] 2.1 Change `GitHubFileStore.read`/`write` to take a codec; `write` passes only `value` to the update function and merges `invalid` back via `encode`; a write to a file with an unreadable root throws a new `corruptData` `StorageError` naming the path
- [x] 2.2 Record `size` from the tree listing; skip content requests for blobs over 2 MB and report them as unreadable
- [x] 2.3 Ignore tree paths under `entries/` and `timers/` whose login segment fails `isLogin`
- [x] 2.4 Collect problems (path + blob SHA + reason) per refresh and expose them from the adapter (e.g. `dataProblems()` on the `StorageAdapter` contract; the memory store returns `[]`)
- [x] 2.5 Update every `store.read`/`store.write` call in `src/storage/repoAdapter.ts` to pass the matching codec
- [x] 2.6 Adapter tests with `fakeGitHub.ts`: malformed record hidden but kept after an unrelated add; entry with foreign login not counted; `{"entries": 42}` reads as empty and refuses writes; 20 MB blob never fetched; bad path login not listed as member; `contract.ts` suite still passes on both adapters

## 3. Data problem notice

- [x] 3.1 Add a hook that reads the adapter's problems after each refresh and shows one dismissible notice listing file paths; remember dismissed `path@sha` pairs for the session so unchanged files don't re-notify
- [x] 3.2 Map `corruptData` in `useErrorText` to a message naming the file and asking an owner to fix it on GitHub
- [x] 3.3 Add en/de strings; component test that the notice appears once and stays dismissed across polls

## 4. Cache lifetime

- [x] 4.1 Add a `persist` option to `createBlobCache`; when false, use only the in-memory map
- [x] 4.2 In `AuthContext`, create the cache with `persist` equal to whether the session was remembered
- [x] 4.3 At startup (before rendering the login page), call `clearBlobCache()` when `localStorage` holds no remembered session
- [x] 4.4 Tests (fake-indexeddb): non-remembered session writes nothing to IndexedDB; leftover IndexedDB content is cleared on startup without a remembered session; a remembered session keeps and reuses it

## 5. CSP and frame protection

- [x] 5.1 In `src/main.tsx`, detect framing (`window.top !== window.self`, with a thrown access counting as framed) and render a static message with a `target="_blank"` link instead of the app; add en/de strings; unit test both branches
- [x] 5.2 Add `require-trusted-types-for 'script'` and `trusted-types 'none'` to the CSP in `vite.config.ts`
- [x] 5.3 Remove `'unsafe-inline'` from `style-src`
- [x] 5.4 `npm run build && npm run preview`: open every page, export PDF and XLSX, run the Clockify import up to the preview step, toggle theme and language; check the console for CSP/Trusted Types violations
- [x] 5.5 For each violation found in 5.4, either fix the code, allow one named Trusted Types policy, or restore `'unsafe-inline'` for styles, with a comment in `vite.config.ts` naming the library that needs it; repeat 5.4 until clean
- [x] 5.6 Update the CSP comment in `vite.config.ts` to explain why `frame-ancestors` is absent (ignored in `<meta>`) and where framing is handled instead

## 6. Token warnings

- [x] 6.1 In `GitHubClient`, capture the `X-OAuth-Scopes` header from responses and expose it (e.g. `lastScopes`)
- [x] 6.2 Add `tokenKind(token)` → `'classic' | 'fineGrained' | 'other'` from the `ghp_` / `github_pat_` prefixes, with unit tests
- [x] 6.3 Login page: show a non-blocking warning under the token field while a classic token is entered, linking to the fine-grained setup steps
- [x] 6.4 Login page: add a helper line under "Remember me" stating that the token is saved on this device and to use it only on personal devices
- [x] 6.5 Settings page: for classic tokens show a warning for the session; when scopes include `repo`, state that the token can read and write all private repositories of the account
- [x] 6.6 Add en/de strings; component tests for login warning (shown for `ghp_`, hidden for `github_pat_`, button stays enabled) and settings warning with and without `repo` scope

## 7. CI and supply chain

- [x] 7.1 Pin every action in `.github/workflows/deploy.yml` to its full commit SHA with the version tag as a trailing comment (look up the current release SHAs; do not guess them)
- [x] 7.2 Set `persist-credentials: false` on `actions/checkout`
- [x] 7.3 Move `pages: write` and `id-token: write` to the `deploy` job; leave the workflow and `build` job at `contents: read`
- [x] 7.4 Add `npm audit --omit=dev --audit-level=high` after install in the build job
- [x] 7.5 Try `npm ci --ignore-scripts` locally (clean `node_modules`) followed by `npm test` and `npm run build`; keep the flag in CI if both pass, otherwise leave plain `npm ci` with a comment explaining which package needs its install script
- [x] 7.6 Add `.github/dependabot.yml` for `npm` and `github-actions`, weekly, minor/patch grouped, `cooldown` of 7 days

## 8. Documentation

- [x] 8.1 Add `SECURITY.md`: private vulnerability reporting via GitHub, supported version (latest `main` on Pages), threat model (token in browser storage and "Remember me", app-enforced roles, untrusted repo data handling, CSP and frame protection, what is not protected)
- [x] 8.2 Add a short "Security" section to `README.md` linking to `SECURITY.md`, recommending fine-grained tokens and "Remember me" only on personal devices
- [x] 8.3 Enable private vulnerability reporting in the GitHub repository settings (manual step for the repo owner; note it in the PR description)

## 9. Verify

- [x] 9.1 `npm test`, `npm run lint`, `npm run build` pass
- [ ] 9.2 Manual check against a real data repo: hand-edit an entry file on GitHub to add a broken record, confirm the notice appears, add an entry in the app, and confirm the broken record is still in the file afterwards
- [x] 9.3 Manual check: log in without "Remember me", load data, close the tab, reopen: IndexedDB `workaddict-cache` is empty
- [x] 9.4 Manual check: embed the preview build in a local `iframe` page and confirm only the message renders
- [ ] 9.5 Push to a branch and confirm the workflow passes with pinned actions and the audit step
