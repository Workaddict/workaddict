import { format } from 'date-fns'
import type { StorageAdapter } from '../../storage'
import { downloadBlob } from './download'

/** Downloads every member's entries plus projects and tags as one JSON file. */
export async function downloadBackup(adapter: StorageAdapter) {
  const backup = await adapter.exportBackup()
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  downloadBlob(blob, `workaddict-backup_${format(new Date(), 'yyyy-MM-dd')}.json`)
}
