import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import '../../i18n'
import { AuthContext } from './AuthContext'
import { LoginPage } from './LoginPage'

function renderLanding() {
  const login = vi.fn(async () => {})
  const auth = { state: { status: 'loggedOut' as const }, login, logout: async () => {} }
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthContext.Provider value={auth}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
  return { login }
}

describe('landing page', () => {
  it('says the app is free and open source', () => {
    renderLanding()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Free and open-source time tracking' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/No paid plans/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Read the code on GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/Workaddict/workaddict',
    )
  })

  it('starts the demo from the intro', () => {
    const { login } = renderLanding()
    fireEvent.click(screen.getByRole('button', { name: 'Try the demo' }))
    expect(login).toHaveBeenCalledWith({ mode: 'demo' }, false)
  })

  it('lists the benefit highlights and setup steps', () => {
    renderLanding()
    const highlights = screen.getByRole('region', { name: 'Everything a small team needs' })
    expect(within(highlights).getAllByRole('listitem')).toHaveLength(6)
    expect(within(highlights).getByText('Switch from Clockify')).toBeInTheDocument()
    expect(within(highlights).getByText(/PDF, Excel, OpenDocument or CSV/)).toBeInTheDocument()
    const steps = screen.getByRole('region', { name: 'How it works' })
    expect(within(steps).getAllByRole('listitem')).toHaveLength(3)
  })

  it('opens the token help from the how-it-works steps', () => {
    renderLanding()
    const help = screen.getByText('How do I get a token?').closest('details')!
    expect(help.open).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Show me how' }))
    expect(help.open).toBe(true)
  })

  it('credits the author and links the project in the footer', () => {
    renderLanding()
    const footer = screen.getByRole('contentinfo')
    expect(footer).toHaveTextContent('Made by Benedikt Lehner')
    const expected: [string, string][] = [
      ['Benedikt Lehner', 'https://github.com/BenediktLehner'],
      ['Source code', 'https://github.com/Workaddict/workaddict'],
      ['Report an issue', 'https://github.com/Workaddict/workaddict/issues'],
      ['Security', 'https://github.com/Workaddict/workaddict/blob/main/SECURITY.md'],
    ]
    for (const [name, href] of expected) {
      const link = within(footer).getByRole('link', { name })
      expect(link).toHaveAttribute('href', href)
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noreferrer')
    }
  })
})
