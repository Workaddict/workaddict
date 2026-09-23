import { format } from 'date-fns'
import { jsPDF } from 'jspdf'
import { autoTable, type RowInput } from 'jspdf-autotable'
import { formatHM, formatTime } from '../../domain/time'
import { getTimeFormat } from '../../timeFormat'
import type { BreakdownRow } from '../stats/stats'
import type { Report } from './report'

const PAGE_W = 210
const PAGE_H = 297
const M = 14
const ACCENT: [number, number, number] = [79, 70, 229]

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function finalY(doc: jsPDF): number {
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
}

export async function exportPdf(r: Report) {
  const { t, locale } = r
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const fmtDate = (d: Date) => format(d, 'P', { locale })
  const fmtTime = (d: Date) => formatTime(d, getTimeFormat())
  let y = 20

  // Header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(t('exports.reportTitle'), M, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(90)
  y += 7
  doc.text(`${t('exports.rangeLabel')}: ${fmtDate(r.range.from)} – ${fmtDate(r.range.to)}`, M, y)
  y += 5
  const filterLines = doc.splitTextToSize(
    `${t('exports.filtersLabel')}: ${r.filtersText}`,
    PAGE_W - 2 * M,
  )
  doc.text(filterLines, M, y)
  y += filterLines.length * 5
  doc.text(
    t('exports.generated', {
      date: `${format(new Date(), 'PP', { locale })}, ${fmtTime(new Date())}`,
    }),
    M,
    y,
  )
  y += 9

  // Summary
  doc.setTextColor(20)
  doc.setFontSize(11)
  const kpis = [
    [t('stats.total'), formatHM(r.summary.totalMs)],
    [t('stats.entryCount'), String(r.summary.count)],
    [t('stats.avgPerDay'), formatHM(r.summary.avgPerDayMs)],
  ]
  const colW = (PAGE_W - 2 * M) / kpis.length
  kpis.forEach(([label, value], i) => {
    doc.setFontSize(9)
    doc.setTextColor(110)
    doc.text(label!, M + i * colW, y)
    doc.setFontSize(16)
    doc.setTextColor(20)
    doc.setFont('helvetica', 'bold')
    doc.text(value!, M + i * colW, y + 7)
    doc.setFont('helvetica', 'normal')
  })
  y += 14

  // Bar chart across the full width
  if (r.charts.bars) {
    const props = doc.getImageProperties(r.charts.bars)
    const w = PAGE_W - 2 * M
    const h = (props.height / props.width) * w
    doc.addImage(r.charts.bars, 'PNG', M, y, w, h, undefined, 'FAST')
    y += h + 6
  }

  const breakdownTable = (title: string, rows: BreakdownRow[], startY: number, left: number) => {
    const body: RowInput[] = rows.map((row) => [
      row.label,
      formatHM(row.ms),
      `${Math.round(row.share * 100)} %`,
    ])
    autoTable(doc, {
      startY,
      margin: { left, right: M },
      head: [[title, t('exports.hours'), t('exports.percent')]],
      body,
      styles: { fontSize: 9, cellPadding: 1.8 },
      headStyles: { fillColor: ACCENT },
      columnStyles: {
        0: {
          cellPadding: {
            left: rows.some((x) => x.color) ? 6 : 1.8,
            top: 1.8,
            bottom: 1.8,
            right: 1.8,
          },
        },
        1: { halign: 'right' },
        2: { halign: 'right' },
      },
      didDrawCell: (data) => {
        const color = rows[data.row.index]?.color
        if (data.section === 'body' && data.column.index === 0 && color) {
          doc.setFillColor(...hexToRgb(color))
          doc.circle(data.cell.x + 3, data.cell.y + data.cell.height / 2, 1.2, 'F')
        }
      },
    })
    return finalY(doc)
  }

  // Donut chart with the project table next to it
  const donutW = 55
  if (y + donutW > PAGE_H - M) {
    doc.addPage()
    y = M + 4
  }
  let bottom = y
  if (r.charts.share) {
    const props = doc.getImageProperties(r.charts.share)
    const h = (props.height / props.width) * donutW
    doc.addImage(r.charts.share, 'PNG', M, y, donutW, h, undefined, 'FAST')
    bottom = y + h
  }
  const afterProjects = breakdownTable(
    t('stats.byProject'),
    r.projects,
    y,
    r.charts.share ? M + donutW + 6 : M,
  )
  y = Math.max(bottom, afterProjects) + 8

  y = breakdownTable(t('stats.byMember'), r.members, y, M) + 8
  y = breakdownTable(t('stats.byTag'), r.tags, y, M) + 2
  doc.setFontSize(8)
  doc.setTextColor(110)
  doc.text(t('stats.tagNote'), M, y + 3)
  y += 10

  // Detailed entries
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [
      [
        t('stats.date'),
        `${t('exports.start')}–${t('exports.end')}`,
        t('stats.member'),
        t('stats.project'),
        t('stats.tagsCol'),
        t('stats.description'),
        t('stats.duration'),
      ],
    ],
    body: r.entries.map((e) => [
      fmtDate(e.start),
      `${fmtTime(e.start)}–${fmtTime(e.end)}`,
      e.member,
      e.project,
      e.tags,
      e.description,
      formatHM(e.ms),
    ]),
    styles: { fontSize: 8, cellPadding: 1.5, overflow: 'linebreak' },
    headStyles: { fillColor: ACCENT },
    columnStyles: { 6: { halign: 'right' }, 5: { cellWidth: 'auto' } },
  })

  // Page numbers
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(140)
    doc.text(`${i} / ${pages}`, PAGE_W - M, PAGE_H - 8, { align: 'right' })
  }

  doc.save(
    `time-report_${format(r.range.from, 'yyyy-MM-dd')}_${format(r.range.to, 'yyyy-MM-dd')}.pdf`,
  )
}
