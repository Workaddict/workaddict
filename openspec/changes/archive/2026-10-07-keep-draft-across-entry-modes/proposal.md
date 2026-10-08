## Why

Switching the tracker between Timer and Manual mode throws away the description, project and tags the user already entered, because each mode keeps its own draft. Users who start in one mode and realise they need the other have to retype everything, and a running timer cannot be corrected into a precise entry from the manual form.

## What Changes

- The description, project and tags carry over when switching between Timer and Manual mode in either direction.
- Switching to Manual while a timer is running shows that timer as an editable entry: description, project and tags from the timer, date and start from the timer's start, end prefilled with the time of the switch. Date, start and end (or duration) can be edited.
- In that state the save button reads "Stop & save": it applies the edits to the running timer and stops it at the chosen end, creating one entry.
- Switching modes never changes the running timer by itself. Leaving Manual without saving keeps the timer running; description, project and tag edits made there are applied to the running timer, time edits are dropped.
- If the timer was stopped elsewhere before "Stop & save", nothing is saved and the user is told the timer was already stopped.
- Out of scope: starting a timer at a manually entered start time. Times entered in Manual are dropped when switching to Timer with no timer running.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `time-tracking`: new requirement for keeping the draft across entry modes and finishing a running timer from the manual form.

## Impact

- `src/features/tracker/TimerBar.tsx`: draft state lifted from `StartTimerView` / `ManualEntryView` into `TimerBar`; `ManualEntryView` gains a running-timer mode.
- Uses the existing `updateTimer` and `stopTimer(end)` adapter calls; no storage, API or data format changes.
- New i18n strings (en, de) for "Stop & save" and the running-timer hint.
- Tests in `src/features/tracker/TimerBar.test.tsx`.
