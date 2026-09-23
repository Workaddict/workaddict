import { isSameDay } from 'date-fns'
import { useState, type FormEvent } from 'react'
import type { ManualTimeResult } from '../../domain/time'
import { Modal } from '../../components/Modal'
import type { TimeEntry } from '../../domain/types'
import { useI18n } from '../../i18n'
import { useSaveEntry } from '../data/hooks'
import { useToast } from '../../components/Toasts'
import { useErrorToast } from '../data/useErrorText'
import {
  GroupPickers,
  resolveTimeFields,
  TimeInputs,
  timeFieldsFrom,
  type TimeFields,
  type WorkFields,
} from './EntryFields'

export function EntryEditModal({ entry, onClose }: { entry: TimeEntry; onClose: () => void }) {
  const { t, timeFormat } = useI18n()
  const toast = useToast()
  const onError = useErrorToast()
  const save = useSaveEntry()
  const initialTimes = timeFieldsFrom(new Date(entry.start), new Date(entry.end), timeFormat)
  const [fields, setFields] = useState<WorkFields>({
    description: entry.description,
    projectId: entry.projectId,
    tagIds: entry.tagIds,
  })
  const [times, setTimes] = useState<TimeFields>(initialTimes)
  const [showErrors, setShowErrors] = useState(false)

  const timesChanged =
    times.date !== initialTimes.date ||
    times.startTime !== initialTimes.startTime ||
    times.useDuration ||
    times.endTime !== initialTimes.endTime
  // Keep second precision of timer entries unless the times were actually edited
  // (minute-rounded fields could otherwise turn a sub-minute entry into 0 h or 24 h).
  const resolved: ManualTimeResult = timesChanged
    ? resolveTimeFields(times)
    : {
        ok: true,
        start: new Date(entry.start),
        end: new Date(entry.end),
        overnight: !isSameDay(new Date(entry.start), new Date(entry.end)),
      }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!resolved.ok) {
      setShowErrors(true)
      return
    }
    const start = timesChanged ? resolved.start.toISOString() : entry.start
    const end = timesChanged ? resolved.end.toISOString() : entry.end
    save.mutate(
      {
        entry: { ...entry, ...fields, description: fields.description.trim(), start, end },
        previousStart: entry.start,
      },
      {
        onSuccess: () => {
          toast.info(t('entries.saved'))
          onClose()
        },
        onError,
      },
    )
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
        </div>
        <TimeInputs
          value={times}
          onChange={(p) => setTimes({ ...times, ...p })}
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
