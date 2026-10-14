import { fireEvent, screen, waitFor } from '@testing-library/react'
import '../../i18n'
import { createMemoryAdapter, MemoryFileStore } from '../../storage'
import { renderWithSession } from '../../test/renderWithSession'
import { AiSection } from './AiSection'
import ConnectAiPage from './ConnectAiPage'

const alice = { login: 'alice', avatarUrl: null }
const bob = { login: 'bob', avatarUrl: null }

describe('AI assistants setting', () => {
  it('lets a team leader turn marking on', async () => {
    const adapter = createMemoryAdapter(alice, { collaborators: [alice], admins: ['alice'] })
    await renderWithSession(<AiSection />, adapter)
    const box = (await screen.findByRole('checkbox', {
      name: 'Mark AI entries',
    })) as HTMLInputElement
    await waitFor(() => expect(box).not.toBeDisabled())
    expect(box.checked).toBe(false)
    fireEvent.click(box)
    await waitFor(async () => expect((await adapter.getWorkspace()).markAiEntries).toBe(true))
  })

  it('shows the setting read-only to other roles', async () => {
    const store = new MemoryFileStore()
    await createMemoryAdapter(alice, { store, admins: ['alice'] }).init()
    const adapter = createMemoryAdapter(bob, {
      store,
      admins: ['alice'],
      collaborators: [alice, bob],
    })
    await renderWithSession(<AiSection />, adapter)
    expect(await screen.findByRole('checkbox', { name: 'Mark AI entries' })).toBeDisabled()
    expect(screen.getByText(/Only team leaders can change this/)).toBeTruthy()
  })
})

describe('ConnectAiPage', () => {
  it("fills in the team's data repository and no token", async () => {
    const adapter = createMemoryAdapter(alice, { admins: ['alice'] })
    await renderWithSession(<ConnectAiPage />, adapter, undefined, {
      mode: 'github',
      token: 'github_pat_SECRET',
      repo: 'acme/time-data',
      branch: 'main',
    })
    fireEvent.click(screen.getByRole('button', { name: 'Windows' }))
    expect(screen.getByText(/setx WORKADDICT_REPO "acme\/time-data"/)).toBeTruthy()
    expect(document.body.textContent).not.toContain('SECRET')
  })
})
