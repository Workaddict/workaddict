import { format, type Locale } from 'date-fns'
import { downloadBlob } from './download'
import {
  cellKind,
  cellValue,
  reportFileName,
  reportSheets,
  type Report,
  type Sheet,
} from './report'

export interface CsvDialect {
  delimiter: ',' | ';'
  decimal: ',' | '.'
}

/**
 * Spreadsheets open CSV with the system's list separator: locales that write decimals with a
 * comma (German) expect `;` between fields, the others `,`.
 */
export function csvDialect(locale: Locale): CsvDialect {
  const decimal = new Intl.NumberFormat(locale.code).format(1.5).includes(',') ? ',' : '.'
  return { delimiter: decimal === ',' ? ';' : ',', decimal }
}

/** Text a spreadsheet would run as a formula gets a leading `'`. */
const FORMULA_START = /^[=+\-@\t\r]/

function field(s: string, d: CsvDialect): string {
  return s.includes(d.delimiter) || /["\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function sheetToCsv(sheet: Sheet, d: CsvDialect): string {
  const lines = [sheet.columns.map((c) => field(c.header, d))]
  for (const row of sheet.rows) {
    lines.push(
      row.map((cell, i) => {
        const v = cellValue(cell)
        switch (cellKind(cell, sheet.columns[i]!)) {
          case 'date':
            return format(v as Date, 'yyyy-MM-dd')
          case 'time':
            return format(v as Date, 'HH:mm')
          case 'datetime':
            return format(v as Date, 'yyyy-MM-dd HH:mm')
          case 'hours':
            return (v as number).toFixed(2).replace('.', d.decimal)
          case 'percent':
            return `${((v as number) * 100).toFixed(1).replace('.', d.decimal)}%`
          case 'number':
            return String(v).replace('.', d.decimal)
          case 'text': {
            const s = String(v)
            return field(FORMULA_START.test(s) ? `'${s}` : s, d)
          }
        }
      }),
    )
  }
  // BOM so Excel reads UTF-8 (umlauts); CRLF per RFC 4180.
  return '\uFEFF' + lines.map((l) => l.join(d.delimiter)).join('\r\n') + '\r\n'
}

/** The filtered entries only; CSV has no room for the summary and breakdown sheets. */
export function reportCsv(r: Report): string {
  return sheetToCsv(reportSheets(r)[1]!, csvDialect(r.locale))
}

export async function exportCsv(r: Report) {
  downloadBlob(
    new Blob([reportCsv(r)], { type: 'text/csv;charset=utf-8' }),
    reportFileName(r, 'csv'),
  )
}
