import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { useI18n } from '../../i18n'
import { githubLinks } from '../onboarding/githubLinks'
import { tokenKind } from './session'
import { signInAttempt, type SignInFrom } from './signInAttempt'
import { useSignIn } from './useSignIn'

/**
 * Repository and token fields, the checks, and the sign-in. Used on the start page, as the last
 * step of the setup wizard and of the join flow. With `lockRepo`, the repository comes from an
 * invite link and can only be changed on purpose. A failed sign-in moves to the fix page; coming
 * back from there refills the form from the attempt still held in memory.
 */
export function SignInForm({
  id,
  from = 'start',
  initialRepo = '',
  lockRepo = false,
  className = 'stack',
  header,
  footer,
}: {
  id?: string
  from?: SignInFrom
  initialRepo?: string
  lockRepo?: boolean
  className?: string
  header?: ReactNode
  footer?: (busy: boolean) => ReactNode
}) {
  const { t } = useI18n()
  const location = useLocation()
  const [resume] = useState(() => {
    const held = signInAttempt.get()
    return held?.from === from ? held : null
  })
  const [token, setToken] = useState(resume?.token ?? '')
  const [repo, setRepo] = useState(resume?.repo ?? initialRepo)
  const [repoLocked, setRepoLocked] = useState(
    lockRepo && initialRepo !== '' && (resume?.repo ?? initialRepo) === initialRepo,
  )
  // Opt-in: persisting the token is the riskier choice, so a fresh sign-in must ask for it.
  const [remember, setRemember] = useState(resume?.remember ?? false)
  const { submit: signIn, busy } = useSignIn()
  const formRef = useRef<HTMLFormElement>(null)

  // "Change token or repository" on the fix page brings the user back here.
  const focusForm = (location.state as { resume?: boolean } | null)?.resume === true
  useEffect(() => {
    if (!focusForm) return
    const form = formRef.current
    form?.scrollIntoView?.({ block: 'center' })
    form?.querySelector<HTMLInputElement>('input:not([readonly])')?.focus({ preventScroll: true })
  }, [focusForm])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    void signIn({ token, repo, remember, from })
  }

  return (
    <form ref={formRef} id={id} className={className} onSubmit={submit}>
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

      <button className="btn btn-primary btn-lg" disabled={busy}>
        <Icon name="github" size={18} />
        {busy ? t('login.checking') : t('login.submit')}
      </button>

      {footer?.(busy)}
    </form>
  )
}
