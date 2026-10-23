## 1. Styling fix

- [x] 1.1 `.task-card` in `global.css`: padding like `.login-card` (28px, 20px under 560px), `max-width: 440px`, flex column with 18px gap
- [x] 1.2 Use `card task-card` for the form cards in `AddProjectPage` and `ReplaceTokenPage` (all three spots in `ProfilePages.tsx`); check desktop and 375px in light and dark

## 2. Signed-in sign-in from setup and join

- [x] 2.1 `addsWorkspace` flag (D4): `from === 'add' || (signedIn && (from === 'setup' || from === 'join'))`; `savesProfile` and `useSignIn` use it so saving is mandatory
- [x] 2.2 `SignInForm`: hide "Save as a profile", show the existing-profile banner and the token reuse offer whenever `addsWorkspace`
- [x] 2.3 Tests: signed-in sign-in from `setup` and `join` saves a workspace and switches the tab, the previous workspace stays saved; failure keeps the current workspace and the fix page returns to the wizard step / join link

## 3. Routes and back links

- [x] 3.1 `App.tsx`: `setup` and `join` in the signed-in tree, outside `Layout`
- [x] 3.2 `SetupPage` and `JoinPage`: back link to `/add-project` with `profiles.back` when signed in
- [x] 3.3 `JoinPage`: invalid `repo` while signed in goes to `/add-project` with the invalid-invite notice; add page shows that notice
- [x] 3.4 Tests (in `profiles.test.tsx`, which renders the signed-in app with a vault): signed-in `#/setup` and `#/join?repo=…` render the flows (not the tracker), back links, invalid join link while signed in

## 4. Path choice on "Add workspace"

- [x] 4.1 Invite parser `joinPathFor` next to `joinTarget` in `names.ts`: full invite URL → `repo` + `kind`, otherwise `parseRepo`; only `repo` and `kind` are kept; unit tests incl. invalid input
- [x] 4.2 `AddProjectPage`: radiogroup with `.ob-modes`/`.ob-mode` cards (existing, new, invite), "Existing" by default and when `?repo=` is set
- [x] 4.3 "New": one-sentence explanation and primary link to `#/setup`
- [x] 4.4 "Invite": field, "Open invite" navigates to `#/join?repo=…[&kind=user]`, inline error for invalid input
- [x] 4.5 New intro and texts for the three paths in `en.ts` and `de.ts` (German terminology as in the glossary: Arbeitsbereich, Daten-Repository, Einladungslink)
- [x] 4.6 Tests in `profiles.test.tsx`: default path, switching paths, setup link, invite navigation incl. `kind=user`, invalid invite, coming back from the fix page keeps "Existing" with "Enter a new token"

## 5. Check

- [x] 5.1 `npm run lint`, type check and the full test suite pass
- [ ] 5.2 Manual run: signed in, add a new repository through the wizard and through an invite link, then switch back to the first workspace; screenshot add page desktop + phone
