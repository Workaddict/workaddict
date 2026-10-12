import { render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { EMPTY_WORKSPACE } from '../../domain/types'
import '../../i18n'
import { HoursBarChart } from './Charts'
import { presetRange, timeBuckets } from './stats'

/** Reports a fixed container size, like the chart card on a phone. */
function stubResizeObserver(width: number, height = 260) {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(private cb: ResizeObserverCallback) {}
      observe() {
        this.cb([{ contentRect: { width, height } } as ResizeObserverEntry], this as never)
      }
      unobserve() {}
      disconnect() {}
    },
  )
}

const tickTexts = (container: HTMLElement) =>
  [...container.querySelectorAll('.recharts-xAxis-tick-labels text')]
    .map((t) => t.textContent ?? '')
    .filter(Boolean)

describe('HoursBarChart axis', () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-10-12T10:00:00Z') }))
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('labels every one of the last 14 days on a 320 px phone, including 5 Oct', async () => {
    stubResizeObserver(258) // 320 px screen minus page and card padding
    const range = presetRange('lastTwoWeeks')
    const buckets = timeBuckets([], range, EMPTY_WORKSPACE)
    const { container } = render(<HoursBarChart buckets={buckets} projects={[]} granularity="day" />)

    await waitFor(() => expect(tickTexts(container)).toHaveLength(14))
    const texts = tickTexts(container)
    // Day of the month with the weekday initial: 29 Sep (Tue) .. 12 Oct (Mon).
    expect(texts[0]).toBe('29T')
    expect(texts).toContain('5M')
    expect(texts[13]).toBe('12M')
  })

  it('keeps long labels on desktop', async () => {
    stubResizeObserver(900)
    const buckets = timeBuckets([], presetRange('lastTwoWeeks'), EMPTY_WORKSPACE)
    const { container } = render(<HoursBarChart buckets={buckets} projects={[]} granularity="day" />)

    await waitFor(() => expect(tickTexts(container)).toHaveLength(14))
    expect(tickTexts(container)).toContain('Mon 5')
  })
})
