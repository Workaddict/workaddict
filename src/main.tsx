import {
  focusManager,
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { ConfirmProvider } from './components/Modal'
import { ToastProvider } from './components/Toasts'
import { AuthProvider } from './features/auth/AuthContext'
import { reportError } from './features/auth/authEvents'
import './i18n'
import { isStorageError } from './storage'
import './styles/global.css'
import { applyTheme } from './theme'

applyTheme()

// TanStack Query v5 only reacts to `visibilitychange`, which never fires when switching between
// two visible windows (e.g. two browsers side by side). Also treat window focus as "refocused",
// so data changed on another device shows up as soon as the user clicks into this window.
focusManager.setEventListener((handleFocus) => {
  const onChange = () => handleFocus()
  window.addEventListener('visibilitychange', onChange)
  window.addEventListener('focus', onChange)
  return () => {
    window.removeEventListener('visibilitychange', onChange)
    window.removeEventListener('focus', onChange)
  }
})

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: reportError }),
  mutationCache: new MutationCache({ onError: reportError }),
  defaultOptions: {
    queries: {
      staleTime: 20_000,
      retry: (count, e) =>
        count < 2 && !isStorageError(e, 'auth') && !isStorageError(e, 'rateLimit'),
    },
    mutations: { retry: false },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>,
)
