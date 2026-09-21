import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const titleId = useId()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    const first = ref.current?.querySelector<HTMLElement>(
      'input, select, textarea, button:not([data-autofocus-skip])',
    )
    first?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [onClose])

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId}>{title}</h2>
        {children}
      </div>
    </div>
  )
}

// ---- confirm dialog ----------------------------------------------------------

interface ConfirmOptions {
  message: string
  confirmLabel?: string
  danger?: boolean
}
type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const [pending, setPending] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(
    null,
  )
  const confirm = useCallback<ConfirmFn>(
    (opts) => new Promise((resolve) => setPending({ ...opts, resolve })),
    [],
  )
  const close = useCallback(
    (v: boolean) => {
      pending?.resolve(v)
      setPending(null)
    },
    [pending],
  )
  const cancel = useCallback(() => close(false), [close])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <Modal title={pending.confirmLabel ?? t('common.delete')} onClose={cancel}>
          <p>{pending.message}</p>
          <div className="modal-actions">
            <button className="btn" onClick={cancel}>
              {t('common.cancel')}
            </button>
            <button
              className={`btn ${pending.danger === false ? 'btn-primary' : 'btn-danger'}`}
              onClick={() => close(true)}
            >
              {pending.confirmLabel ?? t('common.delete')}
            </button>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm outside ConfirmProvider')
  return ctx
}
