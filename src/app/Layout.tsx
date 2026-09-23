import { Suspense, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Avatar, Spinner } from '../components/bits'
import { Icon, type IconName } from '../components/Icon'
import { ThemeToggle } from '../components/ThemeToggle'
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

function UserMenu() {
  const { t } = useI18n()
  const { logout } = useAuth()
  const { user, session } = useSessionData()
  const access = useAccess()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div className="user-menu" ref={ref}>
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
          <Link className="menu-item" role="menuitem" to="/settings" onClick={() => setOpen(false)}>
            <Icon name="settings" size={16} />
            {t('nav.settings')}
          </Link>
          <button className="menu-item" role="menuitem" onClick={() => void logout()}>
            <Icon name="logout" size={16} />
            {t('nav.logout')}
          </button>
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
