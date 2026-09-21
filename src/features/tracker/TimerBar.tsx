import { format } from 'date-fns'
import { useState, type FormEvent } from 'react'
import { Icon } from '../../components/Icon'
import { useConfirm } from '../../components/Modal'
import { useToast } from '../../components/Toasts'
import { newId } from '../../domain/ids'
import { formatClock } from '../../domain/time'
import type { RunningTimer } from '../../domain/types'
import { useI18n } from '../../i18n'
import { useSessionData } from '../auth/AuthContext'
import { useDiscardTimer, useSaveEntry, useUpdateTimer } from '../data/hooks'
import { useErrorToast } from '../data/useErrorText'
import {
  GroupPickers,
  resolveTimeFields,
  TimeInputs,
  type TimeFields,
  type WorkFields,
} from './EntryFields'
import { useNow } from './useNow'
import { useTimerActions } from './useTimerActions'

const EMPTY: WorkFields = { description: '', projectId: null, tagIds: [] }

function RunningTimerView({ timer }: { timer: RunningTimer }) {
  const { t, locale } = useI18n()
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
        <span className="small muted">
          {t('timer.runningSince', { time: format(new Date(timer.start), 'p', { locale }) })}
        </span>
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

function StartTimerView() {
  const { t } = useI18n()
  const { startTimer, busy } = useTimerActions()
  const [draft, setDraft] = useState<WorkFields>(EMPTY)

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

function ManualEntryView() {
  const { t } = useI18n()
  const toast = useToast()
  const onError = useErrorToast()
  const { user } = useSessionData()
  const save = useSaveEntry()
  const [fields, setFields] = useState<WorkFields>(EMPTY)
  const [times, setTimes] = useState<TimeFields>(defaultTimes)
  const [showErrors, setShowErrors] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const r = resolveTimeFields(times)
    if (!r.ok) {
      setShowErrors(true)
      return
    }
    const now = new Date().toISOString()
    save.mutate(
      {
        entry: {
          id: newId(),
          login: user.login,
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
          toast.info(t('manual.added'))
          setFields(EMPTY)
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
        value={times}
        onChange={(p) => setTimes({ ...times, ...p })}
        showErrors={showErrors}
      />
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" disabled={save.isPending}>
          <Icon name="plus" size={16} />
          {t('manual.add')}
        </button>
      </div>
    </form>
  )
}

export function TimerBar() {
  const { t } = useI18n()
  const { timer } = useTimerActions()
  const [mode, setMode] = useState<'timer' | 'manual'>('timer')

  return (
    <section className="card timer-bar">
      <div className="row">
        <div className="segmented" role="group">
          <button type="button" aria-pressed={mode === 'timer'} onClick={() => setMode('timer')}>
            {t('timer.modeTimer')}
          </button>
          <button type="button" aria-pressed={mode === 'manual'} onClick={() => setMode('manual')}>
            {t('timer.modeManual')}
          </button>
        </div>
      </div>
      {mode === 'manual' ? (
        <ManualEntryView />
      ) : timer ? (
        <RunningTimerView key={timer.id} timer={timer} />
      ) : (
        <StartTimerView />
      )}
    </section>
  )
}
