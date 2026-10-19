import { useState } from 'react'
import { Icon } from '../../components/Icon'
import { isIssueRef, issueUrl, type IssueParse } from '../../domain/issueRef'
import { useI18n } from '../../i18n'
import { InlineEdit } from './InlineFields'
import { useParseIssue, useResolveIssue } from './useResolveIssue'

function useIssueErrorText() {
  const { t } = useI18n()
  return (r: IssueParse) => (r.ok ? null : t(`issue.errors.${r.reason}`))
}

/** `owner/repo#42` linking to the issue; nothing for a missing or malformed value. */
export function IssueLink({ value }: { value: string | undefined }) {
  if (!isIssueRef(value)) return null
  return (
    <a className="chip issue-link" href={issueUrl(value)} target="_blank" rel="noopener noreferrer">
      <Icon name="github" size={12} />
      {value}
    </a>
  )
}

/**
 * Issue field of the timer and entry forms. It reports every keystroke (so a submit with Enter
 * sees the text), normalizes to `owner/repo#42` on blur, and shows why the text is not an issue.
 * `showError` shows the error before the field was left, e.g. after a refused submit.
 */
export function IssueField({
  value,
  projectId,
  onChange,
  showError,
  disabled,
}: {
  value: string | undefined
  projectId: string | null
  onChange: (value: string | undefined) => void
  showError?: boolean
  disabled?: boolean
}) {
  const { t } = useI18n()
  const resolve = useResolveIssue(projectId)
  const errorText = useIssueErrorText()
  const [touched, setTouched] = useState(false)
  const result = resolve(value?.trim() || undefined)
  const error = (touched || showError) && !result.ok ? errorText(result) : null

  return (
    <span className="issue-field">
      <input
        className="input issue-input"
        placeholder={t('issue.placeholder')}
        aria-label={t('issue.label')}
        aria-invalid={error !== null}
        value={value ?? ''}
        disabled={disabled}
        onChange={(e) => {
          setTouched(false)
          onChange(e.target.value || undefined)
        }}
        onBlur={() => {
          setTouched(true)
          if (result.ok && (result.ref ?? undefined) !== value) onChange(result.ref ?? undefined)
        }}
      />
      {error && (
        <span className="form-error inline-error" role="alert">
          {error}
        </span>
      )}
    </span>
  )
}

/** Click-to-edit issue link in the entry list; saves on Enter or leaving the field. */
export function InlineIssue({
  value,
  projectId,
  editable,
  editing,
  onStart,
  onDone,
  onSave,
}: {
  value: string | undefined
  projectId: string | null
  editable: boolean
  editing: boolean
  onStart: () => void
  onDone: () => void
  onSave: (ref: string | undefined) => Promise<string | null>
}) {
  const { t } = useI18n()
  const parse = useParseIssue(projectId)
  const errorText = useIssueErrorText()
  const shown = isIssueRef(value) ? value : undefined
  if (!editable && !shown) return null
  // A link cannot sit inside the edit button, so a set issue gets its own edit button.
  if (shown && !editing) {
    return (
      <span className="entry-issue">
        <IssueLink value={shown} />
        {editable && (
          <button
            type="button"
            className="btn btn-icon btn-xs"
            aria-label={t('issue.edit')}
            title={t('issue.edit')}
            onClick={onStart}
          >
            <Icon name="edit" size={12} />
          </button>
        )}
      </span>
    )
  }
  return (
    <InlineEdit
      editable={editable}
      editing={editing}
      onStart={onStart}
      onDone={onDone}
      className="entry-issue empty"
      display={`+ ${t('issue.label')}`}
      initial={shown ?? ''}
      label={t('issue.edit')}
      placeholder={t('issue.placeholder')}
      onCommit={async (text) => {
        const r = parse(text)
        return r.ok ? onSave(r.ref ?? undefined) : errorText(r)
      }}
    />
  )
}
