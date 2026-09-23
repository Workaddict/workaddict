import { screen } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import '../../i18n'
import { createMemoryAdapter, MemoryFileStore } from '../../storage'
import { renderWithSession } from '../../test/renderWithSession'
import type { Session } from '../auth/session'
import { TeamHelper } from './TeamHelper'

const alice = { login: 'alice', avatarUrl: null }
const bob = { login: 'bob', avatarUrl: null }

function adapterFor(me: typeof alice) {
  return createMemoryAdapter(me, {
    store: new MemoryFileStore(),
    collaborators: [alice, bob],
    admins: ['alice'],
  })
}

const orgSession: Session = {
  mode: 'github',
  token: 'github_pat_x',
  repo: 'my-team/time-data',
  branch: 'main',
  ownerType: 'Organization',
}

const client = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })

describe('TeamHelper', () => {
  it('gives owners of an organization repo the invite link, member helper and approvals', async () => {
    await renderWithSession(<TeamHelper />, adapterFor(alice), client(), orgSession)
    expect(await screen.findByRole('heading', { name: 'Invite members' })).toBeInTheDocument()
    expect((screen.getByRole('textbox', { name: 'Copy link' }) as HTMLInputElement).value).toMatch(
      /#\/join\?repo=my-team\/time-data$/,
    )
    expect(screen.getByRole('link', { name: /Open People/ })).toHaveAttribute(
      'href',
      'https://github.com/orgs/my-team/people',
    )
    expect(screen.getByRole('link', { name: /Open pending requests/ })).toHaveAttribute(
      'href',
      'https://github.com/organizations/my-team/settings/personal-access-token-requests',
    )
  })

  it('is hidden for members without admin permission', async () => {
    await renderWithSession(<TeamHelper />, adapterFor(bob), client(), orgSession)
    await new Promise((r) => setTimeout(r, 50))
    expect(screen.queryByRole('heading', { name: 'Invite members' })).toBeNull()
  })

  it('is hidden for personal repos and old sessions', async () => {
    await renderWithSession(<TeamHelper />, adapterFor(alice), client(), {
      ...orgSession,
      ownerType: 'User',
    })
    await new Promise((r) => setTimeout(r, 50))
    expect(screen.queryByRole('heading', { name: 'Invite members' })).toBeNull()
  })
})
