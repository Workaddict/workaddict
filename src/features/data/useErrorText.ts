import { useCallback } from 'react'
import { formatTime } from '../../domain/time'
import { useI18n } from '../../i18n'
import { StorageError } from '../../storage'
import { useToast } from '../../components/Toasts'

/** Maps any error to a clear, non-technical, localized message. */
export function useErrorText() {
  const { t, timeFormat } = useI18n()
  return useCallback(
    (e: unknown): string => {
      if (e instanceof StorageError) {
        if (e.kind === 'rateLimit') {
          const time = e.resetAt ? formatTime(e.resetAt, timeFormat) : '…'
          return t('errors.rateLimit', { time })
        }
        if (e.kind === 'corruptData') return t('errors.corruptData', { path: e.path ?? '' })
        return t(`errors.${e.kind}`)
      }
      return t('errors.unknown')
    },
    [t, timeFormat],
  )
}

/** Returns a handler that shows an error toast for a failed operation. */
export function useErrorToast() {
  const toast = useToast()
  const text = useErrorText()
  return useCallback((e: unknown) => toast.error(text(e)), [toast, text])
}
