import { format } from 'date-fns'
import { ProjectPicker, TagPicker } from '../../components/Pickers'
import { durationMs, formatHM, resolveManualTimes, type ManualTimeResult } from '../../domain/time'
import { useI18n } from '../../i18n'
import { useWorkspace } from '../data/hooks'
import { useWorkspaceActions } from '../data/workspaceActions'
import { useErrorToast } from '../data/useErrorText'

export interface WorkFields {
  description: string
  projectId: string | null
  tagIds: string[]
}

/** Project + tag pickers bound to the shared workspace (tags can be created inline). */
export function GroupPickers({
  value,
  onChange,
  disabled,
}: {
  value: Pick<WorkFields, 'projectId' | 'tagIds'>
  onChange: (patch: Partial<WorkFields>) => void
  disabled?: boolean
}) {
  const ws = useWorkspace().data
  const { createTag } = useWorkspaceActions()
  const onError = useErrorToast()
  return (
    <>
      <ProjectPicker
        projects={ws?.projects ?? []}
        value={value.projectId}
        onChange={(projectId) => onChange({ projectId })}
        disabled={disabled}
      />
      <TagPicker
        tags={ws?.tags ?? []}
        value={value.tagIds}
        onChange={(tagIds) => onChange({ tagIds })}
        onCreate={async (name) => {
          try {
            return await createTag(name)
          } catch (e) {
            onError(e)
            throw e
          }
        }}
        disabled={disabled}
      />
    </>
  )
}

export interface TimeFields {
  date: string
  startTime: string
  endTime: string
  duration: string
  useDuration: boolean
}

export function timeFieldsFrom(start: Date, end: Date): TimeFields {
  return {
    date: format(start, 'yyyy-MM-dd'),
    startTime: format(start, 'HH:mm'),
    endTime: format(end, 'HH:mm'),
    duration: formatHM(durationMs(start, end)),
    useDuration: false,
  }
}

export function resolveTimeFields(f: TimeFields): ManualTimeResult {
  return f.useDuration
    ? resolveManualTimes({ date: f.date, startTime: f.startTime, duration: f.duration })
    : resolveManualTimes({ date: f.date, startTime: f.startTime, endTime: f.endTime })
}

/** Date, start and end-or-duration inputs with a live duration preview. */
export function TimeInputs({
  value,
  onChange,
  showErrors,
  resolved,
}: {
  value: TimeFields
  onChange: (patch: Partial<TimeFields>) => void
  showErrors: boolean
  /** Overrides the result derived from `value` (e.g. exact times of an unedited entry). */
  resolved?: ManualTimeResult
}) {
  const { t } = useI18n()
  const result = resolved ?? resolveTimeFields(value)
  const error = !result.ok ? result.error : null

  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="manual-grid">
        <label className="field">
          <span>{t('manual.date')}</span>
          <input
            className="input"
            type="date"
            required
            value={value.date}
            onChange={(e) => onChange({ date: e.target.value })}
          />
        </label>
        <label className="field">
          <span>{t('manual.start')}</span>
          <input
            className="input"
            type="time"
            required
            value={value.startTime}
            aria-invalid={showErrors && error === 'invalidStart'}
            onChange={(e) => onChange({ startTime: e.target.value })}
          />
        </label>
        {value.useDuration ? (
          <label className="field">
            <span>{t('manual.duration')}</span>
            <input
              className="input"
              inputMode="decimal"
              placeholder={t('manual.durationPlaceholder')}
              value={value.duration}
              aria-invalid={showErrors && error === 'invalidDuration'}
              onChange={(e) => onChange({ duration: e.target.value })}
            />
          </label>
        ) : (
          <label className="field">
            <span>{t('manual.end')}</span>
            <input
              className="input"
              type="time"
              value={value.endTime}
              aria-invalid={showErrors && error !== null && error !== 'invalidStart'}
              onChange={(e) => onChange({ endTime: e.target.value })}
            />
          </label>
        )}
      </div>
      <div className="row wrap small">
        <button
          type="button"
          className="link-btn"
          onClick={() => onChange({ useDuration: !value.useDuration })}
        >
          {value.useDuration ? t('manual.useEnd') : t('manual.useDuration')}
        </button>
        <span className="spacer" />
        {result.ok ? (
          <span className="muted">
            {t('manual.preview', { duration: formatHM(durationMs(result.start, result.end)) })}
            {result.overnight && ` · ${t('manual.nextDay')}`}
          </span>
        ) : (
          showErrors && <span className="form-error">{t(`manual.errors.${result.error}`)}</span>
        )}
      </div>
    </div>
  )
}
