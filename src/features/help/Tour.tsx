import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { useAccess } from '../data/hooks'
import { endTour, getWelcome, setTourIndex, setWelcome, useTourRun } from './tourStore'
import { findTarget, stepsFor } from './tourSteps'

/** How long a step waits for its element to appear after a page change, in ms. */
const WAIT_MS = 2000
/** Space around the highlighted element, in px. */
const PAD = 6
/** Distance between the highlight and the bubble, and to the viewport edge, in px. */
const GAP = 12
const MARGIN = 8

interface Box {
  top: number
  left: number
  width: number
  height: number
}

function place(el: HTMLElement | null, box: Partial<Box>) {
  if (!el) return
  for (const [k, v] of Object.entries(box)) el.style.setProperty(k, `${Math.round(v)}px`)
}

/**
 * The guided tour: dims the page except one control, explains it in a bubble and moves page by
 * page. It only reads; nothing is written. Steps whose control is not on screen are skipped.
 */
export function Tour({ isDemo }: { isDemo: boolean }) {
  const { running, index } = useTourRun()
  if (!running) return null
  return <TourStepView index={index} isDemo={isDemo} />
}

function TourStepView({ index, isDemo }: { index: number; isDemo: boolean }) {
  const { t } = useI18n()
  const access = useAccess()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const steps = stepsFor(access.role)
  const step = steps[index]
  const titleId = useId()
  // The element found for a step; stale once the step or page changes.
  const [found, setFound] = useState<{ key: string; el: HTMLElement } | null>(null)
  const key = `${index}:${pathname}`
  const target = found?.key === key ? found.el : null
  const dir = useRef<1 | -1>(1)
  const shades = useRef<(HTMLDivElement | null)[]>([])
  const ring = useRef<HTMLDivElement>(null)
  const bubble = useRef<HTMLDivElement>(null)
  const title = useRef<HTMLHeadingElement>(null)
  const returnFocus = useRef<Element | null>(null)

  const finish = () => {
    endTour()
    setWelcome(isDemo, { ...getWelcome(isDemo), status: 'done' })
    ;(returnFocus.current as HTMLElement | null)?.focus?.()
  }
  const go = (d: 1 | -1) => {
    dir.current = d
    const next = index + d
    if (next < 0) return
    if (next >= steps.length) finish()
    else setTourIndex(next)
  }

  useEffect(() => {
    returnFocus.current = document.activeElement
  }, [])

  // Open the step's page, then wait for its element; skip the step when it never shows up.
  useEffect(() => {
    if (!step) {
      finish()
      return
    }
    if (step.route && pathname !== step.route) {
      navigate(step.route)
      return
    }
    const started = Date.now()
    let timer: number | undefined
    const look = () => {
      const el = findTarget(step.target)
      if (el) {
        el.scrollIntoView?.({ block: 'center', inline: 'nearest' })
        setFound({ key, el })
      } else if (Date.now() - started > WAIT_MS) {
        const next = index + dir.current
        if (next < 0 || next >= steps.length) finish()
        else setTourIndex(next)
      } else {
        timer = window.setTimeout(look, 100)
      }
    }
    timer = window.setTimeout(look, 0)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run per step and page only
  }, [index, pathname, step?.target])

  // Spotlight: four shades around the element, a ring on it, and the bubble beside it.
  useLayoutEffect(() => {
    if (!target) return
    const layout = () => {
      const r = target.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      const top = Math.max(0, r.top - PAD)
      const left = Math.max(0, r.left - PAD)
      const bottom = Math.min(vh, r.bottom + PAD)
      const right = Math.min(vw, r.right + PAD)
      const [above, below, before, after] = shades.current
      place(above ?? null, { top: 0, left: 0, width: vw, height: top })
      place(below ?? null, { top: bottom, left: 0, width: vw, height: Math.max(0, vh - bottom) })
      place(before ?? null, { top, left: 0, width: left, height: bottom - top })
      place(after ?? null, {
        top,
        left: right,
        width: Math.max(0, vw - right),
        height: bottom - top,
      })
      place(ring.current, { top, left, width: right - left, height: bottom - top })

      const b = bubble.current
      if (!b) return
      const bw = b.offsetWidth
      const bh = b.offsetHeight
      const roomBelow = vh - bottom - GAP
      const y =
        roomBelow >= bh + MARGIN
          ? bottom + GAP
          : top - GAP - bh >= MARGIN
            ? top - GAP - bh
            : Math.max(MARGIN, vh - bh - MARGIN)
      const x = Math.max(MARGIN, Math.min(left, vw - bw - MARGIN))
      place(b, { top: y, left: x })
    }
    layout()
    title.current?.focus()
    window.addEventListener('scroll', layout, true)
    window.addEventListener('resize', layout)
    return () => {
      window.removeEventListener('scroll', layout, true)
      window.removeEventListener('resize', layout)
    }
  }, [target])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        finish()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!step) return null
  const last = index === steps.length - 1
  return (
    <div className="tour" aria-live="polite">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="tour-shade"
          aria-hidden="true"
          ref={(el) => {
            shades.current[i] = el
          }}
        />
      ))}
      <div className="tour-ring" ref={ring} aria-hidden="true" hidden={!target} />
      <div
        className="tour-bubble"
        ref={bubble}
        role="dialog"
        aria-labelledby={titleId}
        aria-describedby={`${titleId}-body`}
        hidden={!target}
      >
        <span className="small muted">
          {t('help.tour.stepOf', { n: index + 1, total: steps.length })}
        </span>
        <h2 id={titleId} ref={title} tabIndex={-1}>
          {t(`help.tour.steps.${step.text}.title`)}
        </h2>
        <p id={`${titleId}-body`}>{t(`help.tour.steps.${step.text}.body`)}</p>
        <div className="tour-actions">
          <button type="button" className="link-btn small" onClick={finish}>
            {t('help.tour.end')}
          </button>
          <span className="spacer" />
          {index > 0 && (
            <button type="button" className="btn btn-sm" onClick={() => go(-1)}>
              {t('help.tour.back')}
            </button>
          )}
          <button type="button" className="btn btn-sm btn-primary" onClick={() => go(1)}>
            {t(last ? 'help.tour.done' : 'help.tour.next')}
          </button>
        </div>
      </div>
    </div>
  )
}
