import { format, isToday, isYesterday, startOfDay } from 'date-fns'
import { useMemo, useState } from 'react'
import { MemberLabel, ProjectChip } from '../../components/bits'
import { Icon } from '../../components/Icon'
import { useConfirm } from '../../components/Modal'
import { useToast } from '../../components/Toasts'
import { durationMs, formatHM } from '../../domain/time'
import type { TimeEntry } from '../../domain/types'
import { useI18n } from '../../i18n'
import { useSessionData } from '../auth/AuthContext'
import { useDeleteEntry, useLookups } from '../data/hooks'
import { useErrorToast } from '../data/useErrorText'
import { EntryEditModal } from './EntryEditModal'
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

function EntryRow({
  entry,
  showMember,
  onEdit,
}: {
  entry: TimeEntry
  showMember: boolean
  onEdit: (e: TimeEntry) => void
}) {
  const { t, locale } = useI18n()
  const { user, adapter } = useSessionData()
  const { project, tag, member } = useLookups()
  const confirm = useConfirm()
  const toast = useToast()
  const onError = useErrorToast()
  const del = useDeleteEntry({ onSuccess: () => toast.info(t('entries.deleted')), onError })
  const { startTimer, busy } = useTimerActions()
  const own = entry.login === user.login
  const tags = entry.tagIds.map(tag).filter((x) => x !== undefined)
  const time = (iso: string) => format(new Date(iso), 'p', { locale })

  return (
    <div className="entry">
      <div className={`entry-desc${entry.description ? '' : ' empty'}`}>
        {entry.description || t('common.noDescription')}
      </div>
      <div className="entry-side">
        <span className="entry-time">
          {time(entry.start)} – {time(entry.end)}
        </span>
        <span className="entry-duration">{formatHM(durationMs(entry.start, entry.end))}</span>
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
          {own && (
            <>
              <button
                className="btn btn-icon"
                title={t('common.edit')}
                aria-label={t('common.edit')}
                disabled={adapter.readOnly}
                onClick={() => onEdit(entry)}
              >
                <Icon name="edit" size={16} />
              </button>
              <button
                className="btn btn-icon"
                title={t('common.delete')}
                aria-label={t('common.delete')}
                disabled={adapter.readOnly}
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
        <ProjectChip project={project(entry.projectId)} />
        {tags.map((x) => (
          <span key={x.id} className="chip">
            {x.name}
          </span>
        ))}
        {showMember && <MemberLabel member={member(entry.login)} />}
      </div>
    </div>
  )
}

export function EntryList({ entries, showMember }: { entries: TimeEntry[]; showMember: boolean }) {
  const { t, locale } = useI18n()
  const [editing, setEditing] = useState<TimeEntry | null>(null)
  const groups = useMemo(() => groupByDay(entries), [entries])

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
            <EntryRow key={e.id} entry={e} showMember={showMember} onEdit={setEditing} />
          ))}
        </section>
      ))}
      {editing && <EntryEditModal entry={editing} onClose={() => setEditing(null)} />}
    </>
  )
}
