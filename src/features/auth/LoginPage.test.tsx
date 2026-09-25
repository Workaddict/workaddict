import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { setLanguage } from '../../i18n'
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
      screen.getByRole('heading', { level: 1, name: 'Free time tracking. Your data stays yours.' }),
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

  it('offers the demo only once, in the intro', () => {
    renderLanding()
    expect(screen.getAllByRole('button', { name: /demo/i })).toHaveLength(1)
    expect(screen.getByRole('heading', { name: 'Already set up? Sign in' })).toBeInTheDocument()
  })

  it('moves to the sign-in form from the how-it-works steps', () => {
    renderLanding()
    fireEvent.click(screen.getByRole('button', { name: 'Go to sign-in' }))
    expect(screen.getByPlaceholderText('owner/name')).toHaveFocus()
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

  it('links the token help page from the sign-in card and the steps', () => {
    renderLanding()
    expect(screen.queryByRole('group')).toBeNull()
    expect(screen.getByRole('link', { name: 'How do I get a token?' })).toHaveAttribute(
      'href',
      '/token-help',
    )
    expect(screen.getByRole('link', { name: 'Show me how' })).toHaveAttribute('href', '/token-help')
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
      ['AGPL-3.0', 'https://github.com/Workaddict/workaddict/blob/main/LICENSE'],
    ]
    for (const [name, href] of expected) {
      const link = within(footer).getByRole('link', { name })
      expect(link).toHaveAttribute('href', href)
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noreferrer')
    }
  })

  it('links the search pages in the UI language, in the same tab', () => {
    renderLanding()
    const footer = screen.getByRole('contentinfo')
    const alternative = within(footer).getByRole('link', { name: 'Clockify alternative' })
    expect(alternative).toHaveAttribute('href', './clockify-alternative/')
    expect(alternative).not.toHaveAttribute('target')
    expect(within(footer).getByRole('link', { name: 'Import from Clockify' })).toHaveAttribute(
      'href',
      './import-from-clockify/',
    )
    const highlights = screen.getByRole('region', { name: 'Everything a small team needs' })
    expect(within(highlights).getByRole('link', { name: 'Read the import guide' })).toHaveAttribute(
      'href',
      './import-from-clockify/',
    )
  })

  it('links the German search pages when German is selected', () => {
    act(() => setLanguage('de'))
    try {
      renderLanding()
      const footer = screen.getByRole('contentinfo')
      expect(within(footer).getByRole('link', { name: 'Clockify-Alternative' })).toHaveAttribute(
        'href',
        './de/clockify-alternative/',
      )
      expect(screen.getByRole('link', { name: 'Zur Import-Anleitung' })).toHaveAttribute(
        'href',
        './de/import-from-clockify/',
      )
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'Kostenlose Zeiterfassung. Deine Daten bleiben bei dir.',
        }),
      ).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Kostenlos einrichten' })).toBeInTheDocument()
    } finally {
      act(() => setLanguage('en'))
    }
  })
})
