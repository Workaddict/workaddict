import { de, enUS } from 'date-fns/locale'
import type { TFunction } from 'i18next'
import type { Locale } from 'date-fns'
import type { TimeFormat } from '../../domain/time'
import type { TimeEntry, Workspace } from '../../domain/types'
import { csvDialect, reportCsv } from './csv'
import { odsFiles, xml } from './ods'
import { buildReport, cellValue, reportSheets, shortDateParts, type Report } from './report'
import { xlsxDateFormat, xlsxTimeFormat, xlsxWorkbook } from './xlsx'

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

function report(
  entries: TimeEntry[],
  locale: Locale = enUS,
  timeFormat: TimeFormat = '24h',
): Report {
  return buildReport({
    entries,
    ws,
    range: { from: new Date(2026, 8, 1), to: new Date(2026, 8, 30, 23, 59) },
    filtersText: 'all',
    charts: {},
    t,
    locale,
    timeFormat,
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

  it('gives the summary a title row instead of a header row, with values next to their labels', () => {
    const summary = reportSheets(report([entry(1, 1)], de))[0]!
    expect(summary.title).toBe('exports.reportTitle 01.09.2026 – 30.09.2026')
    expect(summary.header).toBe(false)
    expect(summary.rows[0]).toEqual(['exports.filtersLabel', 'all'])
    expect(summary.columns[1]).toMatchObject({ width: 20, alignStart: true })
  })
})

describe('shortDateParts', () => {
  it('follows the locale’s short date pattern', () => {
    expect(shortDateParts(de)).toEqual([
      { kind: 'day', long: true },
      { kind: 'text', text: '.' },
      { kind: 'month', long: true },
      { kind: 'text', text: '.' },
      { kind: 'year' },
    ])
    expect(shortDateParts(enUS)).toEqual([
      { kind: 'month', long: true },
      { kind: 'text', text: '/' },
      { kind: 'day', long: true },
      { kind: 'text', text: '/' },
      { kind: 'year' },
    ])
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

  it('localizes date and time styles', () => {
    const deXml = content(report([entry(1, 1)], de))
    expect(deXml).toContain(
      '<number:date-style style:name="N_date"><number:day number:style="long"/><number:text>.</number:text>' +
        '<number:month number:style="long"/><number:text>.</number:text><number:year number:style="long"/></number:date-style>',
    )
    expect(deXml).not.toContain('<number:am-pm/>')
    const enXml = content(report([entry(1, 1)], enUS, '12h'))
    expect(enXml).toMatch(
      /style:name="N_date"><number:month number:style="long"\/><number:text>\/<\/number:text><number:day/,
    )
    expect(enXml).toMatch(/style:name="N_time">[^]*<number:am-pm\/><\/number:time-style>/)
  })

  it('starts the summary with a title row and no header row, values left-aligned', () => {
    const xmlText = content(report([entry(1, 1.5)], de))
    const summary = xmlText.match(
      /<table:table table:name="exports.summary">[^]*?<\/table:table>/,
    )![0]
    expect(summary).not.toContain('table:table-header-rows')
    expect(summary).not.toContain('ce_head')
    expect(summary).toMatch(
      /^<table:table [^>]*>(<table:table-column [^>]*\/>)+<table:table-row><table:table-cell table:style-name="ce_title" office:value-type="string"><text:p>exports.reportTitle 01.09.2026 – 30.09.2026<\/text:p><\/table:table-cell><\/table:table-row>/,
    )
    expect(summary).toContain(
      'table:style-name="ce_hours_start" office:value-type="float" office:value="1.5"',
    )
    expect(summary).toContain(
      'table:style-name="ce_number_start" office:value-type="float" office:value="1"',
    )
    // The entries sheet keeps its header row
    expect(xmlText).toMatch(
      /table:name="exports.entries">(<table:table-column [^>]*\/>)+<table:table-header-rows>/,
    )
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

describe('Excel export', () => {
  it('builds number formats from the date parts and the clock format', () => {
    expect(xlsxDateFormat(shortDateParts(de))).toBe('dd\\.mm\\.yyyy')
    expect(xlsxDateFormat(shortDateParts(enUS))).toBe('mm\\/dd\\/yyyy')
    expect(xlsxTimeFormat('24h')).toBe('hh:mm')
    expect(xlsxTimeFormat('12h')).toBe('h:mm AM/PM')
  })

  it('starts the summary with the title and no header row; entries use localized formats', async () => {
    const wb = await xlsxWorkbook(report([entry(1, 1.5)], de))
    const summary = wb.getWorksheet('exports.summary')!
    expect(summary.getCell('A1').value).toBe('exports.reportTitle 01.09.2026 – 30.09.2026')
    expect(summary.getCell('A1').font?.bold).toBe(true)
    expect(summary.getCell('B1').value).toBeNull()
    expect(summary.getCell('A2').value).toBe('exports.filtersLabel')
    expect(summary.getCell('B3').value).toBe(1.5)
    expect(summary.getColumn(2).width).toBe(20)
    expect(summary.getCell('B3').alignment?.horizontal).toBe('left')
    const entries = wb.getWorksheet('exports.entries')!
    expect(entries.getCell('A1').value).toBe('stats.date')
    expect(entries.getCell('A2').numFmt).toBe('dd\\.mm\\.yyyy')
    expect(entries.getCell('B2').numFmt).toBe('hh:mm')
  })

  it('uses 12-hour times when the app does', async () => {
    const wb = await xlsxWorkbook(report([entry(1, 1)], enUS, '12h'))
    expect(wb.getWorksheet('exports.entries')!.getCell('B2').numFmt).toBe('h:mm AM/PM')
  })
})
