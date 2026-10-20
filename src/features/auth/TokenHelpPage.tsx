import { useI18n } from '../../i18n'
import { HelpShot } from '../help/HelpShot'
import { githubLinks } from '../onboarding/githubLinks'
import { TokenChecklist } from '../onboarding/parts'

/**
 * How to create a token, shown on the token help topic (`#/help/token`), which the sign-in card
 * links to.
 */
export function TokenHelpSections() {
  const { t } = useI18n()
  return (
    <>
      <section className="card help-section">
        <h2>{t('login.help.title')}</h2>
        <p className="muted">{t('login.help.intro')}</p>
        <h3>{t('login.help.orderTitle')}</h3>
        <p>{t('login.help.order')}</p>
      </section>

      <section className="card help-section">
        <h2>{t('login.help.fineTitle')}</h2>
        <TokenChecklist />
        <HelpShot id="token-form" />
        <HelpShot id="token-permissions" />
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
    </>
  )
}
