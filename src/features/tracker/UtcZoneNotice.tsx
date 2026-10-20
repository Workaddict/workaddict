import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { useI18n } from '../../i18n'
import { browserZone, reportsUtc, useZoneInfo } from '../../timeZone'
import { useAccess, useWorkspace } from '../data/hooks'
import { TIME_ZONE_SECTION_ID } from '../settings/TimeZoneSection'
import { TipButton } from '../../components/InfoTip'

const DISMISSED_KEY = 'workaddict.utcNoticeDismissed'

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Warns when the browser reports UTC (privacy settings often hide the real zone this way) and
 * nothing overrides it: neither a team time zone nor a zone chosen on this device.
 */
export function UtcZoneNotice() {
  const { t } = useI18n()
  const access = useAccess()
  const loaded = useWorkspace().data !== undefined
  const { source } = useZoneInfo()
  const [dismissed, setDismissed] = useState(readDismissed)
  if (!loaded || dismissed || source !== 'browser' || !reportsUtc(browserZone())) return null

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISSED_KEY, '1')
    } catch {
      // storage unavailable: hidden for this session only
    }
  }
  const leader = access.can('setTeamTimeZone')
  return (
    <div className="banner banner-warning row" role="note">
      <span>
        {t('timeZone.notice')} {!leader && t('timeZone.noticeMember')}
      </span>
      <span className="spacer" />
      {leader && (
        <Link className="btn btn-sm" to="/settings" state={{ scrollTo: TIME_ZONE_SECTION_ID }}>
          {t('timeZone.noticeLeader')}
        </Link>
      )}
      <TipButton
        className="btn btn-icon btn-sm"
        onClick={dismiss}
        tip={t('timeZone.noticeDismiss')}
      >
        <Icon name="x" size={14} />
      </TipButton>
    </div>
  )
}
