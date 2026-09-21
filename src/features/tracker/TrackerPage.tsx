import { addMonths, endOfMonth, startOfMonth, subMonths } from 'date-fns'
import { useEffect, useMemo, useRef, useState } from 'react'
import { EmptyState, Spinner } from '../../components/bits'
import { useI18n } from '../../i18n'
import { useSessionData } from '../auth/AuthContext'
import { useEntries } from '../data/hooks'
import { EntryList } from './EntryList'
import { TimerBar } from './TimerBar'

export function TrackerPage() {
  const { t } = useI18n()
  const { user } = useSessionData()
  const [who, setWho] = useState<'me' | 'everyone'>('me')
  const [months, setMonths] = useState(1)

  const range = useMemo(() => {
    const now = new Date()
    return {
      from: startOfMonth(subMonths(now, months - 1)),
      to: endOfMonth(addMonths(now, 1)),
    }
  }, [months])
  const query = useEntries(range)
  const all = query.data
  const entries = useMemo(
    () => (all ?? []).filter((e) => who === 'everyone' || e.login === user.login),
    [all, who, user.login],
  )

  // Auto-load the previous month when the end of the list scrolls into view; stop
  // auto-loading once a step back in time yields no additional entries.
  const sentinel = useRef<HTMLDivElement>(null)
  const countBeforeLoad = useRef<number | null>(null)
  const [exhausted, setExhausted] = useState(false)
  const loadOlder = () => {
    countBeforeLoad.current = all?.length ?? 0
    setMonths((m) => m + 1)
  }
  useEffect(() => {
    if (query.isFetching || !all || countBeforeLoad.current === null) return
    setExhausted(all.length === countBeforeLoad.current)
    countBeforeLoad.current = null
  }, [all, query.isFetching])

  const loadOlderRef = useRef(loadOlder)
  useEffect(() => {
    loadOlderRef.current = loadOlder
  })
  useEffect(() => {
    const el = sentinel.current
    if (!el || exhausted || query.isFetching) return
    const obs = new IntersectionObserver((items) => {
      if (items.some((i) => i.isIntersecting)) loadOlderRef.current()
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [exhausted, query.isFetching])

  return (
    <>
      <TimerBar />

      <div className="page-head">
        <h1>{t('nav.tracker')}</h1>
        <div className="segmented" role="group">
          <button aria-pressed={who === 'me'} onClick={() => setWho('me')}>
            {t('entries.me')}
          </button>
          <button aria-pressed={who === 'everyone'} onClick={() => setWho('everyone')}>
            {t('entries.everyone')}
          </button>
        </div>
      </div>

      {query.isPending ? (
        <Spinner label={t('common.loading')} />
      ) : (
        <>
          {entries.length === 0 && !query.isFetching ? (
            <div className="card">
              <EmptyState title={t('entries.empty')} hint={t('entries.emptyHint')} />
            </div>
          ) : (
            <EntryList entries={entries} showMember={who === 'everyone'} />
          )}
          <div ref={sentinel} className="center" style={{ padding: 8 }}>
            {query.isFetching ? (
              <span className="muted small">{t('entries.loadingOlder')}</span>
            ) : (
              <button className="btn btn-ghost" onClick={loadOlder}>
                {t('entries.loadOlder')}
              </button>
            )}
          </div>
        </>
      )}
    </>
  )
}
