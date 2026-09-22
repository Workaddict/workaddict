import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

/** Distance between the toggle button and its popover, in px. */
const GAP = 6

function usePopover() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  return { open, setOpen, ref }
}

export function Popover({
  label,
  button,
  hasValue,
  disabled,
  busy,
  onClose,
  buttonClassName,
  hasPopup = 'listbox',
  restoreFocus,
  popClassName,
  children,
}: {
  label: string
  button: ReactNode
  hasValue?: boolean
  disabled?: boolean
  /** Work in progress: the button ignores clicks but stays focusable, unlike `disabled`. */
  busy?: boolean
  /** Called whenever the popover closes (outside click, Escape, or the toggle button). */
  onClose?: () => void
  /** Replaces the default picker button styling. */
  buttonClassName?: string
  hasPopup?: 'listbox' | 'menu'
  /** Move focus back to the toggle button when the popover closes and focus would otherwise be lost. */
  restoreFocus?: boolean
  popClassName?: string
  children: (close: () => void) => ReactNode
}) {
  const { open, setOpen, ref } = usePopover()
  const wasOpen = useRef(false)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  const btnRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (wasOpen.current && !open) {
      onCloseRef.current?.()
      const active = document.activeElement
      if (restoreFocus && (!active || active === document.body)) btnRef.current?.focus()
    }
    wasOpen.current = open
  }, [open, restoreFocus])

  // The popover is position: fixed so containers that clip overflow (day groups, modals) can't
  // cut it off. Place it under the button, or above it when there isn't enough room below.
  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const btn = btnRef.current
      const pop = popRef.current
      if (!btn || !pop) return
      const r = btn.getBoundingClientRect()
      const margin = 16
      const left = Math.max(margin, Math.min(r.left, window.innerWidth - pop.offsetWidth - margin))
      const spaceBelow = window.innerHeight - r.bottom
      const above = spaceBelow < pop.offsetHeight + GAP + margin && r.top > spaceBelow
      pop.style.left = `${left}px`
      pop.style.top = above ? '' : `${r.bottom + GAP}px`
      pop.style.bottom = above ? `${window.innerHeight - r.top + GAP}px` : ''
    }
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open])

  return (
    <div className="picker" ref={ref}>
      <button
        ref={btnRef}
        type="button"
        className={buttonClassName ?? `picker-btn${hasValue ? ' has-value' : ''}`}
        aria-haspopup={hasPopup}
        aria-expanded={open}
        aria-label={label}
        title={label}
        disabled={disabled}
        aria-disabled={busy || undefined}
        aria-busy={busy || undefined}
        onClick={() => !busy && setOpen((o) => !o)}
      >
        {button}
      </button>
      {open && (
        <div className={popClassName ? `picker-pop ${popClassName}` : 'picker-pop'} ref={popRef}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}
