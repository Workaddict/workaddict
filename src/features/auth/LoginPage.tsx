import { format } from 'date-fns'
import { useRef, useState, type FormEvent } from 'react'
import { REPO_URL } from '../../app/about'
import { Icon } from '../../components/Icon'
import { LanguageSwitch } from '../../components/LanguageSwitch'
import { SiteFooter } from '../../components/SiteFooter'
import { ThemeToggle } from '../../components/ThemeToggle'
import { useI18n } from '../../i18n'
import { checkLogin } from '../../storage'
import { useAuth } from './AuthContext'
import { Highlights, HowItWorks } from './Landing'
import { tokenKind } from './session'

const FINE_GRAINED_URL = 'https://github.com/settings/personal-access-tokens/new'
const CLASSIC_URL = 'https://github.com/settings/tokens/new?scopes=repo&description=Workaddict'

export function LoginPage() {
  const { t, locale } = useI18n()
  const { state, login } = useAuth()
  const [token, setToken] = useState('')
  const [repo, setRepo] = useState('')
  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reason = state.status === 'loggedOut' ? state.reason : undefined

  const [helpOpen, setHelpOpen] = useState(false)
  const helpRef = useRef<HTMLDetailsElement>(null)

  const startDemo = () => void login({ mode: 'demo' }, false)

  const showTokenHelp = () => {
    setHelpOpen(true)
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    helpRef.current?.scrollIntoView?.({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await checkLogin({ token, repo })
      if (!res.ok) {
        setError(
          t(`login.errors.${res.error}`, {
            time: res.resetAt ? format(res.resetAt, 'p', { locale }) : '…',
          }),
        )
        return
      }
      await login(
        {
          mode: 'github',
          token: token.trim(),
          repo: res.repo.full_name,
          branch: res.repo.default_branch,
          ...(res.scopes ? { scopes: res.scopes } : {}),
        },
        remember,
      )
    } catch {
      setError(t('login.errors.unknown'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="landing">
      <header className="row landing-top">
        <div className="brand">
          <img src="./favicon.svg" width={28} height={28} alt="" />
          {t('common.appName')}
        </div>
        <span className="spacer" />
        <LanguageSwitch />
        <ThemeToggle />
      </header>

      <div className="landing-main">
        <section className="landing-hero" aria-labelledby="landing-headline">
          <h1 id="landing-headline">{t('landing.headline')}</h1>
          <p className="landing-subline">{t('landing.subline')}</p>
          <ul className="landing-facts">
            <li>
              <Icon name="check" size={18} />
              {t('landing.factFree')}
            </li>
            <li>
              <Icon name="check" size={18} />
              <span>
                {t('landing.factOpenSource')}{' '}
                <a href={REPO_URL} target="_blank" rel="noreferrer">
                  {t('landing.factOpenSourceLink')}
                </a>
              </span>
            </li>
            <li>
              <Icon name="check" size={18} />
              {t('landing.factData')}
            </li>
          </ul>
          <div>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              disabled={busy}
              onClick={startDemo}
            >
              <Icon name="play" size={16} filled />
              {t('landing.demo')}
            </button>
          </div>
        </section>

        <form className="card login-card" onSubmit={submit}>
          <div className="stack" style={{ gap: 4 }}>
            <h2>{t('login.title')}</h2>
            <p className="muted small">{t('login.subtitle')}</p>
          </div>

          {reason === 'sessionExpired' && (
            <div className="banner banner-warning">{t('login.sessionExpired')}</div>
          )}
          {reason === 'unreachable' && (
            <div className="banner banner-warning row">
              <span>{t('login.errors.offline')}</span>
              <span className="spacer" />
              <button type="button" className="btn btn-sm" onClick={() => window.location.reload()}>
                {t('common.retry')}
              </button>
            </div>
          )}

          <label className="field">
            <span>{t('login.repo')}</span>
            <input
              className="input"
              required
              autoComplete="off"
              spellCheck={false}
              placeholder={t('login.repoPlaceholder')}
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
            />
          </label>
          <label className="field">
            <span>{t('login.token')}</span>
            <input
              className="input"
              required
              type="password"
              autoComplete="off"
              spellCheck={false}
              placeholder={t('login.tokenPlaceholder')}
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </label>
          {tokenKind(token) === 'classic' && (
            <div className="banner banner-warning" role="note">
              {t('login.classicToken')}{' '}
              <a href={FINE_GRAINED_URL} target="_blank" rel="noreferrer">
                {t('login.classicTokenLink')} ↗
              </a>
            </div>
          )}
          <div className="stack" style={{ gap: 2 }}>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>{t('login.remember')}</span>
            </label>
            <span className="muted small">{t('login.rememberHint')}</span>
          </div>

          {error && (
            <div className="banner banner-error" role="alert">
              {error}
            </div>
          )}

          <button className="btn btn-primary btn-lg" disabled={busy}>
            <Icon name="github" size={18} />
            {busy ? t('login.checking') : t('login.submit')}
          </button>

          <details
            ref={helpRef}
            open={helpOpen}
            onToggle={(e) => setHelpOpen(e.currentTarget.open)}
          >
            <summary>{t('login.help.title')}</summary>
            <p style={{ marginTop: 8 }}>{t('login.help.intro')}</p>
            <p style={{ marginTop: 10 }}>
              <strong>{t('login.help.fineTitle')}</strong>
            </p>
            <ol>
              <li>{t('login.help.step1')}</li>
              <li>{t('login.help.step2')}</li>
              <li>{t('login.help.step3')}</li>
              <li>{t('login.help.step4')}</li>
              <li>{t('login.help.step5')}</li>
            </ol>
            <a href={FINE_GRAINED_URL} target="_blank" rel="noreferrer">
              {t('login.help.openGitHub')} ↗
            </a>
            <p style={{ marginTop: 12 }}>
              <strong>{t('login.help.classicTitle')}</strong>
            </p>
            <p>{t('login.help.classicText')}</p>
            <div className="banner banner-warning" style={{ margin: '8px 0' }}>
              {t('login.help.classicWarning')}
            </div>
            <a href={CLASSIC_URL} target="_blank" rel="noreferrer">
              {t('login.help.openClassic')} ↗
            </a>
            <p className="muted" style={{ marginTop: 12 }}>
              {t('login.help.security')}
            </p>
          </details>

          <div className="divider">{t('login.or')}</div>
          <button type="button" className="btn btn-wrap" disabled={busy} onClick={startDemo}>
            {t('login.demo')}
          </button>
        </form>
      </div>

      <Highlights />
      <HowItWorks onTokenHelp={showTokenHelp} />
      <SiteFooter />
    </div>
  )
}
