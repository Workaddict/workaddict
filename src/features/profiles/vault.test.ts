import { describe, expect, it } from 'vitest'
import {
  emptyVault,
  importConflicts,
  mergeImport,
  mostRecentProfile,
  openVault,
  parseVault,
  removeProfile,
  replaceToken,
  reusableTokens,
  saveProfile,
  sealVault,
  setRejected,
  type NewToken,
  type VaultData,
} from './vault'
import { deriveKey, KDF_ITERATIONS, newKdf } from './vaultCrypto'

const FAST = 1000
const acmeToken: NewToken = {
  token: 'github_pat_acme',
  owner: 'acme',
  login: 'alice',
  kind: 'fineGrained',
}
const globexToken: NewToken = { ...acmeToken, token: 'github_pat_globex', owner: 'globex' }

function sample(): VaultData {
  let [data] = saveProfile(emptyVault(), { repo: 'acme/time-data', branch: 'main' }, acmeToken, 1)
  ;[data] = saveProfile(data, { repo: 'globex/hours', branch: 'main' }, globexToken, 2)
  return data
}

async function sealed(passphrase = 'correct horse battery', data = sample()) {
  const kdf = newKdf(FAST)
  const key = await deriveKey(passphrase, kdf)
  return { key, kdf, blob: await sealVault(key, kdf, data, 1) }
}

describe('vault crypto', () => {
  it('uses 600,000 PBKDF2 iterations and a 16-byte salt by default', () => {
    const kdf = newKdf()
    expect(kdf.iterations).toBe(KDF_ITERATIONS)
    expect(KDF_ITERATIONS).toBeGreaterThanOrEqual(600_000)
    expect(atob(kdf.salt)).toHaveLength(16)
  })

  it('round-trips the data', async () => {
    const { key, blob } = await sealed()
    const opened = await openVault(key, blob)
    expect(opened?.profiles.map((p) => p.repo)).toEqual(['acme/time-data', 'globex/hours'])
    expect(opened?.tokens.map((t) => t.token)).toEqual(['github_pat_acme', 'github_pat_globex'])
  })

  it('rejects a wrong passphrase', async () => {
    const { blob } = await sealed()
    const wrong = await deriveKey('wrong passphrase!', blob.kdf)
    expect(await openVault(wrong, blob)).toBeNull()
  })

  it('uses a fresh IV for every write', async () => {
    const { key, kdf, blob } = await sealed()
    const again = await sealVault(key, kdf, sample(), 2, blob.check)
    expect(again.iv).not.toBe(blob.iv)
    expect(again.data).not.toBe(blob.data)
    expect(atob(again.iv)).toHaveLength(12)
  })

  it('keeps tokens, repositories and logins out of the serialized vault', async () => {
    const { blob } = await sealed()
    const text = JSON.stringify(blob)
    for (const secret of ['github_pat', 'acme', 'globex', 'time-data', 'alice']) {
      expect(text).not.toContain(secret)
    }
  })

  it('derives the key with the parameters stored in the vault', async () => {
    const { blob } = await sealed('correct horse battery')
    expect(blob.kdf.iterations).toBe(FAST)
    const fromStored = await deriveKey('correct horse battery', blob.kdf)
    expect(await openVault(fromStored, blob)).not.toBeNull()
    const otherCount = await deriveKey('correct horse battery', {
      ...blob.kdf,
      iterations: FAST + 1,
    })
    expect(await openVault(otherCount, blob)).toBeNull()
  })
})

describe('vault format', () => {
  it('accepts a sealed vault', async () => {
    const { blob } = await sealed()
    expect(parseVault(JSON.stringify(blob))).toEqual({ ok: true, blob })
  })

  it('refuses unknown formats and newer versions', async () => {
    const { blob } = await sealed()
    expect(parseVault('not json')).toEqual({ ok: false, error: 'format' })
    expect(parseVault({ ...blob, format: 'other' })).toEqual({ ok: false, error: 'format' })
    expect(parseVault({ ...blob, v: 2 })).toEqual({ ok: false, error: 'version' })
    expect(parseVault({ ...blob, kdf: { ...blob.kdf, name: 'Argon2id' } })).toEqual({
      ok: false,
      error: 'format',
    })
  })
})

