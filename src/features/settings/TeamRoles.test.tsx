import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import '../../i18n'
import { createMemoryAdapter, MemoryFileStore } from '../../storage'
import { renderWithSession } from '../../test/renderWithSession'
import { TeamRolesSection } from './TeamRoles'

const alice = { login: 'alice', avatarUrl: null }
const bob = { login: 'bob', avatarUrl: null }

function team(me: typeof alice) {
  const store = new MemoryFileStore()
  const opts = { store, collaborators: [alice, bob], admins: ['alice'] }
  return { adapter: createMemoryAdapter(me, opts), store }
}

describe('TeamRolesSection', () => {
  it('lets the owner change a member role and saves it', async () => {
    const { adapter, store } = team(alice)
    await renderWithSession(<TeamRolesSection />, adapter)

    const select = await screen.findByRole('combobox', { name: 'Role of bob' })
    expect(screen.queryByRole('combobox', { name: 'Role of alice' })).toBeNull()
    fireEvent.change(select, { target: { value: 'editor' } })

    await waitFor(() => expect(store.dump()['roles.json']).toEqual({ roles: { bob: 'editor' } }))
    expect(screen.getByText(/Owner · Team leader/)).toBeInTheDocument()
  })

  it('shows roles read-only to non-owners', async () => {
    const { adapter } = team(bob)
    await renderWithSession(<TeamRolesSection />, adapter)

    expect(await screen.findByText('Worker')).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(screen.getByText(/Only owners/)).toBeInTheDocument()
    expect(screen.getByText(/enforced by this app, not by GitHub/)).toBeInTheDocument()
  })
})
