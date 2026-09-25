## Context

All UI text lives in `src/i18n/en.ts` (the source; its type is `Resources`) and `src/i18n/de.ts`. The start page is `LoginPage.tsx` (hero plus sign-in card) and `Landing.tsx` (highlights, steps). `index.html` carries a static English copy of the landing text for crawlers, and a test fails if its `<h1>` differs from `landing.headline`.

A check of the live site (workaddict.me, ~1060 px wide viewport, German) showed:
- The layout stacks. The sign-in card with token fields fills most of the first screen below the two hero buttons.
- The hero offers "Demo ausprobieren" and "Team einrichten". The card below repeats "Demo ausprobieren (es wird nichts gespeichert)" and a third setup link.
- Step 2 "Zeig mir, wie" has no underline (it is a `link-btn` button), unlike the other step links.
- Step 3 has no action. The invite hint looks like a second line of step 3's text.

## Goals / Non-Goals

**Goals:**
- German that reads as written in German: one term per concept, real German questions, no calques.
- One clear primary action on the start page and one clear secondary action, and a sign-in card clearly aimed at returning users.
- English fixes where strings read translated.

**Non-Goals:**
- Changing the layout grid, visuals, or icons beyond the setup button icon.
- Renaming role keys or the English role names (Worker/Editor/Team leader stay; specs reference them).
- Rewriting the static SEO pages. Only the German import guide's use of "Tag" is aligned.
- Changing the "remember me" default or any sign-in behavior.

## Decisions

### D1: German "Tag" → "Label"
"Tag" collides with *Tag* (day). This is worst in statistics ("Nach Tag") and in "Kein Tag". "Label" is short, understood by German users, and has no collision. Clockify-related text says "Tags" only when it means Clockify's own feature, e.g. "Clockify-Tags werden zu Labels".
*Alternatives:* "Schlagwort" (long, feels dated), keep "Tag" (the ambiguity stays).

### D2: German "Owner" everywhere, no "Besitzer"
Onboarding and diagnosis texts point at GitHub screens that say "Owner". The app's owner role *is* the repository admin, so these are the same people. One word avoids "Besitzer" in Settings and "Owner" in help texts for the same person.
*Alternative:* "Besitzer" everywhere. Rejected: it would then clash with the GitHub UI the texts tell users to click through.

### D3: Roles stay "Mitarbeiter / Bearbeiter / Teamleitung"
Only the stray "Teamleiter" (`team.note`) is fixed. Gender-neutral role names are a separate decision and out of scope.

### D4: Start page CTA hierarchy

```
HERO                                   SIGN-IN CARD
[▶ Demo ausprobieren]  primary         "Schon eingerichtet? Anmelden"
[⚙ Kostenlos einrichten] secondary     fields, remember, [Anmelden]
                                       ▸ Wie bekomme ich ein Token?
                                       "Noch kein Daten-Repository?
                                        Einrichtung starten"   (link)
                                       ✗ removed: "oder" + demo button
HOW IT WORKS
1 … "Einrichtungs-Anleitung öffnen"
2 … "Zeig mir, wie"  (underlined like other links)
3 … "Zum Anmelden"   → focus first field of sign-in form
    note: "Hast du einen Einladungslink? Öffne ihn, er führt dich durch alle Schritte."
```

The demo stays primary: it is the cheapest way to see the product, and setup needs GitHub knowledge. The setup button loses "Team", because the wizard asks solo or team on its first screen.

### D5: Headline
The headline says what the visitor gets and keeps "free" and "time tracking" for search. It makes no comparison claims (the landing-page spec forbids them).
- EN: **"Free time tracking. Your data stays yours."**
- DE: **"Kostenlose Zeiterfassung. Deine Daten bleiben bei dir."**

The page `<title>` and meta description stay unchanged. They already carry the Clockify-alternative keywords.

### D6: New wording for key strings

| Key | DE new | EN new |
|---|---|---|
| `landing.subline` | Erfasse Zeiten allein oder im Team, ohne Abo, Werbung oder Tracking. | Track time alone or with your team. No subscription, no ads, no tracking. |
| `landing.setupTeam` | Kostenlos einrichten | Set up for free |
| `landing.highlights.timerTitle` | Ein Timer auf allen Geräten | One timer on all your devices |
| `landing.highlights.timerText` | Am Laptop starten, am Handy stoppen. Auch Einträge über Mitternacht sind kein Problem. | (unchanged) |
| `landing.highlights.teamText` | Rollen für Mitarbeiter, Bearbeiter und Teamleitung, dazu die Live-Ansicht „Team jetzt“: Wer erfasst gerade Zeit? | (unchanged) |
| `landing.highlights.reportsText` | Diagramme nach Projekt, Label und Mitglied. Export als PDF, Excel, OpenDocument oder CSV. | (unchanged) |
| `landing.step3Link` (new) | Zum Anmelden | Go to sign-in |
| `landing.inviteHint` | Hast du einen Einladungslink von deinem Team? Öffne ihn, er führt dich durch alle Schritte. | Got an invite link from your team? Open it; it guides you through every step. |
| `login.title` | Schon eingerichtet? Anmelden | Already set up? Sign in |
| `login.setupPrompt` / `setupLink` | Noch kein Daten-Repository? / Einrichtung starten | No data repository yet? / Start the setup |
| `timer.start` / `stop` | Starten / Stoppen | (unchanged) |
| `nav.workGroups`, `workGroups.title` | Projekte & Labels | (unchanged) |
| `onboarding.diagnosis.askOwner` | Muss ein Owner etwas tun? Schick ihm… → Muss ein Owner etwas tun? Dann schick diese Nachricht: | (unchanged) |
| `onboarding.setup.cliText` | Ist die GitHub CLI (gh) installiert? Dann … | (unchanged) |
| `onboarding.setup.shareText` | (unchanged) | … You can also find it later in Settings. |
| `import.mapIntro` | (Nutzer → Benutzer) | Choose which member each Clockify user's time entries belong to. … |
| `reassign.*` | „umhängen“ → „neu zuordnen“ | (unchanged) |
| `team.note` | Nur Bearbeiter und die Teamleitung sehen das. … | (unchanged) |

The full sweep (all "Tag", "Besitzer", "Nutzer", and "–" occurrences, plus calque questions) happens in the tasks. This table fixes the direction; exact wording may be refined during implementation if a string reads better.

## Risks / Trade-offs

- [Search ranking changes with a new `<h1>`] → keep "free" and "time tracking" in it, and keep `<title>`/meta unchanged.
- [Returning users used to the hero demo pair] → only labels move. The sign-in form stays in the same place.
- [German users who know Clockify's "Tags"] → the import texts say explicitly that Clockify tags become labels.
- [Tests assert on old strings] → update the assertions in the same change. Nothing depends on the strings except tests.
