import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { lazyWithReload } from '../../app/lazyPage'

const HelpOverlay = lazyWithReload(() => import('./HelpOverlay'))

const OpenHelpContext = createContext<() => void>(() => {})

/** Opens the help overlay, e.g. from the avatar menu. */
export function useOpenHelp() {
  return useContext(OpenHelpContext)
}

function isEditable(el: Element | null): boolean {
  if (!el) return false
  if (el instanceof HTMLElement && el.isContentEditable) return true
  return el.matches('input, textarea, select')
}

/**
 * Provides the help overlay and opens it on `?`, unless the user is typing in a field, holds a
 * modifier key, or a dialog is already open.
 */
export function HelpOverlayProvider({
  signedIn,
  children,
}: {
  signedIn: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  // Stable, so the dialog keeps the element to return focus to.
  const show = useCallback(() => setOpen(true), [])
  const hide = useCallback(() => setOpen(false), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '?' || e.ctrlKey || e.altKey || e.metaKey || e.defaultPrevented) return
      if (isEditable(document.activeElement)) return
      if (document.querySelector('[aria-modal="true"]')) return
      e.preventDefault()
      setOpen(true)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <OpenHelpContext.Provider value={show}>
      {children}
      {open && (
        <Suspense fallback={null}>
          <HelpOverlay signedIn={signedIn} onClose={hide} />
        </Suspense>
      )}
    </OpenHelpContext.Provider>
  )
}
