import { formatDistanceStrict, isSameDay } from 'date-fns'
import { useEffect, useState } from 'react'
import { Modal } from '../../components/Modal'
import { useI18n } from '../../i18n'
import { useSessionData } from '../auth/AuthContext'
import { useMyTimer, useTimers } from '../data/hooks'
import { presenceSnapshot, type PresenceSnapshot } from './presence'
import { closedTimerSince, keepTimerRunning, readTimerDevice, useStopOnClose } from './stopOnClose'
import { useTimerActions } from './useTimerActions'

/** Snapshots already checked: the question is asked at most once per page load. */
const checked = new WeakSet<Promise<PresenceSnapshot>>()

/**
 * Asks what to do with the own timer when this device was left with it running
 * ("Stop timer when I close the page", design D1–D4 of `timer-feedback`).
 */
export function StopOnClosePrompt({
  presence = presenceSnapshot(),
}: {
  presence?: Promise<PresenceSnapshot> | null
}) {
  const { t, locale, time: fmtTime, dateTime } = useI18n()
  const { session, adapter } = useSessionData()
  const loaded = useTimers().isSuccess
  const timer = useMyTimer()
  const enabled = useStopOnClose()
  const { stopTimer, stopTimerAt } = useTimerActions()
  const [since, setSince] = useState<number | null>(null)

  useEffect(() => {
    if (!presence || !loaded || checked.has(presence)) return
    checked.add(presence)
    void presence.then((p) =>
      setSince(
        closedTimerSince({
          enabled,
          demo: session.mode === 'demo',
          readOnly: adapter.readOnly,
          timer,
          device: readTimerDevice(),
          lastAlive: p.lastAlive,
          othersOpen: p.othersOpen,
          reloaded: p.reloaded,
          now: Date.now(),
        }),
      ),
    )
  }, [presence, loaded, enabled, session.mode, adapter.readOnly, timer])

  if (since === null || !timer) return null

  const now = new Date()
  const time = isSameDay(since, now) ? fmtTime(since) : dateTime(since)
  const close = () => setSince(null)

  return (
    <Modal title={t('closeStop.title')} onClose={close} dismissible={false}>
      <p>
        {t('closeStop.message', {
          description: timer.description || t('common.noDescription'),
          time,
          ago: formatDistanceStrict(since, now, { locale }),
        })}
      </p>
      <div className="modal-actions">
        <button
          className="btn"
          data-autofocus-skip
          onClick={() => {
            keepTimerRunning(timer.id)
            close()
          }}
        >
          {t('closeStop.keep')}
        </button>
        <button
          className="btn"
          data-autofocus-skip
          onClick={() => {
            stopTimer()
            close()
          }}
        >
          {t('closeStop.stopNow')}
        </button>
        <button
          className="btn btn-primary"
          onClick={() => {
            stopTimerAt(new Date(since))
            close()
          }}
        >
          {t('closeStop.stopAt', { time: fmtTime(since) })}
        </button>
      </div>
    </Modal>
  )
}
