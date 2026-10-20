import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { REPO_URL } from '../../app/about'
import { Icon, type IconName } from '../../components/Icon'
import { seoPageUrl } from '../../app/seoPages'
import { useI18n } from '../../i18n'

const HIGHLIGHTS: { key: string; icon: IconName }[] = [
  { key: 'free', icon: 'bolt' },
  { key: 'repo', icon: 'lock' },
  { key: 'team', icon: 'users' },
  { key: 'timer', icon: 'clock' },
  { key: 'reports', icon: 'chart' },
  { key: 'import', icon: 'import' },
]

/** Headline, key facts and the start page's buttons (`actions`). */
export function LandingHero({ actions }: { actions: ReactNode }) {
  const { t } = useI18n()
  return (
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
      <div className="row landing-actions">{actions}</div>
    </section>
  )
}

export function Highlights() {
  const { t, lang } = useI18n()
  return (
    <section className="landing-section" aria-labelledby="landing-highlights">
      <h2 id="landing-highlights">{t('landing.highlightsTitle')}</h2>
      <ul className="highlights">
        {HIGHLIGHTS.map((h) => (
          <li key={h.key} className="card highlight">
            <span className="highlight-icon">
              <Icon name={h.icon} size={20} />
            </span>
            <h3>{t(`landing.highlights.${h.key}Title`)}</h3>
            <p className="muted">{t(`landing.highlights.${h.key}Text`)}</p>
            {h.key === 'import' && (
              <a className="highlight-link" href={seoPageUrl('import-from-clockify', lang)}>
                {t('landing.highlights.importGuide')}
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function HowItWorks({ onSignIn }: { onSignIn: () => void }) {
  const { t } = useI18n()
  return (
    <section className="landing-section" aria-labelledby="landing-steps">
      <h2 id="landing-steps">{t('landing.stepsTitle')}</h2>
      <ol className="steps">
        {[1, 2, 3].map((n) => (
          <li key={n} className="step">
            <span className="step-num" aria-hidden="true">
              {n}
            </span>
            <div className="stack" style={{ gap: 4 }}>
              <h3>{t(`landing.step${n}Title`)}</h3>
              <p className="muted">{t(`landing.step${n}Text`)}</p>
              {n === 1 && (
                <Link to="/setup" className="step-link">
                  {t('landing.step1Link')}
                </Link>
              )}
              {n === 2 && (
                <Link to="/help/token" target="_blank" rel="noreferrer" className="step-link">
                  {t('landing.step2Link')} <span aria-hidden="true">↗</span>
                </Link>
              )}
              {n === 3 && (
                <button type="button" className="link-btn step-link" onClick={onSignIn}>
                  {t('landing.step3Link')}
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
      <p className="muted steps-note">{t('landing.inviteHint')}</p>
    </section>
  )
}
