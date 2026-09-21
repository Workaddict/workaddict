import { addMonths, endOfMonth, startOfMonth, subMonths } from 'date-fns'
import { useEffect, useMemo, useRef, useState } from 'react'
import { EmptyState, Spinner } from '../../components/bits'
import { useI18n } from '../../i18n'
import { useSessionData } from '../auth/AuthContext'
import { useAccess, useEntries } from '../data/hooks'
import { EntryList } from './EntryList'
import { TeamNow } from './TeamNow'
import { TimerBar } from './TimerBar'

/** Consecutive months without new entries after which "load older" gives up. */
const MAX_EMPTY_MONTHS = 12

export function TrackerPage() {
  const { t } = useI18n()
  const { user } = useSessionData()
  const access = useAccess()
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

  // Auto-load older months when the end of the list scrolls into view. One load keeps stepping
  // back past empty months until new visible entries appear, so a single click always shows
  // something; after MAX_EMPTY_MONTHS empty months in a row, auto-loading stops.
  const sentinel = useRef<HTMLDivElement>(null)
  const pendingLoad = useRef<{ count: number; emptyMonths: number } | null>(null)
  const [exhausted, setExhausted] = useState(false)
  const loadOlder = () => {
    pendingLoad.current = { count: entries.length, emptyMonths: 0 }
    setMonths((m) => m + 1)
  }
  useEffect(() => {
    const pending = pendingLoad.current
    if (query.isFetching || !all || pending === null) return
    if (entries.length > pending.count) {
      pendingLoad.current = null
      setExhausted(false)
    } else if (pending.emptyMonths + 1 >= MAX_EMPTY_MONTHS) {
      pendingLoad.current = null
      setExhausted(true)
    } else {
      pending.emptyMonths += 1
      setMonths((m) => m + 1)
    }
  }, [all, entries.length, query.isFetching])
  const showWho = (next: 'me' | 'everyone') => {
    setWho(next)
    setExhausted(false)
  }

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
      {access.can('viewLiveActivity') && <TeamNow />}

      <div className="page-head">
        <h1>{t('nav.tracker')}</h1>
        <div className="segmented" role="group">
          <button aria-pressed={who === 'me'} onClick={() => showWho('me')}>
            {t('entries.me')}
          </button>
          <button aria-pressed={who === 'everyone'} onClick={() => showWho('everyone')}>
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
