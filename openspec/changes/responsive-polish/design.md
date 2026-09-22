## Context

All layout lives in `src/styles/global.css`. The app shell switches between two layouts at one breakpoint, `@media (max-width: 720px)`:

- **≤ 720 px:** compact header (brand, timer pill without description, theme toggle, avatar) plus a fixed bottom nav with four items.
- **> 720 px:** full header with brand, four text+icon nav links, the timer pill with description (max 180 px), theme toggle and avatar, all in one flex row.

No JavaScript reads the viewport width (only `Popover` clamps to `innerWidth`), so breakpoints can move without code changes.

Audit numbers (headless Edge, demo data, `rolesHintDismissed` set where noted):

| Width | Lang | Timer | Result |
|---|---|---|---|
| 721 | de | running | page 79 px wider than viewport, timer pill 16 px wide |
| 768 | de | running | page 32 px wider, timer pill 16 px |
| 721–800 | de/en | none | nav 58 px tall (labels wrap to two lines) |
| 1024 | en | running | "Projects & Tags" wraps, folder icon shrinks |
| 320 | de | – | login demo button text 285 px in a 244 px button |

Causes: `.nav a` can wrap and its `svg` can shrink; `.header-timer` has `min-width: 0` so it is the element flexbox squeezes; nothing hides the description until 720 px. `.btn` has `white-space: nowrap` globally.

## Goals / Non-Goals

**Goals:**
- No horizontal page scroll at any width from 320 px up, in English and German, with or without a running timer.
- Header timer (elapsed time + stop button) always fully visible.
- No iOS focus-zoom on form fields.
- Phone polish listed in the proposal, without changing any behaviour or text.

**Non-Goals:**
- Redesigning pages or changing i18n strings (shorter German labels would also help, but text stays as is).
- A hamburger menu or a third, icon-only nav layout.
- Automated visual regression tests in the repo.

## Decisions

### 1. Move the layout breakpoint from 720 px to 1000 px
The shell rules in the `max-width: 720px` block (header compaction, hidden top nav, bottom nav, `.main` bottom padding, toast position) move to `max-width: 1000px`. Measured once the timer pill can no longer shrink (decision 2): brand + German nav + timer without description + theme toggle + avatar need about 958 px (English about 883 px), so 900 px was too low (first verification run: 37 px overflow at 901 px, German). 1000 px leaves a margin for font differences between platforms, and landscape tablets at 1024 px keep the desktop header.

Content-only rules (KPI column, single-column entries, timer clock size, `wg-grid`, picker width) stay at 720 px: the main column is still ~870 px wide just under the new breakpoint, so the desktop versions fit.

- *Alternative: icon-only nav between 721 and ~1000 px.* Keeps a desktop feel on tablets but adds a third header state to maintain and test, and icon-only links need tooltips/labels for accessibility. Rejected for now.
- *Alternative: only add `nowrap`.* Fixes the wrapping but makes the overflow worse (unwrapped labels are wider). Not enough alone.

### 2. Harden the desktop header anyway
Even above 1000 px, header content depends on translation lengths:
- `.nav a { white-space: nowrap }` and `.nav a svg { flex: none }` so labels never wrap and icons keep their size.
- `.header-timer { flex: none }` (or `flex-shrink: 0`) so it is never the element that gets squeezed; the description keeps `max-width` + ellipsis.
- Hide `.header-timer .desc` below 1200 px. With a full-length (180 px) description the German header needs about 1146 px.
- Below 400 px, while a timer runs, hide the brand name and keep the logo (`.header:has(.header-timer) .brand span`). The compact header with brand name, timer pill, theme toggle and avatar needs about 370 px. `:has()` is supported in all current browsers; where it is not, the header overflows only at under 400 px with a timer running.
- `.brand` gets `flex: none` for the same reason.

### 3. Let buttons with long text wrap where needed, not globally
The global `.btn { white-space: nowrap }` is right for most buttons (icon buttons, toolbar buttons). Only the full-width login-card demo button has sentence-length text. Add a modifier (e.g. `.btn-wrap`: `white-space: normal; text-align: center; height: auto; padding-block: 8px`) and use it on that button in `LoginPage.tsx`. Any other long-label button found during verification gets the same modifier.

