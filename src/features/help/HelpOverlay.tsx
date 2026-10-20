import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Modal } from '../../components/Modal'
import { useI18n } from '../../i18n'
import { HelpResults, SearchField, ShortcutList } from './HelpPage'
import { searchHelp } from './search'
import { startTour } from './tourStore'

/** Help overlay: search over topics and glossary, the keyboard shortcuts and the tour. */
export default function HelpOverlay({
  onClose,
  signedIn,
}: {
  onClose: () => void
  signedIn: boolean
}) {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const results = useMemo(() => searchHelp(query, lang, t), [query, lang, t])

  const restart = () => {
    onClose()
    navigate('/')
    startTour()
  }

  return (
    <Modal title={t('help.title')} onClose={onClose}>
      <div className="help-overlay">
        {/* The dialog focuses the search field, its first input. */}
        <SearchField value={query} onChange={setQuery} />
        {query.trim() && <HelpResults results={results} onPick={onClose} />}
        <section className="stack" style={{ gap: 8 }}>
          <h3 className="small muted">{t('help.overlay.shortcuts')}</h3>
          <ShortcutList />
        </section>
        <div className="modal-actions">
          {signedIn && (
            <button type="button" className="btn" onClick={restart}>
              {t('help.overlay.restartTour')}
            </button>
          )}
          <Link className="btn btn-primary" to="/help" onClick={onClose}>
            {t('help.overlay.allTopics')}
          </Link>
        </div>
      </div>
    </Modal>
  )
}
