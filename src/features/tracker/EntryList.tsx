import { format, isToday, isYesterday, startOfDay } from 'date-fns'
import { useCallback, useMemo, useState } from 'react'
import { MemberLabel, ProjectChip } from '../../components/bits'
import { Icon } from '../../components/Icon'
import { useConfirm } from '../../components/Modal'
import { useToast } from '../../components/Toasts'
import { applyInlineTime, durationMs, formatHM, type InlineTimeField } from '../../domain/time'
import type { TimeEntry } from '../../domain/types'
import { useI18n } from '../../i18n'
import { useSessionData } from '../auth/AuthContext'
import { useAccess, useDeleteEntry, useLookups, useSaveEntry } from '../data/hooks'
import { useErrorText, useErrorToast } from '../data/useErrorText'
import { EntryEditModal } from './EntryEditModal'
import { useCreateTag } from './EntryFields'
import { InlineEdit, InlineProject, InlineTags } from './InlineFields'
import { useTimerActions } from './useTimerActions'

interface DayGroup {
  day: Date
  entries: TimeEntry[]
  totalMs: number
}

export function groupByDay(entries: TimeEntry[]): DayGroup[] {
  const groups = new Map<number, DayGroup>()
  for (const e of entries) {
    const day = startOfDay(new Date(e.start))
    const g = groups.get(day.getTime()) ?? { day, entries: [], totalMs: 0 }
    g.entries.push(e)
    g.totalMs += durationMs(e.start, e.end)
    groups.set(day.getTime(), g)
  }
  return [...groups.values()]
    .sort((a, b) => b.day.getTime() - a.day.getTime())
    .map((g) => ({ ...g, entries: g.entries.sort((a, b) => b.start.localeCompare(a.start)) }))
}

type InlineField = 'description' | InlineTimeField

/** The one field being edited inline in the whole list. */
interface Editing {
  entryId: string
  field: InlineField
}

