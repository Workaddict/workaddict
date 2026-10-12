import { format } from '../../domain/zoned'
import { useState, type FormEvent } from 'react'
import { Icon } from '../../components/Icon'
import { useConfirm } from '../../components/Modal'
import { useToast } from '../../components/Toasts'
import { newId } from '../../domain/ids'
import { formatClock, resolveTimerStart } from '../../domain/time'
import type { RunningTimer } from '../../domain/types'
import { useI18n } from '../../i18n'
import { useSessionData } from '../auth/AuthContext'
import { useAccess, useDiscardTimer, useMembers, useSaveEntry, useUpdateTimer } from '../data/hooks'
import { useErrorText, useErrorToast } from '../data/useErrorText'
import {
  GroupPickers,
  resolveEditedTimes,
  resolveTimeFields,
  TimeInputs,
  timeFieldsFrom,
  type TimeFields,
  type WorkFields,
} from './EntryFields'
import { InlineEdit } from './InlineFields'
import { usePref } from '../../prefs'
import { useNow } from './useNow'
import { useTimerActions } from './useTimerActions'

const EMPTY: WorkFields = { description: '', projectId: null, tagIds: [] }

/** "Running since 09:12" with the start time editable in place. */
function TimerStart({ timer }: { timer: RunningTimer }) {
  const { t, time } = useI18n()
  const { adapter } = useSessionData()
  const onError = useErrorToast()
  const errorText = useErrorText()
  const update = useUpdateTimer()
  const [editing, setEditing] = useState(false)
  const start = new Date(timer.start)

  const commit = async (value: string): Promise<string | null> => {
    const r = resolveTimerStart(start, value, new Date())
    if (!r.ok) return t(`timer.errors.${r.error}`)
    try {
      await update.mutateAsync({ start: r.start.toISOString() })
      return null
    } catch (e) {
      onError(e)
      return errorText(e)
    }
  }

  return (
    <span className="small muted timer-since">
      {t('timer.runningSinceLabel')}{' '}
      <InlineEdit
        type="time"
        editable={timer.id !== 'pending' && !adapter.readOnly}
        editing={editing}
        onStart={() => setEditing(true)}
        onDone={() => setEditing(false)}
        display={time(start)}
        initial={time(start)}
        label={t('timer.editStart')}
        onCommit={commit}
      />
    </span>
  )
}

function RunningTimerView({ timer }: { timer: RunningTimer }) {
  const { t } = useI18n()
  const confirm = useConfirm()
  const onError = useErrorToast()
  const { stopTimer, busy } = useTimerActions()
  const update = useUpdateTimer()
  const discard = useDiscardTimer({ onError })
  const now = useNow()
  const pending = timer.id === 'pending'
  const [desc, setDesc] = useState(timer.description)
  const [remoteDesc, setRemoteDesc] = useState(timer.description)

  // Follow remote changes (other device) to the description.
  if (timer.description !== remoteDesc) {
    setRemoteDesc(timer.description)
    setDesc(timer.description)
  }

  const saveDesc = () => {
    if (desc !== timer.description && !pending) update.mutate({ description: desc }, { onError })
  }

  return (
    <>
      <div className="timer-main">
        <input
          className="input desc-input"
          placeholder={t('timer.placeholder')}
          aria-label={t('timer.placeholder')}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          onBlur={saveDesc}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        />
        <div className="timer-meta">
          <GroupPickers
            value={timer}
            disabled={pending}
            onChange={(patch) => update.mutate(patch, { onError })}
          />
        </div>
      </div>
      <div className="timer-foot">
        <TimerStart timer={timer} />
        <div className="row">
          <button
            className="btn btn-icon"
            title={t('timer.discard')}
            aria-label={t('timer.discard')}
            disabled={pending}
            onClick={async () => {
              if (
                await confirm({
                  message: t('timer.discardConfirm'),
                  confirmLabel: t('timer.discard'),
                })
              )
                discard.mutate()
            }}
          >
            <Icon name="trash" />
          </button>
          <span className="timer-clock">{formatClock(now - new Date(timer.start).getTime())}</span>
          <button
            className="btn btn-danger btn-lg"
            onClick={async () => {
              // Persist a pending description edit before the stop reads the timer.
              if (desc !== timer.description) {
                try {
                  await update.mutateAsync({ description: desc })
                } catch (e) {
                  onError(e)
                  return
                }
              }
              stopTimer()
            }}
            disabled={busy || pending}
          >
            <Icon name="stop" size={16} filled />
            {t('timer.stop')}
          </button>
        </div>
      </div>
    </>
  )
}

interface DraftProps {
  /** Description, project and tags shared by the timer and manual forms. */
  draft: WorkFields
  setDraft: (draft: WorkFields) => void
}

