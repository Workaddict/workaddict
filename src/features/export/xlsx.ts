import { format } from 'date-fns'
import type { Worksheet } from 'exceljs'
import type { BreakdownRow } from '../stats/stats'
import { downloadBlob } from './download'
import { shortDateParts, type DatePart, type Report } from './report'

const HOUR = 3_600_000

/**
 * exceljs writes Date cells as UTC. Shift local wall-clock time into UTC so Excel shows
 * the same date and time the user sees in the app.
 */
function excelDate(d: Date): Date {
  return new Date(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()),
  )
}

/** Excel number format for the locale's short date: `dd.mm.yyyy`, `mm/dd/yyyy`. */
export function xlsxDateFormat(parts: DatePart[]): string {
  return parts
    .map((p) => {
      switch (p.kind) {
        case 'day':
          return p.long ? 'dd' : 'd'
        case 'month':
          return p.long ? 'mm' : 'm'
        case 'year':
          return 'yyyy'
        case 'text':
          // Escaped, so Excel keeps the character instead of swapping in its own separator.
          return [...p.text].map((c) => `\\${c}`).join('')
      }
    })
    .join('')
}

export function xlsxTimeFormat(f: Report['timeFormat']): string {
  return f === '12h' ? 'h:mm AM/PM' : 'hh:mm'
}

function styleHeader(ws: Worksheet) {
  const row = ws.getRow(1)
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } }
  ws.views = [{ state: 'frozen', ySplit: 1 }]
}

/** The workbook for a report (split from the download so tests can inspect it). */
export async function xlsxWorkbook(r: Report) {
  const mod = (await import('exceljs')) as typeof import('exceljs') & {
    default?: typeof import('exceljs')
  }
  const Excel = mod.default ?? mod
  const { t, locale } = r
  const dateFmt = xlsxDateFormat(shortDateParts(locale))
  const timeFmt = xlsxTimeFormat(r.timeFormat)
  const wb = new Excel.Workbook()
  wb.creator = 'Workaddict'
  wb.created = new Date()

  // Summary: a title row, then labels with their values; no header row (same layout as the .ods).
  const summary = wb.addWorksheet(t('exports.summary'))
  summary.columns = [
    { key: 'k', width: 30 },
    // Sized for the numbers and the date; the filter text runs on into the empty columns.
    { key: 'v', width: 20 },
  ]
  const title = summary.addRow([
    `${t('exports.reportTitle')} ${format(r.range.from, 'P', { locale })} – ${format(r.range.to, 'P', { locale })}`,
  ])
  title.font = { bold: true, size: 12 }
  summary.addRow([t('exports.filtersLabel'), r.filtersText])
  summary.addRow([`${t('stats.total')} (${t('exports.hours')})`, r.summary.totalMs / HOUR]).getCell(2).numFmt = '0.00'
  summary.addRow([t('stats.entryCount'), r.summary.count])
  summary.addRow([`${t('stats.avgPerDay')} (${t('exports.hours')})`, r.summary.avgPerDayMs / HOUR]).getCell(2).numFmt = '0.00'
  summary.addRow([t('exports.generated', { date: '' }).trim(), excelDate(new Date())]).getCell(2).numFmt =
    `${dateFmt} ${timeFmt}`
  summary.getColumn(2).alignment = { horizontal: 'left' }

  // Entries
  const entries = wb.addWorksheet(t('exports.entries'))
  entries.columns = [
    { header: t('stats.date'), key: 'date', width: 12, style: { numFmt: dateFmt } },
    { header: t('exports.start'), key: 'start', width: 9, style: { numFmt: timeFmt } },
    { header: t('exports.end'), key: 'end', width: 9, style: { numFmt: timeFmt } },
    { header: t('stats.member'), key: 'member', width: 16 },
    { header: t('stats.project'), key: 'project', width: 22 },
    { header: t('stats.tagsCol'), key: 'tags', width: 22 },
    { header: t('stats.description'), key: 'description', width: 48 },
    { header: t('exports.hours'), key: 'hours', width: 9, style: { numFmt: '0.00' } },
  ]
  for (const e of r.entries) {
    entries.addRow({
      date: excelDate(e.start),
      start: excelDate(e.start),
      end: excelDate(e.end),
      member: e.member,
      project: e.project,
      tags: e.tags,
      description: e.description,
      // Unrounded, so the column sums exactly to the total.
      hours: e.ms / HOUR,
    })
  }
  entries.autoFilter = { from: 'A1', to: 'H1' }
  styleHeader(entries)

  const breakdownSheet = (name: string, rows: BreakdownRow[]) => {
    const ws = wb.addWorksheet(name)
    ws.columns = [
      { header: t('exports.name'), key: 'name', width: 28 },
      { header: t('exports.hours'), key: 'hours', width: 10, style: { numFmt: '0.00' } },
      { header: t('exports.percent'), key: 'share', width: 10, style: { numFmt: '0.0%' } },
    ]
    for (const row of rows) ws.addRow({ name: row.label, hours: row.ms / HOUR, share: row.share })
    styleHeader(ws)
  }
  breakdownSheet(t('stats.byProject'), r.projects)
  breakdownSheet(t('stats.byMember'), r.members)
  return wb
}

export async function exportXlsx(r: Report) {
  const buffer = await (await xlsxWorkbook(r)).xlsx.writeBuffer()
  downloadBlob(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `time-report_${format(r.range.from, 'yyyy-MM-dd')}_${format(r.range.to, 'yyyy-MM-dd')}.xlsx`,
  )
}
