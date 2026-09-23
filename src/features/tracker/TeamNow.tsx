import { format } from 'date-fns'
import { useMemo, useState, type FormEvent } from 'react'
import { Avatar, ProjectChip } from '../../components/bits'
import { Icon } from '../../components/Icon'
import { Modal, useConfirm } from '../../components/Modal'
import { TimeInput } from '../../components/TimeInput'
import { useToast } from '../../components/Toasts'
import {
  buildTeamRows,
  isRunningTooLong,
  suggestedStopEnd,
  type TeamRow,
} from '../../domain/teamNow'
import {
  durationMs,
  formatClock,
  formatHM,
  formatTime,
  isValidDuration,
  localDateTime,
} from '../../domain/time'
import type { RunningTimer } from '../../domain/types'
import { useI18n } from '../../i18n'
import { useSessionData } from '../auth/AuthContext'
import {
  useAccess,
  useDiscardOthersTimer,
  useLookups,
  useStopOthersTimer,
  useTimers,
  useTodayEntries,
} from '../data/hooks'
import { useErrorToast } from '../data/useErrorText'
import { useNow } from './useNow'

/**
 * "Team now": what every other member is tracking right now, their total for today, and — for
 * editors and team leaders — stopping or discarding their timers. Only rendered for users who
 * may view team live activity.
 */
export function TeamNow() {
  const { t } = useI18n()
  const { user, adapter } = useSessionData()
  const access = useAccess()
  const toast = useToast()
  const onError = useErrorToast()
  const confirm = useConfirm()
  const { members } = useLookups()
  const timers = useTimers().data
  const entries = useTodayEntries().data
  const now = useNow()
  const [stopping, setStopping] = useState<RunningTimer | null>(null)

  const rows = useMemo(
    () =>
      buildTeamRows({
        members,
        timers: (timers ?? []).filter((x) => x.id !== 'pending'),
        entries: entries ?? [],
        me: user.login,
        now: new Date(now),
      }),
    [members, timers, entries, user.login, now],
  )

  const stop = useStopOthersTimer({
    onSuccess: (entry) =>
      entry
        ? toast.info(t('team.stopped', { login: entry.login }))
        : toast.info(t('team.timerChanged')),
    onError,
  })
  const discard = useDiscardOthersTimer({
    onSuccess: (cleared) => toast.info(cleared ? t('team.discarded') : t('team.timerChanged')),
    onError,
  })

  if (rows.length === 0) return null
  const canAct = access.can('stopOthersTimer') && !adapter.readOnly
  const tracking = rows.filter((r) => r.timer).length

  const onDiscard = async (timer: RunningTimer) => {
    const ok = await confirm({
      message: t('team.discardConfirm', { login: timer.login }),
      confirmLabel: t('timer.discard'),
      danger: true,
    })
    if (ok) discard.mutate({ login: timer.login, timerId: timer.id })
  }

  return (
    <section className="card team-now" aria-labelledby="team-now-title">
      <div className="card-head">
        <h2 id="team-now-title">{t('team.title')}</h2>
        <span className="small muted">{t('team.tracking', { count: tracking })}</span>
      </div>
      {rows.map((row) => (
        <TeamNowRow
          key={row.member.login}
          row={row}
          canAct={canAct}
          onStop={setStopping}
          onDiscard={(timer) => void onDiscard(timer)}
        />
      ))}
      <p className="small faint team-note">{t('team.note')}</p>
      {stopping && (
        <StopOthersTimerDialog
          timer={stopping}
          onClose={() => setStopping(null)}
          onSubmit={(end) => {
            stop.mutate({ target: { login: stopping.login, timerId: stopping.id }, end })
            setStopping(null)
          }}
        />
      )}
    </section>
  )
}

