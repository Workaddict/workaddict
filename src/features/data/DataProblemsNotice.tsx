import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../components/Icon'
import { useI18n } from '../../i18n'
import type { DataProblem } from '../../storage'
import { useSessionData } from '../auth/AuthContext'

const MAX_LISTED = 5

const keyOf = (p: DataProblem) => `${p.path}@${p.version}`

/**
 * One notice for repository files that could not be (fully) read. It is re-checked after every
 * successful query, and a dismissed file version stays dismissed until the file changes.
 */
export function DataProblemsNotice() {
  const { t } = useI18n()
  const { adapter } = useSessionData()
  const qc = useQueryClient()
  const dismissed = useRef(new Set<string>())
  const [problems, setProblems] = useState<DataProblem[]>([])

  useEffect(() => {
    const refresh = () => {
      const next = adapter.dataProblems().filter((p) => !dismissed.current.has(keyOf(p)))
      setProblems((cur) =>
        cur.map(keyOf).join('|') === next.map(keyOf).join('|') ? cur : next,
      )
    }
    refresh()
    return qc.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && event.action.type === 'success') refresh()
    })
  }, [adapter, qc])

  if (problems.length === 0) return null

  const dismiss = () => {
    for (const p of problems) dismissed.current.add(keyOf(p))
    setProblems([])
  }
  const listed = problems.slice(0, MAX_LISTED)
  const more = problems.length - listed.length
  return (
    <div className="banner banner-warning row top" role="status">
      <div className="data-problems">
        <span>{t('dataProblems.title')}</span>
        <ul>
          {listed.map((p) => (
            <li key={p.path}>
              <code>{p.path}</code>
            </li>
          ))}
          {more > 0 && <li>{t('dataProblems.more', { count: more })}</li>}
        </ul>
        <span className="muted">{t('dataProblems.hint')}</span>
      </div>
      <span className="spacer" />
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
