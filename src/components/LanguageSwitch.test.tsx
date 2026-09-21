import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import i18n, { setLanguage } from '../i18n'
import { LanguageSwitch } from './LanguageSwitch'

describe('LanguageSwitch', () => {
  afterEach(() => act(() => setLanguage('en')))

  it('changes the UI language immediately and remembers it', async () => {
    act(() => setLanguage('en'))
    render(<LanguageSwitch />)
    const select = screen.getByRole('combobox', { name: 'Language' })
    await act(async () => {
      fireEvent.change(select, { target: { value: 'de' } })
    })
    expect(i18n.language).toBe('de')
    expect(localStorage.getItem('workaddict.lang')).toBe('de')
    expect(screen.getByRole('combobox', { name: 'Sprache' })).toBeInTheDocument()
  })
})
