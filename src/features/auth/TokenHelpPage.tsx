import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SiteFooter } from '../../components/SiteFooter'
import { useI18n } from '../../i18n'
import { githubLinks } from '../onboarding/githubLinks'
import { TokenChecklist } from '../onboarding/parts'
import { PublicHeader } from './PublicHeader'

/** Logged-out page that explains how to create a token, linked from the sign-in card. */
export function TokenHelpPage() {
  const { t } = useI18n()
  const navigate = useNavigate()

  // The page opens in its own tab from the sign-in card: close it to get back there. Browsers may
  // refuse to close a tab that was opened directly, so fall back to the start page.
  const done = () => {
    window.close()
    window.setTimeout(() => navigate('/'), 200)
  }

  useEffect(() => {
    document.documentElement.scrollTop = 0
  }, [])

  return (
    <div className="landing">
      <PublicHeader />
      <main className="ob-main">
        <Link to="/" className="ob-back">
          ← {t('login.help.back')}
        </Link>
        <div className="stack" style={{ gap: 6 }}>
          <h1>{t('login.help.title')}</h1>
          <p className="muted">{t('login.help.intro')}</p>
        </div>

        <section className="card help-section">
          <h2>{t('login.help.orderTitle')}</h2>
          <p>{t('login.help.order')}</p>
        </section>

        <section className="card help-section">
          <h2>{t('login.help.fineTitle')}</h2>
          <TokenChecklist />
          <p className="muted small">{t('login.help.approval')}</p>
        </section>

        <section className="card help-section">
          <h2>{t('login.help.classicTitle')}</h2>
          <p>{t('login.help.classicText')}</p>
          <div className="banner banner-warning">{t('login.help.classicWarning')}</div>
          <a href={githubLinks.classicToken()} target="_blank" rel="noreferrer">
            {t('login.help.openClassic')} ↗
          </a>
        </section>

        <p className="muted small">{t('login.help.security')}</p>
        <button type="button" className="btn btn-primary btn-lg help-done" onClick={done}>
          {t('login.help.back')}
        </button>
      </main>
      <SiteFooter />
    </div>
  )
}
