import { Suspense, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Avatar, Spinner } from '../components/bits'
import { Icon, type IconName } from '../components/Icon'
import { useConfirm } from '../components/Modal'
import { ThemeToggle } from '../components/ThemeToggle'
import { useToast } from '../components/Toasts'
import { formatClock } from '../domain/time'
import { useI18n } from '../i18n'
import { useAuth, useSessionData } from '../features/auth/AuthContext'
import { useNow } from '../features/tracker/useNow'
import { StopOnClosePrompt } from '../features/tracker/StopOnClosePrompt'
import { useStoppedByNotice } from '../features/tracker/useStoppedByNotice'
import { useTimerActions } from '../features/tracker/useTimerActions'
import { useTimerTitle } from '../features/tracker/useTimerTitle'
import { DataProblemsNotice } from '../features/data/DataProblemsNotice'
import { useAccess, useTeamRoles } from '../features/data/hooks'
import { RoleBadge, TEAM_SECTION_ID } from '../features/settings/TeamRoles'
import { fixPathForProfile } from '../features/profiles/profileNav'
import { ProfileName } from '../features/profiles/StartScreens'
import { MigrationNotice } from '../features/profiles/MigrationNotice'
import { useRunningTimers } from '../features/profiles/timerProbe'
import { tokenOf } from '../features/profiles/vault'
import { useVault } from '../features/profiles/vaultStore'
import { PageErrorBoundary } from './lazyPage'

const NAV: { to: string; key: string; icon: IconName }[] = [
  { to: '/', key: 'nav.tracker', icon: 'clock' },
  { to: '/stats', key: 'nav.stats', icon: 'chart' },
  { to: '/groups', key: 'nav.workGroups', icon: 'folder' },
  { to: '/settings', key: 'nav.settings', icon: 'settings' },
]

function HeaderTimer() {
  const { t } = useI18n()
  const { timer, stopTimer, busy } = useTimerActions()
  const now = useNow(!!timer)
  if (!timer) return null
  return (
    <div className="header-timer" title={timer.description || t('common.noDescription')}>
      <span className="desc">{timer.description || t('common.noDescription')}</span>
      <span className="clock" aria-live="off">
        {formatClock(now - new Date(timer.start).getTime())}
      </span>
      <button
        className="stop-btn"
        onClick={stopTimer}
        disabled={busy || timer.id === 'pending'}
        aria-label={t('timer.stop')}
        title={t('timer.stop')}
      >
        <Icon name="stop" size={14} filled />
      </button>
    </div>
  )
}

/**
 * The open workspace, next to the avatar; it opens the switcher and pulses once when the tab
 * switches to another workspace.
 */
function WorkspaceChip({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { t } = useI18n()
  const { session, profileId } = useSessionData()
  const { data } = useVault()
  const repo = session.mode === 'github' ? session.repo : null
  const label = repo
    ? (data?.profiles.find((p) => p.id === profileId)?.label ?? repo)
    : t('profiles.demo')
  const key = repo ?? 'demo'
  const [shown, setShown] = useState(key)
  const [switches, setSwitches] = useState(0)
  if (shown !== key) {
    setShown(key)
    setSwitches((n) => n + 1)
  }
  return (
    <>
      <button
        type="button"
        className="project-chip-btn"
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('profiles.switcher', { name: label })}
        title={repo && label !== repo ? `${label} (${repo})` : label}
      >
        <span key={switches} className={`project-chip${switches ? ' is-switched' : ''}`}>
          <Icon name="folder" size={14} />
          <span className="project-chip-label">{label}</span>
          <Icon name="chevron" size={12} />
        </span>
      </button>
      <span className="visually-hidden" aria-live="polite">
        {switches ? label : ''}
      </span>
    </>
  )
}

