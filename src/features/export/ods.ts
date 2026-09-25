import { format } from 'date-fns'
import { downloadBlob } from './download'
import {
  cellKind,
  cellValue,
  reportFileName,
  reportSheets,
  shortDateParts,
  type CellKind,
  type DatePart,
  type Report,
  type Sheet,
} from './report'
import { zip, type ZipEntry } from './zip'

const MIME = 'application/vnd.oasis.opendocument.spreadsheet'

const NS = [
  'xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"',
  'xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"',
  'xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"',
  'xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"',
  'xmlns:number="urn:oasis:names:tc:opendocument:xmlns:datastyle:1.0"',
  'xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"',
  'xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0"',
  'xmlns:dc="http://purl.org/dc/elements/1.1/"',
].join(' ')

const XML_HEAD = '<?xml version="1.0" encoding="UTF-8"?>\n'

/** Escapes XML special characters and drops control characters XML 1.0 can't hold. */
export function xml(s: string): string {
  return (
    s
      // eslint-disable-next-line no-control-regex -- stripping them is the point
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  )
}

const style = (long: boolean) => (long ? ' number:style="long"' : '')

function dateXml(parts: DatePart[]): string {
  return parts
    .map((p) => {
      switch (p.kind) {
        case 'day':
          return `<number:day${style(p.long)}/>`
        case 'month':
          return `<number:month${style(p.long)}/>`
        case 'year':
          return '<number:year number:style="long"/>'
        case 'text':
          return `<number:text>${xml(p.text)}</number:text>`
      }
    })
    .join('')
}

/** "16:20" (24h) or "4:20 PM" (12h), as in the app. */
function timeXml(f: Report['timeFormat']): string {
  return f === '12h'
    ? '<number:hours/><number:text>:</number:text><number:minutes number:style="long"/><number:text> </number:text><number:am-pm/>'
    : '<number:hours number:style="long"/><number:text>:</number:text><number:minutes number:style="long"/>'
}

const decimals = (n: number) =>
  `<number:number number:decimal-places="${n}" number:min-decimal-places="${n}" number:min-integer-digits="1"/>`

/** Date and time styles follow the report's language and clock format. */
function dataStyles(r: Report): string {
  const date = dateXml(shortDateParts(r.locale))
  const time = timeXml(r.timeFormat)
  return [
    `<number:date-style style:name="N_date">${date}</number:date-style>`,
    `<number:time-style style:name="N_time">${time}</number:time-style>`,
    `<number:date-style style:name="N_datetime">${date}<number:text> </number:text>${time}</number:date-style>`,
    `<number:number-style style:name="N_number"><number:number number:min-integer-digits="1"/></number:number-style>`,
    `<number:number-style style:name="N_hours">${decimals(2)}</number:number-style>`,
    `<number:percentage-style style:name="N_percent">${decimals(1)}<number:text>%</number:text></number:percentage-style>`,
  ].join('')
}

const START =
  '<style:table-cell-properties style:text-align-source="fix"/><style:paragraph-properties fo:text-align="start"/>'

const CELL_STYLES = [
  ...(['date', 'time', 'datetime', 'hours', 'percent', 'number'] as const).flatMap((k) => [
    `<style:style style:name="ce_${k}" style:family="table-cell" style:data-style-name="N_${k}"/>`,
    // Left-aligned twin, for values that sit next to their label.
    `<style:style style:name="ce_${k}_start" style:family="table-cell" style:data-style-name="N_${k}">${START}</style:style>`,
  ]),
  '<style:style style:name="ce_head" style:family="table-cell">' +
    '<style:table-cell-properties fo:background-color="#4f46e5"/>' +
    '<style:text-properties fo:font-weight="bold" fo:color="#ffffff"/></style:style>',
  '<style:style style:name="ce_title" style:family="table-cell">' +
    '<style:text-properties fo:font-weight="bold" fo:font-size="12pt"/></style:style>',
].join('')

const localIso = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm:ss")

function textCell(s: string, style = ''): string {
  // One paragraph per line; ODF collapses raw line breaks.
  const paras = s.split(/\r\n|\r|\n/).map((line) => `<text:p>${xml(line)}</text:p>`)
  return `<table:table-cell${style} office:value-type="string">${paras.join('')}</table:table-cell>`
}

