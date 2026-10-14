import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { SiteFooter } from '../../components/SiteFooter'
import { useI18n } from '../../i18n'
import { ImportDialog } from '../profiles/ImportExport'
import { useOpenRecentProfile } from '../profiles/profileNav'
import { ProfilePicker, UnlockScreen } from '../profiles/StartScreens'
import { useVault } from '../profiles/vaultStore'
import { useAuth } from './AuthContext'
import { Highlights, HowItWorks, LandingHero } from './Landing'
import { PublicHeader } from './PublicHeader'
import { SignInForm } from './SignInForm'

const SIGN_IN_ID = 'sign-in'

export function LoginPage({ notice }: { notice?: 'invalidInvite' }) {
  const { t } = useI18n()
  const { state, login } = useAuth()

  const reason = state.status === 'loggedOut' ? state.reason : undefined
  const { status: vaultStatus } = useVault()
  // "Sign in without saving" from the unlock screen or the profile picker.
  const [plain, setPlain] = useState(false)
  const [importing, setImporting] = useState(false)
  const openRecent = useOpenRecentProfile()

  // Unlocked here or in another tab while the unlock screen was shown: open the last profile.
  const prevStatus = useRef(vaultStatus)
  useEffect(() => {
    if (prevStatus.current === 'locked' && vaultStatus === 'unlocked' && !plain) void openRecent()
    prevStatus.current = vaultStatus
  }, [vaultStatus, plain, openRecent])

  const startDemo = () => void login({ mode: 'demo' }, false)

  const showSignIn = () => {
    const form = document.getElementById(SIGN_IN_ID)
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    form?.scrollIntoView?.({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    form?.querySelector<HTMLInputElement>('input:not([readonly])')?.focus({ preventScroll: true })
  }

  if (!plain && (vaultStatus === 'locked' || vaultStatus === 'unlocked')) {
    return (
      <div className="landing">
        <PublicHeader />
        <main className="ob-main">
          {notice === 'invalidInvite' && (
            <div className="banner banner-warning" role="note">
              {t('onboarding.join.invalid')}
            </div>
          )}
          {vaultStatus === 'locked' ? (
            <UnlockScreen onPlainSignIn={() => setPlain(true)} />
          ) : (
            <ProfilePicker reason={reason} onPlainSignIn={() => setPlain(true)} />
          )}
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="landing">
      <PublicHeader />

      <div className="landing-main">
        <LandingHero
          actions={
            <>
              <button type="button" className="btn btn-primary btn-lg" onClick={startDemo}>
                <Icon name="play" size={16} filled />
                {t('landing.demo')}
              </button>
              <Link to="/setup" className="btn btn-lg">
                <Icon name="settings" size={16} />
                {t('landing.setup')}
              </Link>
            </>
          }
        />

        <SignInForm
          id={SIGN_IN_ID}
          className="card login-card"
          defaultSave={plain ? false : undefined}
          header={
            <>
              <div className="stack" style={{ gap: 4 }}>
                <h2>{t('login.title')}</h2>
                <p className="muted small">{t('login.subtitle')}</p>
              </div>
              {notice === 'invalidInvite' && (
                <div className="banner banner-warning" role="note">
                  {t('onboarding.join.invalid')}
                </div>
              )}
              {reason === 'sessionExpired' && (
                <div className="banner banner-warning">{t('login.sessionExpired')}</div>
              )}
              {reason === 'unreachable' && (
                <div className="banner banner-warning row">
                  <span>{t('login.errors.offline')}</span>
                  <span className="spacer" />
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => window.location.reload()}
                  >
                    {t('common.retry')}
                  </button>
                </div>
              )}
            </>
          }
          footer={() => (
            <>
              <Link to="/token-help" target="_blank" rel="noreferrer" className="small">
                {t('login.help.title')} <span aria-hidden="true">↗</span>
              </Link>

              <p className="small">
                {t('login.setupPrompt')} <Link to="/setup">{t('login.setupLink')}</Link>
              </p>
              {vaultStatus === 'none' && (
                <p className="small">
                  {t('profiles.importPrompt')}{' '}
                  <button type="button" className="link-btn" onClick={() => setImporting(true)}>
                    {t('profiles.import')}
                  </button>
                </p>
              )}
            </>
          )}
        />
      </div>

      {importing && (
        <ImportDialog onClose={() => setImporting(false)} onImported={() => void openRecent()} />
      )}
      <Highlights />
      <HowItWorks onSignIn={showSignIn} />
      <SiteFooter />
    </div>
  )
}
