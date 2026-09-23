import { Link } from 'react-router-dom'
import { LanguageSwitch } from '../../components/LanguageSwitch'
import { ThemeToggle } from '../../components/ThemeToggle'
import { useI18n } from '../../i18n'

/** Header of the logged-out pages: start page, setup wizard and join flow. */
export function PublicHeader() {
  const { t } = useI18n()
  return (
    <header className="row landing-top">
      <Link to="/" className="brand brand-link">
        <img src="./favicon.svg" width={28} height={28} alt="" />
        {t('common.appName')}
      </Link>
      <span className="spacer" />
      <LanguageSwitch />
      <ThemeToggle />
    </header>
  )
}
