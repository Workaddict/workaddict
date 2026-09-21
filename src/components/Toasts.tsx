import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { Icon } from './Icon'

type Kind = 'info' | 'error'
interface Toast {
  id: number
  kind: Kind
  message: string
}
interface ToastApi {
  info(message: string): void
  error(message: string): void
}

const ToastContext = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => setToasts((l) => l.filter((t) => t.id !== id)), [])
  const push = useCallback(
    (kind: Kind, message: string) => {
      const id = ++nextId.current
      setToasts((l) => [...l.filter((t) => t.message !== message), { id, kind, message }].slice(-4))
      setTimeout(() => dismiss(id), kind === 'error' ? 8000 : 4000)
    },
    [dismiss],
  )
  const api = useMemo<ToastApi>(
    () => ({ info: (m) => push('info', m), error: (m) => push('error', m) }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`}>
            <span>{t.message}</span>
            <button onClick={() => dismiss(t.id)} aria-label="×">
              <Icon name="x" size={16} />
            </button>
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
