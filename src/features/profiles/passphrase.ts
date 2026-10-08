import type { UnlockMode } from './vaultStore'

export const MIN_PASSPHRASE = 10

export type Strength = 'weak' | 'fair' | 'strong'

/** A rough hint only; it never blocks a passphrase of the minimum length. */
export function passphraseStrength(p: string): Strength {
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(p)).length
  const words = p.trim().split(/\s+/).length
  if (p.length >= 20 || (p.length >= 14 && (classes >= 3 || words >= 3))) return 'strong'
  if (p.length >= 12 && classes >= 2) return 'fair'
  return 'weak'
}

export interface NewPassphrase {
  passphrase: string
  confirm: string
  mode: UnlockMode
}

export const emptyNewPassphrase = (): NewPassphrase => ({
  passphrase: '',
  confirm: '',
  mode: 'ask',
})

export function newPassphraseError(v: Pick<NewPassphrase, 'passphrase' | 'confirm'>) {
  if (v.passphrase.length < MIN_PASSPHRASE) return 'tooShort' as const
  if (v.passphrase !== v.confirm) return 'mismatch' as const
  return null
}
