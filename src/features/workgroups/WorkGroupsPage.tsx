import { useMemo, useState, type FormEvent } from 'react'
import { EmptyState, Spinner } from '../../components/bits'
import { Icon } from '../../components/Icon'
import { useConfirm } from '../../components/Modal'
import { isNameTaken } from '../../domain/ids'
import { durationMs, formatHM } from '../../domain/time'
import { PROJECT_COLORS, type Project, type Tag, type TimeEntry } from '../../domain/types'
import { useI18n } from '../../i18n'
import { useSessionData } from '../auth/AuthContext'
import { useAllEntries, useWorkspace } from '../data/hooks'
import { useErrorToast } from '../data/useErrorText'
import { nextProjectColor, useWorkspaceActions } from '../data/workspaceActions'

interface Usage {
  ms: number
  count: number
}

function usageBy(entries: TimeEntry[], keys: (e: TimeEntry) => string[]): Map<string, Usage> {
  const m = new Map<string, Usage>()
  for (const e of entries) {
    for (const k of keys(e)) {
      const u = m.get(k) ?? { ms: 0, count: 0 }
      u.ms += durationMs(e.start, e.end)
      u.count++
      m.set(k, u)
    }
  }
  return m
}

function Palette({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const { t } = useI18n()
  return (
    <div className="palette" role="group" aria-label={t('workGroups.color')}>
      {PROJECT_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          className="swatch"
          style={{ background: c }}
          aria-pressed={c === value}
          aria-label={c}
          onClick={() => onChange(c)}
        />
      ))}
    </div>
  )
}

/** Name input with uniqueness validation, used for create and rename. */
function NameForm({
  items,
  initial = '',
  exceptId,
  placeholder,
  color,
  onColor,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  items: { id: string; name: string }[]
  initial?: string
  exceptId?: string
  placeholder: string
  color?: string
  onColor?: (c: string) => void
  submitLabel: string
  onSubmit: (name: string) => Promise<unknown>
  onCancel?: () => void
}) {
  const { t } = useI18n()
  const onError = useErrorToast()
  const [name, setName] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError(t('workGroups.nameRequired'))
    if (isNameTaken(items, name, exceptId)) return setError(t('workGroups.nameTaken'))
    setBusy(true)
    try {
      await onSubmit(name.trim())
      setName('')
      setError(null)
    } catch (err) {
      onError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="stack" style={{ gap: 8, padding: '12px 16px' }} onSubmit={submit}>
      <div className="row">
        {color && <span className="dot" style={{ background: color, width: 12, height: 12 }} />}
        <input
          className="input"
          placeholder={placeholder}
          aria-label={placeholder}
          value={name}
          aria-invalid={!!error}
          autoFocus={!!onCancel}
          onChange={(e) => {
            setName(e.target.value)
            setError(null)
          }}
        />
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel}>
            {t('common.cancel')}
          </button>
        )}
        <button className="btn btn-primary" disabled={busy}>
          {submitLabel}
        </button>
      </div>
      {color && onColor && <Palette value={color} onChange={onColor} />}
      {error && <span className="form-error">{error}</span>}
    </form>
  )
}

function ProjectRow({ project, usage, items }: { project: Project; usage?: Usage; items: Project[] }) {
  const { t } = useI18n()
  const { adapter } = useSessionData()
  const confirm = useConfirm()
  const onError = useErrorToast()
  const { updateProject, deleteProject } = useWorkspaceActions()
  const [editing, setEditing] = useState(false)
  const [color, setColor] = useState(project.color)

  if (editing) {
    return (
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <NameForm
          items={items}
          initial={project.name}
          exceptId={project.id}
          placeholder={t('workGroups.newProject')}
          color={color}
          onColor={setColor}
          submitLabel={t('common.save')}
          onCancel={() => setEditing(false)}
          onSubmit={async (name) => {
            await updateProject(project.id, { name, color }, `update project "${name}"`)
            setEditing(false)
          }}
        />
      </div>
    )
  }

  return (
    <div className={`wg-row${project.archived ? ' archived' : ''}`}>
      <span className="dot" style={{ background: project.color, width: 12, height: 12 }} />
      <span className="name">
        {project.name}
        {project.archived && <span className="faint small"> · {t('common.archived')}</span>}
      </span>
      <span className="num muted small" title={t('workGroups.totalHours')}>
        {formatHM(usage?.ms ?? 0)}
      </span>
      <RowActions
        archived={project.archived}
        disabled={adapter.readOnly}
        onEdit={() => {
          setColor(project.color)
          setEditing(true)
        }}
        onArchive={() =>
          updateProject(
            project.id,
            { archived: !project.archived },
            `${project.archived ? 'restore' : 'archive'} project "${project.name}"`,
          ).catch(onError)
        }
        onDelete={async () => {
          const ok = await confirm({
            message: t('workGroups.deleteProjectConfirm', { name: project.name, count: usage?.count ?? 0 }),
          })
          if (ok) deleteProject(project).catch(onError)
        }}
      />
    </div>
  )
}

