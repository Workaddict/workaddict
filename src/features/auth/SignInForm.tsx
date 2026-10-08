import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { useI18n } from '../../i18n'
import { parseRepo } from '../../storage'
import { githubLinks } from '../onboarding/githubLinks'
import { profileForRepo, reusableTokens, type VaultToken } from '../profiles/vault'
import { emptyNewPassphrase, newPassphraseError } from '../profiles/passphrase'
import { NewPassphraseFields, UnlockForm } from '../profiles/VaultForms'
import { useVault } from '../profiles/vaultStore'
import { useAuth } from './AuthContext'
import { tokenKind } from './session'
import { signInAttempt, type SignInFrom } from './signInAttempt'
import { savesProfile, useSignIn } from './useSignIn'

/** The token offered for reuse: one of the repository owner's before a classic one (design D8). */
function pickReusable(tokens: VaultToken[], owner: string): VaultToken | undefined {
  return (
    tokens.find((t) => t.kind !== 'classic' && t.owner.toLowerCase() === owner.toLowerCase()) ??
    tokens[0]
  )
}

/**
 * Repository and token fields, the checks, and the sign-in. Used on the start page, as the last
 * step of the setup wizard and of the join flow, on "Add project" and for replacing a profile's
 * token. With `lockRepo`, the repository comes from an invite link (or is the profile's) and can
 * only be changed on purpose. A failed sign-in moves to the fix page; coming back from there
 * refills the form from the attempt still held in memory.
 */
