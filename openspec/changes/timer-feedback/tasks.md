## 1. Tab title

- [x] 1.1 Add a hook (e.g. `useTimerTitle`) that remembers the current `document.title` on mount, sets `▶ <formatClock(elapsed)> · Workaddict` while the own timer runs (a pending start shows too, it starts now) (only when the string changes), and restores the remembered title when the timer stops or the hook unmounts (design D6)
- [x] 1.2 Mount it in the logged-in `Layout`; tests: running timer sets the title, stop and unmount restore it, another member's timer does not change it

## 2. Start time of a running timer

- [x] 2.1 Add `resolveTimerStart(currentStart, value, now)` next to `applyInlineTime` (today; previous day only if the current start is before today; else `startInFuture`); unit tests incl. midnight and future cases
- [x] 2.2 In `TimerBar`, turn "Running since <time>" into an `InlineEdit type="time"` that saves through `useUpdateTimer({ start })`, disabled for the `pending` timer; shows the validation error and keeps the typed value
- [x] 2.3 Check that `useUpdateTimer` updates the cached timer optimistically for `start` so the clock and the header jump at once; component tests for save, Escape, and the future error
- [x] 2.4 Add the `startInFuture` message and the edit label in `en.ts` and `de.ts`

## 3. Correcting stopped entries

- [x] 3.1 Give editable start, end and duration buttons (entry list and timer start) a permanent dotted underline in `global.css`, in light and dark theme, without changing the row layout at 320 px (design D8)
- [x] 3.2 Change the "timer saved" toast to "Saved. Tap a time in the list to correct it." (EN) and the German equivalent; update affected tests

## 4. Stop on close

- [x] 4.1 Add the per-device setting helpers (`workaddict.stopOnClose`, default on) with try/catch storage access, and the setting control plus help text in `SettingsPage` next to language and theme; i18n EN/DE; test that it defaults to on and is remembered
- [x] 4.2 Add the presence module (design D2): at app start snapshot `workaddict.lastAlive` and whether another document holds the Web Lock `workaddict-open`, then hold the shared lock for the document's life and write `lastAlive` every 30 s and on `pagehide` / hidden; initialize it once from `main.tsx`; unit tests with fake timers and a mocked `navigator.locks` (present and missing)
- [x] 4.3 Record `workaddict.timerDevice = { timerId, keep: false }` on a successful own start in `useStartTimer` (covers the timer bar, "Continue" and restarts); test
- [x] 4.4 Let `useStopTimer` take an optional `end` date and pass it to `adapter.stopTimer`; existing callers unchanged; test
- [x] 4.5 Add `useStopOnCloseCheck` in the logged-in `Layout`: once per document, after the own timer loaded, ask when the setting is on, not demo, not read-only, timer not `pending`, `timerDevice` matches and `keep` is false, no other document was open, and `now − lastAlive > 2 min` (design D3, D4)
- [x] 4.6 Build the question modal with "Stop at <time>" (default), "Keep running" (sets `keep: true`) and "Stop now"; "Stop at" uses `max(lastAlive, timer.start)`; shows the saved or "already stopped" feedback; i18n EN/DE incl. relative duration ("2 h 10 min ago")
- [x] 4.7 Tests for the spec scenarios: closed and reopened, keep running (no second question), stop now, reload, another tab open, timer from another device, setting off, already stopped elsewhere, demo and read-only skipped

## 5. Verify

- [x] 5.1 `npm test`, `npm run lint`, `npm run build` pass
- [ ] 5.2 Manual check in Chrome and one other browser: tab title in a background tab, close the last tab and reopen after more than 2 minutes (question appears with the right time), reload (no question), two tabs (no question), phone width 360 px and dark mode for the timer start edit, the underline and the modal
- [ ] 5.3 Tell the users who gave the feedback what changed (the four points) after deploy
