import { endOfDay, format, fromDateKey } from '../../domain/zoned'
import { useMemo, useRef, useState } from 'react'
import { EmptyState, MemberLabel, ProjectChip, Spinner } from '../../components/bits'
import { FilterPicker } from '../../components/Pickers'
import { useToast } from '../../components/Toasts'
import { durationMs, formatHM } from '../../domain/time'
import { EMPTY_WORKSPACE, type DateRange, type TimeEntry } from '../../domain/types'
import { useI18n } from '../../i18n'
import { getTimeFormat } from '../../timeFormat'
import { useAllEntries, useEntries, useLookups } from '../data/hooks'
import { loadWriter, type ExportFormat } from '../export/formats'
import { buildReport, chartToPng } from '../export/report'
import { HoursBarChart, ProjectShareChart } from './Charts'
import { ExportMenu } from './ExportMenu'
import {
  allTimeRange,
  byMember,
  byProject,
  byTag,
  filterEntries,
  granularityFor,
  NO_PROJECT,
  NO_TAG,
  presetRange,
  RANGE_PRESETS,
  summarize,
  timeBuckets,
  type BreakdownRow,
  type RangePreset,
  type StatsFilters,
} from './stats'
import { pruneFilters, useStatsState } from './statsState'
import { HelpButton } from '../help/Term'

function BreakdownTable({ title, rows, note }: { title: string; rows: BreakdownRow[]; note?: string }) {
  const { t } = useI18n()
  return (
    <section className="card">
      <div className="card-head">
        <h2>{title}</h2>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>{t('exports.name')}</th>
              <th className="num">{t('stats.hours')}</th>
              <th className="num">{t('stats.share')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <td>
                  <span className="row" style={{ gap: 7 }}>
                    {r.color && <span className="dot" style={{ background: r.color }} />}
                    {r.label}
                  </span>
                </td>
                <td className="num">{formatHM(r.ms)}</td>
                <td className="num bar-cell">
                  <div className="row" style={{ justifyContent: 'flex-end' }}>
                    <span className="num">{Math.round(r.share * 100)} %</span>
                    <div className="share-bar" style={{ width: 60 }}>
                      <span style={{ width: `${r.share * 100}%`, background: r.color }} />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && <p className="small muted" style={{ padding: '4px 16px 14px' }}>{note}</p>}
    </section>
  )
}

type SortKey = 'date' | 'member' | 'project' | 'description' | 'duration'
const PAGE = 200

