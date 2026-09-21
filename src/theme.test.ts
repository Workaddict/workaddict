import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveTheme, setTheme, toggleTheme, useThemePref } from './theme'
import { renderHook } from '@testing-library/react'

function mockOsDark(dark: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: dark && query.includes('dark'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

describe('theme toggle', () => {
  afterEach(() => {
    setTheme('system')
    vi.unstubAllGlobals()
  })

  it('switches from system dark to explicit light', () => {
    mockOsDark(true)
    setTheme('system')
    expect(resolveTheme()).toBe('dark')
    toggleTheme()
    expect(renderHook(() => useThemePref()).result.current).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(localStorage.getItem('workaddict.theme')).toBe('light')
  })

  it('switches from light to dark and back to system on request', () => {
    mockOsDark(false)
    setTheme('light')
    toggleTheme()
    expect(resolveTheme()).toBe('dark')
    expect(localStorage.getItem('workaddict.theme')).toBe('dark')
    setTheme('system')
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
    expect(resolveTheme()).toBe('light')
  })
})
