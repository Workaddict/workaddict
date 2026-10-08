import { useState, type FormEvent } from 'react'
import { Icon } from '../../components/Icon'
import { Modal, useConfirm } from '../../components/Modal'
import { useToast } from '../../components/Toasts'
import { useI18n } from '../../i18n'
import { useAuth, useSessionData } from '../auth/AuthContext'
import { ExportDialog, ImportDialog } from './ImportExport'
import { ProtectDialog } from './MigrationNotice'
import { ProfileName } from './StartScreens'
import { setLabel, tokenOf, type VaultProfile } from './vault'
import { emptyNewPassphrase, newPassphraseError } from './passphrase'
import { NewPassphraseFields, UnlockForm, UnlockModeField } from './VaultForms'
import { useVault } from './vaultStore'

function ChangePassphraseDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const { vault } = useVault()
  const toast = useToast()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState(emptyNewPassphrase)
  const [tried, setTried] = useState(false)
  const [wrong, setWrong] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setTried(true)
    setWrong(false)
    if (newPassphraseError(next)) return
    setBusy(true)
    try {
      if (!(await vault.changePassphrase(current, next.passphrase))) return setWrong(true)
      toast.info(t('profiles.passphraseChanged'))
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={t('profiles.changePassphrase')} onClose={onClose} dismissible={!busy}>
      <form className="stack" onSubmit={(e) => void submit(e)}>
        <label className="field">
          <span>{t('profiles.currentPassphrase')}</span>
          <input
            className="input"
            type="password"
            required
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </label>
        {wrong && (
          <div className="banner banner-warning" role="alert">
            {t('profiles.wrongPassphrase')}
          </div>
        )}
        <NewPassphraseFields value={next} onChange={setNext} showErrors={tried} withMode={false} />
        <p className="muted small">{t('profiles.changePassphraseExports')}</p>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? t('profiles.working') : t('profiles.changePassphrase')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

/** Unlock first, then save the tab-only session as a profile. */
function UnlockAndSaveDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const { mode, vault } = useVault()
  const { saveCurrentAsProfile } = useAuth()
  return (
    <Modal title={t('profiles.saveCurrent')} onClose={onClose}>
      <p>{t('profiles.unlockToSave')}</p>
      <UnlockForm
        initialMode={mode}
        submitLabel={t('profiles.saveCurrent')}
        onUnlock={async (p, m) => {
          if (!(await vault.unlock(p, m))) return false
          await saveCurrentAsProfile()
          onClose()
          return true
        }}
      />
    </Modal>
  )
}

/** Inline name field; an empty name falls back to `owner/name`. */
function RenameRow({ profile, onDone }: { profile: VaultProfile; onDone: () => void }) {
  const { t } = useI18n()
  const { vault } = useVault()
  const toast = useToast()
  const [name, setName] = useState(profile.label)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await vault.update((d) => setLabel(d, profile.id, name))
      toast.info(t('profiles.renamed'))
      onDone()
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="settings-row" onSubmit={(e) => void submit(e)}>
      <label className="field" style={{ flex: '1 1 260px' }}>
        <span>{t('profiles.name')}</span>
        <input
          className="input"
          autoFocus
          maxLength={80}
          placeholder={profile.repo}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && onDone()}
        />
      </label>
      <span className="muted small" style={{ flex: '1 1 100%' }}>
        {t('profiles.nameHint', { repo: profile.repo })}
      </span>
      <button type="button" className="btn btn-sm" onClick={onDone}>
        {t('common.cancel')}
      </button>
      <button className="btn btn-sm btn-primary" disabled={busy}>
        {t('common.save')}
      </button>
    </form>
  )
}

type Dialog = 'export' | 'import' | 'passphrase' | 'protect' | 'unlockSave' | null

/**
 * Settings → Profiles: saved profiles, unlock mode, passphrase, export, import and "Forget all";
 * for tab-only sessions "Sign out" and saving as a profile; for a plaintext session from an
 * earlier version the offer to protect it.
 */
