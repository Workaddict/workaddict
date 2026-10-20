import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getHintLevel, setHintLevel, useIsExpert } from './hintLevel'

afterEach(() => {
  vi.restoreAllMocks()
  setHintLevel('guided')
  localStorage.clear()
})

describe('hint level', () => {
  it('is guided by default', () => {
    expect(getHintLevel()).toBe('guided')
  })

  it('remembers Expert mode on the device', () => {
    setHintLevel('expert')
    expect(localStorage.getItem('workaddict.hintLevel')).toBe('expert')
    setHintLevel('guided')
    expect(localStorage.getItem('workaddict.hintLevel')).toBeNull()
  })

  it('updates mounted components immediately', () => {
    const { result } = renderHook(() => useIsExpert())
    expect(result.current).toBe(false)
    act(() => setHintLevel('expert'))
    expect(result.current).toBe(true)
  })

  it('works when storage throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => setHintLevel('expert')).not.toThrow()
    expect(getHintLevel()).toBe('expert')
  })
})
