## 1. Header and layout breakpoint

- [x] 1.1 Move the app-shell rules in `@media (max-width: 720px)` (header compaction, hidden top nav, bottom nav, `.main` padding, toasts) to `@media (max-width: 1000px)` (raised from 900 px after verification measured the German header at ~958 px)
- [x] 1.2 Review the content rules from that block (KPIs, entry grid, timer clock, wg grid, picker width) just under the new breakpoint and keep each there or leave it at 720 px, whichever looks right
- [x] 1.3 Add `white-space: nowrap` to `.nav a`, `flex: none` to `.nav a svg`, `.brand` and `.header-timer`
- [x] 1.4 Hide `.header-timer .desc` below 1200 px, and the brand name below 400 px while a timer runs
- [x] 1.5 Check the team-live-view `max-width: 720px` block and other 720 px rules still line up with the new shell breakpoint

## 2. Buttons and form fields

- [x] 2.1 Add a `.btn-wrap` modifier (normal white-space, centered text, auto height, vertical padding) and use it on the login-card demo button in `LoginPage.tsx`
- [x] 2.2 Set `font-size: 16px` for `.input`, `.select` (including `.select-compact`) and `.input.inline-input` at â‰¤ 1000 px

## 3. Viewport and safe areas

- [x] 3.1 Add `viewport-fit=cover` to the viewport meta in `index.html`
- [x] 3.2 Add `100dvh` after the `100vh` fallbacks on `.app` and `.modal`
- [x] 3.3 Make `.bottom-nav` height include `env(safe-area-inset-bottom)` and add the inset to `.main` bottom padding and the `.toasts` bottom offset
- [x] 3.4 Use `max(<current>, env(safe-area-inset-left/right))` for side padding of `.header`, `.main` and `.landing`

## 4. Phone polish

- [x] 4.1 Let `.banner.row` wrap so the roles-banner action moves below the text on narrow screens
- [x] 4.2 Compact the stats KPIs on phones (one grouped card or reduced padding, no markup change if possible)
- [x] 4.3 Under `@media (pointer: coarse)`, raise tap areas: stats table sort buttons â‰¥ 32 px tall, checkboxes 22 px, footer and settings about links with extra vertical padding

## 5. Verification

- [x] 5.1 Run `npm run lint`, `npm test` and `npm run build`
- [x] 5.2 Rerun the headless audit against a scratchpad build at 320, 360, 375, 414, 721, 768, 820, 900, 1000, 1001, 1024, 1100, 1200, 1201 and 1280 px, plus the four static Clockify pages, in EN and DE: no horizontal scroll on any page, with and without a running timer
- [x] 5.3 With a running timer, confirm at every width that the header timer pill is â‰¥ 90 px wide and the nav is one line
- [x] 5.4 Screenshot check at 320 px DE: start page, picker, export menu, edit modal, import dialog, user menu, roles banner, stats KPIs
- [x] 5.5 Check the landscape phone viewport (812Ã—375) for side padding and bottom nav, in light and dark themes
