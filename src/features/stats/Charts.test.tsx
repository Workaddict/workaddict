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

  it('labels every day of "Last 14 days" on a 320 px phone, including 28 Sep and 5 Oct', async () => {
    stubResizeObserver(258) // 320 px screen minus page and card padding
    const range = presetRange('lastTwoWeeks')
    const buckets = timeBuckets([], range, EMPTY_WORKSPACE)
    const { container } = render(<HoursBarChart buckets={buckets} projects={[]} granularity="day" />)

    await waitFor(() => expect(tickTexts(container)).toHaveLength(15))
    const texts = tickTexts(container)
    // Day of the month with the weekday initial: 28 Sep (Mon) .. 12 Oct (Mon).
    expect(texts[0]).toBe('28M')
    expect(texts).toContain('5M')
    expect(texts[14]).toBe('12M')
  })

  it('keeps long labels on desktop', async () => {
    stubResizeObserver(900)
    const buckets = timeBuckets([], presetRange('lastTwoWeeks'), EMPTY_WORKSPACE)
    const { container } = render(<HoursBarChart buckets={buckets} projects={[]} granularity="day" />)

    await waitFor(() => expect(tickTexts(container)).toHaveLength(15))
    expect(tickTexts(container)).toContain('Mon 28')
  })
})
