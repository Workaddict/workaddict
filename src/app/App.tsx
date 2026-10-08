import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Spinner } from '../components/bits'
import { useAuth } from '../features/auth/AuthContext'
import { FixPage } from '../features/auth/FixPage'
import { LoginPage } from '../features/auth/LoginPage'
import { TokenHelpPage } from '../features/auth/TokenHelpPage'
import { ApprovePage } from '../features/onboarding/ApprovePage'
import { JoinPage } from '../features/onboarding/JoinPage'
import { SetupPage } from '../features/onboarding/SetupPage'
import { AddProjectPage, ReplaceTokenPage } from '../features/profiles/ProfilePages'
import { TrackerPage } from '../features/tracker/TrackerPage'
import { useI18n } from '../i18n'
import { Layout } from './Layout'
import { lazyWithReload } from './lazyPage'
import { ZoneScope } from './ZoneScope'

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
          <Route path="token-help" element={<TokenHelpPage />} />
          <Route path="fix" element={<FixPage />} />
          <Route path="approve" element={<ApprovePage />} />
          <Route path="add-project" element={<AddProjectPage />} />
          <Route path="replace-token" element={<ReplaceTokenPage />} />
          <Route path="*" element={<LoginPage />} />
        </Routes>
      ) : (
        <Routes>
          {/* Owners open the link from a member while signed in; the page has no app chrome. */}
          <Route path="approve" element={<ApprovePage />} />
          {/* Adding a project or replacing a token keeps the current profile signed in. */}
          <Route path="add-project" element={<AddProjectPage />} />
          <Route path="replace-token" element={<ReplaceTokenPage />} />
          <Route path="fix" element={<FixPage />} />
          <Route
            element={
              <ZoneScope>
                <Layout />
              </ZoneScope>
            }
          >
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