export function SignInForm({
  id,
  from = 'start',
  initialRepo = '',
  lockRepo = false,
  profileId,
  className = 'stack',
  header,
  footer,
  submitLabel,
  defaultSave,
}: {
  id?: string
  from?: SignInFrom
  initialRepo?: string
  lockRepo?: boolean
  /** The profile whose token is replaced (`from: 'profile'`). */
  profileId?: string
  className?: string
  header?: ReactNode
  footer?: (busy: boolean) => ReactNode
  submitLabel?: string
  /** Initial "Save as a profile"; by default on unless the vault is locked. */
  defaultSave?: boolean
}) {
  const { t } = useI18n()
  const location = useLocation()
  const { status, data, mode: savedMode, vault } = useVault()
  const [resume] = useState(() => {
    const held = signInAttempt.get()
    return held?.from === from ? held : null
  })
  // A reused token is never put into the field; returning after it failed selects a new token.
  const [token, setToken] = useState(resume && !resume.reused ? resume.token : '')
  const [repo, setRepo] = useState(resume?.repo ?? initialRepo)
  const [repoLocked, setRepoLocked] = useState(
    lockRepo && initialRepo !== '' && (resume?.repo ?? initialRepo) === initialRepo,
  )
  const [save, setSave] = useState(resume?.save ?? defaultSave ?? status !== 'locked')
  const [choice, setChoice] = useState<'reuse' | 'new'>(resume?.reused ? 'new' : 'reuse')
  const [step, setStep] = useState<'form' | 'create' | 'unlock'>('form')
  const [newPass, setNewPass] = useState(emptyNewPassphrase)
  const [triedCreate, setTriedCreate] = useState(false)
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

  const owner = parseRepo(repo)?.owner
  const reusable =
    from === 'add' && status === 'unlocked' && data && owner
      ? pickReusable(reusableTokens(data, owner), owner)
      : undefined
  const reusing = reusable && choice === 'reuse' ? reusable : undefined
  // One profile per repository: adding it again opens the existing one (or replaces its token).
  const existing =
    from === 'add' && status === 'unlocked' && data && parseRepo(repo)
      ? profileForRepo(data, repo.trim())
      : undefined
  const wantsSave = savesProfile({ save, from })

  const run = (newVault?: { passphrase: string; mode: 'ask' | 'stay' }) =>
    signIn({
      token: reusing?.token ?? token,
      repo,
      save: wantsSave,
      from,
      ...(profileId ? { profileId } : {}),
      ...(reusing ? { reused: true } : {}),
      ...(newVault ? { newVault } : {}),
    })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (existing) return
    if (wantsSave && status === 'locked') return setStep('unlock')
    if (wantsSave && status === 'none') {
      if (step !== 'create') return setStep('create')
      setTriedCreate(true)
      if (newPassphraseError(newPass)) return
      return void run({ passphrase: newPass.passphrase, mode: newPass.mode })
    }
    void run()
  }

  if (step === 'unlock') {
    return (
      <div id={id} className={className}>
        {header}
        <p>{t('profiles.unlockToSave')}</p>
        <UnlockForm
          initialMode={savedMode}
          onUnlock={async (passphrase, mode) => {
            if (!(await vault.unlock(passphrase, mode))) return false
            setStep('form')
            void run()
            return true
          }}
        >
          <button type="button" className="link-btn" onClick={() => setStep('form')}>
            {t('profiles.back')}
          </button>
        </UnlockForm>
      </div>
    )
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
          readOnly={repoLocked || step === 'create'}
          placeholder={t('login.repoPlaceholder')}
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
        />
      </label>
      {repoLocked && from !== 'profile' && (
        <button
          type="button"
          className="link-btn ob-change-repo"
          onClick={() => setRepoLocked(false)}
        >
          {t('onboarding.join.changeRepo')}
        </button>
      )}
      {existing && <ExistingProfile repo={existing.repo} profileId={existing.id} />}
      {!existing && reusable && (
        <fieldset className="stack" style={{ gap: 6 }}>
          <legend className="small">{t('login.token')}</legend>
          <label className="checkbox">
            <input
              type="radio"
              name="token-choice"
              checked={choice === 'reuse'}
              onChange={() => setChoice('reuse')}
            />
            <span>
              {reusable.kind === 'classic'
                ? t('profiles.reuseClassic', { login: reusable.login })
                : t('profiles.reuse', { owner: reusable.owner })}
            </span>
          </label>
          <label className="checkbox">
            <input
              type="radio"
              name="token-choice"
              checked={choice === 'new'}
              onChange={() => setChoice('new')}
            />
            <span>{t('profiles.newToken')}</span>
          </label>
        </fieldset>
      )}
      {!reusing && (
        <label className="field">
          <span>{t('login.token')}</span>
          <input
            className="input"
            required
            type="password"
            autoComplete="off"
            spellCheck={false}
            readOnly={step === 'create'}
            placeholder={t('login.tokenPlaceholder')}
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </label>
      )}
      {tokenKind(reusing?.token ?? token) === 'classic' && (
        <div className="banner banner-warning" role="note">
          {t('login.classicToken')}{' '}
          <a href={githubLinks.newToken()} target="_blank" rel="noreferrer">
            {t('login.classicTokenLink')} ↗
          </a>
        </div>
      )}

      {step === 'create' ? (
        <section className="stack" aria-labelledby={`${id ?? 'sign-in'}-vault`}>
          <h3 id={`${id ?? 'sign-in'}-vault`}>{t('profiles.createTitle')}</h3>
          <p className="muted small">{t('profiles.createIntro')}</p>
          <NewPassphraseFields value={newPass} onChange={setNewPass} showErrors={triedCreate} />
          <button type="button" className="link-btn" onClick={() => setStep('form')}>
            {t('profiles.back')}
          </button>
        </section>
      ) : (
        from !== 'add' &&
        from !== 'profile' && (
          <div className="stack" style={{ gap: 2 }}>
            <label className="checkbox">
              <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} />
              <span>{t('login.saveProfile')}</span>
            </label>
            <span className="muted small">{t('login.saveProfileHint')}</span>
          </div>
        )
      )}

      <button className="btn btn-primary btn-lg" disabled={busy || !!existing}>
        <Icon name="github" size={18} />
        {busy ? t('login.checking') : (submitLabel ?? t('login.submit'))}
      </button>

      {footer?.(busy)}
    </form>
  )
}

function ExistingProfile({ repo, profileId }: { repo: string; profileId: string }) {
  const { t } = useI18n()
  const { switchProfile } = useAuth()
  const navigate = useNavigate()
  const [failed, setFailed] = useState(false)
  const openIt = async () => {
    try {
      await switchProfile(profileId)
      navigate('/', { replace: true })
    } catch {
      setFailed(true)
    }
  }
  return (
    <div className="banner banner-info stack" role="note" style={{ gap: 8 }}>
      <span>{t('profiles.exists', { repo })}</span>
      {failed && <span>{t('profiles.openFailed')}</span>}
      <div className="row">
        <button type="button" className="btn btn-sm btn-primary" onClick={() => void openIt()}>
          {t('profiles.openExisting')}
        </button>
        <Link
          className="btn btn-sm"
          to={`/replace-token?repo=${encodeURIComponent(repo).replace(/%2F/gi, '/')}`}
        >
          {t('profiles.replaceToken')}
        </Link>
      </div>
    </div>
  )
}
