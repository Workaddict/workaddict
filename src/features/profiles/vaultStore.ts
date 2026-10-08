import { useSyncExternalStore } from 'react'
import {
  emptyVault,
  openVault,
  parseVault,
  sealVault,
  type VaultBlob,
  type VaultData,
} from './vault'
import { deriveKey, makeCheck, newKdf } from './vaultCrypto'
import { browserEnv, KEY_WAIT_MS, VAULT_KEY, type VaultEnv, type VaultMessage } from './vaultSync'

/**
 * The profile vault of this browser (design D1–D4, D15): create, unlock, lock, read-modify-write
 * under a cross-tab lock, change passphrase, reset. One instance per tab; tabs share the key over
 * the channel.
 */

/** "Ask on every visit" keeps the key in memory only; "stay" also stores it in IndexedDB. */
export type UnlockMode = 'ask' | 'stay'
const MODE_KEY = 'workaddict.vaultUnlock'

export type VaultStatus = 'none' | 'locked' | 'unlocked'

export interface VaultSnapshot {
  /** False until startup found out whether the vault can be unlocked without a prompt. */
  ready: boolean
  status: VaultStatus
  /** Decrypted contents while unlocked. */
  data: VaultData | null
  /** The saved unlock mode; pre-sets the "Stay unlocked" checkbox. */
  mode: UnlockMode
}

/** What happened, for listeners that react to more than the snapshot (other tabs locking etc.). */
export type VaultEvent = 'unlocked' | 'locked' | 'changed' | 'forgotten'

export class VaultLockedError extends Error {
  constructor() {
    super('The profile vault is locked')
  }
}

export interface VaultStore {
  getSnapshot(): VaultSnapshot
  subscribe(fn: () => void): () => void
  onEvent(fn: (e: VaultEvent) => void): () => void
  /** Startup: unlock from IndexedDB or from another tab when possible. Idempotent. */
  init(): Promise<void>
  create(passphrase: string, mode: UnlockMode, data?: VaultData): Promise<void>
  /** False for a wrong passphrase; the vault stays locked and unchanged. */
  unlock(passphrase: string, mode: UnlockMode): Promise<boolean>
  lock(): Promise<void>
  update(fn: (data: VaultData) => VaultData): Promise<VaultData>
  verify(passphrase: string): Promise<boolean>
  changePassphrase(current: string, next: string): Promise<boolean>
  setMode(mode: UnlockMode): Promise<void>
  /** Removes the vault and the stored key; other tabs sign out ("Forget all", "Reset"). */
  forget(): Promise<void>
  /** The encrypted vault without `rev`, for export. */
  exportBlob(): VaultBlob | null
  /** Makes an imported vault this device's vault, replacing any existing one. */
  adopt(blob: VaultBlob, key: CryptoKey, mode: UnlockMode): Promise<void>
  /** Stops listening to other tabs (tests). */
  dispose(): void
}

