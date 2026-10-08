## Context

`TimerBar` renders one of three views: `ManualEntryView`, `RunningTimerView` or `StartTimerView`. `StartTimerView` and `ManualEntryView` each hold their own `WorkFields` draft in `useState`, so switching modes unmounts the view and loses the draft. The running timer lives in the repository (`useMyTimer`) and is edited through `updateTimer` (a `TimerPatch` that may include `start`) and stopped through `stopTimer(end)`, which is idempotent and reuses the timer id as the entry id.

## Goals / Non-Goals

**Goals:**
- Description, project and tags survive mode switches in both directions.
- A running timer can be corrected (date, start, end/duration, fields) and stopped from the manual form.
- No storage, adapter or data format changes.

**Non-Goals:**
- Starting a timer at a manually entered start time (backdated start).
- Keeping the draft across page reloads.
- A live, ticking end time in the manual form.

## Decisions

**Lift the draft into `TimerBar`.** One `WorkFields` state in `TimerBar`, passed as `value`/`onChange` to `StartTimerView` and `ManualEntryView`. Simplest way to share across the unmount; no context or store needed since both views are direct children. Alternative: keep views mounted and hide with CSS — rejected, it keeps two independent drafts that still diverge.

**Running timer in manual mode = a separate "finish" form mode of `ManualEntryView`.** When `timer` exists and mode is manual, `ManualEntryView` initialises its fields from the timer (`timeFieldsFrom(new Date(timer.start), switchTime, timeFormat)`) on mount. `switchTime` is captured once on mount, giving the frozen end. Key the view on `timer.id` so a timer started/stopped elsewhere re-initialises it.

**Stop & save = `updateTimer` then `stopTimer(end)`.** Validate with `resolveTimeFields` first. Then `updateTimer({ description, projectId, tagIds, start })`; if it returns `null` the timer is gone → show `timer.alreadyStopped` and stop. Otherwise `stopTimerAt(end)`. Alternatives: save a new entry and discard the timer — two writes with different ids, a crash between them leaves both entry and timer; a new atomic adapter call — more surface for no real gain since stop is already idempotent and a failure after step 1 leaves a still-running, edited timer that can simply be stopped again.

**Leaving manual mode patches only fields.** On switch back to timer with a running timer, if description/project/tags differ from the timer, send one `updateTimer` with those fields. Time edits are dropped: applying a start edit silently on a tab switch would be surprising, and the running view already has its own start editor. In timer mode the running view shows the timer's own fields (the shared draft is not used while a timer runs).

**Without a running timer, times stay local to `ManualEntryView`.** Only `WorkFields` is shared; `TimeFields` keep their current per-view state and are reset on remount, which satisfies "times dropped" for timer mode.

## Risks / Trade-offs

- [Timer polled/updated from another device while the finish form is open] → form keeps the user's edits; save goes through `updateTimer` returning null when stopped, and a different timer id remounts the form.
- [`stopTimer` clamps an end before start to start + 1 s] → client validation via `resolveTimeFields` runs before any write.
- [Step 1 succeeds, step 2 fails] → timer runs on with edits applied; error toast, user retries. Accepted.
- [Manual mode is remembered, so reload with a running timer opens the finish form with end = load time] → matches "end frozen at switch"; acceptable.
- [Patch on leaving manual races with the running view's own edits] → single patch sent on switch before the running view mounts; last write wins as today.
