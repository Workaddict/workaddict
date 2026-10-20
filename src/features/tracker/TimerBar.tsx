import { format } from '../../domain/zoned'
import { useState, type FormEvent } from 'react'
import { Icon } from '../../components/Icon'
import { useConfirm } from '../../components/Modal'
import { Popover } from '../../components/Popover'
import { useToast } from '../../components/Toasts'
import { newId } from '../../domain/ids'
import { formatClock, resolveTimerStart } from '../../domain/time'
import type { RunningTimer, TimeEntry } from '../../domain/types'
import { useI18n } from '../../i18n'
import { useSessionData } from '../auth/AuthContext'
import {
  useAccess,
  useDiscardTimer,
  useMembers,
  useSaveEntries,
  useSaveEntry,
  useUpdateTimer,
} from '../data/hooks'
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
import { IssueField } from './IssueInput'
import { useResolveIssue } from './useResolveIssue'
import { usePref } from '../../prefs'
import { useNow } from './useNow'
import { useTimerActions } from './useTimerActions'
import { TipButton } from '../../components/InfoTip'

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
  const [issue, setIssue] = useState(timer.issueRef)
  const [remoteIssue, setRemoteIssue] = useState(timer.issueRef)
  const resolveIssue = useResolveIssue(timer.projectId)

  // Follow remote changes (other device) to the description and issue.
  if (timer.description !== remoteDesc) {
    setRemoteDesc(timer.description)
    setDesc(timer.description)
  }
  if (timer.issueRef !== remoteIssue) {
    setRemoteIssue(timer.issueRef)
    setIssue(timer.issueRef)
  }

  /** The issue to save, if it was changed here and resolves. */
  const issuePatch = (): { issueRef: string | undefined } | null => {
    const r = resolveIssue(issue?.trim() || undefined)
    const ref = r.ok ? (r.ref ?? undefined) : timer.issueRef
    return ref !== timer.issueRef ? { issueRef: ref } : null
  }

  const saveDesc = () => {
    if (desc !== timer.description && !pending) update.mutate({ description: desc }, { onError })
  }

  const saveIssue = () => {
    const patch = issuePatch()
    if (patch && !pending) update.mutate(patch, { onError })
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
          <span onBlur={saveIssue}>
            <IssueField
              value={issue}
              projectId={timer.projectId}
              onChange={setIssue}
              disabled={pending}
            />
          </span>
        </div>
      </div>
      <div className="timer-foot">
        <TimerStart timer={timer} />
        <div className="row">
          <TipButton
            className="btn btn-icon"
            tip={t('timer.discard')}
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
          </TipButton>
          <span className="timer-clock">{formatClock(now - new Date(timer.start).getTime())}</span>
          <button
            className="btn btn-danger btn-lg"
            onClick={async () => {
              // Persist pending description and issue edits before the stop reads the timer.
              const patch = {
                ...(desc !== timer.description ? { description: desc } : {}),
                ...issuePatch(),
              }
              if (Object.keys(patch).length) {
                try {
                  await update.mutateAsync(patch)
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
  const resolveIssue = useResolveIssue(draft.projectId)
  const [showErrors, setShowErrors] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const issue = resolveIssue(draft.issueRef?.trim() || undefined)
    if (!issue.ok) {
      setShowErrors(true)
      return
    }
    startTimer({ ...draft, issueRef: issue.ref ?? undefined })
    setDraft(EMPTY)
    setShowErrors(false)
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
        <IssueField
          value={draft.issueRef}
          projectId={draft.projectId}
          onChange={(issueRef) => setDraft({ ...draft, issueRef })}
          showError={showErrors}
        />
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

/**
 * "For" picker: whose entries the manual form creates, one or several members. Only for users who
 * may edit others' entries.
 */
function MemberPicker({
  value,
  onChange,
  initiallyOpen,
  onClose,
}: {
  value: string[]
  onChange: (logins: string[]) => void
  initiallyOpen?: boolean
  onClose?: () => void
}) {
  const { t } = useI18n()
  const { user } = useSessionData()
  const members = useMembers().data ?? []
  const all = [
    user.login,
    ...members
      .map((m) => m.login)
      .filter((l) => l !== user.login)
      .sort((a, b) => a.localeCompare(b)),
  ]
  const allSelected = all.every((l) => value.includes(l))
  const nameOf = (login: string) => (login === user.login ? t('manual.me', { login }) : login)
  const summary =
    value.length === 0
      ? t('manual.nobody')
      : value.length === 1
        ? nameOf(value[0]!)
        : allSelected
          ? t('manual.allMembers')
          : t('manual.membersCount', { count: value.length })
  // Keep the list order (the user first) whatever order members were checked in.
  const toggle = (login: string) =>
    onChange(
      value.includes(login)
        ? value.filter((l) => l !== login)
        : all.filter((l) => l === login || value.includes(l)),
    )

  return (
    <div className="row small member-picker">
      <span>{t('manual.for')}</span>
      <Popover
        label={t('manual.for')}
        hasValue
        initiallyOpen={initiallyOpen}
        onClose={onClose}
        button={<span>{summary}</span>}
      >
        {() => (
          <div
            className="picker-list"
            role="listbox"
            aria-multiselectable="true"
            style={{ marginTop: 0 }}
          >
            <label className="picker-option">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => onChange(allSelected ? [] : all)}
              />
              <strong>{t('manual.selectAll')}</strong>
            </label>
            {all.map((l) => (
              <label key={l} className="picker-option">
                <input type="checkbox" checked={value.includes(l)} onChange={() => toggle(l)} />
                <span>{nameOf(l)}</span>
              </label>
            ))}
          </div>
        )}
      </Popover>
    </div>
  )
}

/**
 * Manual entry form. With a running timer it shows that timer, ending when the form opened,
 * and saving stops the timer with the edited values. `timer` is null unless the entry is for the
 * user alone, so entries for other or several members never touch the user's own timer.
 */
function ManualEntryView({
  draft: fields,
  setDraft: setFields,
  timer,
  forLogins,
  setForLogins,
  pickerOpen,
  onPickerClose,
}: DraftProps & {
  timer: RunningTimer | null
  forLogins: string[]
  setForLogins: (logins: string[]) => void
  /** The member picker was in use when this form replaced the previous one. */
  pickerOpen: boolean
  onPickerClose: () => void
}) {
  const { t, timeFormat } = useI18n()
  const toast = useToast()
  const onError = useErrorToast()
  const { adapter, user } = useSessionData()
  const access = useAccess()
  const single = forLogins.length === 1 ? forLogins[0]! : null
  const forOther = single !== null && single !== user.login
  const many = forLogins.length > 1
  const save = useSaveEntry()
  const saveMany = useSaveEntries()
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
  const resolveIssue = useResolveIssue(fields.projectId)
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

  const finishTimer = async (start: Date, end: Date, issueRef: string | undefined) => {
    setFinishing(true)
    try {
      // Apply the edits first so the stop writes them; null means the timer is gone.
      const updated = await update.mutateAsync({
        ...fields,
        issueRef,
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
    const issue = resolveIssue(fields.issueRef?.trim() || undefined)
    if (!r.ok || !issue.ok) {
      setShowErrors(true)
      return
    }
    const issueRef = issue.ref ?? undefined
    if (timer) {
      void finishTimer(r.start, r.end, issueRef)
      return
    }
    if (single === null && !many) return
    const now = new Date().toISOString()
    const entryFor = (login: string): TimeEntry => ({
      id: newId(),
      login,
      start: r.start.toISOString(),
      end: r.end.toISOString(),
      ...fields,
      description: fields.description.trim(),
      issueRef,
      createdAt: now,
      updatedAt: now,
    })
    // Inputs are only cleared once the entries are safely stored.
    const onSuccess = () => {
      toast.info(
        many
          ? t('manual.addedForMany', { count: forLogins.length })
          : forOther
            ? t('manual.addedFor', { login: single })
            : t('manual.added'),
      )
      // Skip the no-op: React would keep it queued and could later replay it over the
      // draft filled from the running timer when switching back to the user's own entry.
      if (fields !== EMPTY) setFields(EMPTY)
      setTimes((prev) => ({ ...defaultTimes(), date: prev.date }))
      setShowErrors(false)
    }
    if (many) saveMany.mutate(forLogins.map(entryFor), { onSuccess, onError })
    else save.mutate({ entry: entryFor(single!) }, { onSuccess, onError })
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
          <IssueField
            value={fields.issueRef}
            projectId={fields.projectId}
            onChange={(issueRef) => setFields({ ...fields, issueRef })}
            showError={showErrors}
          />
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
          <MemberPicker
            value={forLogins}
            onChange={setForLogins}
            initiallyOpen={pickerOpen}
            onClose={onPickerClose}
          />
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
          <button
            className="btn btn-primary"
            disabled={save.isPending || saveMany.isPending || forLogins.length === 0}
          >
            <Icon name="plus" size={16} />
            {many
              ? t('manual.addForMany', { count: forLogins.length })
              : forOther
                ? t('manual.addFor', { login: single })
                : t('manual.add')}
          </button>
        )}
      </div>
    </form>
  )
}

function workFieldsOf(timer: RunningTimer): WorkFields {
  return {
    description: timer.description,
    projectId: timer.projectId,
    tagIds: timer.tagIds,
    issueRef: timer.issueRef,
  }
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
  const resolveIssue = useResolveIssue(draft.projectId)
  // The running timer the manual form was filled from, and its values at that point.
  const [seed, setSeed] = useState<{ id: string; fields: WorkFields } | null>(null)
  // Whose entries the manual form creates; kept across saves, reset when leaving manual mode.
  const [forLogins, setForLogins] = useState<string[]>([user.login])
  // Entries for other or several members ignore the user's own running timer.
  const forSelfOnly = forLogins.length === 1 && forLogins[0] === user.login
  const timer = mode === 'manual' && !forSelfOnly ? null : ownTimer
  // Choosing members can swap the form (own timer ↔ others' entry); keep the picker open then.
  const [pickerOpen, setPickerOpen] = useState(false)
  const chooseFor = (logins: string[]) => {
    const self = logins.length === 1 && logins[0] === user.login
    setPickerOpen(ownTimer !== null && self !== forSelfOnly)
    setForLogins(logins)
  }

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
      // Keep the running timer, with the description, project, tags and issue edited here
      // (an issue that does not resolve is left as it was).
      const issue = resolveIssue(draft.issueRef?.trim() || undefined)
      const patch = changedFields(workFieldsOf(timer), {
        ...draft,
        description: draft.description.trim(),
        issueRef: issue.ok ? (issue.ref ?? undefined) : timer.issueRef,
      })
      if (patch && timer.id !== 'pending') update.mutate(patch, { onError })
      setDraft(EMPTY)
    }
    setSeed(null)
    setForLogins([user.login])
    setPickerOpen(false)
    setMode(next)
  }

  return (
    <section className="card timer-bar" data-tour="timer">
      <div className="row">
        <div className="segmented" role="group">
          <button type="button" aria-pressed={mode === 'timer'} onClick={() => switchTo('timer')}>
            {t('timer.modeTimer')}
          </button>
          <button type="button" aria-pressed={mode === 'manual'} onClick={() => switchTo('manual')}>
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
          forLogins={forLogins}
          setForLogins={chooseFor}
          pickerOpen={pickerOpen}
          onPickerClose={() => setPickerOpen(false)}
        />
      ) : timer ? (
        <RunningTimerView key={timer.id} timer={timer} />
      ) : (
        <StartTimerView draft={draft} setDraft={setDraft} />
      )}
    </section>
  )
}
