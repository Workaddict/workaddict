import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import '../../i18n'
import { createMemoryAdapter } from '../../storage'
import { renderWithSession } from '../../test/renderWithSession'
import SettingsPage from './SettingsPage'

describe('Settings about section', () => {
  it('shows version, author and project links to a worker in demo mode', async () => {
    const bob = { login: 'bob', avatarUrl: null }
    const adapter = createMemoryAdapter(bob, { collaborators: [bob], admins: [] })
    await renderWithSession(<SettingsPage />, adapter)

    await screen.findByText('Worker')
    const about = screen.getByRole('heading', { name: 'About' }).closest('section')!
    expect(within(about).getByText(`v${__APP_VERSION__}`)).toBeInTheDocument()
    expect(within(about).getByRole('link', { name: 'Benedikt Lehner' })).toHaveAttribute(
      'href',
      'https://github.com/BenediktLehner',
    )
    expect(within(about).getByRole('link', { name: 'Workaddict/workaddict' })).toHaveAttribute(
      'href',
      'https://github.com/Workaddict/workaddict',
    )
    expect(within(about).getByRole('link', { name: 'Report an issue' })).toHaveAttribute(
      'href',
      'https://github.com/Workaddict/workaddict/issues',
    )
    expect(within(about).getByRole('link', { name: 'Security policy' })).toHaveAttribute(
      'href',
      'https://github.com/Workaddict/workaddict/blob/main/SECURITY.md',
    )
    expect(within(about).getByRole('link', { name: 'AGPL-3.0' })).toHaveAttribute(
      'href',
      'https://github.com/Workaddict/workaddict/blob/main/LICENSE',
    )
  })
})
