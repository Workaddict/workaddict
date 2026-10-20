import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../../components/Toasts'
import { setHintLevel, useIsExpert } from '../../hintLevel'
import { useI18n } from '../../i18n'
import { showChecklistAgain } from './checklistState'
import { resetWelcome, startTour } from './tourStore'
import { NewDot } from './newFeatures'

/** Settings → "Help & guide": Expert mode, restart the tour, show tips again, help center. */
export function HelpGuideSection() {
  const { t } = useI18n()
  const expert = useIsExpert()
  const navigate = useNavigate()
  const toast = useToast()

  const restart = () => {
    navigate('/')
    startTour()
  }
  const showTips = () => {
    showChecklistAgain()
    resetWelcome()
    toast.info(t('help.settings.tipsShown'))
  }

  return (
    <section className="section" data-tour="help-guide">
      <h2>
        {t('help.settings.title')}
        <NewDot feature="help-guide" seenOn="view" />
      </h2>
      <div className="card settings-list">
        <div className="settings-row">
          <div className="stack" style={{ gap: 2 }}>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={expert}
                onChange={(e) => setHintLevel(e.target.checked ? 'expert' : 'guided')}
              />
              <span>{t('help.settings.expert')}</span>
            </label>
            <span className="muted small">{t('help.settings.expertHint')}</span>
          </div>
        </div>
        <div className="settings-row">
          <span className="muted small" style={{ flex: '1 1 260px' }}>
            {t('help.settings.restartHint')}
          </span>
          <button type="button" className="btn" onClick={restart}>
            {t('help.settings.restartTour')}
          </button>
        </div>
        <div className="settings-row">
          <span className="muted small" style={{ flex: '1 1 260px' }}>
            {t('help.settings.showTipsHint')}
          </span>
          <button type="button" className="btn" onClick={showTips}>
            {t('help.settings.showTips')}
          </button>
        </div>
        <div className="settings-row">
          <span className="muted small" style={{ flex: '1 1 260px' }}>
            {t('help.settings.centerHint')}
          </span>
          <Link className="btn" to="/help">
            {t('help.settings.center')}
          </Link>
        </div>
      </div>
    </section>
  )
}
