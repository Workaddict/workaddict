import type { TFunction } from 'i18next'
import type { Locale } from 'date-fns'
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

/** Everything the PDF and Excel exports need, already filtered and localized. */
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
