import { useState, type FormEvent, type ReactNode } from 'react'
import { Icon } from '../../components/Icon'
import { useI18n } from '../../i18n'
import { checkLogin, type LoginCheck } from '../../storage'
import { githubLinks } from '../onboarding/githubLinks'
import { LoginDiagnosis } from '../onboarding/LoginDiagnosis'
import { useAuth } from './AuthContext'
import { tokenKind } from './session'

/**
 * Repository and token fields, the checks, and the sign-in. Used on the start page, as the last
 * step of the setup wizard and of the join flow. With `lockRepo`, the repository comes from an
 * invite link and can only be changed on purpose.
 */
export function SignInForm({
  initialRepo = '',
  lockRepo = false,
  className = 'stack',
  header,
  footer,
}: {
  initialRepo?: string
  lockRepo?: boolean
  className?: string
  header?: ReactNode
  footer?: (busy: boolean) => ReactNode
}) {
  const { t } = useI18n()
  const { login } = useAuth()
  const [token, setToken] = useState('')
  const [repo, setRepo] = useState(initialRepo)
  const [repoLocked, setRepoLocked] = useState(lockRepo && initialRepo !== '')
  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<{
    result: Extract<LoginCheck, { ok: false }>
    repo: string
    token: string
  } | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setFailure(null)
    try {
      const res = await checkLogin({ token, repo })
      if (!res.ok) {
        setFailure({ result: res, repo, token })
        return
      }
      await login(
        {
          mode: 'github',
          token: token.trim(),
          repo: res.repo.full_name,
          branch: res.repo.default_branch,
          ...(res.scopes ? { scopes: res.scopes } : {}),
          ...(res.ownerType ? { ownerType: res.ownerType } : {}),
        },
        remember,
      )
    } catch {
      setFailure({ result: { ok: false, error: 'unknown' }, repo, token })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className={className} onSubmit={submit}>
      {header}

      <label className="field">
        <span>{t('login.repo')}</span>
        <input
          className="input"
          required
          autoComplete="off"
          spellCheck={false}
          readOnly={repoLocked}
          placeholder={t('login.repoPlaceholder')}
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
        />
      </label>
      {repoLocked && (
        <button
          type="button"
          className="link-btn ob-change-repo"
          onClick={() => setRepoLocked(false)}
        >
          {t('onboarding.join.changeRepo')}
        </button>
      )}
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
          <a href={githubLinks.newToken()} target="_blank" rel="noreferrer">
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

      {failure && (
        <LoginDiagnosis failure={failure.result} repo={failure.repo} token={failure.token} />
      )}

      <button className="btn btn-primary btn-lg" disabled={busy}>
        <Icon name="github" size={18} />
        {busy ? t('login.checking') : t('login.submit')}
      </button>

      {footer?.(busy)}
    </form>
  )
}
