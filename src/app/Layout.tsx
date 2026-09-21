import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Avatar } from '../components/bits'
import { Icon, type IconName } from '../components/Icon'
import { formatClock } from '../domain/time'
import { useI18n } from '../i18n'
import { useAuth, useSessionData } from '../features/auth/AuthContext'
import { useNow } from '../features/tracker/useNow'
import { useTimerActions } from '../features/tracker/useTimerActions'

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
            <strong>{user.login}</strong>
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

export function Layout() {
  const { t } = useI18n()
  const { adapter } = useSessionData()

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
        <UserMenu />
      </header>

      <main className="main">
        {adapter.readOnly && <div className="banner banner-warning">{t('readOnly')}</div>}
        <Outlet />
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