function EntryRow({
  entry,
  showMember,
  onEdit,
  editing,
  setEditing,
}: {
  entry: TimeEntry
  showMember: boolean
  onEdit: (e: TimeEntry) => void
  editing: InlineField | null
  setEditing: (field: InlineField, active: boolean) => void
}) {
  const { t, time } = useI18n()
  const { user, adapter } = useSessionData()
  const { project, tag, member, workspace } = useLookups()
  const confirm = useConfirm()
  const toast = useToast()
  const onError = useErrorToast()
  const errorText = useErrorText()
  const del = useDeleteEntry({ onSuccess: () => toast.info(t('entries.deleted')), onError })
  const save = useSaveEntry()
  const onCreateTag = useCreateTag()
  const { startTimer, busy } = useTimerActions()
  const access = useAccess()
  const editable =
    !adapter.readOnly && (entry.login === user.login || access.can('editOthersEntries'))
  const tags = entry.tagIds.map(tag).filter((x) => x !== undefined)

  /** Saves a change; resolves to an error message for the field, or null on success. */
  const saveFields = async (patch: Partial<TimeEntry>): Promise<string | null> => {
    try {
      await save.mutateAsync({ entry: { ...entry, ...patch }, previousStart: entry.start })
      return null
    } catch (e) {
      onError(e)
      return errorText(e)
    }
  }

  const saveTime = (field: InlineTimeField) => (value: string) => {
    const r = applyInlineTime(new Date(entry.start), new Date(entry.end), field, value)
    if (!r.ok) return Promise.resolve(t(`manual.errors.${r.error}`))
    return saveFields({ start: r.start.toISOString(), end: r.end.toISOString() })
  }

  const field = (name: InlineField) => ({
    editable,
    editing: editing === name,
    onStart: () => setEditing(name, true),
    onDone: () => setEditing(name, false),
  })

  return (
    <div className="entry">
      <InlineEdit
        {...field('description')}
        className={`entry-desc${entry.description ? '' : ' empty'}`}
        display={entry.description || t('common.noDescription')}
        initial={entry.description}
        label={t('entries.editDescription')}
        placeholder={t('timer.placeholder')}
        onCommit={(v) => saveFields({ description: v.trim() })}
      />
      <div className="entry-side">
        <span className="entry-time">
          <InlineEdit
            {...field('start')}
            type="time"
            display={time(entry.start)}
            initial={time(entry.start)}
            label={t('entries.editStart')}
            onCommit={saveTime('start')}
          />
          {' – '}
          <InlineEdit
            {...field('end')}
            type="time"
            display={time(entry.end)}
            initial={time(entry.end)}
            label={t('entries.editEnd')}
            onCommit={saveTime('end')}
          />
        </span>
        <InlineEdit
          {...field('duration')}
          className="entry-duration"
          inputMode="decimal"
          display={formatHM(durationMs(entry.start, entry.end))}
          initial={formatHM(durationMs(entry.start, entry.end))}
          label={t('entries.editDuration')}
          onCommit={saveTime('duration')}
        />
        <div className="entry-actions">
          <button
            className="btn btn-icon"
            title={t('entries.continue')}
            aria-label={t('entries.continue')}
            disabled={busy || adapter.readOnly}
            onClick={() =>
              startTimer({
                description: entry.description,
                projectId: entry.projectId,
                tagIds: entry.tagIds,
              })
            }
          >
            <Icon name="play" size={16} />
          </button>
          {editable && (
            <>
              <button
                className="btn btn-icon"
                title={t('common.edit')}
                aria-label={t('common.edit')}
                onClick={() => onEdit(entry)}
              >
                <Icon name="edit" size={16} />
              </button>
              <button
                className="btn btn-icon"
                title={t('common.delete')}
                aria-label={t('common.delete')}
                onClick={async () => {
                  if (await confirm({ message: t('entries.deleteConfirm') })) {
                    del.mutate(entry)
                  }
                }}
              >
                <Icon name="trash" size={16} />
              </button>
            </>
          )}
        </div>
      </div>
      <div className="entry-meta">
        {editable ? (
          <>
            <InlineProject
              projects={workspace?.projects ?? []}
              value={entry.projectId}
              onSave={(projectId) => void saveFields({ projectId })}
            />
            <InlineTags
              tags={workspace?.tags ?? []}
              value={entry.tagIds}
              onCreate={onCreateTag}
              onSave={(tagIds) => void saveFields({ tagIds })}
            />
          </>
        ) : (
          <>
            <ProjectChip project={project(entry.projectId)} />
            {tags.map((x) => (
              <span key={x.id} className="chip">
                {x.name}
              </span>
            ))}
          </>
        )}
        {showMember && <MemberLabel member={member(entry.login)} />}
      </div>
    </div>
  )
}

export function EntryList({ entries, showMember }: { entries: TimeEntry[]; showMember: boolean }) {
  const { t, locale } = useI18n()
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const [inline, setInline] = useState<Editing | null>(null)
  const groups = useMemo(() => groupByDay(entries), [entries])

  // Leaving a field only clears the state if no other field was opened meanwhile.
  const setInlineFor = useCallback(
    (entryId: string) => (field: InlineField, active: boolean) =>
      setInline((cur) =>
        active ? { entryId, field } : cur?.entryId === entryId && cur.field === field ? null : cur,
      ),
    [],
  )

  const dayLabel = (d: Date) =>
    isToday(d)
      ? t('entries.today')
      : isYesterday(d)
        ? t('entries.yesterday')
        : format(d, 'EEEE, PP', { locale })

  return (
    <>
      {groups.map((g) => (
        <section key={g.day.getTime()} className="card day-group">
          <div className="day-head">
            <span>{dayLabel(g.day)}</span>
            <span className="num">
              {t('entries.total')}: {formatHM(g.totalMs)}
            </span>
          </div>
          {g.entries.map((e) => (
            <EntryRow
              key={e.id}
              entry={e}
              showMember={showMember}
              onEdit={setEditingEntry}
              editing={inline?.entryId === e.id ? inline.field : null}
              setEditing={setInlineFor(e.id)}
            />
          ))}
        </section>
      ))}
      {editingEntry && (
        <EntryEditModal entry={editingEntry} onClose={() => setEditingEntry(null)} />
      )}
    </>
  )
}
