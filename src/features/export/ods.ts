import { format } from 'date-fns'
import { downloadBlob } from './download'
import {
  cellKind,
  cellValue,
  reportFileName,
  reportSheets,
  type CellKind,
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

const dateParts =
  '<number:year number:style="long"/><number:text>-</number:text>' +
  '<number:month number:style="long"/><number:text>-</number:text>' +
  '<number:day number:style="long"/>'
const timeParts =
  '<number:hours number:style="long"/><number:text>:</number:text><number:minutes number:style="long"/>'
const decimals = (n: number) =>
  `<number:number number:decimal-places="${n}" number:min-decimal-places="${n}" number:min-integer-digits="1"/>`

const DATA_STYLES = [
  `<number:date-style style:name="N_date">${dateParts}</number:date-style>`,
  `<number:time-style style:name="N_time">${timeParts}</number:time-style>`,
  `<number:date-style style:name="N_datetime">${dateParts}<number:text> </number:text>${timeParts}</number:date-style>`,
  `<number:number-style style:name="N_hours">${decimals(2)}</number:number-style>`,
  `<number:percentage-style style:name="N_percent">${decimals(1)}<number:text>%</number:text></number:percentage-style>`,
].join('')

const CELL_STYLES = [
  ...(['date', 'time', 'datetime', 'hours', 'percent'] as const).map(
    (k) =>
      `<style:style style:name="ce_${k}" style:family="table-cell" style:data-style-name="N_${k}"/>`,
  ),
  '<style:style style:name="ce_head" style:family="table-cell">' +
    '<style:table-cell-properties fo:background-color="#4f46e5"/>' +
    '<style:text-properties fo:font-weight="bold" fo:color="#ffffff"/></style:style>',
].join('')

const localIso = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm:ss")

function textCell(s: string, style = ''): string {
  // One paragraph per line; ODF collapses raw line breaks.
  const paras = s.split(/\r\n|\r|\n/).map((line) => `<text:p>${xml(line)}</text:p>`)
  return `<table:table-cell${style} office:value-type="string">${paras.join('')}</table:table-cell>`
}

function cell(kind: CellKind, v: string | number | Date): string {
  const style = kind === 'text' || kind === 'number' ? '' : ` table:style-name="ce_${kind}"`
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
  const head = `<table:table-header-rows><table:table-row>${sheet.columns
    .map((c) => textCell(c.header, ' table:style-name="ce_head"'))
    .join('')}</table:table-row></table:table-header-rows>`
  const rows = sheet.rows
    .map(
      (row) =>
        `<table:table-row>${row.map((c, i) => cell(cellKind(c, sheet.columns[i]!), cellValue(c))).join('')}</table:table-row>`,
    )
    .join('')
  return `<table:table table:name="${sheetName(sheet.name)}">${cols}${head}${rows}</table:table>`
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
    `<office:automatic-styles>${DATA_STYLES}${CELL_STYLES}${columnStyles(sheets)}</office:automatic-styles>` +
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
