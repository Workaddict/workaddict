import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { isNameTaken } from '../domain/ids'
import type { Project, Tag } from '../domain/types'
import { Icon } from './Icon'

function usePopover() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  return { open, setOpen, ref }
}

function Popover({
  label,
  button,
  hasValue,
  disabled,
  onClose,
  children,
}: {
  label: string
  button: ReactNode
  hasValue: boolean
  disabled?: boolean
  /** Called whenever the popover closes (outside click, Escape, or the toggle button). */
  onClose?: () => void
  children: (close: () => void) => ReactNode
}) {
  const { open, setOpen, ref } = usePopover()
  const wasOpen = useRef(false)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })
  useEffect(() => {
    if (wasOpen.current && !open) onCloseRef.current?.()
    wasOpen.current = open
  }, [open])
  return (
    <div className="picker" ref={ref}>
      <button
        type="button"
        className={`picker-btn${hasValue ? ' has-value' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        title={label}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
      >
        {button}
      </button>
      {open && <div className="picker-pop">{children(() => setOpen(false))}</div>}
    </div>
  )
}

function matches(name: string, q: string) {
  return name.toLocaleLowerCase().includes(q.trim().toLocaleLowerCase())
}

/**
 * Single project selection. Archived projects are hidden from the list but still shown
 * when already selected.
 */
export function ProjectPicker({
  projects,
  value,
  onChange,
  disabled,
}: {
  projects: Project[]
  value: string | null
  onChange: (id: string | null) => void
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const selected = projects.find((p) => p.id === value)
  const visible = projects.filter((p) => !p.archived && matches(p.name, q))

  return (
    <Popover
      label={t('stats.project')}
      hasValue={!!selected}
      disabled={disabled}
      button={
        <>
          {selected ? (
            <span className="dot" style={{ background: selected.color }} />
          ) : (
            <Icon name="folder" size={16} />
          )}
          <span>{selected ? selected.name : t('stats.project')}</span>
        </>
      }
    >
      {(close) => (
        <>
          <input
            className="input"
            autoFocus
            placeholder={t('common.search')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="picker-list" role="listbox">
            <button
              type="button"
              role="option"
              aria-selected={value === null}
              className="picker-option"
              onClick={() => {
                onChange(null)
                close()
              }}
            >
              <span className="dot" />
              <span className="muted">{t('common.noProject')}</span>
            </button>
            {visible.map((p) => (
              <button
                type="button"
                role="option"
                key={p.id}
                aria-selected={p.id === value}
                className="picker-option"
                onClick={() => {
                  onChange(p.id)
                  close()
                }}
              >
                <span className="dot" style={{ background: p.color }} />
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </Popover>
  )
}

/** Multi tag selection with inline creation. */
export function TagPicker({
  tags,
  value,
  onChange,
  onCreate,
  onClose,
  disabled,
}: {
  tags: Tag[]
  value: string[]
  onChange: (ids: string[]) => void
  onCreate?: (name: string) => Promise<string>
  onClose?: () => void
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const [creating, setCreating] = useState(false)
  const selected = useMemo(() => tags.filter((x) => value.includes(x.id)), [tags, value])
  const visible = tags.filter((x) => (!x.archived || value.includes(x.id)) && matches(x.name, q))
  const canCreate = onCreate && q.trim() !== '' && !isNameTaken(tags, q)

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])

  const create = async () => {
    if (!onCreate || !canCreate) return
    setCreating(true)
    try {
      const id = await onCreate(q)
      onChange([...value, id])
      setQ('')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Popover
      label={t('stats.tags')}
      hasValue={selected.length > 0}
      disabled={disabled}
      onClose={onClose}
      button={
        <>
          <Icon name="tag" size={16} />
          <span>
            {selected.length === 0
              ? t('stats.tags')
              : selected.map((x) => x.name).join(', ')}
          </span>
        </>
      }
    >
      {() => (
        <>
          <input
            className="input"
            autoFocus
            placeholder={t('common.search')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (canCreate) void create()
                else if (visible[0]) toggle(visible[0].id)
              }
            }}
          />
          <div className="picker-list" role="listbox" aria-multiselectable="true">
            {visible.map((x) => (
              <label key={x.id} className="picker-option" role="option" aria-selected={value.includes(x.id)}>
                <input type="checkbox" checked={value.includes(x.id)} onChange={() => toggle(x.id)} />
                <span>{x.name}</span>
              </label>
            ))}
            {canCreate && (
              <button type="button" className="picker-option" disabled={creating} onClick={create}>
                <Icon name="plus" size={16} />
                <span>{t('common.create', { name: q.trim() })}</span>
              </button>
            )}
          </div>
        </>
      )}
    </Popover>
  )
}

/** Multi-select filter with an "All" state (null). Used on the stats page. */
export function FilterPicker({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { id: string; label: string; color?: string }[]
  value: string[] | null
  onChange: (v: string[] | null) => void
}) {
  const { t } = useTranslation()
  const isAll = value === null
  const summary = isAll
    ? t('common.all')
    : value.length === 1
      ? (options.find((o) => o.id === value[0])?.label ?? '1')
      : t('common.selectedCount', { count: value.length })

  const toggle = (id: string) => {
    const current = value ?? options.map((o) => o.id)
    const next = current.includes(id) ? current.filter((v) => v !== id) : [...current, id]
    onChange(next.length === options.length ? null : next)
  }

  return (
    <div className="field">
      <span>{label}</span>
      <Popover label={label} hasValue button={<span>{summary}</span>}>
        {() => (
          <div className="picker-list" role="listbox" aria-multiselectable="true" style={{ marginTop: 0 }}>
            <label className="picker-option">
              <input type="checkbox" checked={isAll} onChange={() => onChange(isAll ? [] : null)} />
              <strong>{t('common.all')}</strong>
            </label>
            {options.map((o) => (
              <label key={o.id} className="picker-option">
                <input
                  type="checkbox"
                  checked={isAll || value.includes(o.id)}
                  onChange={() => toggle(o.id)}
                />
                {o.color !== undefined && <span className="dot" style={{ background: o.color }} />}
                <span>{o.label}</span>
              </label>
            ))}
          </div>
        )}
      </Popover>
    </div>
  )
}
