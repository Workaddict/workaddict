import { useQuery } from '@tanstack/react-query'
import { Suspense, useState } from 'react'
import { lazyWithReload } from '../../app/lazyPage'
import { Avatar } from '../../components/bits'
import { Icon } from '../../components/Icon'
import { LANGUAGES, setLanguage, useI18n, type Language } from '../../i18n'
import { setTheme, useThemePref, type ThemePref } from '../../theme'
import { useAuth, useSessionData } from '../auth/AuthContext'
import { tokenKind } from '../auth/session'
import { useAccess } from '../data/hooks'
import { useErrorToast } from '../data/useErrorText'
import { downloadBackup } from '../export/backup'
import { ReassignEntriesModal } from './ReassignEntries'
import { RoleBadge, TeamRolesSection } from './TeamRoles'

const ImportWizard = lazyWithReload(() => import('../import/ImportWizard'))

export default function SettingsPage() {
  const { t, lang } = useI18n()
  const { logout } = useAuth()
  const { user, session, adapter } = useSessionData()
  const theme = useThemePref()
  const access = useAccess()
  const onError = useErrorToast()
  const [backingUp, setBackingUp] = useState(false)
  const [importing, setImporting] = useState(false)
  const [reassigning, setReassigning] = useState(false)
  const repoEmpty = useQuery({
    queryKey: ['importAvailable'],
    queryFn: () => adapter.isEmpty(),
    enabled: access.can('import'),
  }).data

  const backup = async () => {
    setBackingUp(true)
    try {
      await downloadBackup(adapter)
    } catch (e) {
      onError(e)
    } finally {
      setBackingUp(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>{t('settings.title')}</h1>
      </div>

      <section className="section">
        <h2>{t('settings.connection')}</h2>
        <div className="card settings-list">
          {session.mode === 'demo' ? (
            <div className="settings-row">
              <span className="muted">{t('settings.demoMode')}</span>
            </div>
          ) : (
            <div className="settings-row">
              <span>{t('settings.repo')}</span>
              <a href={`https://github.com/${session.repo}`} target="_blank" rel="noreferrer">
                <code>{session.repo}</code>
              </a>
            </div>
          )}
          {session.mode === 'github' && tokenKind(session.token) === 'classic' && (
            <div className="settings-row">
              <div className="banner banner-warning" role="note">
                {t('settings.classicToken')}
                {Array.isArray(session.scopes) && session.scopes.includes('repo') && <> {t('settings.classicTokenRepo')}</>}
              </div>
            </div>
          )}
          <div className="settings-row">
            <span>{t('settings.user')}</span>
            <span className="row">
              <Avatar member={user} />
              <strong>{user.login}</strong>
              <RoleBadge role={access.role} owner={access.owner} />
            </span>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>{t('settings.appearance')}</h2>
        <div className="card settings-list">
          <label className="settings-row">
            <span>{t('settings.language')}</span>
            <select
              className="select"
              value={lang}
              onChange={(e) => setLanguage(e.target.value as Language)}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <label className="settings-row">
            <span>{t('settings.theme')}</span>
            <select
              className="select"
              value={theme}
              onChange={(e) => setTheme(e.target.value as ThemePref)}
            >
              <option value="system">{t('settings.themeSystem')}</option>
              <option value="light">{t('settings.themeLight')}</option>
              <option value="dark">{t('settings.themeDark')}</option>
            </select>
          </label>
        </div>
      </section>

      <TeamRolesSection />

      <section className="section">
        <h2>{t('settings.data')}</h2>
        <div className="card settings-list">
          <div className="settings-row">
            <span className="muted small" style={{ flex: '1 1 260px' }}>
              {t('settings.backupHint')}
            </span>
            <button className="btn" onClick={backup} disabled={backingUp}>
              <Icon name="download" size={16} />
              {t('settings.downloadBackup')}
            </button>
          </div>
          {access.can('import') && (
            <div className="settings-row">
              <span className="muted small" style={{ flex: '1 1 260px' }}>
                {t('import.settingsHint')}
                {repoEmpty === false && (
                  <>
                    <br />
                    <strong>{t('import.replaceHint')}</strong>
                  </>
                )}
              </span>
              <button
                className="btn"
                onClick={() => setImporting(true)}
                disabled={adapter.readOnly}
              >
                {t('import.start')}
              </button>
            </div>
          )}
          {access.can('reassignEntries') && (
            <div className="settings-row">
              <span className="muted small" style={{ flex: '1 1 260px' }}>
                {t('reassign.settingsHint')}
              </span>
              <button
                className="btn"
                onClick={() => setReassigning(true)}
                disabled={adapter.readOnly}
              >
                {t('reassign.start')}
              </button>
            </div>
          )}
          <div className="settings-row">
            <span className="muted small" style={{ flex: '1 1 260px' }}>
              {t('settings.logoutHint')}
            </span>
            <button className="btn" onClick={() => void logout()}>
              <Icon name="logout" size={16} />
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </section>

      {importing && (
        <Suspense fallback={null}>
          <ImportWizard onClose={() => setImporting(false)} />
        </Suspense>
      )}
      {reassigning && <ReassignEntriesModal onClose={() => setReassigning(false)} />}
    </>
  )
}
