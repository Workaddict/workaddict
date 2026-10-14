import { Link } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { SiteFooter } from '../../components/SiteFooter'
import { useI18n } from '../../i18n'
import { Highlights, LandingHero } from './Landing'
import { PublicHeader } from './PublicHeader'

/**
 * The start page for a signed-in user (from the avatar menu). Sign-in and setup are left out:
 * the user already has a workspace, so the only action is going back to it.
 */
export default function StartPage() {
  const { t } = useI18n()
  return (
    <div className="landing">
      <PublicHeader />
      <div className="landing-main landing-main-single">
        <LandingHero
          actions={
            <Link to="/" className="btn btn-primary btn-lg">
              <Icon name="clock" size={16} />
              {t('nav.backToApp')}
            </Link>
          }
        />
      </div>
      <Highlights />
      <SiteFooter />
    </div>
  )
}
