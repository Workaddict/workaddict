import { format } from '../../domain/zoned'
import type { StorageAdapter } from '../../storage'
import { downloadJson } from './download'

/** Downloads every member's entries plus projects and tags as one JSON file. */
export async function downloadBackup(adapter: StorageAdapter) {
  const backup = await adapter.exportBackup()
  downloadJson(backup, `workaddict-backup_${format(new Date(), 'yyyy-MM-dd')}.json`)
}