function TagRow({ tag, usage, items }: { tag: Tag; usage?: Usage; items: Tag[] }) {
  const { t } = useI18n()
  const { adapter } = useSessionData()
  const confirm = useConfirm()
  const onError = useErrorToast()
  const { updateTag, deleteTag } = useWorkspaceActions()
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <NameForm
          items={items}
          initial={tag.name}
          exceptId={tag.id}
          placeholder={t('workGroups.newTag')}
          submitLabel={t('common.save')}
          onCancel={() => setEditing(false)}
          onSubmit={async (name) => {
            await updateTag(tag.id, { name }, `rename tag "${tag.name}" to "${name}"`)
            setEditing(false)
          }}
        />
      </div>
    )
  }

  return (
    <div className={`wg-row${tag.archived ? ' archived' : ''}`}>
      <Icon name="tag" size={15} />
      <span className="name">
        {tag.name}
        {tag.archived && <span className="faint small"> · {t('common.archived')}</span>}
      </span>
      <span className="num muted small" title={t('workGroups.totalHours')}>
        {formatHM(usage?.ms ?? 0)}
      </span>
      <RowActions
        archived={tag.archived}
        disabled={adapter.readOnly}
        onEdit={() => setEditing(true)}
        onArchive={() =>
          updateTag(
            tag.id,
            { archived: !tag.archived },
            `${tag.archived ? 'restore' : 'archive'} tag "${tag.name}"`,
          ).catch(onError)
        }
        onDelete={async () => {
          const ok = await confirm({
            message: t('workGroups.deleteTagConfirm', { name: tag.name, count: usage?.count ?? 0 }),
          })
          if (ok) deleteTag(tag).catch(onError)
        }}
      />
    </div>
  )
}

function RowActions(props: {
  archived: boolean
  disabled: boolean
  onEdit: () => void
  onArchive: () => void
  onDelete: () => void
}) {
  const { t } = useI18n()
  const archiveLabel = props.archived ? t('workGroups.unarchive') : t('workGroups.archive')
  return (
    <div className="entry-actions">
      <button className="btn btn-icon" title={t('common.edit')} aria-label={t('common.edit')} disabled={props.disabled} onClick={props.onEdit}>
        <Icon name="edit" size={16} />
      </button>
      <button className="btn btn-icon" title={archiveLabel} aria-label={archiveLabel} disabled={props.disabled} onClick={props.onArchive}>
        <Icon name={props.archived ? 'restore' : 'archive'} size={16} />
      </button>
      <button className="btn btn-icon" title={t('common.delete')} aria-label={t('common.delete')} disabled={props.disabled} onClick={props.onDelete}>
        <Icon name="trash" size={16} />
      </button>
    </div>
  )
}

export default function WorkGroupsPage() {
  const { t } = useI18n()
  const { adapter } = useSessionData()
  const ws = useWorkspace()
  const entries = useAllEntries()
  const { createProject, createTag } = useWorkspaceActions()
  const [showArchived, setShowArchived] = useState(false)
  const [newColor, setNewColor] = useState<string | null>(null)

  const projectUsage = useMemo(
    () => usageBy(entries.data ?? [], (e) => (e.projectId ? [e.projectId] : [])),
    [entries.data],
  )
  const tagUsage = useMemo(() => usageBy(entries.data ?? [], (e) => e.tagIds), [entries.data])

  if (ws.isPending) return <Spinner label={t('common.loading')} />
  const projects = ws.data?.projects ?? []
  const tags = ws.data?.tags ?? []
  const visibleProjects = projects
    .filter((p) => showArchived || !p.archived)
    .sort((a, b) => a.name.localeCompare(b.name))
  const visibleTags = tags
    .filter((x) => showArchived || !x.archived)
    .sort((a, b) => a.name.localeCompare(b.name))
  const color = newColor ?? nextProjectColor(ws.data)

  return (
    <>
      <div className="page-head">
        <h1>{t('workGroups.title')}</h1>
        <label className="checkbox small">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          {t('workGroups.showArchived')}
        </label>
      </div>

      <div className="wg-grid">
        <section className="card">
          <div className="card-head">
            <h2>{t('workGroups.projects')}</h2>
          </div>
          {!adapter.readOnly && (
            <NameForm
              items={projects}
              placeholder={t('workGroups.newProject')}
              color={color}
              onColor={setNewColor}
              submitLabel={t('common.add')}
              onSubmit={async (name) => {
                await createProject(name, color)
                setNewColor(null)
              }}
            />
          )}
          {visibleProjects.length === 0 ? (
            <EmptyState icon="folder" title={t('workGroups.projects')} hint={t('workGroups.emptyProjects')} />
          ) : (
            visibleProjects.map((p) => (
              <ProjectRow key={p.id} project={p} usage={projectUsage.get(p.id)} items={projects} />
            ))
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <h2>{t('workGroups.tags')}</h2>
          </div>
          {!adapter.readOnly && (
            <NameForm
              items={tags}
              placeholder={t('workGroups.newTag')}
              submitLabel={t('common.add')}
              onSubmit={(name) => createTag(name)}
            />
          )}
          {visibleTags.length === 0 ? (
            <EmptyState icon="tag" title={t('workGroups.tags')} hint={t('workGroups.emptyTags')} />
          ) : (
            visibleTags.map((x) => (
              <TagRow key={x.id} tag={x} usage={tagUsage.get(x.id)} items={tags} />
            ))
          )}
        </section>
      </div>
    </>
  )
}
