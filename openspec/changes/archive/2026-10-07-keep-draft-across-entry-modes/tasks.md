## 1. Shared draft

- [x] 1.1 Lift the `WorkFields` draft into `TimerBar` and pass `value`/`onChange` to `StartTimerView` and `ManualEntryView`
- [x] 1.2 Clear the shared draft after a timer is started and after a manual entry is added
- [x] 1.3 Tests: description/project survive timer→manual and manual→timer without a running timer; manual times are not carried to timer mode

## 2. Finish running timer in manual mode

- [x] 2.1 When a timer is running, initialise `ManualEntryView` fields from the timer and times via `timeFieldsFrom(timer.start, switchTime)` with `switchTime` captured on mount; key the view on `timer.id`
- [x] 2.2 Add i18n strings (en, de) for "Stop & save" and a short hint that the running timer is being edited; show them in this mode
- [x] 2.3 Implement "Stop & save": validate with `resolveTimeFields`, `updateTimer({ description, projectId, tagIds, start })`, toast `timer.alreadyStopped` and stop when it returns null, else `stopTimerAt(end)`
- [x] 2.4 On switching back to timer mode without saving, send one `updateTimer` with changed description/project/tags; drop time edits
- [x] 2.5 Tests: correct and stop (edited start/end produce one entry, no timer left); end frozen at switch; leave without saving keeps timer running with new description and original start; invalid duration saves nothing; timer stopped elsewhere shows already-stopped and creates no entry

## 3. Verify

- [x] 3.1 Run typecheck, lint and the test suite
- [ ] 3.2 Check both flows in the running app (timer↔manual with and without a running timer)
