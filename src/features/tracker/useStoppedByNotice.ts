import { useQueryClient } from '@tanstack/react-query'
import { endOfDay, startOfDay } from 'date-fns'
import { useEffect, useRef } from 'react'
import { useToast } from '../../components/Toasts'
import type { RunningTimer } from '../../domain/types'
import { useI18n } from '../../i18n'
import { useSessionData } from '../auth/AuthContext'
import { keys, useMyTimer } from '../data/hooks'

const SHOWN_KEY = 'workaddict.stoppedByShown'

function shownIds(): string[] {
  try {
    const raw = sessionStorage.getItem(SHOWN_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function markShown(id: string) {
  try {
    sessionStorage.setItem(SHOWN_KEY, JSON.stringify([...shownIds(), id].slice(-20)))
  } catch {
    // Storage unavailable: the notice may repeat after a reload, nothing else breaks.
  }
}

/**
 * Tells the user once when another member stopped their timer: when the own timer disappears,
 * the entry created from it is looked up and checked for `stoppedBy`.
 */
export function useStoppedByNotice() {
  const { t } = useI18n()
  const { adapter, user } = useSessionData()
  const qc = useQueryClient()
  const toast = useToast()
  const timer = useMyTimer()
  const previous = useRef<RunningTimer | null>(null)

  useEffect(() => {
    const last = previous.current
    previous.current = timer
    if (!last || last.id === 'pending' || timer?.id === last.id) return
    if (shownIds().includes(last.id)) return

    const day = new Date(last.start)
    const range = { from: startOfDay(day), to: endOfDay(day) }
    void qc
      .fetchQuery({
        queryKey: keys.entriesRange(range),
        queryFn: () => adapter.listEntries(range),
        staleTime: 0,
      })
      .then((entries) => {
        const entry = entries.find((e) => e.id === last.id)
        if (!entry?.stoppedBy || entry.stoppedBy === user.login) return
        markShown(last.id)
        toast.info(t('team.stoppedByOther', { login: entry.stoppedBy }))
      })
      .catch(() => {
        // Only a hint; the next data refresh shows the entry anyway.
      })
  }, [timer, adapter, qc, toast, t, user.login])
}
