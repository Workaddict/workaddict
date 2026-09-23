## Why

The first feedback from outside users (2026-09-23) is about the timer: they forget to stop it, cannot see it when the tab is in the background, and do not find a quick way to fix wrong times. The common need is "correct times with little effort". Fixing that now matters because these are the first real users and the timer is the app's core.

## What Changes

- **Elapsed time in the browser tab**: while the user's own timer runs, the document title shows it, e.g. `▶ 1:23:45 · Workaddict`. Without a running timer the title goes back to normal.
- **Stop the timer when the page is closed** (new, per-device setting, **on by default**): the device that started the timer records a local heartbeat. When the app is opened again after all Workaddict tabs on that device were closed for more than 2 minutes, it asks: "Stop at <close time>", "Keep running" or "Stop now". A hidden tab or a sleeping laptop does not count as closed. Timers started on another device are never touched. The actual stop is written on the next open, because a closing page cannot finish the GitHub writes.
- **Change the start time of a running timer**: "Running since 09:12" becomes editable in place (same click-to-edit behavior as the entry list). A start in the future is rejected.
- **Make correcting a stopped entry easier to find**: start, end and duration in the entry list already can be edited inline, but on touch screens they look like plain text. Editable times get a visible affordance on every device, and the "Timer saved" message says that the times can be corrected there.
- Out of scope: stopping the timer in the repository at the moment of closing (not reliably possible from a closing page), a server-side or repository heartbeat (a commit every few minutes), idle detection while the page stays open.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `time-tracking`: new requirements "Elapsed time in the tab title" and "Stop on page close"; "Live timer" gains a scenario for editing the start time of a running timer; "Inline entry editing" requires editable fields to be recognizable without hover and the stop feedback to point to it.
- `app-shell`: "Settings page" lists the new "Stop timer when I close the page" setting.

## Impact

- Code: `src/features/tracker/TimerBar.tsx` (editable start), `src/features/tracker/InlineFields.tsx` and `src/styles/global.css` (affordance), new hooks for the tab title and the close detection under `src/features/tracker/`, `src/app/Layout.tsx` (mount them and the dialog for logged-in pages), `src/features/data/hooks.ts` (`useStopTimer` with an end time, start-time update), `src/features/settings/SettingsPage.tsx` (setting), `src/i18n/en.ts` + `de.ts`.
- Storage: no change to the repository format or the adapter contract (`TimerPatch.start` and `stopTimer(end)` already exist). New localStorage keys per device.
- No new dependencies, no new permissions, no extra GitHub requests while the page is open.
- Known limitation: "Team now" and other devices keep showing a timer as running until the user opens the app again on the device that started it.
