import {
  AUTHOR_NAME,
  AUTHOR_URL,
  ISSUES_URL,
  LICENSE_NAME,
  LICENSE_URL,
  REPO_URL,
  SECURITY_URL,
} from '../app/about'
import { useI18n } from '../i18n'
import { Icon } from './Icon'

export function SiteFooter() {
  const { t } = useI18n()
  return (
    <footer className="site-footer">
      <div className="site-footer-brand">
        <span className="brand">
          <img src="./favicon.svg" width={22} height={22} alt="" />
          {t('common.appName')}
        </span>
        <span className="muted small">{t('footer.tagline')}</span>
      </div>
      <nav className="site-footer-links" aria-label={t('common.appName')}>
        <a href={REPO_URL} target="_blank" rel="noreferrer">
          <Icon name="github" size={16} />
          {t('footer.github')}
        </a>
        <a href={ISSUES_URL} target="_blank" rel="noreferrer">
          <Icon name="bug" size={16} />
          {t('footer.issues')}
        </a>
        <a href={SECURITY_URL} target="_blank" rel="noreferrer">
          <Icon name="shield" size={16} />
          {t('footer.security')}
        </a>
      </nav>
      <p className="site-footer-credit muted small">
        {t('footer.madeBy')}{' '}
        <a href={AUTHOR_URL} target="_blank" rel="noreferrer">
          {AUTHOR_NAME}
        </a>
        {' · '}
        {t('footer.license')}{' '}
        <a href={LICENSE_URL} target="_blank" rel="noreferrer">
          {LICENSE_NAME}
        </a>
      </p>
    </footer>
  )
}
