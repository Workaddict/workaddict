import { base64ToBytes, bytesToBase64 } from '../../storage/github/base64'

/**
 * Key derivation and encryption for the profile vault (design D1, D2). Everything runs in WebCrypto:
 * PBKDF2-SHA256 turns the passphrase into a non-extractable AES-GCM-256 key, and every encryption
 * uses a fresh random 12-byte IV.
 */

export const KDF_ITERATIONS = 600_000
const SALT_BYTES = 16
const IV_BYTES = 12
/** Encrypted under the key so a passphrase can be checked without decrypting the whole vault. */
const CHECK_TEXT = 'workaddict-vault-check'

export interface KdfParams {
  name: 'PBKDF2'
  hash: 'SHA-256'
  iterations: number
  /** Base64, 16 bytes. */
  salt: string
}

export interface Sealed {
  /** Base64, 12 bytes. */
  iv: string
  /** Base64 AES-GCM ciphertext including the tag. */
  data: string
}

function random(bytes: number): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(bytes))
}

/** New KDF parameters with a random salt. `iterations` is lowered only in tests. */
export function newKdf(iterations = KDF_ITERATIONS): KdfParams {
  return { name: 'PBKDF2', hash: 'SHA-256', iterations, salt: bytesToBase64(random(SALT_BYTES)) }
}

/** Derives the vault key from the passphrase with the parameters stored in the vault. */
export async function deriveKey(passphrase: string, kdf: KdfParams): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: kdf.hash, iterations: kdf.iterations, salt: base64ToBytes(kdf.salt) },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function seal(key: CryptoKey, text: string): Promise<Sealed> {
  const iv = random(IV_BYTES)
  const data = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(text),
  )
  return { iv: bytesToBase64(iv), data: bytesToBase64(new Uint8Array(data)) }
}

/** Throws when the key is wrong or the data was changed (AES-GCM authentication). */
export async function open(key: CryptoKey, sealed: Sealed): Promise<string> {
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(sealed.iv) },
    key,
    base64ToBytes(sealed.data),
  )
  return new TextDecoder().decode(plain)
}

/** The `check` value: IV and ciphertext of a fixed text, joined with a dot. */
export async function makeCheck(key: CryptoKey): Promise<string> {
  const { iv, data } = await seal(key, CHECK_TEXT)
  return `${iv}.${data}`
}

export async function verifyCheck(key: CryptoKey, check: string): Promise<boolean> {
  const [iv, data] = check.split('.')
  if (!iv || !data) return false
  try {
    return (await open(key, { iv, data })) === CHECK_TEXT
  } catch {
    return false
  }
}
