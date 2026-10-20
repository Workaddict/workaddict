import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { helpQuestionUrl } from '../../app/about'
import { seoPageUrl } from '../../app/seoPages'
import { Icon } from '../../components/Icon'
import { SiteFooter } from '../../components/SiteFooter'
import i18n, { useI18n } from '../../i18n'
import { PublicHeader } from '../auth/PublicHeader'
import { TokenHelpSections } from '../auth/TokenHelpPage'
import type { HelpBlock } from './content/types'
import { searchHelp, topicContent } from './search'
import {
  GLOSSARY,
  SHORTCUTS,
  TERM_IDS,
  TOPIC_IDS,
  helpPath,
  isTopicId,
  termPath,
  type TopicId,
} from './topics'

/**
 * The help center: `#/help` (index with search) and `#/help/<topic>`. Signed in it renders inside
 * the app layout; signed out (`shell="public"`) with the public header and footer.
 */
export default function HelpPage({ shell = 'app' }: { shell?: 'app' | 'public' }) {
  const { topic } = useParams()
  const { pathname } = useLocation()

  useEffect(() => {
    document.documentElement.scrollTop = 0
  }, [pathname])

  let body: ReactNode
  if (!topic) body = <HelpIndex />
  else if (!isTopicId(topic)) body = <HelpIndex notFound />
  else if (topic === 'glossary') body = <GlossaryPage />
  else if (topic === 'shortcuts') body = <ShortcutsPage />
  else body = <TopicPage id={topic} />

  if (shell === 'app') return <div className="help-page">{body}</div>
  return (
    <div className="landing">
      <PublicHeader />
      <main className="ob-main">
        <div className="help-page">{body}</div>
        <PublicDone />
      </main>
      <SiteFooter />
    </div>
  )
}

/** Signed out, help usually opens in its own tab from the sign-in card: close it to get back. */
function PublicDone() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const done = () => {
    window.close()
    // Browsers may refuse to close a tab that was opened directly: fall back to the start page.
    window.setTimeout(() => navigate('/'), 200)
  }
  return (
    <button type="button" className="btn btn-primary btn-lg help-done" onClick={done}>
      {t('help.page.backToApp')}
    </button>
  )
}

function BackLink() {
  const { t } = useI18n()
  return (
    <Link to="/help" className="ob-back">
      ← {t('help.page.back')}
    </Link>
  )
}

