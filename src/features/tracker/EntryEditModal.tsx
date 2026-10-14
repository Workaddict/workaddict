import { useRef, useState, type FormEvent } from 'react'
import { Modal } from '../../components/Modal'
import type { TimeEntry } from '../../domain/types'
import { useI18n } from '../../i18n'
import { useSaveEntry } from '../data/hooks'
import { useToast } from '../../components/Toasts'
import { useErrorToast } from '../data/useErrorText'
import { readPref, writePref } from '../../prefs'
import {
  GroupPickers,
  resolveEditedTimes,
  TimeInputs,
  timeFieldsFrom,
  timesChanged,
  type TimeFields,
  type WorkFields,
} from './EntryFields'
import { IssueField } from './IssueInput'
import { useResolveIssue } from './useResolveIssue'
import { isIssueRef } from '../../domain/issueRef'

/** What the user typed in the dialog, kept to reopen it after a failed save. */
export interface EntryDraft {
  fields: WorkFields
  times: TimeFields
}

export function EntryEditModal({
  entry,
  draft,
  onClose,
  onSaveFailed,
}: {
  entry: TimeEntry
  /** Values to start with instead of the entry's, e.g. after a failed save. */
  draft?: EntryDraft
  onClose: () => void
  /** Reports a save that failed after the dialog closed; without it, an error toast is shown. */
  onSaveFailed?: (draft: EntryDraft, error: unknown) => void
}) {
  const { t, timeFormat } = useI18n()
  const toast = useToast()
  const onError = useErrorToast()
  const initialTimes = timeFieldsFrom(new Date(entry.start), new Date(entry.end), timeFormat)
  const [fields, setFields] = useState<WorkFields>(
    draft?.fields ?? {
      description: entry.description,
      projectId: entry.projectId,
      tagIds: entry.tagIds,
      // A malformed stored value is not offered for editing; saving replaces it.
      issueRef: isIssueRef(entry.issueRef) ? entry.issueRef : undefined,
    },
  )
  const resolveIssue = useResolveIssue(fields.projectId)
  const [times, setTimes] = useState<TimeFields>(
    () =>
      draft?.times ?? { ...initialTimes, useDuration: readPref('manualTimeInput') === 'duration' },
  )
  const [showErrors, setShowErrors] = useState(false)
  // The dialog closes before GitHub confirms the save, so failures are reported through
  // hook-level callbacks, which still run after this component unmounts.
  const save = useSaveEntry({
    onError: (e) => {
      if (onSaveFailed && submitted.current) onSaveFailed(submitted.current, e)
      else onError(e)
    },
  })
  const submitted = useRef<EntryDraft | null>(null)

  // Keep second precision of timer entries unless the times were actually edited.
  const resolved = resolveEditedTimes(
    times,
    initialTimes,
    new Date(entry.start),
    new Date(entry.end),
  )

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const issue = resolveIssue(fields.issueRef?.trim() || undefined)
    if (!resolved.ok || !issue.ok) {
      setShowErrors(true)
      return
    }
    const edited = timesChanged(times, initialTimes)
    const start = edited ? resolved.start.toISOString() : entry.start
    const end = edited ? resolved.end.toISOString() : entry.end
    submitted.current = { fields, times }
    // The list shows the new values at once (optimistic update), so there is nothing to wait for.
    save.mutate({
      entry: {
        ...entry,
        ...fields,
        description: fields.description.trim(),
        issueRef: issue.ref ?? undefined,
        start,
        end,
      },
      previousStart: entry.start,
    })
    toast.info(t('entries.saved'))
    onClose()
  }

  return (
    <Modal title={t('entries.editTitle')} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <input
          className="input"
          placeholder={t('timer.placeholder')}
          aria-label={t('stats.description')}
          value={fields.description}
          onChange={(e) => setFields({ ...fields, description: e.target.value })}
        />
        <div className="row wrap">
          <GroupPickers value={fields} onChange={(p) => setFields({ ...fields, ...p })} />
          <IssueField
            value={fields.issueRef}
            projectId={fields.projectId}
            onChange={(issueRef) => setFields({ ...fields, issueRef })}
            showError={showErrors}
          />
        </div>
        <TimeInputs
          value={times}
          onChange={(p) => {
            if (p.useDuration !== undefined) {
              writePref('manualTimeInput', p.useDuration ? 'duration' : 'end')
            }
            setTimes({ ...times, ...p })
          }}
          showErrors={showErrors}
          resolved={resolved}
        />
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button className="btn btn-primary" disabled={save.isPending}>
            {t('common.save')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
