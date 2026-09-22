import { Icon, type IconName } from '../../components/Icon'
import { useI18n } from '../../i18n'

const HIGHLIGHTS: { key: string; icon: IconName }[] = [
  { key: 'free', icon: 'bolt' },
  { key: 'repo', icon: 'lock' },
  { key: 'team', icon: 'users' },
  { key: 'timer', icon: 'clock' },
  { key: 'reports', icon: 'chart' },
  { key: 'import', icon: 'import' },
]

export function Highlights() {
  const { t } = useI18n()
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
          </li>
        ))}
      </ul>
    </section>
  )
}

export function HowItWorks({ onTokenHelp }: { onTokenHelp: () => void }) {
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
              {n === 2 && (
                <button type="button" className="link-btn step-link" onClick={onTokenHelp}>
                  {t('landing.step2Link')}
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
