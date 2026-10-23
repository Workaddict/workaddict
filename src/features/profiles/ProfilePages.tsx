import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { SiteFooter } from '../../components/SiteFooter'
import { useI18n } from '../../i18n'
import { PublicHeader } from '../auth/PublicHeader'
import { SignInForm } from '../auth/SignInForm'
import { joinPathFor } from '../onboarding/names'
import { profileForRepo } from './vault'
import { UnlockForm } from './VaultForms'
import { useVault } from './vaultStore'

/** Without app chrome, like the fix page: one task, a way back. */
function TaskPage({
  title,
  intro,
  children,
}: {
  title: string
  intro?: string
  children: ReactNode
}) {
  const { t } = useI18n()
  return (
    <div className="landing">
      <PublicHeader />
      <main className="ob-main">
        <Link to="/" className="ob-back">
          ← {t('profiles.back')}
        </Link>
        <div className="stack" style={{ gap: 6 }}>
          <h1>{title}</h1>
          {intro && <p className="muted">{intro}</p>}
        </div>
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}

const ADD_PATHS = ['existing', 'new', 'invite'] as const
type AddPath = (typeof ADD_PATHS)[number]

const PATH_LABEL = {
  existing: ['profiles.pathExisting', 'profiles.pathExistingHint'],
  new: ['profiles.pathNew', 'profiles.pathNewHint'],
  invite: ['profiles.pathInvite', 'profiles.pathInviteHint'],
} as const

/**
 * "+ Add project" (`#/add-project`): an existing repository with a reused or a new token (D8, D11),
 * or the way into the setup wizard or the join flow, which then add the workspace themselves.
 */
export function AddProjectPage({ notice }: { notice?: 'invalidInvite' }) {
  const { t } = useI18n()
  const [params] = useSearchParams()
  const [path, setPath] = useState<AddPath>('existing')
  return (
    <TaskPage title={t('profiles.addTitle')} intro={t('profiles.addIntro')}>
      {notice === 'invalidInvite' && (
        <div className="banner banner-warning" role="note">
          {t('onboarding.join.invalid')}
        </div>
      )}
      <div className="ob-modes" role="radiogroup" aria-label={t('profiles.addPath')}>
        {ADD_PATHS.map((p) => (
          <label key={p} className={`ob-mode${path === p ? ' is-selected' : ''}`}>
            <input
              type="radio"
              className="visually-hidden"
              name="add-path"
              value={p}
              checked={path === p}
              onChange={() => setPath(p)}
            />
            <span className="ob-mode-mark" aria-hidden="true">
              <Icon name="check" size={14} />
            </span>
            <span className="ob-mode-text">
              <strong>{t(PATH_LABEL[p][0])}</strong>
              <span className="muted small">{t(PATH_LABEL[p][1])}</span>
            </span>
          </label>
        ))}
      </div>
      {path === 'existing' ? (
        <SignInForm
          from="add"
          className="card task-card"
          initialRepo={params.get('repo') ?? ''}
          submitLabel={t('profiles.addSubmit')}
        />
      ) : path === 'new' ? (
        <div className="card task-card">
          <p>{t('profiles.newText')}</p>
          <Link className="btn btn-primary btn-lg" to="/setup">
            {t('profiles.newStart')} →
          </Link>
        </div>
      ) : (
        <InviteForm />
      )}
    </TaskPage>
  )
}

/** A pasted invite link (or `owner/name`) opens the join flow for that repository. */
function InviteForm() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const [invalid, setInvalid] = useState(false)
  const fieldId = useId()
  const errorId = useId()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const target = joinPathFor(value)
    if (!target) return setInvalid(true)
    navigate(target)
  }

  return (
    <form className="card task-card" onSubmit={submit} noValidate>
      <div className="field">
        <span className="row field-label">
          <label htmlFor={fieldId}>{t('profiles.inviteLabel')}</label>
        </span>
        <input
          id={fieldId}
          className="input"
          autoComplete="off"
          spellCheck={false}
          placeholder={t('profiles.invitePlaceholder')}
          value={value}
          aria-invalid={invalid}
          aria-describedby={invalid ? errorId : undefined}
          onChange={(e) => {
            setValue(e.target.value)
            setInvalid(false)
          }}
        />
      </div>
      {invalid && (
        <div id={errorId} className="banner banner-warning" role="alert">
          {t('profiles.inviteInvalid')}
        </div>
      )}
      <button className="btn btn-primary btn-lg">{t('profiles.inviteOpen')}</button>
    </form>
  )
}

/**
 * "Replace token for this profile" (`#/replace-token?repo=…`): the repository is locked, a new
 * token repairs every profile that used the rejected one (D9). The profile is found by repository,
 * so no profile id goes into the URL.
 */
export function ReplaceTokenPage() {
  const { t } = useI18n()
  const [params] = useSearchParams()
  const { status, data, mode, vault } = useVault()
  const repo = (params.get('repo') ?? '').trim()
  const profile = data ? profileForRepo(data, repo) : undefined

  return (
    <TaskPage title={t('profiles.replaceTitle', { repo: profile?.label ?? repo })}>
      {status === 'locked' ? (
        <div className="card task-card">
          <p>{t('profiles.unlockToSave')}</p>
          <UnlockForm initialMode={mode} onUnlock={(p, m) => vault.unlock(p, m)} />
        </div>
      ) : profile ? (
        <SignInForm
          from="profile"
          className="card task-card"
          initialRepo={profile.repo}
          lockRepo
          profileId={profile.id}
          submitLabel={t('profiles.replaceSubmit')}
          header={<p className="muted small">{t('profiles.replaceIntro')}</p>}
        />
      ) : (
        <p className="banner banner-warning">{t('profiles.noProfile', { repo })}</p>
      )}
    </TaskPage>
  )
}