export function ProfilesSection() {
  const { t } = useI18n()
  const { logout, removeProfile, forgetAll, saveCurrentAsProfile } = useAuth()
  const { session, profileId, legacy } = useSessionData()
  const { status, data, mode, vault } = useVault()
  const confirm = useConfirm()
  const [dialog, setDialog] = useState<Dialog>(null)
  const [renaming, setRenaming] = useState<string | null>(null)
  const close = () => setDialog(null)

  const remove = async (id: string, label: string) => {
    const ok = await confirm({
      message: t('profiles.removeConfirm', { repo: label }),
      confirmLabel: t('profiles.remove'),
    })
    if (ok) await removeProfile(id)
  }

  const forget = async () => {
    const ok = await confirm({
      message: t('profiles.forgetConfirm'),
      confirmLabel: t('profiles.forgetAll'),
    })
    if (ok) await forgetAll()
  }

  const saveCurrent = () => {
    if (status === 'none') setDialog('protect')
    else if (status === 'locked') setDialog('unlockSave')
    else void saveCurrentAsProfile()
  }

  const profiles = status === 'unlocked' && data ? data.profiles : []
  const tabOnly = session.mode === 'github' && !profileId

  return (
    <section className="section" aria-labelledby="profiles-title">
      <h2 id="profiles-title">{t('profiles.title')}</h2>
      <div className="card settings-list">
        {legacy && (
          <div className="settings-row">
            <span className="small" style={{ flex: '1 1 260px' }}>
              {t('profiles.migrationNotice')}
            </span>
            <button className="btn btn-primary" onClick={() => setDialog('protect')}>
              <Icon name="lock" size={16} />
              {t('profiles.protect')}
            </button>
          </div>
        )}

        {profiles.map((p) =>
          renaming === p.id ? (
            <RenameRow key={p.id} profile={p} onDone={() => setRenaming(null)} />
          ) : (
            <div key={p.id} className="settings-row">
              <ProfileName profile={p} />
              {tokenOf(data!, p)?.rejected && (
                <span className="chip chip-warning">{t('profiles.tokenRejected')}</span>
              )}
              {p.id === profileId && <span className="chip">{t('profiles.current')}</span>}
              <button
                className="btn btn-sm"
                onClick={() => setRenaming(p.id)}
                aria-label={`${t('profiles.rename')}: ${p.label}`}
              >
                <Icon name="edit" size={14} />
                {t('profiles.rename')}
              </button>
              <button className="btn btn-sm" onClick={() => void remove(p.id, p.label)}>
                <Icon name="trash" size={14} />
                {t('profiles.remove')}
              </button>
            </div>
          ),
        )}

        {status === 'unlocked' && (
          <>
            <div className="settings-row">
              <UnlockModeField mode={mode} onChange={(m) => void vault.setMode(m)} />
            </div>
            <div className="settings-row" style={{ flexWrap: 'wrap', gap: 8 }}>
              <button className="btn" onClick={() => setDialog('passphrase')}>
                {t('profiles.changePassphrase')}
              </button>
              <button className="btn" onClick={() => setDialog('export')}>
                <Icon name="download" size={16} />
                {t('profiles.export')}
              </button>
              <button className="btn" onClick={() => setDialog('import')}>
                <Icon name="import" size={16} />
                {t('profiles.import')}
              </button>
            </div>
          </>
        )}

        {tabOnly && !legacy && (
          <div className="settings-row">
            <span className="muted small" style={{ flex: '1 1 260px' }}>
              {t('profiles.tabOnlyHint')}
            </span>
            <button className="btn" onClick={saveCurrent}>
              {t('profiles.saveCurrent')}
            </button>
          </div>
        )}
        {!profileId && (
          <div className="settings-row">
            <span className="muted small" style={{ flex: '1 1 260px' }}>
              {t('settings.logoutHint')}
            </span>
            <button className="btn" onClick={() => void logout()}>
              <Icon name="logout" size={16} />
              {t('nav.logout')}
            </button>
          </div>
        )}
        {status !== 'none' && (
          <div className="settings-row">
            <span className="muted small" style={{ flex: '1 1 260px' }}>
              {t('profiles.forgetHint')}
            </span>
            <button className="btn btn-danger" onClick={() => void forget()}>
              {t('profiles.forgetAll')}
            </button>
          </div>
        )}
      </div>

      {dialog === 'export' && <ExportDialog onClose={close} />}
      {dialog === 'import' && <ImportDialog onClose={close} />}
      {dialog === 'passphrase' && <ChangePassphraseDialog onClose={close} />}
      {dialog === 'protect' && <ProtectDialog onClose={close} />}
      {dialog === 'unlockSave' && <UnlockAndSaveDialog onClose={close} />}
    </section>
  )
}