function HelpIndex({ notFound }: { notFound?: boolean }) {
  const { t, lang } = useI18n()
  const [query, setQuery] = useState('')
  const results = useMemo(() => searchHelp(query, lang, t), [query, lang, t])
  return (
    <>
      <div className="stack" style={{ gap: 6 }}>
        <h1>{t('help.title')}</h1>
        <p className="help-summary">{t('help.index.intro')}</p>
      </div>
      {notFound && (
        <div className="banner banner-warning" role="status">
          {t('help.index.notFound')}
        </div>
      )}
      <SearchField value={query} onChange={setQuery} />
      {query.trim() ? (
        <HelpResults results={results} />
      ) : (
        <ul className="help-topics">
          {TOPIC_IDS.map((id) => (
            <li key={id}>
              <Link className="card help-topic-card" to={helpPath(id)}>
                <strong>{t(`help.topics.${id}`)}</strong>
                <span className="muted small">{topicContent(lang, id)?.summary ?? ''}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function SearchField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useI18n()
  return (
    <label className="help-search">
      <span className="visually-hidden">{t('help.index.search')}</span>
      <Icon name="search" size={16} />
      <input
        className="input"
        type="search"
        value={value}
        placeholder={t('help.index.searchPlaceholder')}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

export function HelpResults({
  results,
  onPick,
}: {
  results: ReturnType<typeof searchHelp>
  onPick?: () => void
}) {
  const { t } = useI18n()
  if (results.length === 0) return <p className="muted">{t('help.index.noResults')}</p>
  return (
    <ul className="help-results" aria-label={t('help.index.search')}>
      {results.map((r) => (
        <li key={`${r.kind}-${r.id}`}>
          <Link to={r.kind === 'topic' ? helpPath(r.id) : termPath(r.id)} onClick={onPick}>
            <span className="kind">
              {t(r.kind === 'topic' ? 'help.overlay.topic' : 'help.overlay.term')}
            </span>
            <strong>{r.title}</strong>
            {r.text && <span className="muted small">{r.text}</span>}
          </Link>
        </li>
      ))}
    </ul>
  )
}

function Block({ block }: { block: HelpBlock }) {
  const { lang } = useI18n()
  if (typeof block === 'string') return <p>{block}</p>
  if ('list' in block)
    return (
      <ul>
        {block.list.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    )
  if ('steps' in block)
    return (
      <ol>
        {block.steps.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    )
  if ('note' in block) return <p className="help-note">{block.note}</p>
  if (block.link.startsWith('seo:'))
    return (
      <p>
        <a href={seoPageUrl(block.link.slice(4) as 'import-from-clockify', lang)}>
          {block.label} →
        </a>
      </p>
    )
  return (
    <p>
      <Link to={block.link}>{block.label} →</Link>
    </p>
  )
}

function TopicPage({ id }: { id: TopicId }) {
  const { t, lang } = useI18n()
  const content = topicContent(lang, id)
  const titleRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => titleRef.current?.focus(), [id])
  if (!content) return <HelpIndex notFound />
  return (
    <>
      <BackLink />
      <div className="stack" style={{ gap: 6 }}>
        <h1 ref={titleRef} tabIndex={-1}>
          {t(`help.topics.${id}`)}
        </h1>
        <p className="help-summary">{content.summary}</p>
      </div>
      {content.sections.map((s) => (
        <section key={s.heading} className="card help-topic-section">
          <h2>{s.heading}</h2>
          {s.blocks.map((b, i) => (
            <Block key={i} block={b} />
          ))}
        </section>
      ))}
      {id === 'token' && <TokenHelpSections />}
      <Related ids={content.related} />
      <Feedback key={id} topic={id} />
    </>
  )
}

function Related({ ids }: { ids: TopicId[] }) {
  const { t } = useI18n()
  if (ids.length === 0) return null
  return (
    <nav aria-label={t('help.page.related')} className="stack" style={{ gap: 8 }}>
      <h2 className="small muted">{t('help.page.related')}</h2>
      <div className="help-related">
        {ids.map((r) => (
          <Link key={r} className="btn btn-sm" to={helpPath(r)}>
            {t(`help.topics.${r}`)}
          </Link>
        ))}
      </div>
    </nav>
  )
}

/** "Was this helpful?" Nothing is stored or sent; "No" offers a question on GitHub. */
function Feedback({ topic }: { topic: TopicId }) {
  const { t } = useI18n()
  const [answer, setAnswer] = useState<'yes' | 'no' | null>(null)
  const title = i18n.getFixedT('en')(`help.topics.${topic}`)
  return (
    <div className="help-feedback" role="group" aria-label={t('help.page.helpful')}>
      {answer === null && (
        <>
          <span>{t('help.page.helpful')}</span>
          <button type="button" className="btn btn-sm" onClick={() => setAnswer('yes')}>
            <span aria-hidden="true">👍</span> {t('help.page.yes')}
          </button>
          <button type="button" className="btn btn-sm" onClick={() => setAnswer('no')}>
            <span aria-hidden="true">👎</span> {t('help.page.no')}
          </button>
        </>
      )}
      {answer === 'yes' && <span role="status">{t('help.page.thanks')}</span>}
      {answer === 'no' && (
        <span role="status">
          {t('help.page.askIntro')}{' '}
          <a href={helpQuestionUrl(title)} target="_blank" rel="noreferrer">
            {t('help.page.ask')} ↗
          </a>
        </span>
      )}
    </div>
  )
}

function GlossaryPage() {
  const { t } = useI18n()
  const [params] = useSearchParams()
  const highlighted = params.get('term')
  const terms = useMemo(
    () =>
      TERM_IDS.map((id) => ({
        id,
        term: t(`help.glossary.terms.${id}.term`),
        short: t(`help.glossary.terms.${id}.short`),
        topic: GLOSSARY[id] as TopicId,
      })).sort((a, b) => a.term.localeCompare(b.term)),
    [t],
  )
  useEffect(() => {
    if (highlighted) document.getElementById(`term-${highlighted}`)?.scrollIntoView?.()
  }, [highlighted])
  return (
    <>
      <BackLink />
      <div className="stack" style={{ gap: 6 }}>
        <h1>{t('help.topics.glossary')}</h1>
        <p className="help-summary">{t('help.glossary.intro')}</p>
      </div>
      <dl className="card help-glossary">
        {terms.map((g) => (
          <div
            key={g.id}
            id={`term-${g.id}`}
            className={g.id === highlighted ? 'is-highlighted' : undefined}
            aria-current={g.id === highlighted ? 'true' : undefined}
          >
            <dt>{g.term}</dt>
            <dd>
              {g.short}{' '}
              {g.topic !== 'glossary' && (
                <Link to={helpPath(g.topic)}>{t(`help.topics.${g.topic}`)} →</Link>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <Feedback topic="glossary" />
    </>
  )
}

export function ShortcutList() {
  const { t } = useI18n()
  return (
    <ul className="help-shortcuts">
      {SHORTCUTS.map((s) => (
        <li key={s.id}>
          <span className="keys">
            {s.keys.map((k) => (
              <kbd key={k}>{k}</kbd>
            ))}
          </span>
          <span>{t(`help.shortcuts.${s.id}`)}</span>
        </li>
      ))}
    </ul>
  )
}

function ShortcutsPage() {
  const { t } = useI18n()
  return (
    <>
      <BackLink />
      <h1>{t('help.topics.shortcuts')}</h1>
      <section className="card help-topic-section">
        <ShortcutList />
      </section>
      <Feedback topic="shortcuts" />
    </>
  )
}
