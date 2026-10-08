import { useState } from 'react'
import { Icon } from '../../components/Icon'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/Toasts'
import { useI18n } from '../../i18n'
import { useAuth, useSessionData } from '../auth/AuthContext'
import { CreateVaultForm } from './VaultForms'

const DISMISSED_KEY = 'workaddict.migrationDismissed'

function readDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

/** "Protect with a passphrase" dialog: moves the current session into a new vault. */
export function ProtectDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const { saveCurrentAsProfile } = useAuth()
  const toast = useToast()
  return (
    <Modal title={t('profiles.protectTitle')} onClose={onClose} dismissible={false}>
      <CreateVaultForm
        intro={<p className="muted small">{t('profiles.createIntro')}</p>}
        submitLabel={t('profiles.protect')}
        onCancel={onClose}
        onSubmit={async (passphrase, mode) => {
          await saveCurrentAsProfile({ passphrase, mode })
          toast.info(t('profiles.protected'))
          onClose()
        }}
      />
    </Modal>
  )
}

/**
 * For a token saved in plaintext by an earlier version (design D10): offers to protect it with a
 * passphrase. Dismissing hides it for this tab session; Settings keeps the offer.
 */
export function MigrationNotice() {
  const { t } = useI18n()
  const { legacy } = useSessionData()
  const [dismissed, setDismissed] = useState(readDismissed)
  const [protecting, setProtecting] = useState(false)
  if (!legacy) return null

  const dismiss = () => {
    setDismissed(true)
    try {
      sessionStorage.setItem(DISMISSED_KEY, '1')
    } catch {
      // hidden until the page is reloaded
    }
  }

  return (
    <>
      {!dismissed && (
        <div className="banner banner-warning row" role="note">
          <span>{t('profiles.migrationNotice')}</span>
          <span className="spacer" />
          <button className="btn btn-sm" onClick={() => setProtecting(true)}>
            {t('profiles.protect')}
          </button>
          <button
            className="btn btn-icon btn-sm"
            onClick={dismiss}
            aria-label={t('common.close')}
            title={t('common.close')}
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      )}
      {protecting && <ProtectDialog onClose={() => setProtecting(false)} />}
    </>
  )
}