function cell(kind: CellKind, v: string | number | Date, alignStart = false): string {
  const name = alignStart ? `ce_${kind}_start` : `ce_${kind}`
  const style =
    kind === 'text' || (kind === 'number' && !alignStart) ? '' : ` table:style-name="${name}"`
  switch (kind) {
    case 'text':
      return textCell(String(v))
    case 'number':
    case 'hours':
      return `<table:table-cell${style} office:value-type="float" office:value="${v as number}"/>`
    case 'percent':
      return `<table:table-cell${style} office:value-type="percentage" office:value="${v as number}"/>`
    case 'date':
      return `<table:table-cell${style} office:value-type="date" office:date-value="${format(v as Date, 'yyyy-MM-dd')}"/>`
    case 'datetime':
      // ODF dates carry no time zone: local wall-clock time, as shown in the app.
      return `<table:table-cell${style} office:value-type="date" office:date-value="${localIso(v as Date)}"/>`
    case 'time':
      return `<table:table-cell${style} office:value-type="time" office:time-value="${format(v as Date, "'PT'HH'H'mm'M'ss'S'")}"/>`
  }
}

/** LibreOffice rejects these characters in sheet names. */
const sheetName = (s: string) => xml(s.replace(/[[\]*?:/\\]/g, ' '))

function table(sheet: Sheet, index: number): string {
  const cols = sheet.columns
    .map((_, i) => `<table:table-column table:style-name="co_${index}_${i}"/>`)
    .join('')
  // Only column A: an empty B1 lets the title run on across the sheet.
  const title =
    sheet.title === undefined
      ? ''
      : `<table:table-row>${textCell(sheet.title, ' table:style-name="ce_title"')}</table:table-row>`
  const head =
    sheet.header === false
      ? ''
      : `<table:table-header-rows><table:table-row>${sheet.columns
          .map((c) => textCell(c.header, ' table:style-name="ce_head"'))
          .join('')}</table:table-row></table:table-header-rows>`
  const rows = sheet.rows
    .map((row) => {
      const cells = row.map((c, i) => {
        const col = sheet.columns[i]!
        return cell(cellKind(c, col), cellValue(c), col.alignStart)
      })
      return `<table:table-row>${cells.join('')}</table:table-row>`
    })
    .join('')
  return `<table:table table:name="${sheetName(sheet.name)}">${cols}${title}${head}${rows}</table:table>`
}

function columnStyles(sheets: Sheet[]): string {
  return sheets
    .flatMap((s, si) =>
      s.columns.map(
        (c, ci) =>
          `<style:style style:name="co_${si}_${ci}" style:family="table-column">` +
          `<style:table-column-properties style:column-width="${(c.width * 0.21).toFixed(2)}cm"/></style:style>`,
      ),
    )
    .join('')
}

/** The package entries, in the order ODF requires (`mimetype` first). */
export function odsFiles(r: Report, now = new Date()): ZipEntry[] {
  const sheets = reportSheets(r)
  const content =
    XML_HEAD +
    `<office:document-content ${NS} office:version="1.3">` +
    `<office:automatic-styles>${dataStyles(r)}${CELL_STYLES}${columnStyles(sheets)}</office:automatic-styles>` +
    `<office:body><office:spreadsheet>${sheets.map(table).join('')}</office:spreadsheet></office:body>` +
    '</office:document-content>'
  const meta =
    XML_HEAD +
    `<office:document-meta ${NS} office:version="1.3"><office:meta>` +
    '<meta:generator>Workaddict</meta:generator>' +
    `<dc:title>${xml(r.t('exports.reportTitle'))}</dc:title>` +
    `<meta:creation-date>${localIso(now)}</meta:creation-date>` +
    '</office:meta></office:document-meta>'
  const styles = XML_HEAD + `<office:document-styles ${NS} office:version="1.3"/>`
  const manifest =
    XML_HEAD +
    '<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.3">' +
    `<manifest:file-entry manifest:full-path="/" manifest:version="1.3" manifest:media-type="${MIME}"/>` +
    ['content.xml', 'styles.xml', 'meta.xml']
      .map((p) => `<manifest:file-entry manifest:full-path="${p}" manifest:media-type="text/xml"/>`)
      .join('') +
    '</manifest:manifest>'
  return [
    { name: 'mimetype', data: MIME },
    { name: 'META-INF/manifest.xml', data: manifest },
    { name: 'content.xml', data: content },
    { name: 'styles.xml', data: styles },
    { name: 'meta.xml', data: meta },
  ]
}

export async function exportOds(r: Report) {
  const now = new Date()
  const bytes = zip(odsFiles(r, now), now)
  downloadBlob(new Blob([bytes], { type: MIME }), reportFileName(r, 'ods'))
}