describe('profiles and tokens', () => {
  it('stores one token for two repositories of the same owner', () => {
    let [data] = saveProfile(emptyVault(), { repo: 'acme/time-data', branch: 'main' }, acmeToken)
    ;[data] = saveProfile(data, { repo: 'acme/other-data', branch: 'main' }, acmeToken)
    expect(data.tokens).toHaveLength(1)
    expect(data.profiles.map((p) => p.tokenId)).toEqual([data.tokens[0]!.id, data.tokens[0]!.id])
  })

  it('keeps one profile per repository, case-insensitive', () => {
    const [data, id] = saveProfile(sample(), { repo: 'ACME/Time-Data', branch: 'dev' }, acmeToken)
    expect(data.profiles).toHaveLength(2)
    expect(data.profiles.find((p) => p.id === id)?.branch).toBe('dev')
  })

  it('removes the token with its last profile', () => {
    const data = sample()
    const globex = data.profiles.find((p) => p.repo === 'globex/hours')!
    const next = removeProfile(data, globex.id)
    expect(next.tokens.map((t) => t.owner)).toEqual(['acme'])
  })

  it('opens the most recently used profile with a working token', () => {
    const data = sample()
    expect(mostRecentProfile(data)?.repo).toBe('globex/hours')
    expect(mostRecentProfile(setRejected(data, 'github_pat_globex', true))?.repo).toBe(
      'acme/time-data',
    )
  })

  it('offers tokens of the same owner and classic tokens for reuse', () => {
    let [data] = saveProfile(emptyVault(), { repo: 'acme/a', branch: 'main' }, acmeToken)
    expect(reusableTokens(data, 'ACME')).toHaveLength(1)
    expect(reusableTokens(data, 'globex')).toHaveLength(0)
    ;[data] = saveProfile(
      data,
      { repo: 'me/b', branch: 'main' },
      {
        token: 'ghp_classic',
        owner: 'me',
        login: 'me',
        kind: 'classic',
      },
    )
    expect(reusableTokens(data, 'globex').map((t) => t.kind)).toEqual(['classic'])
    expect(reusableTokens(setRejected(data, 'ghp_classic', true), 'globex')).toEqual([])
  })

  it('replacing a token repairs every profile that used it', () => {
    const [initial, first] = saveProfile(
      emptyVault(),
      { repo: 'acme/a', branch: 'main' },
      acmeToken,
    )
    let data = initial
    ;[data] = saveProfile(data, { repo: 'acme/b', branch: 'main' }, acmeToken)
    data = setRejected(data, acmeToken.token, true)
    const next = replaceToken(data, first, { ...acmeToken, token: 'github_pat_new' })
    expect(next.tokens).toHaveLength(1)
    expect(next.tokens[0]).toMatchObject({ token: 'github_pat_new' })
    expect(next.tokens[0]!.rejected).toBeUndefined()
    expect(new Set(next.profiles.map((p) => p.tokenId))).toEqual(new Set([next.tokens[0]!.id]))
  })
})

describe('import merge', () => {
  it('adds new repositories and asks about different tokens', () => {
    const [local] = saveProfile(emptyVault(), { repo: 'acme/time-data', branch: 'main' }, acmeToken)
    const imported = saveProfile(
      saveProfile(
        emptyVault(),
        { repo: 'acme/time-data', branch: 'main' },
        {
          ...acmeToken,
          token: 'github_pat_other',
        },
      )[0],
      { repo: 'globex/hours', branch: 'main' },
      globexToken,
    )[0]
    expect(importConflicts(local, imported).map((c) => c.repo)).toEqual(['acme/time-data'])

    const kept = mergeImport(local, imported, {})
    expect(kept.profiles.map((p) => p.repo)).toEqual(['acme/time-data', 'globex/hours'])
    expect(kept.tokens.map((t) => t.token).sort()).toEqual(['github_pat_acme', 'github_pat_globex'])

    const replaced = mergeImport(local, imported, { 'acme/time-data': true })
    expect(replaced.tokens.map((t) => t.token).sort()).toEqual([
      'github_pat_globex',
      'github_pat_other',
    ])
  })

  it('deduplicates tokens by value', () => {
    const [local] = saveProfile(emptyVault(), { repo: 'acme/a', branch: 'main' }, acmeToken)
    const [imported] = saveProfile(emptyVault(), { repo: 'acme/b', branch: 'main' }, acmeToken)
    const merged = mergeImport(local, imported, {})
    expect(merged.tokens).toHaveLength(1)
    expect(merged.profiles).toHaveLength(2)
  })
})
