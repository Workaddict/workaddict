import { describe, expect, it } from 'vitest'
import { fakeDevice, settle } from './testVault'
import { removeProfile, saveProfile, type NewToken } from './vault'
import { VAULT_KEY } from './vaultSync'

const PASS = 'correct horse battery'
const acme: NewToken = {
  token: 'github_pat_acme',
  owner: 'acme',
  login: 'alice',
  kind: 'fineGrained',
}
const globex: NewToken = { ...acme, token: 'github_pat_globex', owner: 'globex' }

describe('vault store', () => {
  it('creates, locks and unlocks', async () => {
    const device = fakeDevice()
    const tab = device.tab()
    await tab.init()
    expect(tab.getSnapshot()).toMatchObject({ ready: true, status: 'none' })

    await tab.create(PASS, 'ask')
    expect(tab.getSnapshot().status).toBe('unlocked')
    expect(device.storage.get(VAULT_KEY)).toBeTruthy()
    expect(device.storedKey()).toBeUndefined()

    await tab.lock()
    expect(tab.getSnapshot()).toMatchObject({ status: 'locked', data: null })
    expect(await tab.unlock('wrong passphrase', 'ask')).toBe(false)
    expect(tab.getSnapshot().status).toBe('locked')
    expect(await tab.unlock(PASS, 'ask')).toBe(true)
    expect(tab.getSnapshot().status).toBe('unlocked')
  })

  it('stays unlocked across a restart only in "stay" mode', async () => {
    const device = fakeDevice()
    const first = device.tab()
    await first.create(PASS, 'stay')
    expect(device.storedKey()).toBeDefined()

    // A new tab after all tabs closed: nothing in memory, storage and IndexedDB stay.
    const afterRestart = device.tab()
    await afterRestart.init()
    expect(afterRestart.getSnapshot()).toMatchObject({ status: 'unlocked', mode: 'stay' })

    await afterRestart.setMode('ask')
    expect(device.storedKey()).toBeUndefined()
  })

  it('shares the unlocked state with a new tab', async () => {
    const device = fakeDevice()
    const a = device.tab()
    await a.create(PASS, 'ask')
    const b = device.tab()
    await b.init()
    expect(b.getSnapshot().status).toBe('unlocked')
  })

  it('a tab without BroadcastChannel asks on its own', async () => {
    const device = fakeDevice({ channel: false })
    const a = device.tab()
    await a.create(PASS, 'ask')
    const b = device.tab()
    await b.init()
    expect(b.getSnapshot().status).toBe('locked')
  })

  it('locks every tab', async () => {
    const device = fakeDevice()
    const a = device.tab()
    const b = device.tab()
    await a.create(PASS, 'stay')
    await settle()
    expect(b.getSnapshot().status).toBe('unlocked')
    const events: string[] = []
    b.onEvent((e) => events.push(e))
    await a.lock()
    await settle()
    expect(b.getSnapshot().status).toBe('locked')
    expect(events).toContain('locked')
    expect(device.storedKey()).toBeUndefined()
  })

  it('shows changes from another tab without a reload', async () => {
    const device = fakeDevice()
    const a = device.tab()
    const b = device.tab()
    await a.create(PASS, 'ask')
    await settle()
    await a.update((d) => saveProfile(d, { repo: 'globex/hours', branch: 'main' }, globex)[0])
    await settle()
    expect(b.getSnapshot().data?.profiles.map((p) => p.repo)).toEqual(['globex/hours'])
  })

  it('keeps both changes of concurrent writes', async () => {
    const device = fakeDevice()
    const a = device.tab()
    const b = device.tab()
    await a.create(PASS, 'ask')
    await settle()
    await Promise.all([
      a.update((d) => saveProfile(d, { repo: 'acme/time-data', branch: 'main' }, acme)[0]),
      b.update((d) => saveProfile(d, { repo: 'globex/hours', branch: 'main' }, globex)[0]),
    ])
    await settle()
    const repos = (s: typeof a) =>
      s
        .getSnapshot()
        .data?.profiles.map((p) => p.repo)
        .sort()
    expect(repos(a)).toEqual(['acme/time-data', 'globex/hours'])
    expect(repos(b)).toEqual(['acme/time-data', 'globex/hours'])
  })

  it('removes the token with the last profile using it', async () => {
    const device = fakeDevice()
    const a = device.tab()
    await a.create(PASS, 'ask')
    const data = await a.update(
      (d) => saveProfile(d, { repo: 'globex/hours', branch: 'main' }, globex)[0],
    )
    const after = await a.update((d) => removeProfile(d, data.profiles[0]!.id))
    expect(after.tokens).toEqual([])
  })

  it('keeps other tabs unlocked after a passphrase change', async () => {
    const device = fakeDevice()
    const a = device.tab()
    const b = device.tab()
    await a.create(PASS, 'ask')
    await settle()
    expect(await a.changePassphrase('wrong', 'new passphrase!')).toBe(false)
    expect(await a.changePassphrase(PASS, 'new passphrase!')).toBe(true)
    await settle()
    expect(b.getSnapshot().status).toBe('unlocked')
    await b.update((d) => d)
    expect(await a.verify(PASS)).toBe(false)
    expect(await a.verify('new passphrase!')).toBe(true)
  })

  it('forget removes everything and tells other tabs', async () => {
    const device = fakeDevice()
    const a = device.tab()
    const b = device.tab()
    await a.create(PASS, 'stay')
    await settle()
    const events: string[] = []
    b.onEvent((e) => events.push(e))
    await a.forget()
    await settle()
    expect(device.storage.size).toBe(0)
    expect(device.storedKey()).toBeUndefined()
    expect(b.getSnapshot().status).toBe('none')
    expect(events).toContain('forgotten')
  })
})
