import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SiteFooter } from '../../components/SiteFooter'
import { useI18n } from '../../i18n'
import { PublicHeader } from '../auth/PublicHeader'
import { SignInForm } from '../auth/SignInForm'
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

/** "+ Add project" (`#/add-project`): repository first, then a reused or a new token (D8, D11). */
export function AddProjectPage() {
  const { t } = useI18n()
  const [params] = useSearchParams()
  return (
    <TaskPage title={t('profiles.addTitle')} intro={t('profiles.addIntro')}>
      <SignInForm
        from="add"
        className="card stack"
        initialRepo={params.get('repo') ?? ''}
        submitLabel={t('profiles.addSubmit')}
      />
    </TaskPage>
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
        <div className="card stack">
          <p>{t('profiles.unlockToSave')}</p>
          <UnlockForm initialMode={mode} onUnlock={(p, m) => vault.unlock(p, m)} />
        </div>
      ) : profile ? (
        <SignInForm
          from="profile"
          className="card stack"
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
