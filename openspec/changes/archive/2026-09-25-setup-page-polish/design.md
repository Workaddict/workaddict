## Context

`SetupPage.tsx` renders the owner wizard in three blocks: a mode card (shown only while `state.mode === null`), a names card plus a progress row with "Change" / "Start over" links, and the `<ol>` of `Step`s. When the names are invalid, a `needNames` banner appears and each step hides its GitHub link (`{ready && …}`), but the step text and the "Done" checkbox remain usable. `Step` in `parts.tsx` already supports `locked` + `lockedText` (used by the join flow): no body, no checkbox, dimmed. Saved state lives in `localStorage` under `workaddict.setup` via `setupState.ts`.

## Goals / Non-Goals

**Goals:**
- Path selector that is always visible and only marks the selection.
- Steps cannot be worked through before a valid name (and repository name) is entered.
- A calmer, more deliberate look for the whole page in light and dark mode and at 375px width.

**Non-Goals:**
- Changing the steps themselves, their order, their copy or their GitHub links.
- Checking the name against the GitHub API (does the org/user exist). Validation stays the local login pattern (`isLogin`, `isRepoName`).
- Changing `JoinPage` or the saved-state format.

## Decisions

1. **Selector is a radio group, not buttons.** Two `<label>` option cards each wrapping a visually hidden `<input type="radio" name="setup-mode">`, inside `role="radiogroup"` with the "Who is this for?" heading as its label. Native radios give arrow-key switching and a checked state for screen readers for free. Alternative considered: `<button aria-pressed>` — works, but a pair of toggle buttons that are mutually exclusive is exactly what a radio group is. Both options use the same neutral style; the checked one gets the accent border, tinted background and a check mark (`:has(input:checked)` plus a class fallback set from state so it does not depend on `:has`).
2. **Rest of the page renders below the selector once `mode !== null`.** The "Change" link and `onboarding.setup.modeChange` string are removed. Switching keeps the entered name and ticked steps as today (steps not in the new path are simply not counted).
3. **Locking reuses `Step locked`.** `locked = !ready` for every step including sign-in. `lockedText`, shown on the first step only (the same note on eight cards read as noise in the running app), names what is missing: the username (solo) or organization (team) when that is invalid/empty, otherwise the repository name. The `needNames` banner is removed since each locked step and the names field already say it. Ticked state is preserved while locked, so clearing the field by accident loses nothing. The inner `{ready && …}` guards become redundant and are dropped for readability.
4. **Progress as a bar.** A `<progress value max>` with the existing "{{done}} of {{total}} done" text as its visible label, placed in the names card footer next to "Start over". Native element, no ARIA plumbing.
5. **Styling stays in `global.css` under `.ob-*`, using existing tokens** (`--accent`, `--border`, `--surface`, `--success`, `--text-faint`). No new component library. Names card gets a small heading ("Your GitHub names" / "Deine GitHub-Namen") so it reads as a form section rather than floating inputs.

## Risks / Trade-offs

- [Existing tests click `button` "Just me"/"A team"/"Change" and expect the needNames banner] → update them to `radio` roles and to assert locked steps instead.
- [Owner with saved progress but an invalid name now sees everything locked] → lockedText tells them exactly which field to fix; progress is kept.
- [`:has()` not supported in an old browser] → selected class is also set from React state.
- ["Ugly" is subjective] → verify visually in the running app (light, dark, 375px) before calling it done; adjust spacing there rather than in the spec.
