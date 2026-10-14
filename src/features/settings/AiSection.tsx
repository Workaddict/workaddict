import { Link } from 'react-router-dom'
import { useToast } from '../../components/Toasts'
import { useI18n } from '../../i18n'
import { useSessionData } from '../auth/AuthContext'
import { useAccess, useSetMarkAiEntries, useWorkspace } from '../data/hooks'
import { useErrorToast } from '../data/useErrorText'

/** Team setting for entries that AI assistants add through the MCP server. */
export function AiSection() {
  const { t } = useI18n()
  const { adapter } = useSessionData()
  const access = useAccess()
  const toast = useToast()
  const onError = useErrorToast()
  const workspace = useWorkspace().data
  const marking = workspace?.markAiEntries === true
  const canSet = access.can('setAiMarking') && !adapter.readOnly
  const set = useSetMarkAiEntries({ onError })

  return (
    <section className="section">
      <h2>
        {t('ai.title')} <span className="chip chip-beta">{t('ai.beta')}</span>
      </h2>
      <div className="card settings-list">
        <div className="settings-row">
          <div className="stack" style={{ gap: 2 }}>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={marking}
                disabled={!canSet || !workspace || set.isPending}
                onChange={(e) => {
                  const on = e.target.checked
                  set.mutate(on, {
                    onSuccess: () => toast.info(on ? t('ai.markOn') : t('ai.markOff')),
                  })
                }}
              />
              <span>{t('ai.mark')}</span>
            </label>
            <span className="muted small">
              {t('ai.markHint')} {!canSet && t('ai.leaderOnly')}
            </span>
          </div>
        </div>
        <div className="settings-row">
          <span className="muted small">{t('ai.connectHint')}</span>
          <Link to="/connect-ai" className="btn">
            {t('ai.connect')}
          </Link>
        </div>
      </div>
    </section>
  )
}
