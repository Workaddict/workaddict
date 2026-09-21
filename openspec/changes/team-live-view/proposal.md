## Why

Editors and team leaders have no way to see who on the team is tracking time right now, or what they are working on, although every client already downloads all members' running timers every 30 seconds and discards all but its own. Forgotten timers are also a problem: a timer left running overnight turns into a 14-hour entry, and only its owner can stop it.

## What Changes

- New "Team now" block on the tracker page, rendered only for editors and team leaders. It lists every other member with their running timer (description, project, tags, live elapsed time), their tracked total for today, and when they were last active.
- A timer running longer than 10 hours, or started before today, is flagged as "running too long".
- Editors and team leaders can stop another member's running timer. A dialog asks for the end time, which defaults to now, or to start + 8h when the timer ran too long. They can also discard another member's timer.
- An entry created this way records who stopped it (`stoppedBy`). The member whose timer was stopped sees a one-time toast: "Your timer was stopped by <login>". Commit messages name both the member and the actor.
- Two new permissions in the matrix: "View team live activity" and "Stop or discard other members' timers", both for editors and team leaders.
- The app states that the live view is enforced by the app only: workers can still read `timers/*.json` on GitHub.
- Demo data includes running timers of other members, so the feature is visible in the demo.

## Capabilities

### New Capabilities
- `team-live-view`: the "Team now" block on the tracker page. It covers who sees it, what it shows per member, the "running too long" flag, stopping and discarding other members' timers from it, and the toast shown to the affected member.

### Modified Capabilities
- `roles-and-permissions`: the permission matrix gains two rows (view team live activity; stop or discard other members' timers), both editor and above, and both enforced in the storage layer.
- `time-tracking`: stopping and discarding a timer are no longer restricted to the timer's owner. The idempotent stop behaviour also applies when another member stops the timer.
- `data-storage`: time entries gain an optional `stoppedBy` field.

## Impact

- `src/domain/permissions.ts`: new actions `viewLiveActivity` and `stopOthersTimer`.
- `src/domain/types.ts`: `TimeEntry.stoppedBy?: string`.
- `src/storage/types.ts`, `src/storage/repoAdapter.ts`: `stopTimer` and `discardTimer` accept an optional target login and check permissions for other logins. Commit messages carry the actor.
- `src/storage/contract.ts`: contract tests for stopping and discarding other members' timers, including the permission refusal.
- `src/features/data/hooks.ts`: mutations for stopping and discarding another member's timer.
- `src/features/tracker/`: new `TeamNow` component, a stop dialog, and the "stopped by" toast detection. `TrackerPage.tsx` renders the block.
- `src/features/auth/demoData.ts`: seeded running timers for other demo members.
- `src/i18n/en.ts`, `src/i18n/de.ts`: new strings.
- README: permission matrix and the note that enforcement is app-only.
- No new dependencies. No schema version bump, because the `stoppedBy` field is optional and older clients ignore it.
