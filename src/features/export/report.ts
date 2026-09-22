import type { TFunction } from 'i18next'
import { format, type Locale } from 'date-fns'
import type { DateRange, TimeEntry, Workspace } from '../../domain/types'
import { durationMs } from '../../domain/time'
import {
  byMember,
  byProject,
  byTag,
  projectKey,
  summarize,
  type BreakdownRow,
  type Summary,
} from '../stats/stats'

export interface ReportEntry {
  start: Date
  end: Date
  member: string
  project: string
  tags: string
  description: string
  ms: number
}

/** Everything the exports need, already filtered and localized. */
export interface Report {
  range: DateRange
  filtersText: string
  summary: Summary
  projects: BreakdownRow[]
  members: BreakdownRow[]
  tags: BreakdownRow[]
  entries: ReportEntry[]
  charts: { bars?: string; share?: string }
  t: TFunction
  locale: Locale
}

export function buildReport(args: {
  entries: TimeEntry[]
  ws: Workspace
  range: DateRange
  filtersText: string
  charts: Report['charts']
  t: TFunction
  locale: Locale
}): Report {
  const { entries, ws, t } = args
  const projects = new Map(ws.projects.map((p) => [p.id, p]))
  const ids = new Set(projects.keys())
  const tags = new Map(ws.tags.map((x) => [x.id, x]))
  return {
    range: args.range,
    filtersText: args.filtersText,
    summary: summarize(entries),
    projects: byProject(entries, ws, t('common.noProject')),
    members: byMember(entries),
    tags: byTag(entries, ws, t('common.noTag')),
    entries: [...entries]
      .sort((a, b) => a.start.localeCompare(b.start))
      .map((e) => ({
        start: new Date(e.start),
        end: new Date(e.end),
        member: e.login,
        project: projects.get(projectKey(e, ids))?.name ?? t('common.noProject'),
        tags: e.tagIds
          .map((id) => tags.get(id)?.name)
          .filter(Boolean)
          .join(', '),
        description: e.description,
        ms: durationMs(e.start, e.end),
      })),
    charts: args.charts,
    t,
    locale: args.locale,
  }
}

/** Renders a chart's SVG (inside `container`) to a PNG data URL on a white background. */
export async function chartToPng(container: HTMLElement | null, scale = 2): Promise<string | undefined> {
  const svg = container?.querySelector('svg.recharts-surface') as SVGSVGElement | null
  if (!svg) return undefined
  const { width, height } = svg.getBoundingClientRect()
  if (!width || !height) return undefined
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))
  const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('chart render failed'))
      img.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = width * scale
    canvas.height = height * scale
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.scale(scale, scale)
    ctx.drawImage(img, 0, 0, width, height)
    return canvas.toDataURL('image/png')
  } finally {
    URL.revokeObjectURL(url)
  }
}

// ---- tabular model (ODS, CSV) -----------------------------------------------

const HOUR = 3_600_000

export type CellKind = 'text' | 'number' | 'hours' | 'percent' | 'date' | 'time' | 'datetime'
/** A cell takes its column's kind unless it carries its own. */
export type Cell = string | number | Date | { value: number | Date; kind: CellKind }

export interface SheetColumn {
  header: string
  kind: CellKind
  /** Approximate width in characters. */
  width: number
}

export interface Sheet {
  name: string
  columns: SheetColumn[]
  rows: Cell[][]
}

export function cellValue(c: Cell): string | number | Date {
  return typeof c === 'object' && !(c instanceof Date) ? c.value : c
}

export function cellKind(c: Cell, column: SheetColumn): CellKind {
  return typeof c === 'object' && !(c instanceof Date) ? c.kind : column.kind
}

/** The report as sheets, in the same layout as the Excel export. Entries come second. */
export function reportSheets(r: Report): Sheet[] {
  const { t, locale } = r
  const breakdown = (name: string, rows: BreakdownRow[]): Sheet => ({
    name,
    columns: [
      { header: t('exports.name'), kind: 'text', width: 28 },
      { header: t('exports.hours'), kind: 'hours', width: 10 },
      { header: t('exports.percent'), kind: 'percent', width: 10 },
    ],
    rows: rows.map((row) => [row.label, row.ms / HOUR, row.share]),
  })
  return [
    {
      name: t('exports.summary'),
      columns: [
        { header: t('exports.name'), kind: 'text', width: 26 },
        { header: t('exports.value'), kind: 'text', width: 60 },
      ],
      rows: [
        [t('exports.reportTitle'), `${format(r.range.from, 'P', { locale })} – ${format(r.range.to, 'P', { locale })}`],
        [t('exports.filtersLabel'), r.filtersText],
        [`${t('stats.total')} (${t('exports.hours')})`, { value: r.summary.totalMs / HOUR, kind: 'hours' }],
        [t('stats.entryCount'), { value: r.summary.count, kind: 'number' }],
        [`${t('stats.avgPerDay')} (${t('exports.hours')})`, { value: r.summary.avgPerDayMs / HOUR, kind: 'hours' }],
        [t('exports.generated', { date: '' }).trim(), { value: new Date(), kind: 'datetime' }],
      ],
    },
    {
      name: t('exports.entries'),
      columns: [
        { header: t('stats.date'), kind: 'date', width: 12 },
        { header: t('exports.start'), kind: 'time', width: 8 },
        { header: t('exports.end'), kind: 'time', width: 8 },
        { header: t('stats.member'), kind: 'text', width: 16 },
        { header: t('stats.project'), kind: 'text', width: 22 },
        { header: t('stats.tagsCol'), kind: 'text', width: 22 },
        { header: t('stats.description'), kind: 'text', width: 48 },
        { header: t('exports.hours'), kind: 'hours', width: 9 },
      ],
      // Unrounded hours, so the column sums exactly to the total.
      rows: r.entries.map((e) => [e.start, e.start, e.end, e.member, e.project, e.tags, e.description, e.ms / HOUR]),
    },
    breakdown(t('stats.byProject'), r.projects),
    breakdown(t('stats.byMember'), r.members),
  ]
}

/** `time-report_2026-09-01_2026-09-30.<ext>` */
export function reportFileName(r: Report, ext: string): string {
  return `time-report_${format(r.range.from, 'yyyy-MM-dd')}_${format(r.range.to, 'yyyy-MM-dd')}.${ext}`
}
