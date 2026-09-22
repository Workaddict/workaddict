import type { ReactNode } from 'react'
import { useI18n } from '../i18n'
import { isFramed } from './frame'

/** Renders the app only as a top-level page, so no other site can overlay it (clickjacking). */
export function FrameGuard({ children, framed = isFramed() }: { children: ReactNode; framed?: boolean }) {
  const { t } = useI18n()
  if (!framed) return children
  return (
    <div className="center">
      <p>{t('framed.text')}</p>
      <a className="btn btn-primary" href={window.location.href} target="_blank" rel="noopener noreferrer">
        {t('framed.open')}
      </a>
    </div>
  )
}