function DetailTable({ entries }: { entries: TimeEntry[] }) {
  const { t, locale } = useI18n()
  const { project, tag, member } = useLookups()
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'date', desc: true })
  const [limit, setLimit] = useState(PAGE)

  const sorted = useMemo(() => {
    const value = (e: TimeEntry): string | number => {
      switch (sort.key) {
        case 'date':
          return e.start
        case 'member':
          return e.login
        case 'project':
          return project(e.projectId)?.name ?? ''
        case 'description':
          return e.description.toLocaleLowerCase()
        case 'duration':
          return durationMs(e.start, e.end)
      }
    }
    return [...entries].sort((a, b) => {
      const va = value(a)
      const vb = value(b)
      const c = va < vb ? -1 : va > vb ? 1 : 0
      return sort.desc ? -c : c
    })
  }, [entries, sort, project])

  const header = (key: SortKey, label: string, num = false) => (
    <th className={num ? 'num' : undefined} aria-sort={sort.key === key ? (sort.desc ? 'descending' : 'ascending') : 'none'}>
      <button
        onClick={() =>
          // First click sorts descending, the next ascending.
          setSort((s) => ({ key, desc: s.key === key ? !s.desc : true }))
        }
      >
        {label}
        {sort.key === key ? (sort.desc ? ' ↓' : ' ↑') : ''}
      </button>
    </th>
  )

  return (
    <section className="card">
      <div className="card-head">
        <h2>{t('stats.details')}</h2>
        <span className="muted small">{entries.length}</span>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {header('date', t('stats.date'))}
              {header('member', t('stats.member'))}
              {header('project', t('stats.project'))}
              <th>{t('stats.tagsCol')}</th>
              {header('description', t('stats.description'))}
              {header('duration', t('stats.duration'), true)}
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, limit).map((e) => (
              <tr key={e.id}>
                <td className="num" style={{ whiteSpace: 'nowrap' }}>
                  {format(new Date(e.start), 'P p', { locale })}
                </td>
                <td>
                  <MemberLabel member={member(e.login)} />
                </td>
                <td>
                  <ProjectChip project={project(e.projectId)} />
                </td>
                <td>
                  <div className="row wrap" style={{ gap: 4 }}>
                    {e.tagIds.map((id) => tag(id)).filter((x) => x !== undefined).map((x) => (
                      <span key={x.id} className="chip">
                        {x.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className={e.description ? undefined : 'faint'}>
                  {e.description || t('common.noDescription')}
                </td>
                <td className="num">{formatHM(durationMs(e.start, e.end))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sorted.length > limit && (
        <div className="center" style={{ padding: 12 }}>
          <button className="btn btn-ghost" onClick={() => setLimit(Infinity)}>
            {t('common.all')} ({sorted.length})
          </button>
        </div>
      )}
    </section>
  )
}

export default function StatsPage() {
  const { t, locale } = useI18n()
  const toast = useToast()
  const lookups = useLookups()
  const ws = lookups.workspace ?? EMPTY_WORKSPACE
  const [state, setState] = useStatsState()
  const { preset, custom } = state
  const setPreset = (preset: RangePreset | 'custom') => setState((s) => ({ ...s, preset }))
  const setCustom = (custom: { from: string; to: string }) => setState((s) => ({ ...s, custom }))
  const setFilters = (filters: StatsFilters) => setState((s) => ({ ...s, filters }))
  const [exporting, setExporting] = useState<ExportFormat | null>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const shareRef = useRef<HTMLDivElement>(null)

  const allTime = preset === 'allTime'
  const datedRange: DateRange = useMemo(() => {
    if (preset === 'allTime') return presetRange('thisWeek') // unused: all time loads every entry
    if (preset !== 'custom') return presetRange(preset)
    const from = fromDateKey(custom.from)
    const toDay = fromDateKey(custom.to)
    const to = toDay && endOfDay(toDay)
    return !from || !to || to < from ? presetRange('thisMonth') : { from, to }
  }, [preset, custom])

  const datedQuery = useEntries(datedRange, { enabled: !allTime })
  const allQuery = useAllEntries({ enabled: allTime })
  const query = allTime ? allQuery : datedQuery
  const range = useMemo(
    () => (allTime ? allTimeRange(allQuery.data ?? []) : datedRange),
    [allTime, allQuery.data, datedRange],
  )
  const entries = useMemo(() => {
    if (!allTime) return datedQuery.data ?? []
    const to = range.to.getTime()
    return (allQuery.data ?? []).filter((e) => new Date(e.start).getTime() <= to)
  }, [allTime, datedQuery.data, allQuery.data, range])

  const memberOptions = lookups.members.map((m) => ({ id: m.login, label: m.login }))
  const projectOptions = [
    ...ws.projects.map((p) => ({ id: p.id, label: p.name, color: p.color })),
    { id: NO_PROJECT, label: t('common.noProject'), color: '#9ca3af' },
  ]
  const tagOptions = [
    ...ws.tags.map((x) => ({ id: x.id, label: x.name })),
    { id: NO_TAG, label: t('common.noTag') },
  ]

  // Remembered ids of deleted members, projects or tags are dropped once the workspace has loaded.
  const loaded = lookups.workspace !== undefined && lookups.members.length > 0
  const filters = useMemo(
    () =>
      loaded
        ? pruneFilters(state.filters, {
            members: lookups.members.map((m) => m.login),
            projects: [...ws.projects.map((p) => p.id), NO_PROJECT],
            tags: [...ws.tags.map((x) => x.id), NO_TAG],
          })
        : state.filters,
    [loaded, state.filters, lookups.members, ws],
  )

  const filtered = useMemo(() => filterEntries(entries, filters, ws), [entries, filters, ws])
  const summary = useMemo(() => summarize(filtered), [filtered])
  const projectRows = useMemo(() => byProject(filtered, ws, t('common.noProject')), [filtered, ws, t])
  const memberRows = useMemo(() => byMember(filtered), [filtered])
  const tagRows = useMemo(() => byTag(filtered, ws, t('common.noTag')), [filtered, ws, t])
  const granularity = granularityFor(range)
  const buckets = useMemo(() => timeBuckets(filtered, range, ws, granularity), [filtered, range, ws, granularity])

  const filtersText = () => {
    const part = (label: string, value: string[] | null, opts: { id: string; label: string }[]) =>
      `${label}: ${
        value === null
          ? t('exports.allData')
          : value.map((v) => opts.find((o) => o.id === v)?.label ?? v).join(', ') || t('common.none')
      }`
    return [
      part(t('stats.members'), filters.members, memberOptions),
      part(t('stats.projects'), filters.projects, projectOptions),
      part(t('stats.tags'), filters.tags, tagOptions),
    ].join(' · ')
  }

  const runExport = async (format: ExportFormat) => {
    setExporting(format)
    try {
      const charts =
        format === 'pdf'
          ? { bars: await chartToPng(barRef.current), share: await chartToPng(shareRef.current) }
          : {}
      const report = buildReport({
        entries: filtered,
        ws,
        range,
        filtersText: filtersText(),
        charts,
        t,
        locale,
        timeFormat: getTimeFormat(),
      })
      await (await loadWriter(format))(report)
    } catch (e) {
      console.error(e)
      toast.error(t('stats.exportFailed'))
    } finally {
      setExporting(null)
    }
  }

  return (
    <>
      <div className="page-head">
        <h1 data-tour="stats">{t('stats.title')}</h1>
        <span className="head-with-help" data-tour="export">
          <ExportMenu exporting={exporting} disabled={filtered.length === 0} onExport={runExport} />
          <HelpButton topic="export" />
        </span>
      </div>

      <section className="card filters">
        <label className="field">
          <span>{t('stats.range')}</span>
          <select
            id="stats-range"
            className="select"
            value={preset}
            onChange={(e) => setPreset(e.target.value as RangePreset | 'custom')}
          >
            {RANGE_PRESETS.map((p) => (
              <option key={p} value={p}>
                {t(`stats.presets.${p}`)}
              </option>
            ))}
            <option value="custom">{t('stats.presets.custom')}</option>
          </select>
        </label>
        {preset === 'custom' && (
          <>
            <label className="field">
              <span>{t('stats.from')}</span>
              <input
                className="input"
                type="date"
                value={custom.from}
                max={custom.to}
                onChange={(e) => setCustom({ ...custom, from: e.target.value })}
              />
            </label>
            <label className="field">
              <span>{t('stats.to')}</span>
              <input
                className="input"
                type="date"
                value={custom.to}
                min={custom.from}
                onChange={(e) => setCustom({ ...custom, to: e.target.value })}
              />
            </label>
          </>
        )}
        <FilterPicker
          label={t('stats.members')}
          options={memberOptions}
          value={filters.members}
          onChange={(members) => setFilters({ ...filters, members })}
        />
        <FilterPicker
          label={t('stats.projects')}
          options={projectOptions}
          value={filters.projects}
          onChange={(projects) => setFilters({ ...filters, projects })}
        />
        <FilterPicker
          label={t('stats.tags')}
          options={tagOptions}
          value={filters.tags}
          onChange={(tags) => setFilters({ ...filters, tags })}
        />
        <span className="spacer" />
        <span className="muted small" style={{ alignSelf: 'center' }}>
          {format(range.from, 'PP', { locale })} – {format(range.to, 'PP', { locale })}
        </span>
      </section>

      {query.isPending ? (
        <Spinner label={t('common.loading')} />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="chart"
            title={t('stats.empty')}
            hint={t('stats.emptyHint')}
            action={{
              label: t('stats.emptyAction'),
              onClick: () => document.getElementById('stats-range')?.focus(),
            }}
          />
        </div>
      ) : (
        <>
          <div className="kpis">
            <div className="card kpi">
              <span className="label">{t('stats.total')}</span>
              <div className="value">{formatHM(summary.totalMs)}</div>
            </div>
            <div className="card kpi">
              <span className="label">{t('stats.entryCount')}</span>
              <div className="value">{summary.count}</div>
            </div>
            <div className="card kpi">
              <span className="label">{t('stats.avgPerDay')}</span>
              <div className="value">{formatHM(summary.avgPerDayMs)}</div>
            </div>
          </div>

          <div className="chart-grid">
            <section className="card chart-card">
              <h2>{t('stats.chartHours')}</h2>
              <HoursBarChart ref={barRef} buckets={buckets} projects={projectRows} granularity={granularity} />
            </section>
            <section className="card chart-card">
              <h2>{t('stats.chartShare')}</h2>
              <ProjectShareChart ref={shareRef} projects={projectRows} />
            </section>
          </div>

          <div className="breakdowns">
            <BreakdownTable title={t('stats.byProject')} rows={projectRows} />
            <BreakdownTable title={t('stats.byMember')} rows={memberRows} />
            <BreakdownTable title={t('stats.byTag')} rows={tagRows} note={t('stats.tagNote')} />
          </div>

          <DetailTable entries={filtered} />
        </>
      )}
    </>
  )
}
