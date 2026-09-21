import { format } from 'date-fns'
import type { Worksheet } from 'exceljs'
import type { BreakdownRow } from '../stats/stats'
import { downloadBlob } from './download'
import type { Report } from './report'

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

function styleHeader(ws: Worksheet) {
  const row = ws.getRow(1)
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } }
  ws.views = [{ state: 'frozen', ySplit: 1 }]
}

export async function exportXlsx(r: Report) {
  const mod = (await import('exceljs')) as typeof import('exceljs') & {
    default?: typeof import('exceljs')
  }
  const Excel = mod.default ?? mod
  const { t, locale } = r
  const wb = new Excel.Workbook()
  wb.creator = 'Workaddict'
  wb.created = new Date()

  // Summary
  const summary = wb.addWorksheet(t('exports.summary'))
  summary.columns = [
    { header: t('exports.name'), key: 'k', width: 26 },
    { header: t('exports.value'), key: 'v', width: 60 },
  ]
  summary.addRows([
    { k: t('exports.reportTitle'), v: `${format(r.range.from, 'P', { locale })} – ${format(r.range.to, 'P', { locale })}` },
    { k: t('exports.filtersLabel'), v: r.filtersText },
    { k: `${t('stats.total')} (${t('exports.hours')})`, v: r.summary.totalMs / HOUR },
    { k: t('stats.entryCount'), v: r.summary.count },
    { k: `${t('stats.avgPerDay')} (${t('exports.hours')})`, v: r.summary.avgPerDayMs / HOUR },
    { k: t('exports.generated', { date: '' }).trim(), v: excelDate(new Date()) },
  ])
  summary.getCell('B4').numFmt = '0.00'
  summary.getCell('B6').numFmt = '0.00'
  summary.getCell('B7').numFmt = 'yyyy-mm-dd hh:mm'
  summary.getColumn('v').alignment = { horizontal: 'left', wrapText: true }
  styleHeader(summary)

  // Entries
  const entries = wb.addWorksheet(t('exports.entries'))
  entries.columns = [
    { header: t('stats.date'), key: 'date', width: 12, style: { numFmt: 'yyyy-mm-dd' } },
    { header: t('exports.start'), key: 'start', width: 8, style: { numFmt: 'hh:mm' } },
    { header: t('exports.end'), key: 'end', width: 8, style: { numFmt: 'hh:mm' } },
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

  const buffer = await wb.xlsx.writeBuffer()
  downloadBlob(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `time-report_${format(r.range.from, 'yyyy-MM-dd')}_${format(r.range.to, 'yyyy-MM-dd')}.xlsx`,
  )
}
