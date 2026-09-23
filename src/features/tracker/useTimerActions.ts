import { useCallback } from 'react'
import { useI18n } from '../../i18n'
import type { TimerFields } from '../../storage'
import { useToast } from '../../components/Toasts'
import { useMyTimer, useStartTimer, useStopTimer } from '../data/hooks'
import { useErrorToast } from '../data/useErrorText'

/** Start/stop with the user-facing feedback shared by the timer bar, header and entry list. */
export function useTimerActions() {
  const { t } = useI18n()
  const toast = useToast()
  const onError = useErrorToast()
  const timer = useMyTimer()
  // Feedback goes through the hooks, not mutate(): the caller may unmount before the write settles.
  const start = useStartTimer({
    onSuccess: ({ stopped }) => stopped && toast.info(t('timer.previousStopped')),
    onError,
  })
  const stop = useStopTimer({
    onSuccess: (entry) => toast.info(entry ? t('timer.saved') : t('timer.alreadyStopped')),
    onError,
  })

  const startTimer = useCallback((fields: TimerFields) => start.mutate(fields), [start])
  const stopTimer = useCallback(() => stop.mutate(undefined), [stop])
  const stopTimerAt = useCallback((end: Date) => stop.mutate(end), [stop])

  return { timer, startTimer, stopTimer, stopTimerAt, busy: start.isPending || stop.isPending }
}
