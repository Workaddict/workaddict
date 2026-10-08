import type { TokenKind } from '../auth/session'
import { makeCheck, open, seal, verifyCheck, type KdfParams } from './vaultCrypto'

/**
 * The vault format (design D1). Only the KDF parameters, `check` and `rev` are plaintext; tokens,
 * repository names, labels and logins are inside `data`.
 */

export const VAULT_FORMAT = 'workaddict-vault'
export const VAULT_VERSION = 1

export interface VaultBlob {
  format: typeof VAULT_FORMAT
  v: number
  kdf: KdfParams
  check: string
  iv: string
  data: string
  /** Write counter for cross-tab change detection; dropped from exports. */
  rev?: number
}

export interface VaultToken {
  id: string
  token: string
  /** The account the token belongs to (`owner = login` for classic tokens). */
  owner: string
  /** GitHub login of the token's user. */
  login: string
  kind: TokenKind
  scopes?: string[]
  /** GitHub answered 401 with this token. */
  rejected?: boolean
}

export interface VaultProfile {
  id: string
  label: string
  /** `owner/name` */
  repo: string
  branch: string
  ownerType?: 'User' | 'Organization'
  tokenId: string
  /** Epoch ms of the last switch to this profile. */
  lastUsed: number
}

export interface VaultData {
  tokens: VaultToken[]
  profiles: VaultProfile[]
}

export const emptyVault = (): VaultData => ({ tokens: [], profiles: [] })

export type VaultParseError = 'format' | 'version'

/** Checks the outer shape; refuses unknown formats and newer versions. */
export function parseVault(
  raw: unknown,
): { ok: true; blob: VaultBlob } | { ok: false; error: VaultParseError } {
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw)
    } catch {
      return { ok: false, error: 'format' }
    }
  }
  const b = raw as Partial<VaultBlob> | null
  if (!b || typeof b !== 'object' || b.format !== VAULT_FORMAT)
    return { ok: false, error: 'format' }
  if (typeof b.v !== 'number' || b.v > VAULT_VERSION) return { ok: false, error: 'version' }
  const kdf = b.kdf as Partial<KdfParams> | undefined
  if (
    !kdf ||
    kdf.name !== 'PBKDF2' ||
    kdf.hash !== 'SHA-256' ||
    typeof kdf.iterations !== 'number' ||
    kdf.iterations < 1 ||
    typeof kdf.salt !== 'string' ||
    typeof b.check !== 'string' ||
    typeof b.iv !== 'string' ||
    typeof b.data !== 'string'
  ) {
    return { ok: false, error: 'format' }
  }
  return { ok: true, blob: b as VaultBlob }
}

function parseData(text: string): VaultData {
  const d = JSON.parse(text) as Partial<VaultData>
  return {
    tokens: Array.isArray(d.tokens) ? d.tokens : [],
    profiles: Array.isArray(d.profiles) ? d.profiles : [],
  }
}

/** Encrypts `data` into a blob with a fresh IV. */
export async function sealVault(
  key: CryptoKey,
  kdf: KdfParams,
  data: VaultData,
  rev: number,
  check?: string,
): Promise<VaultBlob> {
  const sealed = await seal(key, JSON.stringify(data))
  return {
    format: VAULT_FORMAT,
    v: VAULT_VERSION,
    kdf,
    check: check ?? (await makeCheck(key)),
    ...sealed,
    rev,
  }
}

/** Decrypts the blob; null when the key does not fit. */
export async function openVault(key: CryptoKey, blob: VaultBlob): Promise<VaultData | null> {
  if (!(await verifyCheck(key, blob.check))) return null
  try {
    return parseData(await open(key, blob))
  } catch {
    return null
  }
}

// ---- operations on the plaintext ---------------------------------------------

const sameRepo = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

function newId(): string {
  return crypto.randomUUID()
}

export function profileForRepo(data: VaultData, repo: string): VaultProfile | undefined {
  return data.profiles.find((p) => sameRepo(p.repo, repo))
}

export function tokenOf(data: VaultData, profile: VaultProfile): VaultToken | undefined {
  return data.tokens.find((t) => t.id === profile.tokenId)
}

/** The profile opened when a tab has none: the most recently used one with a working token. */
export function mostRecentProfile(data: VaultData): VaultProfile | undefined {
  return [...data.profiles]
    .filter((p) => !tokenOf(data, p)?.rejected)
    .sort((a, b) => b.lastUsed - a.lastUsed)[0]
}

/**
 * Tokens that may serve a repository of `owner` (design D8): fine-grained tokens of that owner,
 * and classic tokens, which can reach any owner the user has access to.
 */
export function reusableTokens(data: VaultData, owner: string): VaultToken[] {
  return data.tokens.filter(
    (t) => !t.rejected && (t.kind === 'classic' || t.owner.toLowerCase() === owner.toLowerCase()),
  )
}

export type NewToken = Omit<VaultToken, 'id' | 'rejected'>

/** Adds a token or refreshes the entry with the same value; returns the token's id. */
function putToken(data: VaultData, token: NewToken): [VaultData, string] {
  const existing = data.tokens.find((t) => t.token === token.token)
  if (existing) {
    const updated: VaultToken = { ...existing, ...token }
    delete updated.rejected
    return [
      { ...data, tokens: data.tokens.map((t) => (t === existing ? updated : t)) },
      existing.id,
    ]
  }
  const id = newId()
  return [{ ...data, tokens: [...data.tokens, { id, ...token }] }, id]
}

