import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useToast } from '../../components/Toasts'
import { useI18n } from '../../i18n'
import {
  browserZone,
  isValidZone,
  reportsUtc,
  setDeviceZone,
  useZoneInfo,
  zoneList,
  type ZoneSource,
} from '../../timeZone'
import { useSessionData } from '../auth/AuthContext'
import { useAccess, useSetTeamTimeZone, useWorkspace } from '../data/hooks'
import { useErrorToast } from '../data/useErrorText'
import { HelpButton } from '../help/Term'

export const TIME_ZONE_SECTION_ID = 'time-zone'

/**
 * Picks an IANA zone: a list where the browser can name its zones, otherwise a text field that
 * only applies a valid name. `none` is the label of the empty choice ("").
 */
function ZoneSelect({
  value,
  none,
  onChange,
  disabled,
  label,
}: {
  value: string
  none: string
  onChange: (zone: string | null) => void
  disabled?: boolean
  label: string
}) {
  const { t } = useI18n()
  const zones = useMemo(() => zoneList(), [])
  const [text, setText] = useState(value)
  const errorId = useId()

  if (zones.length > 0) {
    // Keep a stored zone selectable even if this browser does not list it.
    const options = value && !zones.includes(value) ? [value, ...zones] : zones
    return (
      <select
        className="select"
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">{none}</option>
        {options.map((z) => (
          <option key={z} value={z}>
            {z}
          </option>
        ))}
      </select>
    )
  }

  const invalid = text.trim() !== '' && !isValidZone(text.trim())
  return (
    <form
      className="row"
      onSubmit={(e) => {
        e.preventDefault()
        if (!invalid) onChange(text.trim() || null)
      }}
    >
      <input
        className="input"
        aria-label={label}
        placeholder={t('timeZone.placeholder')}
        value={text}
        disabled={disabled}
        aria-invalid={invalid}
        aria-describedby={invalid ? errorId : undefined}
        onChange={(e) => setText(e.target.value)}
      />
      <button className="btn" disabled={disabled || invalid || text.trim() === value}>
        {t('timeZone.apply')}
      </button>
      {invalid && (
        <span id={errorId} className="banner banner-error" role="alert">
          {t('timeZone.invalid')}
        </span>
      )}
    </form>
  )
}

/**
 * Settings section: the zone in use and where it comes from, what the browser reports, the team
 * zone (team leaders change it), and this device's override.
 */
export function TimeZoneSection() {
  const { t } = useI18n()
  const { adapter } = useSessionData()
  const access = useAccess()
  const toast = useToast()
  const onError = useErrorToast()
  const { zone, source } = useZoneInfo()
  const workspace = useWorkspace().data
  const teamZone = workspace?.timeZone ?? null
  const browser = browserZone()
  const browserUtc = reportsUtc(browser)
  const canSet = access.can('setTeamTimeZone') && !adapter.readOnly
  const setTeam = useSetTeamTimeZone({ onError })
  const ref = useRef<HTMLElement>(null)
  const scrollTo = (useLocation().state as { scrollTo?: string } | null)?.scrollTo

  useEffect(() => {
    if (scrollTo === TIME_ZONE_SECTION_ID) ref.current?.scrollIntoView({ block: 'start' })
  }, [scrollTo])

  const saveTeam = (next: string | null) =>
    setTeam.mutate(next, {
      onSuccess: () =>
        toast.info(next ? t('timeZone.teamSaved', { zone: next }) : t('timeZone.teamCleared')),
    })

  const sourceLabel: Record<ZoneSource, string> = {
    team: t('timeZone.sourceTeam'),
    device: t('timeZone.sourceDevice'),
    browser: t('timeZone.sourceBrowser'),
  }

  const warning = browserUtc
    ? source === 'browser'
      ? t('timeZone.browserHiddenNoTeam')
      : t('timeZone.browserHidden', { zone })
    : zone !== browser
      ? t('timeZone.differs', { browser, zone })
      : null

  return (
    <section className="section" id={TIME_ZONE_SECTION_ID} ref={ref}>
      <div className="head-with-help">
        <h2>{t('timeZone.title')}</h2>
        <HelpButton topic="time-zone" />
      </div>
      <div className="card settings-list">
        <div className="settings-row">
          <span>{t('timeZone.inUse')}</span>
          <span>
            <code>{zone}</code> <span className="muted small">({sourceLabel[source]})</span>
          </span>
        </div>
        <div className="settings-row">
          <span>{t('timeZone.browser')}</span>
          <code>{browser}</code>
        </div>
        {warning && (
          <div className="settings-row">
            <div className="banner banner-warning" role="note">
              {warning}
            </div>
          </div>
        )}
        {canSet && workspace && !teamZone && (
          <div className="settings-row">
            <div className="banner banner-info row">
              <span>{t('timeZone.teamPrompt')}</span>
              {!browserUtc && (
                <button
                  className="btn btn-primary"
                  onClick={() => saveTeam(browser)}
                  disabled={setTeam.isPending}
                >
                  {t('timeZone.teamUse', { zone: browser })}
                </button>
              )}
            </div>
          </div>
        )}
        <div className="settings-row">
          <div className="stack" style={{ gap: 2 }}>
            <span>{t('timeZone.team')}</span>
            <span className="muted small">{t('timeZone.teamHint')}</span>
          </div>
          {canSet ? (
            <ZoneSelect
              label={t('timeZone.team')}
              value={teamZone ?? ''}
              none={t('timeZone.teamNone')}
              onChange={saveTeam}
              disabled={setTeam.isPending || !workspace}
            />
          ) : (
            <span>{teamZone ? <code>{teamZone}</code> : t('timeZone.teamNone')}</span>
          )}
        </div>
        <div className="settings-row">
          <div className="stack" style={{ gap: 2 }}>
            <span>{t('timeZone.device')}</span>
            <span className="muted small">{t('timeZone.deviceHint')}</span>
          </div>
          <ZoneSelect
            label={t('timeZone.device')}
            value={source === 'device' ? zone : ''}
            none={teamZone ? t('timeZone.deviceTeam') : t('timeZone.deviceBrowser')}
            onChange={setDeviceZone}
          />
        </div>
      </div>
    </section>
  )
}
