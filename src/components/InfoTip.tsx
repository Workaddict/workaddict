import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type FocusEvent as ReactFocusEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
} from 'react'
import { createPortal } from 'react-dom'

/** Hover delay before a tip opens, in ms. */
const OPEN_DELAY = 300
/** Grace time to move the pointer from the trigger into an interactive tip, in ms. */
const CLOSE_DELAY = 120
/** Touch press length that shows an icon button's tip instead of pressing it, in ms. */
const LONG_PRESS = 500
/** How long a long-press tip stays without further touches, in ms. */
const LONG_PRESS_SHOW = 3000
/** Distance between trigger and tip, and minimum distance to the viewport edge, in px. */
const GAP = 6
const MARGIN = 8

// Focus from a click or tap should not open a tip (hover or tap does that); keyboard focus should.
let lastInputWasPointer = false
if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', () => (lastInputWasPointer = true), true)
  document.addEventListener('keydown', () => (lastInputWasPointer = false), true)
}

type TouchMode = 'tap' | 'longPress'

/**
 * A tip next to a trigger element. It opens on mouse hover and keyboard focus; on touch screens
 * it opens on tap (`tap`, for glossary terms) or on long-press (`longPress`, for buttons whose
 * tap must still run their action). It closes on Escape, blur, pointer leave and outside taps.
 * The tip is positioned through the CSSOM, which the Content Security Policy allows.
 */
export function useTip<T extends HTMLElement>(
  content: ReactNode,
  { touch, interactive = false }: { touch: TouchMode; interactive?: boolean },
) {
  const id = useId()
  const [open, setOpen] = useState(false)
  // A callback ref kept in state, so positioning re-runs when the trigger mounts.
  const [trigger, setTrigger] = useState<T | null>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const pressTimer = useRef<number | undefined>(undefined)
  const suppressClick = useRef(false)
  const lastPointerType = useRef<string>('mouse')

  const clear = () => window.clearTimeout(timer.current)
  const show = useCallback(() => {
    clear()
    setOpen(true)
  }, [])
  const hide = useCallback(() => {
    clear()
    setOpen(false)
  }, [])
  const later = (fn: () => void, ms: number) => {
    clear()
    timer.current = window.setTimeout(fn, ms)
  }

  useEffect(
    () => () => {
      window.clearTimeout(timer.current)
      window.clearTimeout(pressTimer.current)
    },
    [],
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && hide()
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (!trigger?.contains(target) && !tipRef.current?.contains(target)) hide()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open, hide, trigger])

  // Above the trigger when there is room, otherwise below; never outside the viewport.
  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const tip = tipRef.current
      if (!trigger || !tip) return
      const r = trigger.getBoundingClientRect()
      const w = tip.offsetWidth
      const h = tip.offsetHeight
      const centered = r.left + r.width / 2 - w / 2
      const left = Math.max(MARGIN, Math.min(centered, window.innerWidth - w - MARGIN))
      const above = r.top - h - GAP >= MARGIN
      tip.style.left = `${left}px`
      tip.style.top = `${above ? r.top - h - GAP : r.bottom + GAP}px`
      tip.dataset.side = above ? 'top' : 'bottom'
    }
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open, trigger])

  const props = {
    'aria-describedby': open ? id : undefined,
    onPointerEnter: (e: ReactPointerEvent) => {
      if (e.pointerType !== 'touch') later(show, OPEN_DELAY)
    },
    onPointerLeave: (e: ReactPointerEvent) => {
      if (e.pointerType !== 'touch') later(hide, interactive ? CLOSE_DELAY : 0)
      window.clearTimeout(pressTimer.current)
    },
    onPointerDown: (e: ReactPointerEvent) => {
      lastPointerType.current = e.pointerType
      if (e.pointerType === 'touch' && touch === 'longPress') {
        suppressClick.current = false
        window.clearTimeout(pressTimer.current)
        pressTimer.current = window.setTimeout(() => {
          suppressClick.current = true
          show()
          later(hide, LONG_PRESS_SHOW)
        }, LONG_PRESS)
      }
    },
    onPointerUp: () => window.clearTimeout(pressTimer.current),
    onPointerCancel: () => window.clearTimeout(pressTimer.current),
    onContextMenu: (e: ReactMouseEvent) => {
      // A long press opens the context menu on some phones; the tip replaces it.
      if (lastPointerType.current === 'touch' && touch === 'longPress') e.preventDefault()
    },
    onFocus: () => {
      if (!lastInputWasPointer) show()
    },
    onBlur: (e: ReactFocusEvent) => {
      if (!tipRef.current?.contains(e.relatedTarget as Node)) hide()
    },
  }

  /** Handles a click on the trigger. Returns false when the click only ended a long press. */
  const onTriggerClick = () => {
    if (suppressClick.current) {
      suppressClick.current = false
      return false
    }
    if (touch === 'tap') {
      if (lastPointerType.current === 'touch' || !lastInputWasPointer) setOpen((o) => !o)
      else show()
    } else {
      hide()
    }
    return true
  }

  const tip =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={tipRef}
            id={id}
            role="tooltip"
            className={`infotip${interactive ? ' infotip-interactive' : ''}`}
            onPointerEnter={() => interactive && clear()}
            onPointerLeave={(e) => interactive && e.pointerType !== 'touch' && later(hide, CLOSE_DELAY)}
            onBlur={(e) => {
              if (!trigger?.contains(e.relatedTarget as Node) &&
                !tipRef.current?.contains(e.relatedTarget as Node)) hide()
            }}
          >
            {content}
          </div>,
          document.body,
        )
      : null

  return { open, setTrigger, props, onTriggerClick, tip }
}

function mergeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (value: T | null) => {
    for (const r of refs) {
      if (typeof r === 'function') r(value)
      else if (r) (r as { current: T | null }).current = value
    }
  }
}

/**
 * An icon-only button with a tip. The tip text is also the accessible label unless
 * `aria-label` says more. Use instead of a `title` attribute.
 */
export function TipButton({
  tip,
  ref,
  onClick,
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  onFocus,
  onBlur,
  type = 'button',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { tip: string; ref?: Ref<HTMLButtonElement> }) {
  const t = useTip<HTMLButtonElement>(tip, { touch: 'longPress' })
  const p = t.props
  return (
    <>
      <button
        {...rest}
        type={type}
        aria-label={rest['aria-label'] ?? tip}
        ref={mergeRefs(t.setTrigger, ref)}
        aria-describedby={p['aria-describedby'] ?? rest['aria-describedby']}
        onPointerEnter={(e) => {
          p.onPointerEnter(e)
          onPointerEnter?.(e)
        }}
        onPointerLeave={(e) => {
          p.onPointerLeave(e)
          onPointerLeave?.(e)
        }}
        onPointerDown={(e) => {
          p.onPointerDown(e)
          onPointerDown?.(e)
        }}
        onPointerUp={p.onPointerUp}
        onPointerCancel={p.onPointerCancel}
        onContextMenu={p.onContextMenu}
        onFocus={(e) => {
          p.onFocus()
          onFocus?.(e)
        }}
        onBlur={(e) => {
          p.onBlur(e)
          onBlur?.(e)
        }}
        onClick={(e) => {
          if (t.onTriggerClick()) onClick?.(e)
        }}
      >
        {children}
      </button>
      {t.tip}
    </>
  )
}