function dropOrphans(data: VaultData): VaultData {
  const used = new Set(data.profiles.map((p) => p.tokenId))
  return { ...data, tokens: data.tokens.filter((t) => used.has(t.id)) }
}

export interface ProfileInput {
  repo: string
  branch: string
  ownerType?: 'User' | 'Organization'
}

/**
 * Saves a profile for `repo` with `token` (one profile per repository). An existing profile for
 * the repository is pointed at the token instead of being duplicated.
 */
export function saveProfile(
  data: VaultData,
  profile: ProfileInput,
  token: NewToken,
  now = Date.now(),
): [VaultData, string] {
  const [withToken, tokenId] = putToken(data, token)
  const existing = profileForRepo(withToken, profile.repo)
  const fields = {
    repo: profile.repo,
    branch: profile.branch,
    ...(profile.ownerType ? { ownerType: profile.ownerType } : {}),
    tokenId,
    lastUsed: now,
  }
  if (existing) {
    const next = {
      ...withToken,
      profiles: withToken.profiles.map((p) => (p === existing ? { ...p, ...fields } : p)),
    }
    return [dropOrphans(next), existing.id]
  }
  const id = newId()
  const next = {
    ...withToken,
    profiles: [...withToken.profiles, { id, label: profile.repo, ...fields }],
  }
  return [next, id]
}

/**
 * Replaces the token of `profileId` with a new value (design D9). Every profile using the old
 * token gets the new one, so all of them are repaired at once.
 */
export function replaceToken(
  data: VaultData,
  profileId: string,
  token: NewToken,
  now = Date.now(),
): VaultData {
  const profile = data.profiles.find((p) => p.id === profileId)
  if (!profile) return data
  const oldId = profile.tokenId
  const [withToken, newTokenId] = putToken(data, token)
  return dropOrphans({
    ...withToken,
    profiles: withToken.profiles.map((p) =>
      p.tokenId === oldId || p.id === profileId
        ? { ...p, tokenId: newTokenId, ...(p.id === profileId ? { lastUsed: now } : {}) }
        : p,
    ),
  })
}

/** Removes a profile and its token when no other profile uses it. */
export function removeProfile(data: VaultData, profileId: string): VaultData {
  return dropOrphans({ ...data, profiles: data.profiles.filter((p) => p.id !== profileId) })
}

/** Marks the entry holding this token value as rejected (or clears the mark). */
export function setRejected(data: VaultData, tokenValue: string, rejected: boolean): VaultData {
  return {
    ...data,
    tokens: data.tokens.map((t) => {
      if (t.token !== tokenValue) return t
      const next = { ...t }
      if (rejected) next.rejected = true
      else delete next.rejected
      return next
    }),
  }
}

export function touchProfile(data: VaultData, profileId: string, now = Date.now()): VaultData {
  return {
    ...data,
    profiles: data.profiles.map((p) => (p.id === profileId ? { ...p, lastUsed: now } : p)),
  }
}

export function setLabel(data: VaultData, profileId: string, label: string): VaultData {
  const clean = label.trim()
  return {
    ...data,
    profiles: data.profiles.map((p) => (p.id === profileId ? { ...p, label: clean || p.repo } : p)),
  }
}

// ---- import merge (design D14) ---------------------------------------------------

export interface ImportConflict {
  repo: string
  localLabel: string
  importedLabel: string
}

/** Repositories present on both sides with different token values. */
export function importConflicts(local: VaultData, imported: VaultData): ImportConflict[] {
  return imported.profiles.flatMap((ip) => {
    const lp = profileForRepo(local, ip.repo)
    if (!lp) return []
    const lt = tokenOf(local, lp)?.token
    const it = tokenOf(imported, ip)?.token
    return lt !== it ? [{ repo: lp.repo, localLabel: lp.label, importedLabel: ip.label }] : []
  })
}

/**
 * Merges imported profiles by repository (case-insensitive). New repositories are added; for a
 * conflicting one, `useImported[repoLowercase]` decides. Tokens are deduplicated by value.
 */
export function mergeImport(
  local: VaultData,
  imported: VaultData,
  useImported: Record<string, boolean>,
): VaultData {
  let next = local
  for (const ip of imported.profiles) {
    const token = tokenOf(imported, ip)
    if (!token) continue
    const lp = profileForRepo(next, ip.repo)
    if (lp && !useImported[lp.repo.toLowerCase()]) continue
    const { rejected, ...fields } = token
    const [merged, tokenId] = putToken(next, {
      token: fields.token,
      owner: fields.owner,
      login: fields.login,
      kind: fields.kind,
      ...(fields.scopes ? { scopes: fields.scopes } : {}),
    })
    next = merged
    if (rejected) next = setRejected(next, token.token, true)
    if (lp) {
      next = {
        ...next,
        profiles: next.profiles.map((p) => (p.id === lp.id ? { ...p, tokenId } : p)),
      }
    } else {
      next = { ...next, profiles: [...next.profiles, { ...ip, id: newId(), tokenId }] }
    }
  }
  return dropOrphans(next)
}
