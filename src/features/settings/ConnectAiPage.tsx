import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CopyText } from '../../components/CopyText'
import { useI18n } from '../../i18n'
import { useSessionData } from '../auth/AuthContext'
import { githubLinks } from '../onboarding/githubLinks'
import { TokenChecklist } from '../onboarding/parts'
import { markConnectAiOpened } from '../help/checklistState'
import { claudeMcpAdd, envCommands, mcpJson, PLUGIN_INSTALL, type Shell } from './connectAi'

function Snippet({ text, label }: { text: string; label: string }) {
  return (
    <div className="stack" style={{ gap: 6 }}>
      <pre className="code-block">{text}</pre>
      <CopyText text={text} label={label} />
    </div>
  )
}

/** How to let an AI assistant use Workaddict through the MCP server, with this team's data repo filled in. */
export default function ConnectAiPage() {
  const { t } = useI18n()
  // Opening this page ticks off the optional "Connect an AI assistant" first step.
  useEffect(markConnectAiOpened, [])
  const { session } = useSessionData()
  const repo = session.mode === 'github' ? session.repo : 'owner/repo'
  const [owner = '', name = ''] = repo.split('/')
  const [shell, setShell] = useState<Shell>(() =>
    /Win/i.test(globalThis.navigator?.userAgent ?? '') ? 'windows' : 'unix',
  )

  return (
    <div className="stack" style={{ gap: 16, maxWidth: 760 }}>
      <Link to="/settings" className="ob-back">
        ← {t('connectAi.back')}
      </Link>
      <div className="stack" style={{ gap: 6 }}>
        <h1>
          {t('connectAi.title')} <span className="chip chip-beta">{t('ai.beta')}</span>
        </h1>
        <p className="muted">{t('connectAi.intro')}</p>
        <div className="banner banner-info" role="note">
          {t('connectAi.betaNote')}
        </div>
      </div>

      <section className="card help-section">
        <h2>{t('connectAi.tokenTitle')}</h2>
        <p>{t('connectAi.tokenText')}</p>
        <TokenChecklist owner={owner} repo={name} />
        <a href={githubLinks.newToken()} target="_blank" rel="noreferrer">
          {t('connectAi.tokenOpen')} ↗
        </a>
      </section>

      <section className="card help-section">
        <h2>{t('connectAi.claudeCodeTitle')}</h2>
        <div className="segmented" role="group" aria-label={t('connectAi.system')}>
          {(['windows', 'unix'] as const).map((s) => (
            <button key={s} type="button" aria-pressed={shell === s} onClick={() => setShell(s)}>
              {t(`connectAi.${s}`)}
            </button>
          ))}
        </div>
        <p>{t('connectAi.envText')}</p>
        <Snippet text={envCommands(repo, shell)} label={t('connectAi.copyEnv')} />
        <p>{t('connectAi.pluginText')}</p>
        <Snippet text={PLUGIN_INSTALL} label={t('connectAi.copyPlugin')} />
        <p>{t('connectAi.useText')}</p>
        <ul>
          <li>
            <code>/workaddict:log-today</code> – {t('connectAi.logToday')}
          </li>
          <li>
            <code>/workaddict:new-project</code> – {t('connectAi.newProject')}
          </li>
        </ul>
        <details>
          <summary>{t('connectAi.withoutPlugin')}</summary>
          <Snippet text={claudeMcpAdd(repo, shell)} label={t('connectAi.copyCommand')} />
        </details>
      </section>

      <section className="card help-section">
        <h2>{t('connectAi.otherTitle')}</h2>
        <p>{t('connectAi.otherText')}</p>
        <Snippet text={mcpJson(repo)} label={t('connectAi.copyJson')} />
      </section>

      <section className="card help-section">
        <h2>{t('connectAi.privacyTitle')}</h2>
        <ul>
          <li>{t('connectAi.privacyLocal')}</li>
          <li>{t('connectAi.privacySaved')}</li>
          <li>{t('connectAi.privacyCommits')}</li>
          <li>{t('connectAi.privacyNoDelete')}</li>
          <li>{t('connectAi.privacyToken')}</li>
        </ul>
      </section>
    </div>
  )
}
