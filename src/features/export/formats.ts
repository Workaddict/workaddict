import type { Report } from './report'

export type ExportFormat = 'pdf' | 'xlsx' | 'ods' | 'csv'

export const EXPORT_GROUPS: { group: 'document' | 'spreadsheet'; formats: ExportFormat[] }[] = [
  { group: 'document', formats: ['pdf'] },
  { group: 'spreadsheet', formats: ['xlsx', 'ods', 'csv'] },
]

type Writer = (r: Report) => Promise<void>

/** Each writer is its own chunk, loaded only when that format is exported. */
export async function loadWriter(format: ExportFormat): Promise<Writer> {
  switch (format) {
    case 'pdf':
      return (await import('./pdf')).exportPdf
    case 'xlsx':
      return (await import('./xlsx')).exportXlsx
    case 'ods':
      return (await import('./ods')).exportOds
    case 'csv':
      return (await import('./csv')).exportCsv
  }
}
