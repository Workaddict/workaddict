import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Spinner } from '../components/bits'
import { useAuth } from '../features/auth/AuthContext'
import { LoginPage } from '../features/auth/LoginPage'
import { JoinPage } from '../features/onboarding/JoinPage'
import { SetupPage } from '../features/onboarding/SetupPage'
import { TrackerPage } from '../features/tracker/TrackerPage'
import { useI18n } from '../i18n'
import { Layout } from './Layout'
import { lazyWithReload } from './lazyPage'

// Secondary pages are split out so the tracker loads fast.
const StatsPage = lazyWithReload(() => import('../features/stats/StatsPage'))
const WorkGroupsPage = lazyWithReload(() => import('../features/workgroups/WorkGroupsPage'))
const SettingsPage = lazyWithReload(() => import('../features/settings/SettingsPage'))

export function App() {
  const { t } = useI18n()
  const { state } = useAuth()

  if (state.status === 'loading') return <Spinner label={t('common.loading')} />

  return (
    <HashRouter>
      {state.status === 'loggedOut' ? (
        <Routes>
          <Route path="setup" element={<SetupPage />} />
          <Route path="join" element={<JoinPage />} />
          <Route path="*" element={<LoginPage />} />
        </Routes>
      ) : (
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<TrackerPage />} />
            <Route path="stats" element={<StatsPage />} />
            <Route path="groups" element={<WorkGroupsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      )}
    </HashRouter>
  )
}