export function createVaultStore(env: VaultEnv, opts: { iterations?: number } = {}): VaultStore {
  let key: CryptoKey | null = null
  const readMode = (): UnlockMode => (env.storage.get(MODE_KEY) === 'stay' ? 'stay' : 'ask')
  let snapshot: VaultSnapshot = {
    ready: false,
    status: 'none',
    data: null,
    mode: readMode(),
  }
  const listeners = new Set<() => void>()
  const eventListeners = new Set<(e: VaultEvent) => void>()
  let initPromise: Promise<void> | null = null
  let keyArrived: (() => void) | null = null

  const setSnapshot = (patch: Partial<VaultSnapshot>) => {
    snapshot = { ...snapshot, ...patch }
    listeners.forEach((l) => l())
  }
  const emit = (e: VaultEvent) => eventListeners.forEach((l) => l(e))
  const post = (msg: VaultMessage) => env.channel?.post(msg)

  const readBlob = (): VaultBlob | null => {
    const raw = env.storage.get(VAULT_KEY)
    if (!raw) return null
    const parsed = parseVault(raw)
    return parsed.ok ? parsed.blob : null
  }
  const writeBlob = (blob: VaultBlob) => env.storage.set(VAULT_KEY, JSON.stringify(blob))

  const saveMode = (mode: UnlockMode) => {
    if (mode === 'stay') env.storage.set(MODE_KEY, 'stay')
    else env.storage.remove(MODE_KEY)
  }

  /** Status without a key: whether a vault exists at all. */
  const lockedStatus = (): VaultStatus => (readBlob() ? 'locked' : 'none')

  const dropKey = () => {
    key = null
    setSnapshot({ status: lockedStatus(), data: null })
  }

  /** Takes a key (from IndexedDB, another tab or a passphrase) if it opens the current vault. */
  const adoptKey = async (candidate: CryptoKey): Promise<boolean> => {
    const blob = readBlob()
    if (!blob) return false
    const data = await openVault(candidate, blob)
    if (!data) return false
    const wasUnlocked = snapshot.status === 'unlocked'
    key = candidate
    setSnapshot({ status: 'unlocked', data, mode: readMode() })
    emit(wasUnlocked ? 'changed' : 'unlocked')
    keyArrived?.()
    return true
  }

  /** Re-reads the vault after another tab wrote it. */
  const refresh = async () => {
    if (!key) {
      setSnapshot({ status: lockedStatus(), mode: readMode() })
      return
    }
    const blob = readBlob()
    const data = blob ? await openVault(key, blob) : null
    if (!data) {
      // Removed, or re-encrypted under a key this tab did not receive.
      dropKey()
      emit(blob ? 'locked' : 'forgotten')
      return
    }
    setSnapshot({ data, mode: readMode() })
    emit('changed')
  }

  const onMessage = (msg: VaultMessage) => {
    switch (msg.type) {
      case 'key-request':
        if (key) post({ type: 'key', key })
        break
      case 'key':
        if (msg.key !== key) void adoptKey(msg.key)
        break
      case 'locked':
        if (key) {
          dropKey()
          emit('locked')
        }
        break
      case 'changed':
        void refresh()
        break
      case 'forget':
        key = null
        setSnapshot({ status: 'none', data: null, mode: 'ask' })
        emit('forgotten')
        break
    }
  }
  const unsubscribe = [
    env.channel?.subscribe(onMessage),
    env.onStorage(VAULT_KEY, () => void refresh()),
  ]

  const store: VaultStore = {
    getSnapshot: () => snapshot,
    subscribe(fn) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    onEvent(fn) {
      eventListeners.add(fn)
      return () => eventListeners.delete(fn)
    },

    init() {
      initPromise ??= (async () => {
        // Created or unlocked before startup finished.
        if (key) return setSnapshot({ ready: true })
        if (!readBlob()) {
          setSnapshot({ ready: true, status: 'none' })
          return
        }
        setSnapshot({ status: 'locked' })
        const stored = await env.keys.get()
        if (stored && (await adoptKey(stored))) {
          setSnapshot({ ready: true })
          return
        }
        if (env.channel && !key) {
          const arrived = new Promise<void>((resolve) => (keyArrived = resolve))
          post({ type: 'key-request' })
          await Promise.race([arrived, env.wait(KEY_WAIT_MS)])
          keyArrived = null
        }
        setSnapshot({ ready: true })
      })()
      return initPromise
    },

    async create(passphrase, mode, data = emptyVault()) {
      const kdf = newKdf(opts.iterations)
      const newKey = await deriveKey(passphrase, kdf)
      const blob = await sealVault(newKey, kdf, data, 1)
      await env.withLock(async () => writeBlob(blob))
      key = newKey
      saveMode(mode)
      if (mode === 'stay') await env.keys.set(newKey)
      else await env.keys.remove()
      setSnapshot({ ready: true, status: 'unlocked', data, mode })
      emit('unlocked')
      post({ type: 'key', key: newKey })
    },

    async unlock(passphrase, mode) {
      const blob = readBlob()
      if (!blob) return false
      const candidate = await deriveKey(passphrase, blob.kdf)
      const data = await openVault(candidate, blob)
      if (!data) return false
      key = candidate
      saveMode(mode)
      if (mode === 'stay') await env.keys.set(candidate)
      else await env.keys.remove()
      setSnapshot({ status: 'unlocked', data, mode })
      emit('unlocked')
      post({ type: 'key', key: candidate })
      return true
    },

    async lock() {
      key = null
      await env.keys.remove()
      setSnapshot({ status: lockedStatus(), data: null })
      emit('locked')
      post({ type: 'locked' })
    },

    async update(fn) {
      return env.withLock(async () => {
        const blob = readBlob()
        if (!blob || !key) throw new VaultLockedError()
        const current = await openVault(key, blob)
        if (!current) {
          dropKey()
          emit('locked')
          throw new VaultLockedError()
        }
        const next = fn(current)
        const rev = (blob.rev ?? 0) + 1
        writeBlob(await sealVault(key, blob.kdf, next, rev, blob.check))
        setSnapshot({ data: next })
        emit('changed')
        post({ type: 'changed', rev })
        return next
      })
    },

    async verify(passphrase) {
      const blob = readBlob()
      if (!blob) return false
      return (await openVault(await deriveKey(passphrase, blob.kdf), blob)) !== null
    },

    async changePassphrase(current, next) {
      const done = await env.withLock(async () => {
        const blob = readBlob()
        if (!blob) return null
        const data = await openVault(await deriveKey(current, blob.kdf), blob)
        if (!data) return null
        const kdf = newKdf(opts.iterations)
        const newKey = await deriveKey(next, kdf)
        writeBlob(await sealVault(newKey, kdf, data, (blob.rev ?? 0) + 1, await makeCheck(newKey)))
        return { newKey, data }
      })
      if (!done) return false
      key = done.newKey
      if (snapshot.mode === 'stay') await env.keys.set(done.newKey)
      setSnapshot({ status: 'unlocked', data: done.data })
      emit('changed')
      // Other tabs stay unlocked with the new key.
      post({ type: 'key', key: done.newKey })
      return true
    },

    async setMode(mode) {
      saveMode(mode)
      if (mode === 'stay' && key) await env.keys.set(key)
      if (mode === 'ask') await env.keys.remove()
      setSnapshot({ mode })
    },

    async forget() {
      key = null
      env.storage.remove(VAULT_KEY)
      env.storage.remove(MODE_KEY)
      await env.keys.remove()
      setSnapshot({ status: 'none', data: null, mode: 'ask' })
      emit('forgotten')
      post({ type: 'forget' })
    },

    exportBlob() {
      const blob = readBlob()
      if (!blob) return null
      const { format, v, kdf, check, iv, data } = blob
      return { format, v, kdf, check, iv, data }
    },

    async adopt(blob, newKey, mode) {
      const data = await openVault(newKey, blob)
      if (!data) throw new VaultLockedError()
      await env.withLock(async () => writeBlob({ ...blob, rev: (readBlob()?.rev ?? 0) + 1 }))
      key = newKey
      saveMode(mode)
      if (mode === 'stay') await env.keys.set(newKey)
      else await env.keys.remove()
      setSnapshot({ ready: true, status: 'unlocked', data, mode })
      emit('unlocked')
      post({ type: 'key', key: newKey })
    },

    dispose() {
      unsubscribe.forEach((u) => u?.())
    },
  }
  return store
}

// ---- the tab's vault ------------------------------------------------------------

let instance: VaultStore | null = null

export function getVault(): VaultStore {
  instance ??= createVaultStore(browserEnv())
  return instance
}

/** Tests start every case with a fresh store (and may pass a fake environment). */
export function resetVaultForTests(store: VaultStore | null = null) {
  instance?.dispose()
  instance = store
}

/** The vault state of this tab, re-rendered on changes from any tab. */
export function useVault(): VaultSnapshot & { vault: VaultStore } {
  const vault = getVault()
  const snapshot = useSyncExternalStore(vault.subscribe, vault.getSnapshot)
  return { ...snapshot, vault }
}
