import { useRef, useState, type ReactNode } from 'react'
import { ProjectPicker, TagPicker } from '../../components/Pickers'
import type { Project, Tag } from '../../domain/types'

interface InlineEditProps {
  /** Shown in display mode. */
  display: ReactNode
  /** Initial value of the input. */
  initial: string
  /** Accessible name, e.g. "Edit start time". */
  label: string
  editable: boolean
  editing: boolean
  onStart: () => void
  /** Leaves edit mode (after saving, cancelling, or an unchanged value). */
  onDone: () => void
  /** Saves the value; resolves to an error message to stay in edit mode, or null when saved. */
  onCommit: (value: string) => Promise<string | null>
  className?: string
  type?: 'text' | 'time'
  inputMode?: 'text' | 'decimal'
  placeholder?: string
}

/**
 * Click-to-edit field: a button showing the value, turning into an input on click.
 * Enter or leaving the field saves, Escape cancels, an unchanged value is not saved.
 */
export function InlineEdit(p: InlineEditProps) {
  const [value, setValue] = useState(p.initial)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const cancelled = useRef(false)

  if (!p.editable) return <span className={p.className}>{p.display}</span>

  if (!p.editing) {
    return (
      <button
        type="button"
        className={`inline-edit ${p.className ?? ''}`}
        aria-label={p.label}
        title={p.label}
        onClick={() => {
          setValue(p.initial)
          setError(null)
          cancelled.current = false
          p.onStart()
        }}
      >
        {p.display}
      </button>
    )
  }

  const commit = async () => {
    if (busyRef.current || cancelled.current) return
    if (value === p.initial) return p.onDone()
    busyRef.current = true
    setBusy(true)
    const err = await p.onCommit(value)
    busyRef.current = false
    setBusy(false)
    if (err) setError(err)
    else p.onDone()
  }

  return (
    <span className={`inline-edit-wrap ${p.className ?? ''}`}>
      <input
        autoFocus
        className="input inline-input"
        type={p.type ?? 'text'}
        inputMode={p.inputMode}
        placeholder={p.placeholder}
        aria-label={p.label}
        aria-invalid={error !== null}
        value={value}
        readOnly={busy}
        onChange={(e) => {
          setValue(e.target.value)
          setError(null)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            void commit()
          } else if (e.key === 'Escape') {
            e.preventDefault()
            cancelled.current = true
            p.onDone()
          }
        }}
        onBlur={() => void commit()}
      />
      {error && (
        <span className="form-error inline-error" role="alert">
          {error}
        </span>
      )}
    </span>
  )
}

/** Project picker that saves on selection. */
export function InlineProject({
  projects,
  value,
  onSave,
  disabled,
}: {
  projects: Project[]
  value: string | null
  onSave: (projectId: string | null) => void
  disabled?: boolean
}) {
  return (
    <ProjectPicker
      projects={projects}
      value={value}
      disabled={disabled}
      onChange={(id) => id !== value && onSave(id)}
    />
  )
}

/** Tag picker that collects changes while open and saves them once when it closes. */
export function InlineTags({
  tags,
  value,
  onSave,
  onCreate,
  disabled,
}: {
  tags: Tag[]
  value: string[]
  onSave: (tagIds: string[]) => void
  onCreate?: (name: string) => Promise<string>
  disabled?: boolean
}) {
  // While the picker is open, changes collect in the draft; otherwise the saved value is shown.
  const [draft, setDraft] = useState<string[] | null>(null)

  const same = (a: string[], b: string[]) =>
    a.length === b.length && [...a].sort().join() === [...b].sort().join()

  return (
    <TagPicker
      tags={tags}
      value={draft ?? value}
      disabled={disabled}
      onCreate={onCreate}
      onChange={setDraft}
      onClose={() => {
        if (draft && !same(draft, value)) onSave(draft)
        setDraft(null)
      }}
    />
  )
}
