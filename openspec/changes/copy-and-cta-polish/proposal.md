## Why

Much of the German UI text reads like a translation from English. "Tag" is read as *Kalendertag*, so "Nach Tag" in the statistics looks like "by day". Owners are sometimes "Owner" and sometimes "Besitzer". Many questions follow English word order ("Du hast einen Einladungslink…?"). Some English strings also read like translated German. On the start page, the buttons compete: the demo is offered twice and the setup three times, the main setup button says "team" even though a solo path exists, and the headline describes the product instead of saying why someone should use it.

## What Changes

- **German terminology**:
  - "Tag"/"Tags" becomes "Label"/"Labels" everywhere in the German UI, including the nav item "Projekte & Labels".
  - GitHub owners and the app's owner role are called "Owner" throughout, replacing "Besitzer".
  - "Teamleiter" becomes "Teamleitung".
  - "Einträge umhängen" becomes "Einträge neu zuordnen".
  - Only "Benutzer" is used, not "Nutzer".
- **German tone**:
  - Questions in English word order become real German questions.
  - Awkward literal phrases are rewritten ("funktionieren einfach", "Ein Timer, der mitkommt").
  - Gendered "ihm" is removed.
  - Button verbs use the infinitive: "Starten" / "Stoppen".
  - Dashes (–) used as sentence joiners are replaced by a colon or a period.
- **English fixes**: clumsy strings (`setup.shareText`, `import.mapIntro`, and others) are rewritten, and missing final periods are added.
- **Start page headline**: the headline and description say what the visitor gets: free, and their data stays theirs. There is still no comparison with other products. The static `<h1>` in `index.html` follows.
- **Start page CTAs**:
  - The hero keeps two buttons, "Try the demo" (primary) and a setup button that no longer says "team" ("Set up for free" / "Kostenlos einrichten", neutral icon).
  - The duplicate demo button and the "or" divider are removed from the sign-in card.
  - The sign-in card says it is for people who have already set up ("Already set up? Sign in").
  - The setup prompt inside the card is reworded for people without a data repository.
- **How it works**:
  - Step 2 "Show me how" looks like the other links.
  - Step 3 gets a "Go to sign-in" link that moves focus to the sign-in form.
  - The invite-link hint becomes its own short note.

No behavior changes to sign-in, the timer, roles, or data. Role keys, the English role names, and the stored data stay the same.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `landing-page`: intro headline text, hero button labels, sign-in card without its own demo button, sign-in link in the "How it works" steps.
- `search-visibility`: the crawlable static headline scenario uses the new English headline.
- `app-shell`: new requirement for consistent UI terminology in German (Label, Owner, Teamleitung) across all pages.

## Impact

- `src/i18n/de.ts` (most strings), `src/i18n/en.ts` (landing plus a handful of fixes)
- `src/features/auth/LoginPage.tsx`, `src/features/auth/Landing.tsx` (CTA structure, step 3 link)
- `index.html` (static English copy: headline, subline, steps)
- Tests that assert on changed strings (e.g. `TeamRoles.test.tsx`, landing/login tests, the headline sync test)
- The static SEO pages (`clockify-alternative/`, `import-from-clockify/`, `de/…`) are out of scope. Only the wording of the "Tag"-to-"Label" rename in the German import guide is checked for consistency.
