import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/Toasts'
import { setHintLevel, useIsExpert } from '../../hintLevel'
import { useI18n } from '../../i18n'
import { useSessionData } from '../auth/AuthContext'
import {
  setWelcome,
  startTour,
  takePendingTour,
  useTourRun,
  useWelcome,
  type WelcomeState,
} from './tourStore'

/** Own entries older than this mark someone who used the app before the update. */
const EXISTING_AFTER_DAYS = 7
/** How far back the existing-user check looks. */
const EXISTING_LOOKBACK_DAYS = 92

/** Whether the current member already has own entries older than a week (real workspaces only). */
function useIsExistingUser(enabled: boolean) {
  const { adapter, user } = useSessionData()
  return useQuery({
    queryKey: ['welcomeExistingUser', user.login],
    queryFn: async () => {
      const day = 24 * 3600_000
      const now = Date.now()
      const range = {
        from: new Date(now - EXISTING_LOOKBACK_DAYS * day),
        to: new Date(now - EXISTING_AFTER_DAYS * day),
      }
      return (await adapter.listEntries(range)).some((e) => e.login === user.login)
    },
    enabled,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}

/**
 * Welcome dialog after the first sign-in on a device: start the tour, later, no thanks, or Expert
 * mode. Members who used the app before the update get a one-time notice instead. In the demo
 * the dialog uses its own in-memory state, and "Demo with tour" starts the tour right away.
 */
export function Welcome({ isDemo }: { isDemo: boolean }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const toast = useToast()
  const expert = useIsExpert()
  const state = useWelcome(isDemo)
  const { running } = useTourRun()

  useEffect(() => {
    if (isDemo && takePendingTour()) {
      setWelcome(true, { status: 'done', laterCount: 0 })
      startTour()
    }
  }, [isDemo])

  const due =
    !expert &&
    !running &&
    !state.askedThisLoad &&
    (state.status === 'new' || state.status === 'later')
  const check = useIsExistingUser(due && !isDemo && state.status === 'new')
  const existing = check.data === true

  useEffect(() => {
    if (!existing) return
    setWelcome(false, { status: 'declined', laterCount: 0, existing: true })
    toast.info(t('help.welcome.existingNotice'))
  }, [existing, toast, t])

  const waiting = !isDemo && state.status === 'new' && (check.isPending || existing)
  if (!due || waiting) return null

  const choose = (next: Partial<WelcomeState>) => setWelcome(isDemo, { ...state, ...next })
  const later = () => {
    const laterCount = state.laterCount + 1
    choose(
      laterCount >= 2
        ? { status: 'declined', laterCount }
        : { status: 'later', laterCount, askedThisLoad: true },
    )
  }
  const start = () => {
    choose({ status: 'done' })
    navigate('/')
    startTour()
  }

  return (
    <Modal title={t('help.welcome.title')} onClose={later}>
      <p>{t(isDemo ? 'help.welcome.demoIntro' : 'help.welcome.intro')}</p>
      <div className="welcome-actions">
        <button type="button" className="btn btn-primary btn-lg" onClick={start}>
          {t('help.welcome.start')}
        </button>
        <div className="row wrap">
          <button type="button" className="btn" onClick={later}>
            {t('help.welcome.later')}
          </button>
          <button type="button" className="btn" onClick={() => choose({ status: 'declined' })}>
            {t('help.welcome.no')}
          </button>
        </div>
        {!isDemo && (
          <div className="stack" style={{ gap: 2 }}>
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setHintLevel('expert')
                choose({ status: 'declined' })
              }}
            >
              {t('help.welcome.expert')}
            </button>
            <span className="muted small">{t('help.welcome.expertHint')}</span>
          </div>
        )}
      </div>
    </Modal>
  )
}
