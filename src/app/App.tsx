import { Suspense } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Spinner } from '../components/bits'
import { useAuth } from '../features/auth/AuthContext'
import { FixPage } from '../features/auth/FixPage'
import { LoginPage } from '../features/auth/LoginPage'
import { ApprovePage } from '../features/onboarding/ApprovePage'
import { JoinPage } from '../features/onboarding/JoinPage'
import { SetupPage } from '../features/onboarding/SetupPage'
import { AddProjectPage, ReplaceTokenPage } from '../features/profiles/ProfilePages'
import { TrackerPage } from '../features/tracker/TrackerPage'
import { HelpOverlayProvider } from '../features/help/HelpOverlayProvider'
import { useI18n } from '../i18n'
import { Layout } from './Layout'
import { lazyWithReload } from './lazyPage'
import { ZoneScope } from './ZoneScope'

// Secondary pages are split out so the tracker loads fast.
const StatsPage = lazyWithReload(() => import('../features/stats/StatsPage'))
const WorkGroupsPage = lazyWithReload(() => import('../features/workgroups/WorkGroupsPage'))
const SettingsPage = lazyWithReload(() => import('../features/settings/SettingsPage'))
const StartPage = lazyWithReload(() => import('../features/auth/StartPage'))
const ConnectAiPage = lazyWithReload(() => import('../features/settings/ConnectAiPage'))
const HelpPage = lazyWithReload(() => import('../features/help/HelpPage'))

/** Help pages for visitors who are not signed in, with the public header. */
function PublicHelp() {
  return (
    <Suspense fallback={<Spinner />}>
      <HelpPage shell="public" />
    </Suspense>
  )
}

export function App() {
  const { t } = useI18n()
  const { state } = useAuth()

  if (state.status === 'loading') return <Spinner label={t('common.loading')} />

  return (
    <HashRouter>
      <HelpOverlayProvider signedIn={state.status !== 'loggedOut'}>
        {state.status === 'loggedOut' ? (
          <Routes>
            <Route path="setup" element={<SetupPage />} />
            <Route path="join" element={<JoinPage />} />
            <Route path="help" element={<PublicHelp />} />
            <Route path="help/:topic" element={<PublicHelp />} />
            <Route path="token-help" element={<Navigate to="/help/token" replace />} />
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
            {/* Setting up or joining another repository adds it as a workspace. */}
            <Route path="setup" element={<SetupPage />} />
            <Route path="join" element={<JoinPage />} />
            <Route path="replace-token" element={<ReplaceTokenPage />} />
            <Route path="fix" element={<FixPage />} />
            {/* The public start page, for signed-in users; it has no app chrome. */}
            <Route path="start" element={<StartPage />} />
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
              <Route path="connect-ai" element={<ConnectAiPage />} />
              <Route path="help" element={<HelpPage />} />
              <Route path="help/:topic" element={<HelpPage />} />
              <Route path="token-help" element={<Navigate to="/help/token" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        )}
      </HelpOverlayProvider>
    </HashRouter>
  )
}
