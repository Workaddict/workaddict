## 1. Path selector

- [x] 1.1 Replace the mode card in `SetupPage.tsx` with an always-visible radio group ("Just me" / "A team") of option cards with hidden native radios; checked option gets a selected class from state
- [x] 1.2 Render names card, progress and steps below the selector only when a mode is chosen; keep the "Not sure?" hint under the selector
- [x] 1.3 Remove the "Change" link and `onboarding.setup.modeChange` from `en.ts` and `de.ts`

## 2. Lock steps until names are valid

- [x] 2.1 Pass `locked={!ready}` and a `lockedText` to every `Step` including sign-in; lockedText names the missing field (username / organization, else repository)
- [x] 2.2 Add locked-step strings to `en.ts` and `de.ts`; remove the `needNames` banner and its strings
- [x] 2.3 Drop the now-redundant inner `{ready && …}` guards in step bodies
- [x] 2.4 Confirm ticked steps keep their state while locked and after unlock

## 3. Visual cleanup

- [x] 3.1 Style option cards in `global.css` (neutral base, accent border + tint + check on selected, focus-visible ring, stacked on narrow screens)
- [x] 3.2 Give the names card a heading and a footer with a `<progress>` bar, the "x of y done" label and "Start over"
- [x] 3.3 Tidy header spacing, step card spacing and locked-step look; check dark-mode tokens and 375px width

## 4. Tests and verification

- [x] 4.1 Update `onboardingPages.test.tsx`: select modes via `radio` roles, switch paths without "Change", assert steps are locked (no checkbox/link) before a valid name and for an invalid repo name, and unlock with ticks kept
- [x] 4.2 Add a test that the selector stays visible with the chosen option checked after choosing
- [x] 4.3 Run lint, typecheck and the test suite
- [x] 4.4 Look at `#/setup` in the running app (light, dark, 375px) and fix what still looks off