- *Alternative: remove `nowrap` from `.btn` globally.* Risks two-line toolbar buttons all over the app. Rejected.

### 4. 16 px form font on phones
Inside the mobile-layout media query (`max-width: 1000px`): `.input, .select { font-size: 16px }`. `.select-compact` stays at 0.875rem only if it doesn't trigger zoom. It does (< 16 px), so it also gets 16 px on phones. `.input.inline-input` inherits `font: inherit` from its context; set 16 px there too on phones.

- *Alternative: `maximum-scale=1` in the viewport meta.* Blocks user pinch-zoom, an accessibility regression. Rejected.

### 5. Viewport units and safe areas
- `.app { min-height: 100vh; min-height: 100dvh }` and `.modal { max-height: calc(100vh - 32px); max-height: calc(100dvh - 32px) }`: fallback first, `dvh` where supported.
- `index.html` viewport: `width=device-width, initial-scale=1.0, viewport-fit=cover`.
- `.bottom-nav` height becomes `calc(var(--bottom-nav-h) + env(safe-area-inset-bottom))` so the padding adds to the height instead of squashing the icons; `.main` bottom padding and `.toasts` bottom offset include the inset too.
- With `viewport-fit=cover` in landscape, content can go under the notch sideways. `.header`, `.main` and `.landing` side padding use `max(<current>, env(safe-area-inset-left/right))`.

### 6. Phone polish
- **Roles banner:** `.banner.row` gets `flex-wrap: wrap`; the leading text span gets `flex: 1 1 16em` so the actions move under the text when narrow. The offline banner on the login page benefits the same way.
- **Projects & Tags toolbar:** the page-head row ("Show total hours" + "Show archived") gets `wrap`; with the larger touch checkbox it overflowed by 5 px at 320 px in German.
- **Stats KPIs:** on phones render as one card-like group: three rows with no gaps between them (shared border, radius only on the outer corners), or keep separate cards but cut padding to 10 px. Pick the one-group version if it needs no markup change; `.kpis` gets `gap: 0` and the inner cards drop their inner radii/shadows via `:not(:first-child)` / `:not(:last-child)` rules.
- **Tap targets (coarse pointer only):** inside `@media (pointer: coarse)`, as with the existing `.swatch` rule:
  - `.table th button`, settings about links, footer links and the "Show me how" step link: `padding-block: 6px; margin-block: -6px`, so the hit area grows to ~31–35 px without moving anything.
  - `.checkbox input { width: 22px; height: 22px }`, and the `.checkbox` label keeps the whole row clickable.
  - 44 px is the guideline, but 32 px is the floor already used by `.btn-sm`. Target ≥ 32 px, don't reflow dense tables.

## Risks / Trade-offs

- [Tablets at 721–1000 px lose the top nav and get the bottom nav] → This matches common tablet-portrait patterns, and the phone layout is the best-tested one. Landscape tablets (≥ 1024 px) keep the desktop header.
- [Hiding the timer description below 1200 px hides information on laptops with small windows] → The pill has `title` set to the description, and the tracker page shows it in full.
- [`viewport-fit=cover` exposes content to notches if a padding is missed] → Verification includes a landscape phone viewport; only header, main, landing and bottom nav touch the edges.
- [`dvh` unsupported in old browsers] → `vh` fallback declared first.
- [16 px inputs slightly change phone form density] → The difference is 1 px; accepted.

## Migration Plan

CSS and one meta tag only; ships with the normal GitHub Pages deploy. Rollback = revert the commit.

## Verification

Rerun the scratchpad audit (puppeteer-core + system Edge against `vite build` + `vite preview`, not the dev server) at 320, 360, 375, 414, 721, 768, 820, 900, 1000, 1001, 1024, 1100, 1200, 1201, 1280 px, EN and DE:
- every page (landing, tracker, stats, groups, settings) with `document.scrollWidth === clientWidth`;
- the header measured with a running timer: timer pill ≥ 90 px wide, nav one line;
- screenshots of picker, export menu, edit modal, import dialog and user menu at 320 px;
- a landscape phone (812×375) check for the safe-area paddings (visual only, as Chromium reports insets as 0).

## Open Questions

- ~~Should the KPI group apply to tablets?~~ Resolved: the KPIs are grouped only at ≤ 720 px, where they are already one column.