function UserMenu() {
  const { t } = useI18n()
  const { logout, lock, switchProfile, removeProfile } = useAuth()
  const { user, session, profileId } = useSessionData()
  const access = useAccess()
  const { status, data } = useVault()
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const profiles =
    status === 'unlocked' && data
      ? [...data.profiles].sort((a, b) => a.label.localeCompare(b.label))
      : []
  const others = profiles.filter((p) => p.id !== profileId).map((p) => p.id)
  const running = useRunningTimers(data, others, open)
  const active = profiles.find((p) => p.id === profileId)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const close = () => setOpen(false)

  const switchTo = async (id: string) => {
    close()
    try {
      await switchProfile(id)
      navigate('/')
    } catch {
      toast.error(t('profiles.switchFailed'))
    }
  }

  const remove = async () => {
    if (!active) return
    close()
    const ok = await confirm({
      message: t('profiles.removeConfirm', { repo: active.label }),
      confirmLabel: t('profiles.remove'),
    })
    if (!ok) return
    await removeProfile(active.id)
    navigate('/')
  }

  return (
    <div className="user-menu" ref={ref}>
      <WorkspaceChip open={open} onToggle={() => setOpen((o) => !o)} />
      <button
        className="btn btn-icon"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={user.login}
      >
        <Avatar member={user} large />
      </button>
      {open && (
        <div className="menu" role="menu">
          <div className="menu-label">
            <strong>{user.login}</strong> <RoleBadge role={access.role} owner={access.owner} />
            <br />
            {session.mode === 'github' ? session.repo : 'demo'}
          </div>
          {profiles.length > 0 && (
            <>
              <div className="menu-section" aria-hidden="true">
                {t('profiles.title')}
              </div>
              {profiles.map((p) => {
                const rejected = tokenOf(data!, p)?.rejected
                const current = p.id === profileId
                return rejected ? (
                  <Link
                    key={p.id}
                    className="menu-item"
                    role="menuitem"
                    to={fixPathForProfile(p)}
                    onClick={close}
                  >
                    <ProfileName profile={p} />
                    <span className="chip chip-warning">{t('profiles.tokenRejected')}</span>
                  </Link>
                ) : (
                  <button
                    key={p.id}
                    className="menu-item"
                    role="menuitemradio"
                    aria-checked={current}
                    aria-current={current ? 'true' : undefined}
                    onClick={() => (current ? close() : void switchTo(p.id))}
                  >
                    <span style={{ width: 16, display: 'inline-flex' }}>
                      {current && <Icon name="check" size={16} />}
                    </span>
                    <ProfileName profile={p} />
                    {running.has(p.id) && (
                      <span
                        className="timer-dot"
                        role="img"
                        aria-label={t('profiles.timerRunning')}
                        title={t('profiles.timerRunning')}
                      />
                    )}
                  </button>
                )
              })}
            </>
          )}
          {session.mode === 'github' && (
            <Link className="menu-item" role="menuitem" to="/add-project" onClick={close}>
              <Icon name="plus" size={16} />
              {t('profiles.add')}
            </Link>
          )}
          <div className="menu-divider" />
          <Link className="menu-item" role="menuitem" to="/settings" onClick={close}>
            <Icon name="settings" size={16} />
            {t('nav.settings')}
          </Link>
          {profileId ? (
            <>
              <button className="menu-item" role="menuitem" onClick={() => void remove()}>
                <Icon name="trash" size={16} />
                {t('profiles.removeThis')}
              </button>
              <button className="menu-item" role="menuitem" onClick={() => void lock()}>
                <Icon name="lock" size={16} />
                {t('profiles.lock')}
              </button>
            </>
          ) : (
            <button className="menu-item" role="menuitem" onClick={() => void logout()}>
              <Icon name="logout" size={16} />
              {t('nav.logout')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const ROLES_HINT_KEY = 'workaddict.rolesHintDismissed'

function readDismissed(): boolean {
  try {
    return localStorage.getItem(ROLES_HINT_KEY) === '1'
  } catch {
    return false
  }
}

/** Reminds owners to assign roles until roles.json exists or the hint is dismissed. */
function RolesHint() {
  const { t } = useI18n()
  const { adapter } = useSessionData()
  const access = useAccess()
  const [dismissed, setDismissed] = useState(readDismissed)
  const show = access.owner && !adapter.readOnly && !dismissed
  const team = useTeamRoles({ enabled: show })
  if (!show || team.data?.configured !== false) return null

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(ROLES_HINT_KEY, '1')
    } catch {
      // storage unavailable: hidden for this session only
    }
  }
  return (
    <div className="banner banner-info row">
      <span>{t('roles.banner')}</span>
      <span className="spacer" />
      <Link className="btn btn-sm" to="/settings" state={{ scrollTo: TEAM_SECTION_ID }}>
        {t('roles.bannerAction')}
      </Link>
      <button
        className="btn btn-icon btn-sm"
        onClick={dismiss}
        aria-label={t('common.close')}
        title={t('common.close')}
      >
        <Icon name="x" size={14} />
      </button>
    </div>
  )
}

export function Layout() {
  const { t } = useI18n()
  const { adapter } = useSessionData()
  const { pathname } = useLocation()
  useStoppedByNotice()
  useTimerTitle()

  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="brand">
          <img src="./favicon.svg" width={24} height={24} alt="" />
          <span>{t('common.appName')}</span>
        </Link>
        <nav className="nav" aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'}>
              <Icon name={n.icon} size={17} />
              {t(n.key)}
            </NavLink>
          ))}
        </nav>
        <span className="spacer" />
        <HeaderTimer />
        <ThemeToggle />
        <UserMenu />
      </header>

      <main className="main">
        {adapter.readOnly && <div className="banner banner-warning">{t('readOnly')}</div>}
        <MigrationNotice />
        <DataProblemsNotice />
        <RolesHint />
        <StopOnClosePrompt />
        {/* Keyed by path so an error on one page clears when the user navigates away. */}
        <PageErrorBoundary key={pathname}>
          <Suspense fallback={<Spinner />}>
            <Outlet />
          </Suspense>
        </PageErrorBoundary>
      </main>

      <nav className="bottom-nav" aria-label="Main">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'}>
            <Icon name={n.icon} size={20} />
            <span>{t(n.key)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
