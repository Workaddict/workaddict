## Context

`#/add-project` (`AddProjectPage` in `src/features/profiles/ProfilePages.tsx`) renders `TaskPage` (public header, back link, title) around `<SignInForm from="add" className="card stack">`. `.card` only sets background, border, radius and shadow; padding comes from `.card-pad` or `.login-card`, so the form sits on the card edge. `.ob-main` is 760px wide and the card fills it. `ReplaceTokenPage` uses the same classes.

The setup wizard (`SetupPage`, ends with `<SignInForm from="setup">`) and the join flow (`JoinPage`, ends with `<SignInForm from="join" lockRepo>`) are only in the logged-out route tree of `App.tsx`. Signed in, `*` redirects to `/`. The spec even has a scenario that a signed-in user opening a join link lands on the tracker.

`useSignIn` calls `login(session, saveOpts | false)`. `savesProfile` is true for `save || from === 'add' || from === 'profile'`. If a signed-in user signed in from `setup`/`join` with "Save as a profile" off, the tab would switch to an unsaved session and drop the current profile from the tab. `SignInForm` only runs the existing-profile check and token reuse for `from === 'add'`.

The app never creates repositories; the wizard guides the owner through GitHub (links, `gh` commands) and a fine-grained token scoped to that one repository. That stays so.

## Goals / Non-Goals

**Goals:**
- A signed-in user can start a new data repository or follow an invite from "Add workspace".
- Every signed-in flow that ends in a sign-in adds a workspace and switches to it; it never replaces the current profile with an unsaved session.
- The add and replace-token pages look like the sign-in card (padding, width), on desktop and phone.

**Non-Goals:**
- Creating repositories through the GitHub API (would need a token with Administration permission on all repositories, against the least-privilege token model).
- Showing the app header (nav, workspace switcher) on task pages; they stay without app chrome.
- Changes to the wizard steps themselves.

## Decisions

### D1: Path choice on the add page as radio cards, actions as links
`AddProjectPage` shows a radiogroup with the existing `.ob-modes` / `.ob-mode` cards: "Existing data repository" (default), "Set up a new data repository", "I have an invite link". Below it:
- existing → the current `SignInForm from="add"` in the fixed card;
- new → a short text and a primary link button to `#/setup`;
- invite → a field for the invite link (or `owner/name`) and "Open invite", which navigates to `#/join?repo=…[&kind=user]`.

The selection lives in component state, not in the URL. `?repo=` (coming back from the fix page) keeps "Existing" selected, which is the default anyway.
*Alternative:* embed the wizard into the add page. Rejected: the wizard is a long multi-screen flow with its own URL steps (`?step=`) and persisted state; linking reuses it unchanged.
*Alternative:* three plain buttons instead of a choice. Rejected: the form for the common case would then be one click further away.

### D2: Parsing the invite link
A small helper `joinPathFor` next to `joinTarget` in `names.ts` reads a pasted value: a full invite URL (`…/#/join?repo=a/b&kind=user`) gives `repo` and `kind`; otherwise `parseRepo` on the raw value. Invalid input shows an inline error and does not navigate. Only `repo` and `kind` are carried over, nothing else from the pasted URL.

### D3: `setup` and `join` routes in the signed-in tree
`App.tsx` adds `setup` and `join` next to `add-project` outside `Layout`, so they render without app chrome as today. The join page's handling of an invalid `repo` (start page with notice) becomes: signed in, go to `#/add-project` with the same notice, since the start page is not the signed-in home.

### D4: "Adds a workspace" instead of `from === 'add'`
`SignInForm` and `useSignIn` derive one flag: `addsWorkspace = from === 'add' || (signedIn && (from === 'setup' || from === 'join'))`. It drives what `from === 'add'` drives today: saving is mandatory (`savesProfile`), the "Save as a profile" checkbox is hidden, the existing-profile banner and the token reuse offer apply. `from` itself stays `setup`/`join`, so the fix page still returns to the right wizard step or join link.
*Alternative:* pass `from="add"` from the wizard when signed in. Rejected: the fix page uses `from` to find the way back.

### D5: Back targets when signed in
- add page: `/` (tracker), unchanged;
- setup wizard and join flow: `/add-project`;
- fix page: unchanged (`/` when signed in).
Label stays "Back"; signed in it is `profiles.back` like on the add page.

### D6: Card styling
A modifier `.task-card` on the form cards of both task pages: same padding as `.login-card` (28px, 20px under 560px), `max-width: 440px`, flex column with the existing 18px gap. The radio cards from D1 use the full column width so the three options stay readable; on phones `.ob-modes` already stacks.
*Alternative:* reuse `.login-card`. Rejected: `.landing .login-card` adds `justify-self: end` for the landing grid, which does not fit here and would couple two unrelated layouts.

## Risks / Trade-offs

- [Wizard progress from an earlier setup is still in `localStorage` (`workaddict.setup`) and reopens at a finished step] → The wizard already has "Start over"; the add page links to `#/setup` without a step, and the wizard opens at its saved step with that button visible. Acceptable; no extra logic.
- [Signed-in user with a locked vault finishes the wizard] → Same as the add page today: the form asks to unlock first (`step === 'unlock'`), then saves.
- [User has no vault yet but is signed in without saving] → `savesProfile` is mandatory, so the form shows "Create passphrase" like the add page. The current unsaved session stays in other tabs only as long as it does today.
- [Spec scenario "Logged-in user opens join link → tracker" is reversed] → Intended; members who are already in one team can now join a second one from the link.
