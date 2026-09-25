## 1. German terminology sweep (`src/i18n/de.ts`)

- [x] 1.1 Replace every "Tag"/"Tags" meaning tags with "Label"/"Labels", including `common.noTag`, `nav.workGroups`, `workGroups.*`, `stats.*`, landing highlights and import texts. Adjust grammar (der Tag → das Label; "Er wird verwendet" → "Es wird verwendet").
- [x] 1.2 In the Clockify import texts, say once that Clockify tags become labels (e.g. `import.settingsHint` or the import highlight).
- [x] 1.3 Replace "Besitzer" with "Owner" (`roles.*`, `errors.forbiddenRole`), and the format hint "besitzer/name" with "owner/name" (`login.repoPlaceholder`, `login.errors.badRepoFormat`, `onboarding.diagnosis.ownerNotFound`).
- [x] 1.4 Replace "Teamleiter" with "Teamleitung" (`team.note`) and "Nutzer" with "Benutzer" (import strings).
- [x] 1.5 Rename "Einträge umhängen" to "Einträge neu zuordnen" (`reassign.*`, `import.remapHint`).
- [x] 1.6 Change `timer.start`/`timer.stop` to "Starten"/"Stoppen".

## 2. German tone and phrasing (`src/i18n/de.ts`)

- [x] 2.1 Rewrite questions in English word order as German questions: `login.setupPrompt`, `landing.inviteHint`, `onboarding.setup.cliText`, `onboarding.diagnosis.askOwner` (also remove "ihm"), `onboarding.setup.orgText`, `onboarding.join.accessText`.
- [x] 2.2 Rewrite the landing highlights per design D6 (timer title/text, team text, reports text).
- [x] 2.3 Replace "–" used as a sentence joiner with a colon or a period (`landing.inviteHint`, `settings.demoMode`, `errors.offline`, `onboarding.setup.cliText`, `login.help.intro`).
- [x] 2.4 Read the whole file once more for other calques and apply the same rules.

## 3. English fixes (`src/i18n/en.ts`)

- [x] 3.1 Update `landing.headline`, `landing.subline`, `landing.setupTeam`, `landing.inviteHint`, `login.title`, `login.setupPrompt`, `login.setupLink` per design D5/D6, plus the German counterparts.
- [x] 3.2 Add `landing.step3Link` ("Go to sign-in" / "Zum Anmelden").
- [x] 3.3 Fix `onboarding.setup.shareText`, `import.mapIntro`, and the missing period in `import.errors.invalidKey` (both languages).

## 4. Start page structure

- [x] 4.1 `LoginPage.tsx`: change the setup button icon from `users` to a neutral icon (e.g. `bolt` or `arrow`), using the new label.
- [x] 4.2 `LoginPage.tsx`: remove the "or" divider and the demo button from the sign-in card footer.
- [x] 4.3 `Landing.tsx`: add the step 3 "Go to sign-in" link. It scrolls the sign-in card into view (respect reduced motion like `showTokenHelp`) and focuses the first input. Pass a callback from `LoginPage`.
- [x] 4.4 `Landing.tsx`: render the invite hint as a separate note below the step list, not inside step 3.
- [x] 4.5 Style the step 2 `link-btn` like the other step links (underline) in the stylesheet.

## 5. Static copies

- [x] 5.1 `index.html`: update the static `<h1>`, the subline and the step texts to the new English strings. Leave `<title>` and meta unchanged.
- [x] 5.2 `de/import-from-clockify/index.html` and `de/clockify-alternative/index.html`: align "Tag" → "Label" where they describe Workaddict (keep "Tags" when naming Clockify's feature).

## 6. Tests and checks

- [x] 6.1 Update tests that assert on changed strings (`TeamRoles.test.tsx`, landing/login tests, demo button queries that expect two buttons), and add a test for the step 3 sign-in link focus.
- [x] 6.2 Run `npm test`, `npm run lint`, `npm run build`. The headline sync test must pass.
- [x] 6.3 Check the start page in the browser in DE and EN, light and dark, at 360 px and 1280 px: no horizontal scroll, one demo button, link styles alike.

## 7. Token help as its own page

- [x] 7.1 Keep the intro top-aligned and sticky next to the sign-in card on wide screens.
- [x] 7.2 Move the token help out of the `<details>` in the sign-in card into `TokenHelpPage` at `#/token-help`, with a back link and a "Back to sign-in" button.
- [x] 7.3 Link "How do I get a token?" (card) and "Show me how" (step 2) to the new page; update tests.
