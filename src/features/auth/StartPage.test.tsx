import { screen } from '@testing-library/react'
import '../../i18n'
import { createMemoryAdapter } from '../../storage'
import { renderWithSession } from '../../test/renderWithSession'
import StartPage from './StartPage'

describe('StartPage for signed-in users', () => {
  it('shows the start page with a way back to the tracker and no sign-in form', async () => {
    await renderWithSession(<StartPage />, createMemoryAdapter({ login: 'alice', avatarUrl: null }))
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Open the tracker' }).getAttribute('href')).toBe('/')
    expect(screen.queryByRole('textbox')).toBeNull()
  })
})
