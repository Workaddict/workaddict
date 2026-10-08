import { useState, type FormEvent, type ReactNode } from 'react'
import { useI18n } from '../../i18n'
import {
  emptyNewPassphrase,
  MIN_PASSPHRASE,
  newPassphraseError,
  passphraseStrength,
  type NewPassphrase,
} from './passphrase'
import type { UnlockMode } from './vaultStore'

export function UnlockModeField({
  mode,
  onChange,
}: {
  mode: UnlockMode
  onChange: (mode: UnlockMode) => void
}) {
  const { t } = useI18n()
  return (
    <fieldset className="stack" style={{ gap: 6 }}>
      <legend className="small">{t('profiles.unlockMode')}</legend>
      {(['ask', 'stay'] as const).map((m) => (
        <label key={m} className="checkbox">
          <input
            type="radio"
            name="unlock-mode"
            checked={mode === m}
            onChange={() => onChange(m)}
          />
          <span>
            {t(`profiles.mode.${m}`)}
            <br />
            <span className="muted small">{t(`profiles.mode.${m}Hint`)}</span>
          </span>
        </label>
      ))}
    </fieldset>
  )
}

/** Passphrase twice, strength hint, unlock mode and the no-recovery notice. */
export function NewPassphraseFields({
  value,
  onChange,
  showErrors,
  withMode = true,
}: {
  value: NewPassphrase
  onChange: (v: NewPassphrase) => void
  showErrors: boolean
  withMode?: boolean
}) {
  const { t } = useI18n()
  const error = newPassphraseError(value)
  const strength = value.passphrase ? passphraseStrength(value.passphrase) : null
  return (
    <div className="stack">
      <label className="field">
        <span>{t('profiles.newPassphrase')}</span>
        <input
          className="input"
          type="password"
          autoComplete="new-password"
          value={value.passphrase}
          onChange={(e) => onChange({ ...value, passphrase: e.target.value })}
        />
      </label>
      <span className="muted small" aria-live="polite" style={{ marginTop: -6 }}>
        {t('profiles.minLength', { count: MIN_PASSPHRASE })}
        {strength && ` · ${t(`profiles.strength.${strength}`)}`}
      </span>
      <label className="field">
        <span>{t('profiles.confirmPassphrase')}</span>
        <input
          className="input"
          type="password"
          autoComplete="new-password"
          value={value.confirm}
          onChange={(e) => onChange({ ...value, confirm: e.target.value })}
        />
      </label>
      {showErrors && error && (
        <div className="banner banner-warning" role="alert">
          {t(`profiles.errors.${error}`, { count: MIN_PASSPHRASE })}
        </div>
      )}
      {withMode && (
        <UnlockModeField mode={value.mode} onChange={(mode) => onChange({ ...value, mode })} />
      )}
      <p className="banner banner-info small" role="note">
        {t('profiles.noRecovery')}
      </p>
    </div>
  )
}

/** A complete "set a passphrase" form, e.g. for migrating a plaintext session. */
export function CreateVaultForm({
  onSubmit,
  onCancel,
  submitLabel,
  intro,
}: {
  onSubmit: (passphrase: string, mode: UnlockMode) => Promise<void>
  onCancel?: () => void
  submitLabel: string
  intro?: ReactNode
}) {
  const { t } = useI18n()
  const [value, setValue] = useState(emptyNewPassphrase)
  const [tried, setTried] = useState(false)
  const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (newPassphraseError(value)) return
    setBusy(true)
    try {
      await onSubmit(value.passphrase, value.mode)
    } finally {
      setBusy(false)
    }
  }
  return (
    <form className="stack" onSubmit={(e) => void submit(e)}>
      {intro}
      <NewPassphraseFields value={value} onChange={setValue} showErrors={tried} />
      <div className="modal-actions">
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel}>
            {t('common.cancel')}
          </button>
        )}
        <button className="btn btn-primary" disabled={busy}>
          {busy ? t('profiles.working') : submitLabel}
        </button>
      </div>
    </form>
  )
}

/** Passphrase and "Stay unlocked" for an existing vault. */
export function UnlockForm({
  initialMode,
  onUnlock,
  submitLabel,
  children,
}: {
  initialMode: UnlockMode
  /** Resolves false for a wrong passphrase. */
  onUnlock: (passphrase: string, mode: UnlockMode) => Promise<boolean>
  submitLabel?: string
  children?: ReactNode
}) {
  const { t } = useI18n()
  const [passphrase, setPassphrase] = useState('')
  const [stay, setStay] = useState(initialMode === 'stay')
  const [wrong, setWrong] = useState(false)
  const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setWrong(false)
    try {
      const ok = await onUnlock(passphrase, stay ? 'stay' : 'ask')
      if (!ok) setWrong(true)
    } finally {
      setBusy(false)
    }
  }
  return (
    <form className="stack" onSubmit={(e) => void submit(e)}>
      <label className="field">
        <span>{t('profiles.passphrase')}</span>
        <input
          className="input"
          type="password"
          required
          autoComplete="current-password"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
        />
      </label>
      {wrong && (
        <div className="banner banner-warning" role="alert">
          {t('profiles.wrongPassphrase')}
        </div>
      )}
      <label className="checkbox">
        <input type="checkbox" checked={stay} onChange={(e) => setStay(e.target.checked)} />
        <span>
          {t('profiles.mode.stay')}
          <br />
          <span className="muted small">{t('profiles.mode.stayHint')}</span>
        </span>
      </label>
      <button className="btn btn-primary btn-lg" disabled={busy}>
        {busy ? t('profiles.working') : (submitLabel ?? t('profiles.unlock'))}
      </button>
      {children}
    </form>
  )
}