function StartTimerView({ draft, setDraft }: DraftProps) {
  const { t } = useI18n()
  const { startTimer, busy } = useTimerActions()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    startTimer(draft)
    setDraft(EMPTY)
  }

  return (
    <form className="timer-main" onSubmit={submit}>
      <input
        className="input desc-input"
        placeholder={t('timer.placeholder')}
        aria-label={t('timer.placeholder')}
        value={draft.description}
        onChange={(e) => setDraft({ ...draft, description: e.target.value })}
      />
      <div className="timer-meta">
        <GroupPickers value={draft} onChange={(p) => setDraft({ ...draft, ...p })} />
        <span className="timer-clock faint">0:00:00</span>
        <button className="btn btn-primary btn-lg" disabled={busy}>
          <Icon name="play" size={16} filled />
          {t('timer.start')}
        </button>
      </div>
    </form>
  )
}

function defaultTimes(): TimeFields {
  const now = new Date()
  return {
    date: format(now, 'yyyy-MM-dd'),
    startTime: '',
    endTime: '',
    duration: '',
    useDuration: false,
  }
}

/** "For" picker: whose entry the manual form creates. Only for users who may edit others' entries. */
function MemberPicker({ value, onChange }: { value: string; onChange: (login: string) => void }) {
  const { t } = useI18n()
  const { user } = useSessionData()
  const members = useMembers().data ?? []
  const others = members
    .map((m) => m.login)
    .filter((l) => l !== user.login)
    .sort((a, b) => a.localeCompare(b))
  return (
    <label className="row small member-picker">
      <span>{t('manual.for')}</span>
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value={user.login}>{t('manual.me', { login: user.login })}</option>
        {others.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>
    </label>
  )
}

/**
 * Manual entry form. With a running timer it shows that timer, ending when the form opened,
 * and saving stops the timer with the edited values. `timer` is null when the entry is for
 * another member, so their entry never touches the user's own timer.
 */
function ManualEntryView({
  draft: fields,
  setDraft: setFields,
  timer,
  forLogin,
  setForLogin,
}: DraftProps & {
  timer: RunningTimer | null
  forLogin: string
  setForLogin: (login: string) => void
}) {
  const { t, timeFormat } = useI18n()
  const toast = useToast()
  const onError = useErrorToast()
  const { adapter, user } = useSessionData()
  const access = useAccess()
  const forOther = forLogin !== user.login
  const save = useSaveEntry()
  const update = useUpdateTimer()
  const { stopTimerAt, busy } = useTimerActions()
  // The running timer's span as of opening the form; the end stays fixed while editing.
  const [span] = useState(() => timer && { start: new Date(timer.start), end: new Date() })
  const [initialTimes] = useState(() =>
    span ? timeFieldsFrom(span.start, span.end, timeFormat) : null,
  )
  const [times, setTimes] = useState<TimeFields>(() => initialTimes ?? defaultTimes())
  const [timeInput, setTimeInput] = usePref('manualTimeInput')
  const [showErrors, setShowErrors] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const shownTimes = { ...times, useDuration: timeInput === 'duration' }
  const resolved =
    span && initialTimes
      ? resolveEditedTimes(
          shownTimes,
          { ...initialTimes, useDuration: shownTimes.useDuration },
          span.start,
          span.end,
        )
      : resolveTimeFields(shownTimes)

  const finishTimer = async (start: Date, end: Date) => {
    setFinishing(true)
    try {
      // Apply the edits first so the stop writes them; null means the timer is gone.
      const updated = await update.mutateAsync({
        ...fields,
        description: fields.description.trim(),
        start: start.toISOString(),
      })
      if (!updated) {
        toast.info(t('timer.alreadyStopped'))
        return
      }
      stopTimerAt(end)
    } catch (e) {
      onError(e)
    } finally {
      setFinishing(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const r = resolved
    if (!r.ok) {
      setShowErrors(true)
      return
    }
    if (timer) {
      void finishTimer(r.start, r.end)
      return
    }
    const now = new Date().toISOString()
    save.mutate(
      {
        entry: {
          id: newId(),
          login: forLogin,
          start: r.start.toISOString(),
          end: r.end.toISOString(),
          ...fields,
          description: fields.description.trim(),
          createdAt: now,
          updatedAt: now,
        },
      },
      {
        // Inputs are only cleared once the entry is safely stored.
        onSuccess: () => {
          toast.info(forOther ? t('manual.addedFor', { login: forLogin }) : t('manual.added'))
          // Skip the no-op: React would keep it queued and could later replay it over the
          // draft filled from the running timer when switching back to the user's own entry.
          if (fields !== EMPTY) setFields(EMPTY)
          setTimes((prev) => ({ ...defaultTimes(), date: prev.date }))
          setShowErrors(false)
        },
        onError,
      },
    )
  }

  return (
    <form className="stack" onSubmit={submit}>
      <div className="timer-main">
        <input
          className="input desc-input"
          placeholder={t('timer.placeholder')}
          aria-label={t('timer.placeholder')}
          value={fields.description}
          onChange={(e) => setFields({ ...fields, description: e.target.value })}
        />
        <div className="timer-meta">
          <GroupPickers value={fields} onChange={(p) => setFields({ ...fields, ...p })} />
        </div>
      </div>
      <TimeInputs
        value={shownTimes}
        onChange={({ useDuration, ...p }) => {
          if (useDuration !== undefined) setTimeInput(useDuration ? 'duration' : 'end')
          setTimes({ ...times, ...p })
        }}
        showErrors={showErrors}
        resolved={resolved}
      />
      <div className="manual-actions">
        {!adapter.readOnly && access.can('editOthersEntries') && (
          <MemberPicker value={forLogin} onChange={setForLogin} />
        )}
        {timer ? (
          <>
            <span className="small muted">{t('manual.runningHint')}</span>
            <button
              className="btn btn-danger"
              disabled={finishing || busy || timer.id === 'pending'}
            >
              <Icon name="stop" size={16} filled />
              {t('manual.stopAndSave')}
            </button>
          </>
        ) : (
          <button className="btn btn-primary" disabled={save.isPending}>
            <Icon name="plus" size={16} />
            {forOther ? t('manual.addFor', { login: forLogin }) : t('manual.add')}
          </button>
        )}
      </div>
    </form>
  )
}

function workFieldsOf(timer: RunningTimer): WorkFields {
  return { description: timer.description, projectId: timer.projectId, tagIds: timer.tagIds }
}

const sameValue = (a: WorkFields[keyof WorkFields], b: WorkFields[keyof WorkFields]) =>
  Array.isArray(a) && Array.isArray(b) ? a.join('\n') === b.join('\n') : a === b

/** The fields of `next` that differ from `base`, or null if none do. */
function changedFields(base: WorkFields, next: WorkFields): Partial<WorkFields> | null {
  const keys = (Object.keys(next) as (keyof WorkFields)[]).filter(
    (k) => !sameValue(base[k], next[k]),
  )
  return keys.length ? Object.fromEntries(keys.map((k) => [k, next[k]])) : null
}

export function TimerBar() {
  const { t } = useI18n()
  const { user } = useSessionData()
  const { timer: ownTimer } = useTimerActions()
  const onError = useErrorToast()
  const update = useUpdateTimer()
  const [mode, setMode] = usePref('entryMode')
  const [draft, setDraft] = useState<WorkFields>(EMPTY)
  // The running timer the manual form was filled from, and its values at that point.
  const [seed, setSeed] = useState<{ id: string; fields: WorkFields } | null>(null)
  // Whose entry the manual form creates; kept across saves, reset when leaving manual mode.
  const [forLogin, setForLogin] = useState(user.login)
  // An entry for another member ignores the user's own running timer.
  const timer = mode === 'manual' && forLogin !== user.login ? null : ownTimer

  if (mode === 'manual' && timer) {
    const remote = workFieldsOf(timer)
    if (seed?.id !== timer.id) {
      setSeed({ id: timer.id, fields: remote })
      setDraft(remote)
    } else if (changedFields(seed.fields, remote)) {
      // Follow changes from elsewhere (e.g. a description saved on blur) unless edited here.
      setSeed({ id: timer.id, fields: remote })
      const keep = changedFields(seed.fields, draft) ?? {}
      setDraft({ ...remote, ...keep })
    }
  } else if (mode === 'manual' && seed && !timer) {
    // Stopped here or elsewhere: its values belong to the saved entry now.
    setSeed(null)
    setDraft(EMPTY)
  }

  const switchTo = (next: 'timer' | 'manual') => {
    if (next === mode) return
    if (next === 'timer' && timer && seed?.id === timer.id) {
      // Keep the running timer, with the description, project and tags edited here.
      const patch = changedFields(workFieldsOf(timer), {
        ...draft,
        description: draft.description.trim(),
      })
      if (patch && timer.id !== 'pending') update.mutate(patch, { onError })
      setDraft(EMPTY)
    }
    setSeed(null)
    setForLogin(user.login)
    setMode(next)
  }

  return (
    <section className="card timer-bar">
      <div className="row">
        <div className="segmented" role="group">
          <button type="button" aria-pressed={mode === 'timer'} onClick={() => switchTo('timer')}>
            {t('timer.modeTimer')}
          </button>
          <button
            type="button"
            aria-pressed={mode === 'manual'}
            onClick={() => switchTo('manual')}
          >
            {t('timer.modeManual')}
          </button>
        </div>
      </div>
      {mode === 'manual' ? (
        <ManualEntryView
          key={timer?.id ?? 'none'}
          draft={draft}
          setDraft={setDraft}
          timer={timer}
          forLogin={forLogin}
          setForLogin={setForLogin}
        />
      ) : timer ? (
        <RunningTimerView key={timer.id} timer={timer} />
      ) : (
        <StartTimerView draft={draft} setDraft={setDraft} />
      )}
    </section>
  )
}
