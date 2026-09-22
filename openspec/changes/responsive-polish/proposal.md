## Why

A responsive audit (headless Edge, 320–1024 px, English and German, all pages plus menus and dialogs) found that phones are in good shape but the tablet range breaks: between 721 px and about 1024 px the desktop header does not fit. Nav labels wrap onto two lines, the running-timer pill is squeezed to 16 px and covered, and the page scrolls sideways by up to 79 px (German, 721 px). Smaller phone issues showed up as well: a German button that overflows on the start page, fields that make iOS Safari zoom in on focus, and a few cramped or undersized controls.

## What Changes

- Use the mobile layout (bottom nav, compact header) up to 1000 px instead of 720 px, so tablets in portrait get the layout that already works on phones.
- Keep desktop nav links on one line with fixed-size icons, and hide the running timer's description in the header when space is tight, so the elapsed time and stop button always stay visible.
- Let the German "Try the demo" button on the start page wrap instead of spilling past its card at 320–375 px.
- Give text inputs and selects a 16 px font on phones so iOS Safari does not zoom in when they are focused.
- Polish on phones: the roles banner wraps its action onto its own line; the stats summary takes less vertical space; the stats table sort buttons, footer/about links and checkboxes get larger tap areas.
- Use dynamic viewport units (`dvh`) for the app shell and dialogs so dialogs are not cut off behind mobile browser toolbars.
- Add `viewport-fit=cover` and make the bottom nav account for the safe-area inset, so it clears the home indicator on notched phones.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `app-shell`: "Responsive clean design" is tightened: no horizontal scrolling from 320 px to desktop at every width in between, in both languages and while a timer runs; the header timer stays visible and usable at all widths; form fields do not trigger browser zoom on phones; content clears the mobile safe areas.

## Impact

- `src/styles/global.css`: breakpoints, header/nav, buttons, inputs, banner, stats KPIs, tables, footer, modal/app heights, bottom nav.
- `index.html`: viewport meta gains `viewport-fit=cover`.
- Possibly a class name or two in `src/app/Layout.tsx`, `src/features/auth/LoginPage.tsx` or `src/features/stats/StatsPage.tsx` if a style needs a hook; no behaviour, data or i18n changes.
- No new dependencies. Verification uses a throwaway headless-browser script outside the repo.
