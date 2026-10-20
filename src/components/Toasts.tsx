import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from './Icon'
import { TipButton } from './InfoTip'

type Kind = 'info' | 'error'
/** A button in the toast, e.g. to retry; clicking it also closes the toast. */
export interface ToastAction {
  label: string
  run: () => void
}
interface Toast {
  id: number
  kind: Kind
  message: string
  action?: ToastAction
}
interface ToastApi {
  info(message: string): void
  error(message: string, action?: ToastAction): void
}

const ToastContext = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t: translate } = useTranslation()
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => setToasts((l) => l.filter((t) => t.id !== id)), [])
  const push = useCallback(
    (kind: Kind, message: string, action?: ToastAction) => {
      const id = ++nextId.current
      setToasts((l) =>
        [...l.filter((t) => t.message !== message), { id, kind, message, action }].slice(-4),
      )
      setTimeout(() => dismiss(id), kind === 'error' ? 8000 : 4000)
    },
    [dismiss],
  )
  const api = useMemo<ToastApi>(
    () => ({ info: (m) => push('info', m), error: (m, a) => push('error', m, a) }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`}>
            <span>{t.message}</span>
            {t.action && (
              <button
                type="button"
                className="link-btn toast-action"
                onClick={() => {
                  dismiss(t.id)
                  t.action!.run()
                }}
              >
                {t.action.label}
              </button>
            )}
            <TipButton onClick={() => dismiss(t.id)} tip={translate('common.close')}>
              <Icon name="x" size={16} />
            </TipButton>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast outside ToastProvider')
  return ctx
}