function TeamNowRow({
  row,
  canAct,
  onStop,
  onDiscard,
}: {
  row: TeamRow
  canAct: boolean
  onStop: (timer: RunningTimer) => void
  onDiscard: (timer: RunningTimer) => void
}) {
  const { t, time } = useI18n()
  const { project, tag } = useLookups()
  const { member, timer } = row
  const tags = timer ? timer.tagIds.map(tag).filter((x) => x !== undefined) : []

  return (
    <div className={`team-row${timer ? ' running' : ''}${row.tooLong ? ' too-long' : ''}`}>
      <span className="team-status" aria-hidden="true" />
      <Avatar member={member} />
      <div className="team-main">
        <div className="team-line">
          <span className="team-login">{member.login}</span>
          {timer ? (
            <span className={`team-desc${timer.description ? '' : ' faint'}`}>
              {timer.description || t('common.noDescription')}
            </span>
          ) : (
            <span className="small muted">
              {row.lastEnd
                ? t('team.lastActive', { time: time(row.lastEnd) })
                : t('team.noEntriesToday')}
            </span>
          )}
        </div>
        {timer && (
          <div className="entry-meta">
            <ProjectChip project={project(timer.projectId)} />
            {tags.map((x) => (
              <span key={x.id} className="chip">
                {x.name}
              </span>
            ))}
            {row.tooLong && (
              <span className="chip chip-warning">
                <Icon name="clock" size={12} />
                {t('team.tooLong')}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="team-side">
        <div className="team-times">
          <span className="team-clock">{timer ? formatClock(row.elapsedMs) : '–'}</span>
          <span className="small muted">{t('team.today', { time: formatHM(row.todayMs) })}</span>
        </div>
        {canAct && timer && (
          <div className="entry-actions">
            <button
              className="btn btn-icon"
              title={t('team.stop', { login: member.login })}
              aria-label={t('team.stop', { login: member.login })}
              onClick={() => onStop(timer)}
            >
              <Icon name="stop" size={16} filled />
            </button>
            <button
              className="btn btn-icon"
              title={t('team.discard', { login: member.login })}
              aria-label={t('team.discard', { login: member.login })}
              onClick={() => onDiscard(timer)}
            >
              <Icon name="trash" size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

type StopError = 'invalidEnd' | 'beforeStart' | 'inFuture' | 'tooLongEntry'

function StopOthersTimerDialog({
  timer,
  onClose,
  onSubmit,
}: {
  timer: RunningTimer
  onClose: () => void
  onSubmit: (end: Date) => void
}) {
  const { t, timeFormat, dateTime } = useI18n()
  const [opened] = useState(() => new Date())
  const now = useNow()
  const initial = suggestedStopEnd(timer.start, opened)
  const [date, setDate] = useState(format(initial, 'yyyy-MM-dd'))
  const [endTime, setEndTime] = useState(formatTime(initial, timeFormat))
  const [showErrors, setShowErrors] = useState(false)
  const start = new Date(timer.start)
  const tooLong = isRunningTooLong(start, opened)

  const end = localDateTime(date, endTime)
  const error: StopError | null = !end
    ? 'invalidEnd'
    : end.getTime() <= start.getTime()
      ? 'beforeStart'
      : end.getTime() > now
        ? 'inFuture'
        : !isValidDuration(durationMs(start, end))
          ? 'tooLongEntry'
          : null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (error || !end) {
      setShowErrors(true)
      return
    }
    onSubmit(end)
  }

  return (
    <Modal title={t('team.stopTitle', { login: timer.login })} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <p className="small muted" style={{ margin: 0 }}>
          {timer.description || t('common.noDescription')} ·{' '}
          {t('timer.runningSince', { time: dateTime(start) })}
        </p>
        {tooLong && (
          <div className="banner banner-warning">
            {t('team.tooLongWarning', { elapsed: formatHM(durationMs(start, opened)) })}
          </div>
        )}
        <div className="manual-grid">
          <label className="field">
            <span>{t('manual.date')}</span>
            <input
              className="input"
              type="date"
              required
              value={date}
              aria-invalid={showErrors && error !== null}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label className="field">
            <span>{t('manual.end')}</span>
            <TimeInput
              required
              value={endTime}
              aria-invalid={showErrors && error !== null}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </label>
        </div>
        {showErrors && error ? (
          <span className="form-error" role="alert">
            {t(`team.errors.${error}`)}
          </span>
        ) : (
          end &&
          !error && (
            <span className="small muted">
              {t('manual.preview', { duration: formatHM(durationMs(start, end)) })}
            </span>
          )
        )}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button className="btn btn-danger">{t('timer.stop')}</button>
        </div>
      </form>
    </Modal>
  )
}
