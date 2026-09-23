import { useEffect, useRef } from 'react'
import { formatClock } from '../../domain/time'
import { useMyTimer } from '../data/hooks'
import { useNow } from './useNow'

/** Shows the own running timer's elapsed time in the tab title, restoring the title afterwards. */
export function useTimerTitle() {
  const timer = useMyTimer()
  const now = useNow(!!timer)
  const original = useRef<string | null>(null)

  const title = timer
    ? `▶ ${formatClock(now - new Date(timer.start).getTime())} · Workaddict`
    : null

  useEffect(() => {
    if (title === null) return
    original.current ??= document.title
    if (document.title !== title) document.title = title
  }, [title])

  const running = title !== null
  useEffect(() => {
    if (running) return
    if (original.current !== null) document.title = original.current
    original.current = null
  }, [running])

  useEffect(
    () => () => {
      if (original.current !== null) document.title = original.current
    },
    [],
  )
}
