import { Link } from 'react-router-dom'
import { REPO_URL } from '../../app/about'
import { Icon } from '../../components/Icon'
import { SiteFooter } from '../../components/SiteFooter'
import { useI18n } from '../../i18n'
import { useAuth } from './AuthContext'
import { Highlights, HowItWorks } from './Landing'
import { PublicHeader } from './PublicHeader'
import { SignInForm } from './SignInForm'

const SIGN_IN_ID = 'sign-in'

export function LoginPage({ notice }: { notice?: 'invalidInvite' }) {
  const { t } = useI18n()
  const { state, login } = useAuth()

  const reason = state.status === 'loggedOut' ? state.reason : undefined

  const startDemo = () => void login({ mode: 'demo' }, false)

  const showSignIn = () => {
    const form = document.getElementById(SIGN_IN_ID)
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    form?.scrollIntoView?.({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    form?.querySelector<HTMLInputElement>('input:not([readonly])')?.focus({ preventScroll: true })
  }

  return (
    <div className="landing">
      <PublicHeader />

      <div className="landing-main">
        <section className="landing-hero" aria-labelledby="landing-headline">
          <h1 id="landing-headline">{t('landing.headline')}</h1>
          <p className="landing-subline">{t('landing.subline')}</p>
          <ul className="landing-facts">
            <li>
              <Icon name="check" size={18} />
              {t('landing.factFree')}
            </li>
            <li>
              <Icon name="check" size={18} />
              <span>
                {t('landing.factOpenSource')}{' '}
                <a href={REPO_URL} target="_blank" rel="noreferrer">
                  {t('landing.factOpenSourceLink')}
                </a>
              </span>
            </li>
            <li>
              <Icon name="check" size={18} />
              {t('landing.factData')}
            </li>
          </ul>
          <div className="row landing-actions">
            <button type="button" className="btn btn-primary btn-lg" onClick={startDemo}>
              <Icon name="play" size={16} filled />
              {t('landing.demo')}
            </button>
            <Link to="/setup" className="btn btn-lg">
              <Icon name="settings" size={16} />
              {t('landing.setup')}
            </Link>
          </div>
        </section>

        <SignInForm
          id={SIGN_IN_ID}
          className="card login-card"
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
            </>
          )}
        />
      </div>

      <Highlights />
      <HowItWorks onSignIn={showSignIn} />
      <SiteFooter />
    </div>
  )
}
