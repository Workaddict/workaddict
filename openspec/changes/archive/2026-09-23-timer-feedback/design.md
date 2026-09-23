## Context

First outside feedback (2026-09-23), in German:

1. "im Tab steht die Zeit": show the running time in the browser tab.
2. "Seite schließen → Timer stoppt automatisch": closing the page should stop the timer (confirmed as a wish, not a bug).
3. "wenn Zeit gestoppt wurde manuell nochmal eingeben ermöglichen (nicht die ganze Zeit neu eingeben)": correct a stopped entry without typing everything again.
4. "wenn gestartet wurde den Zeitpunkt wann gestartet wurde ändern können": change the start of a running timer.

Current state:
- The running timer is a file in the data repo (`timers/<login>.json`) and runs across devices and page closes. `stopTimer(end)` in `src/storage/repoAdapter.ts` needs 2 reads and 2 dependent writes (entry first, then clear the timer). `TimerPatch` already allows `start`.
- `useStopTimer` in `src/features/data/hooks.ts` always stops at `new Date()`.
- `TimerBar` shows "Running since 09:12" as plain text.
- The entry list already supports inline editing of start, end and duration (`InlineEdit`), but the affordance (`.inline-edit:hover` border) only appears on hover, so it is invisible on touch screens.
- Nothing sets `document.title`; the title is the static SEO title from `index.html`.

## Goals / Non-Goals

**Goals:**
- Running time visible in the tab.
- A forgotten timer ends at the time the user left, with the user confirming it.
- Fix start of a running timer and times of a stopped entry with one tap each.

**Non-Goals:**
- Writing the stop to the repository while the page closes.
- A heartbeat in the repository, idle detection while the page is open, or notifications.
- Changing the repository format or the adapter contract.

## Decisions

### D1 Stop on close is a "lazy stop" on the next open, with a question

A closing page cannot wait for responses, and the stop needs 4 dependent GitHub requests; `fetch(..., { keepalive: true })` in `pagehide` can only fire requests without reading answers, and phones often never fire `pagehide`. So the device only records **when** it was left and asks on the next load.

Alternatives: keepalive requests on `pagehide` (unreliable, needs a sha and ordering), a heartbeat commit every few minutes (history spam, rate limits), a silent stop on the next open (wrong when a phone OS discarded a background tab). The question ("Stop at 17:32" / "Keep running" / "Stop now") makes false positives harmless.

### D2 "Closed" = no Workaddict document alive on this device

A new module (e.g. `src/features/tracker/presence.ts`) runs once per document at app start, before any heartbeat of this document:

1. Snapshot: read `workaddict.lastAlive` and, if `navigator.locks` exists, `navigator.locks.query()` to see whether another document holds the shared lock `workaddict-open`.
2. Acquire the shared lock `workaddict-open` for the lifetime of the document (a request whose callback returns a never-resolving promise). Web Locks are released only when the document is destroyed, so a hidden, throttled or frozen tab still counts as open.
3. Heartbeat: write `workaddict.lastAlive = now` every 30 s and on `pagehide` and `visibilitychange` (hidden). This gives the close time, not the open/closed decision.

The page counts as "was closed" when no other document holds the lock (or Web Locks are missing) **and** `now − lastAlive > 2 min`. A reload writes `lastAlive` in `pagehide` just before, so it never asks. A sleeping laptop keeps its document, so no new load happens and nothing is checked.

Alternative: heartbeat age alone. It breaks when another tab is frozen or heavily throttled in the background (Chrome throttles timers to once a minute and may freeze tabs), which would wrongly ask in a new tab. Web Locks are supported in current Chrome, Edge, Firefox and Safari (15.4+); without them the heartbeat rule is the fallback.

### D3 Only the device that started the timer asks

On a successful own start (`useStartTimer` onSuccess, which covers the timer bar, "Continue" and restarts), store `workaddict.timerDevice = { timerId, keep: false }`. The check runs only when the running timer's id equals `timerId` and `keep` is false. "Keep running" sets `keep: true`. A timer started elsewhere never matches, and stopping or starting another timer replaces the record. Timer ids are unique, so one key per device is enough even with several logins.

### D4 Where the check and the dialog live

A hook in the logged-in `Layout` (e.g. `useStopOnCloseCheck`) waits for the first loaded own timer, runs the check once per document, and opens a modal with three buttons (the existing `useConfirm` has two, so it uses the `Modal` component directly). It is skipped in demo mode, for read-only sessions, for the `pending` timer, and when the setting is off. "Stop at" calls the stop with `end = max(lastAlive, timer.start)`; the adapter already clamps to at least 1 second after the start. The result uses the normal feedback: saved, or "already stopped" when the adapter returns `null`.

`useStopTimer` gets an optional `end` argument (`mutationFn: (end?: Date) => adapter.stopTimer(end ?? new Date())`), so the dialog and the normal stop share the same optimistic update.

### D5 Setting: per device, on by default

`workaddict.stopOnClose` in localStorage, `'0'` = off, missing = on. It is shown in Settings next to language and theme with a short explanation (asks on next open; other devices and "Team now" still show the timer until then). Per device because the right behavior differs between a laptop and a phone. All localStorage access goes through try/catch like `session.ts`; without storage the feature silently does nothing.

### D6 Tab title

A hook in the logged-in `Layout` remembers the title on mount and, while the own timer runs, sets `▶ ${formatClock(elapsed)} · Workaddict` on each `useNow` tick, then restores the remembered title when the timer stops or the layout unmounts (sign-out). Background tabs throttle intervals to about once a minute, which is fine for the requirement. Updating only when the string changes keeps it cheap.

### D7 Editing the start of a running timer

"Running since 09:12" uses the same `InlineEdit` with `type="time"`. A pure function `resolveTimerStart(currentStart, value, now)` next to `applyInlineTime` returns the new start: that time today; if that is after `now`, the previous day only when `currentStart` is before today; otherwise the error `startInFuture`. It is saved through `useUpdateTimer({ start })`. The edit is disabled for the `pending` timer. The adapter already accepts `start` in `TimerPatch`, and another device picks the change up with the normal timer refresh.

### D8 Affordance for editable times

Start, end and duration buttons in the entry list (and the new timer start) get a permanent dotted underline (`text-decoration: underline dotted`, muted color) in addition to the existing hover border, so they read as editable on touch screens. The description keeps the hover-only style, since underlining every description would be noisy. The "Timer saved" toast becomes "Saved. Tap a time in the list to correct it." in EN and DE.

## Risks / Trade-offs

- [A phone OS discards a background tab, the next open asks although the user did not close anything] → the question offers "Keep running"; the setting can be turned off per device.
- [Other devices and "Team now" show the timer as running until the user reopens the app on the original device] → stated in the setting's help text; the existing "stop another member's timer" feature still works for team leaders.
- [The user never opens the app again on that device] → the timer keeps running like today; no worse than before.
- [`lastAlive` is older than the real close when the last tab was frozen before it was discarded] → the question shows the time, and the user can pick "Stop now" or correct the end in the list.
- [Several logins on one device] → the check compares timer ids, which are unique, so a different user's timer never matches.
- [The document title is also the SEO title] → the title is only changed on logged-in pages and restored on sign-out; crawlers never see a running timer.

## Migration Plan

No data migration. After deploy, the setting is on for everyone. A timer that is already running when the new version loads has no `timerDevice` record, so it is never asked about; the feature applies from the next start. Rollback is a plain revert; the localStorage keys are harmless leftovers.
