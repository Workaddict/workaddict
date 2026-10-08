import { useState, type FormEvent } from 'react'
import { Modal } from '../../components/Modal'
import { format } from '../../domain/zoned'
import { downloadJson } from '../export/download'
import { useI18n } from '../../i18n'
import {
  importConflicts,
  mergeImport,
  openVault,
  parseVault,
  type ImportConflict,
  type VaultBlob,
  type VaultData,
} from './vault'
import { deriveKey } from './vaultCrypto'
import { UnlockModeField } from './VaultForms'
import { useVault, type UnlockMode } from './vaultStore'

const exportFileName = (now = new Date()) =>
  `workaddict-workspaces-${format(now, 'yyyy-MM-dd')}.json`

/** "Export profiles": re-enter the passphrase, then download the encrypted vault (design D14). */
export function ExportDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const { vault } = useVault()
  const [passphrase, setPassphrase] = useState('')
  const [wrong, setWrong] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const blob = (await vault.verify(passphrase)) ? vault.exportBlob() : null
      if (!blob) return setWrong(true)
      downloadJson(blob, exportFileName())
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={t('profiles.exportTitle')} onClose={onClose}>
      <form className="stack" onSubmit={(e) => void submit(e)}>
        <p className="banner banner-warning small" role="note">
          {t('profiles.exportWarning')}
        </p>
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
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? t('profiles.working') : t('profiles.export')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

type ImportStep =
  | { name: 'file' }
  | { name: 'passphrase'; blob: VaultBlob }
  | { name: 'mode'; blob: VaultBlob; key: CryptoKey }
  | { name: 'merge'; imported: VaultData; conflicts: ImportConflict[] }

/**
 * "Import profiles" (design D14): without a vault (or replacing a locked one) the file becomes the
 * vault; with an unlocked vault the profiles are merged by repository and the local passphrase
 * stays.
 */
export function ImportDialog({
  onClose,
  onImported,
}: {
  onClose: () => void
  onImported?: () => void
}) {
  const { t } = useI18n()
  const { status, data, mode: savedMode, vault } = useVault()
  const [step, setStep] = useState<ImportStep>({ name: 'file' })
  const [error, setError] = useState<string | null>(null)
  const [passphrase, setPassphrase] = useState('')
  const [mode, setMode] = useState<UnlockMode>(savedMode)
  const [useImported, setUseImported] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState(false)

  const done = () => {
    onImported?.()
    onClose()
  }

  const readFile = async (file: File | undefined) => {
    setError(null)
    if (!file) return
    const parsed = parseVault(await file.text())
    if (!parsed.ok) return setError(t(`profiles.importErrors.${parsed.error}`))
    setStep({ name: 'passphrase', blob: parsed.blob })
  }

  const checkPassphrase = async (e: FormEvent, blob: VaultBlob) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const key = await deriveKey(passphrase, blob.kdf)
      const imported = await openVault(key, blob)
      if (!imported) return setError(t('profiles.importErrors.passphrase'))
      if (status === 'unlocked' && data) {
        setStep({ name: 'merge', imported, conflicts: importConflicts(data, imported) })
      } else {
        setStep({ name: 'mode', blob, key })
      }
    } finally {
      setBusy(false)
    }
  }

  const adopt = async (blob: VaultBlob, key: CryptoKey) => {
    setBusy(true)
    try {
      await vault.adopt(blob, key, mode)
      done()
    } finally {
      setBusy(false)
    }
  }

  const merge = async (imported: VaultData) => {
    setBusy(true)
    try {
      await vault.update((d) => mergeImport(d, imported, useImported))
      done()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={t('profiles.importTitle')} onClose={onClose} dismissible={!busy}>
      <div className="stack">
        {step.name === 'file' && (
          <>
            <p className="muted small">{t('profiles.importIntro')}</p>
            {status === 'locked' && (
              <p className="banner banner-warning small" role="note">
                {t('profiles.importReplacesLocked')}
              </p>
            )}
            <label className="field">
              <span>{t('profiles.importFile')}</span>
              <input
                type="file"
                accept="application/json,.json"
                onChange={(e) => void readFile(e.target.files?.[0])}
              />
            </label>
          </>
        )}

        {step.name === 'passphrase' && (
          <form className="stack" onSubmit={(e) => void checkPassphrase(e, step.blob)}>
            <label className="field">
              <span>{t('profiles.filePassphrase')}</span>
              <input
                className="input"
                type="password"
                required
                autoComplete="off"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
              />
            </label>
            <div className="modal-actions">
              <button className="btn btn-primary" disabled={busy}>
                {busy ? t('profiles.working') : t('profiles.continue')}
              </button>
            </div>
          </form>
        )}

        {step.name === 'mode' && (
          <>
            <UnlockModeField mode={mode} onChange={setMode} />
            <p className="muted small">{t('profiles.importPassphraseKept')}</p>
            <div className="modal-actions">
              <button
                className="btn btn-primary"
                disabled={busy}
                onClick={() => void adopt(step.blob, step.key)}
              >
                {t('profiles.import')}
              </button>
            </div>
          </>
        )}

        {step.name === 'merge' && (
          <>
            <p className="muted small">
              {t('profiles.importMergeIntro', { count: step.imported.profiles.length })}
            </p>
            {step.conflicts.map((c) => {
              const k = c.repo.toLowerCase()
              return (
                <fieldset key={k} className="stack" style={{ gap: 6 }}>
                  <legend>{t('profiles.importConflict', { repo: c.repo })}</legend>
                  <label className="checkbox">
                    <input
                      type="radio"
                      name={`conflict-${k}`}
                      checked={!useImported[k]}
                      onChange={() => setUseImported((u) => ({ ...u, [k]: false }))}
                    />
                    <span>{t('profiles.keepLocal')}</span>
                  </label>
                  <label className="checkbox">
                    <input
                      type="radio"
                      name={`conflict-${k}`}
                      checked={!!useImported[k]}
                      onChange={() => setUseImported((u) => ({ ...u, [k]: true }))}
                    />
                    <span>{t('profiles.useImported')}</span>
                  </label>
                </fieldset>
              )
            })}
            <div className="modal-actions">
              <button
                className="btn btn-primary"
                disabled={busy}
                onClick={() => void merge(step.imported)}
              >
                {t('profiles.import')}
              </button>
            </div>
          </>
        )}

        {error && (
          <div className="banner banner-warning" role="alert">
            {error}
          </div>
        )}
        {step.name !== 'merge' && step.name !== 'mode' && (
          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              {t('common.cancel')}
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}
