import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import '../i18n'
import { fakeAuth } from '../test/fakeAuth'
import { AuthContext } from '../features/auth/AuthContext'
import { App } from './App'

function renderSignedOut(hash: string) {
  window.location.hash = hash
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthContext.Provider value={fakeAuth({ status: 'loggedOut' })}>
        <App />
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
}

afterEach(() => {
  window.location.hash = ''
})

describe('help routes', () => {
  it('sends the old token help address to the token topic', async () => {
    renderSignedOut('#/token-help')
    await waitFor(() => expect(window.location.hash).toBe('#/help/token'))
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Token & data repository' }),
    ).toBeInTheDocument()
  })

  it('shows the help index to visitors who are not signed in', async () => {
    renderSignedOut('#/help')
    expect(await screen.findByRole('heading', { level: 1, name: 'Help' })).toBeInTheDocument()
  })
})
