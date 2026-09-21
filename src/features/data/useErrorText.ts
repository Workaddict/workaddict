import { format } from 'date-fns'
import { useCallback } from 'react'
import { useI18n } from '../../i18n'
import { StorageError } from '../../storage'
import { useToast } from '../../components/Toasts'

/** Maps any error to a clear, non-technical, localized message. */
export function useErrorText() {
  const { t, locale } = useI18n()
  return useCallback(
    (e: unknown): string => {
      if (e instanceof StorageError) {
        if (e.kind === 'rateLimit') {
          const time = e.resetAt ? format(e.resetAt, 'p', { locale }) : '…'
          return t('errors.rateLimit', { time })
        }
        return t(`errors.${e.kind}`)
      }
      return t('errors.unknown')
    },
    [t, locale],
  )
}

/** Returns a handler that shows an error toast for a failed operation. */
export function useErrorToast() {
  const toast = useToast()
  const text = useErrorText()
  return useCallback((e: unknown) => toast.error(text(e)), [toast, text])
}
