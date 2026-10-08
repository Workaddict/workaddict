import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { useConfirm } from '../../components/Modal'
import { useI18n } from '../../i18n'
import { useAuth, type LogoutReason } from '../auth/AuthContext'
import { ImportDialog } from './ImportExport'
import { fixPathForProfile, useOpenRecentProfile } from './profileNav'
import { tokenOf, type VaultProfile } from './vault'
import { UnlockForm } from './VaultForms'
import { useVault } from './vaultStore'

/**
 * The start page of a locked vault (design D3, D15): passphrase, "Stay unlocked", reset after a
 * forgotten passphrase, import, and signing in without saving. Shows no repository names.
 */
export function UnlockScreen({ onPlainSignIn }: { onPlainSignIn: () => void }) {
  const { t } = useI18n()
  const { mode, vault } = useVault()
  const { forgetAll } = useAuth()
  const confirm = useConfirm()
  const [forgot, setForgot] = useState(false)
  const [importing, setImporting] = useState(false)

  const reset = async () => {
    const ok = await confirm({
      message: t('profiles.resetConfirm'),
      confirmLabel: t('profiles.reset'),
    })
    if (ok) await forgetAll()
  }

  return (
    <section className="card login-card stack" aria-labelledby="unlock-title">
      <div className="stack" style={{ gap: 4 }}>
        <h2 id="unlock-title">{t('profiles.unlockTitle')}</h2>
        <p className="muted small">{t('profiles.unlockIntro')}</p>
      </div>
      <UnlockForm initialMode={mode} onUnlock={(p, m) => vault.unlock(p, m)} />
      <button
        type="button"
        className="link-btn"
        aria-expanded={forgot}
        onClick={() => setForgot((f) => !f)}
      >
        {t('profiles.forgot')}
      </button>
      {forgot && (
        <div className="banner banner-info stack" style={{ gap: 8 }}>
          <span>{t('profiles.forgotText')}</span>
          <div>
            <button type="button" className="btn btn-sm btn-danger" onClick={() => void reset()}>
              {t('profiles.reset')}
            </button>
          </div>
        </div>
      )}
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <button type="button" className="link-btn" onClick={() => setImporting(true)}>
          {t('profiles.import')}
        </button>
        <span className="spacer" />
        <button type="button" className="link-btn" onClick={onPlainSignIn}>
          {t('profiles.signInWithoutSaving')}
        </button>
      </div>
      {importing && <ImportDialog onClose={() => setImporting(false)} />}
    </section>
  )
}

/**
 * The start page of an unlocked vault when the tab has no profile to open: all tokens rejected,
 * the last profile removed, or the active one removed elsewhere.
 */
export function ProfilePicker({
  reason,
  onPlainSignIn,
}: {
  reason?: LogoutReason
  onPlainSignIn: () => void
}) {
  const { t } = useI18n()
  const { data } = useVault()
  const { switchProfile, lock } = useAuth()
  const [importing, setImporting] = useState(false)
  const [failed, setFailed] = useState<string | null>(null)
  const openRecent = useOpenRecentProfile()
  const profiles = [...(data?.profiles ?? [])].sort((a, b) => b.lastUsed - a.lastUsed)

  const open = async (id: string) => {
    setFailed(null)
    try {
      await switchProfile(id)
    } catch {
      setFailed(id)
    }
  }

  return (
    <section className="card login-card stack" aria-labelledby="picker-title">
      <h2 id="picker-title">{t('profiles.pickerTitle')}</h2>
      {reason === 'tokenRejected' && (
        <div className="banner banner-warning">{t('profiles.tokenRejectedNotice')}</div>
      )}
      {reason === 'sessionExpired' && (
        <div className="banner banner-warning">{t('login.sessionExpired')}</div>
      )}
      {reason === 'unreachable' && (
        <div className="banner banner-warning">{t('login.errors.offline')}</div>
      )}
      {profiles.length === 0 && <p className="muted">{t('profiles.none')}</p>}
      <ul className="profile-list">
        {profiles.map((p) => {
          const rejected = data && tokenOf(data, p)?.rejected
          return (
            <li key={p.id}>
              {rejected ? (
                <Link className="profile-item" to={fixPathForProfile(p)}>
                  <ProfileName profile={p} />
                  <span className="chip chip-warning">{t('profiles.tokenRejected')}</span>
                </Link>
              ) : (
                <button type="button" className="profile-item" onClick={() => void open(p.id)}>
                  <ProfileName profile={p} />
                  {failed === p.id && (
                    <span className="chip chip-warning">{t('profiles.openFailed')}</span>
                  )}
                </button>
              )}
            </li>
          )
        })}
      </ul>
      <Link className="btn" to="/add-project">
        <Icon name="plus" size={16} />
        {t('profiles.add')}
      </Link>
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <button type="button" className="link-btn" onClick={() => setImporting(true)}>
          {t('profiles.import')}
        </button>
        <button type="button" className="link-btn" onClick={() => void lock()}>
          {t('profiles.lock')}
        </button>
        <span className="spacer" />
        <button type="button" className="link-btn" onClick={onPlainSignIn}>
          {t('profiles.signInWithoutSaving')}
        </button>
      </div>
      {importing && (
        <ImportDialog onClose={() => setImporting(false)} onImported={() => void openRecent()} />
      )}
    </section>
  )
}

export function ProfileName({ profile }: { profile: VaultProfile }) {
  return (
    <span className="profile-name">
      <strong>{profile.label}</strong>
      {profile.label !== profile.repo && <span className="muted small"> {profile.repo}</span>}
    </span>
  )
}
