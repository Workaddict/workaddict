import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { REPO_URL } from '../../app/about'
import { Icon } from '../../components/Icon'
import { SiteFooter } from '../../components/SiteFooter'
import { useI18n } from '../../i18n'
import { githubLinks } from '../onboarding/githubLinks'
import { TokenChecklist } from '../onboarding/parts'
import { useAuth } from './AuthContext'
import { Highlights, HowItWorks } from './Landing'
import { PublicHeader } from './PublicHeader'
import { SignInForm } from './SignInForm'

export function LoginPage({ notice }: { notice?: 'invalidInvite' }) {
  const { t } = useI18n()
  const { state, login } = useAuth()

  const reason = state.status === 'loggedOut' ? state.reason : undefined

  const [helpOpen, setHelpOpen] = useState(false)
  const helpRef = useRef<HTMLDetailsElement>(null)

  const startDemo = () => void login({ mode: 'demo' }, false)

  const showTokenHelp = () => {
    setHelpOpen(true)
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    helpRef.current?.scrollIntoView?.({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
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
              <Icon name="users" size={16} />
              {t('landing.setupTeam')}
            </Link>
          </div>
        </section>

        <SignInForm
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
          footer={(busy) => (
            <>
              <details
                ref={helpRef}
                open={helpOpen}
                onToggle={(e) => setHelpOpen(e.currentTarget.open)}
              >
                <summary>{t('login.help.title')}</summary>
                <p style={{ marginTop: 8 }}>{t('login.help.intro')}</p>
                <p style={{ marginTop: 10 }}>
                  <strong>{t('login.help.orderTitle')}</strong>
                </p>
                <p>{t('login.help.order')}</p>
                <p style={{ marginTop: 10 }}>
                  <strong>{t('login.help.fineTitle')}</strong>
                </p>
                <TokenChecklist />
                <p style={{ marginTop: 10 }}>{t('login.help.approval')}</p>
                <p style={{ marginTop: 12 }}>
                  <strong>{t('login.help.classicTitle')}</strong>
                </p>
                <p>{t('login.help.classicText')}</p>
                <div className="banner banner-warning" style={{ margin: '8px 0' }}>
                  {t('login.help.classicWarning')}
                </div>
                <a href={githubLinks.classicToken()} target="_blank" rel="noreferrer">
                  {t('login.help.openClassic')} ↗
                </a>
                <p className="muted" style={{ marginTop: 12 }}>
                  {t('login.help.security')}
                </p>
              </details>

              <p className="small">
                {t('login.setupPrompt')} <Link to="/setup">{t('login.setupLink')}</Link>
              </p>

              <div className="divider">{t('login.or')}</div>
              <button type="button" className="btn btn-wrap" disabled={busy} onClick={startDemo}>
                {t('login.demo')}
              </button>
            </>
          )}
        />
      </div>

      <Highlights />
      <HowItWorks onTokenHelp={showTokenHelp} />
      <SiteFooter />
    </div>
  )
}
