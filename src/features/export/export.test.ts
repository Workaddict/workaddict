import { de, enUS } from 'date-fns/locale'
import type { TFunction } from 'i18next'
import type { Locale } from 'date-fns'
import type { TimeEntry, Workspace } from '../../domain/types'
import { csvDialect, reportCsv } from './csv'
import { odsFiles, xml } from './ods'
import { buildReport, cellValue, reportSheets, type Report } from './report'

const H = 3_600_000
const ws: Workspace = {
  projects: [{ id: 'web', name: 'Website', color: '#00f', archived: false }],
  tags: [{ id: 'meet', name: 'meeting', archived: false }],
}

let n = 0
function entry(
  day: number,
  hours: number,
  description = '',
  startHour = 9,
  startMinute = 30,
): TimeEntry {
  const start = new Date(2026, 8, day, startHour, startMinute)
  return {
    id: String(++n),
    login: 'müller',
    start: start.toISOString(),
    end: new Date(start.getTime() + hours * H).toISOString(),
    description,
    projectId: 'web',
    tagIds: ['meet'],
    createdAt: '',
    updatedAt: '',
  }
}

const t = ((key: string) => key) as unknown as TFunction

function report(entries: TimeEntry[], locale: Locale = enUS): Report {
  return buildReport({
    entries,
    ws,
    range: { from: new Date(2026, 8, 1), to: new Date(2026, 8, 30, 23, 59) },
    filtersText: 'all',
    charts: {},
    t,
    locale,
  })
}

describe('reportSheets', () => {
  it('lays out summary, entries and breakdowns with hours that sum to the total', () => {
    const r = report([entry(1, 1 / 3), entry(2, 2 / 3), entry(3, 1.25)])
    const sheets = reportSheets(r)
    expect(sheets.map((s) => s.name)).toEqual([
      'exports.summary',
      'exports.entries',
      'stats.byProject',
      'stats.byMember',
    ])
    const entries = sheets[1]!
    expect(entries.rows).toHaveLength(3)
    const sum = entries.rows.reduce((acc, row) => acc + (cellValue(row[7]!) as number), 0)
    expect(sum).toBeCloseTo(r.summary.totalMs / H, 10)
  })
})

describe('CSV export', () => {
  const lines = (csv: string) => csv.replace(/^\uFEFF/, '').split('\r\n')

  it('picks the dialect from the locale', () => {
    expect(csvDialect(de)).toEqual({ delimiter: ';', decimal: ',' })
    expect(csvDialect(enUS)).toEqual({ delimiter: ',', decimal: '.' })
  })

  it('writes German CSV with ; and decimal comma, BOM and one row per entry', () => {
    const csv = reportCsv(report([entry(1, 1.5), entry(2, 0.25)], de))
    expect(csv.startsWith('\uFEFF')).toBe(true)
    const l = lines(csv)
    expect(l).toHaveLength(4) // header, 2 rows, trailing empty after final CRLF
    expect(l[0]).toBe(
      'stats.date;exports.start;exports.end;stats.member;stats.project;stats.tagsCol;stats.description;exports.hours',
    )
    expect(l[1]).toBe('2026-09-01;09:30;11:00;müller;Website;meeting;;1,50')
    expect(l[3]).toBe('')
  })

  it('writes English CSV with , and decimal point', () => {
    const l = lines(reportCsv(report([entry(1, 1.5)])))
    expect(l[1]).toBe('2026-09-01,09:30,11:00,müller,Website,meeting,,1.50')
  })

  it('quotes delimiters, quotes and line breaks', () => {
    const csv = reportCsv(report([entry(1, 1, 'a, "b"\nc')]))
    expect(csv).toContain(',"a, ""b""\nc",1.00')
  })

  it('does not quote the other dialect’s delimiter', () => {
    const l = lines(reportCsv(report([entry(1, 1, 'a, b')], de)))
    expect(l[1]).toContain(';a, b;')
  })

  it('neutralizes formula-like text', () => {
    const l = lines(
      reportCsv(report([entry(1, 1, '=SUM(A1:A9)'), entry(2, 1, '-x'), entry(3, 1, '@y')])),
    )
    expect(l[1]).toContain(",'=SUM(A1:A9),")
    expect(l[2]).toContain(",'-x,")
    expect(l[3]).toContain(",'@y,")
  })
})

describe('ODS export', () => {
  const content = (r: Report) => odsFiles(r).find((f) => f.name === 'content.xml')!.data as string

  it('packages mimetype first, then manifest and XML parts', () => {
    const files = odsFiles(report([entry(1, 1)]))
    expect(files.map((f) => f.name)).toEqual([
      'mimetype',
      'META-INF/manifest.xml',
      'content.xml',
      'styles.xml',
      'meta.xml',
    ])
    expect(files[0]!.data).toBe('application/vnd.oasis.opendocument.spreadsheet')
  })

  it('writes four sheets with typed, wall-clock cells', () => {
    const xmlText = content(report([entry(1, 1.5)]))
    expect(xmlText.match(/<table:table /g)).toHaveLength(4)
    expect(xmlText).toContain('table:name="exports.entries"')
    expect(xmlText).toContain('office:value-type="date" office:date-value="2026-09-01"')
    expect(xmlText).toContain('office:value-type="time" office:time-value="PT09H30M00S"')
    expect(xmlText).toContain('office:value-type="time" office:time-value="PT11H00M00S"')
    expect(xmlText).toContain(
      'table:style-name="ce_hours" office:value-type="float" office:value="1.5"',
    )
    expect(xmlText).toContain('office:value-type="percentage" office:value="1"')
  })

  it('is well-formed XML with special characters escaped', () => {
    const xmlText = content(report([entry(1, 1, 'a < b & "c"\nline\u0007two')]))
    expect(xmlText).toContain(
      '<text:p>a &lt; b &amp; &quot;c&quot;</text:p><text:p>linetwo</text:p>',
    )
    const doc = new DOMParser().parseFromString(xmlText, 'application/xml')
    expect(doc.getElementsByTagName('parsererror')).toHaveLength(0)
  })

  it('escapes all XML specials', () => {
    expect(xml(`<&>"'`)).toBe('&lt;&amp;&gt;&quot;&apos;')
  })
})
