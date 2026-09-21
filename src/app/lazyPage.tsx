import { Component, lazy, type ComponentType, type ReactNode } from 'react'
import { EmptyState } from '../components/bits'
import { useI18n } from '../i18n'

const RELOAD_KEY = 'workaddict:chunk-reload'
/** A second failure within this window means a reload did not help, so show the error instead. */
const RELOAD_WINDOW_MS = 10_000

/**
 * `React.lazy` that reloads the page once when a code chunk fails to load. After a deploy, a tab
 * that still runs the old version requests chunk files that no longer exist on GitHub Pages;
 * reloading fetches the new index.html together with its chunks.
 */
export function lazyWithReload<P extends object>(
  factory: () => Promise<{ default: ComponentType<P> }>,
) {
  return lazy(() =>
    factory().catch((e: unknown) => {
      if (!claimReload()) throw e
      window.location.reload()
      return new Promise<never>(() => {})
    }),
  )
}

function claimReload(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0)
    if (Date.now() - last < RELOAD_WINDOW_MS) return false
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
    return true
  } catch {
    return false
  }
}

/** Shows a reload hint instead of a blank page when a page fails to load or render. */
export class PageErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.error(error)
  }

  render() {
    return this.state.failed ? <PageLoadError /> : this.props.children
  }
}

function PageLoadError() {
  const { t } = useI18n()
  return (
    <div className="card">
      <EmptyState icon="restore" title={t('common.pageLoadError')} hint={t('common.pageLoadErrorHint')}>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          {t('common.reload')}
        </button>
      </EmptyState>
    </div>
  )
}
