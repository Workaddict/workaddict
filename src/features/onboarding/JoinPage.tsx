import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CopyText } from '../../components/CopyText'
import { SiteFooter } from '../../components/SiteFooter'
import { useI18n } from '../../i18n'
import { useAuth } from '../auth/AuthContext'
import { LoginPage } from '../auth/LoginPage'
import { PublicHeader } from '../auth/PublicHeader'
import { signInAttempt } from '../auth/signInAttempt'
import { SignInForm } from '../auth/SignInForm'
import { HelpShot } from '../help/HelpShot'
import { AddProjectPage } from '../profiles/ProfilePages'
import { githubLinks, ownerPageLink } from './githubLinks'
import { ownerMessage } from './messages'
import { joinTarget } from './names'
import { ClassicTokenChecklist, GitHubLink, Step, TokenChecklist } from './parts'

/**
 * The page opened from an invite link: invitation, access check, token, sign-in. Signed in, the
 * sign-in step adds the repository as a workspace. `&kind=user` marks a repository in a personal
 * account: members are collaborators there and need a classic token.
 */
export function JoinPage() {
  const [params] = useSearchParams()
  const signedIn = useAuth().state.status === 'ready'
  const target = joinTarget(params.get('repo'))
  if (!target)
    return signedIn ? (
      <AddProjectPage notice="invalidInvite" />
    ) : (
      <LoginPage notice="invalidInvite" />
    )
  return (
    <JoinFlow owner={target.owner} repo={target.repo} personal={params.get('kind') === 'user'} />
  )
}

function JoinFlow({ owner, repo, personal }: { owner: string; repo: string; personal: boolean }) {
  const { t } = useI18n()
  const signedIn = useAuth().state.status === 'ready'
  const full = `${owner}/${repo}`
  // Back from the fix page: the member already got past the invitation and the access check.
  const [resumed] = useState(() => signInAttempt.get()?.from === 'join')
  const [invited, setInvited] = useState(resumed)
  const [access, setAccess] = useState<'unknown' | 'yes' | 'no'>(resumed ? 'yes' : 'unknown')
  const unlocked = access === 'yes'

  useEffect(() => {
    document.documentElement.scrollTop = 0
  }, [])

  return (
    <div className="landing">
      <PublicHeader />
      <main className="ob-main">
        <Link to={signedIn ? '/add-project' : '/'} className="ob-back">
          ← {t(signedIn ? 'profiles.back' : 'onboarding.back')}
        </Link>
        <div className="stack" style={{ gap: 6 }}>
          <h1>{t('onboarding.join.title', { repo: full })}</h1>
          <p className="muted">{t('onboarding.join.intro')}</p>
        </div>

        <ol className="ob-steps">
          <Step n={1} title={t('onboarding.join.inviteTitle')} done={invited} onDone={setInvited}>
            {personal ? (
              <>
                <p>{t('onboarding.join.inviteTextRepo', { repo: full })}</p>
                <GitHubLink
                  href={githubLinks.repoInvitations(owner, repo)}
                  menu={t('onboarding.menu.repoInvitations')}
                  primary
                >
                  {t('onboarding.join.inviteLink')}
                </GitHubLink>
              </>
            ) : (
              <>
                <p>{t('onboarding.join.inviteText', { org: owner })}</p>
                <GitHubLink
                  href={githubLinks.orgInvitation(owner)}
                  menu={t('onboarding.menu.orgInvitation')}
                  primary
                >
                  {t('onboarding.join.inviteLink')}
                </GitHubLink>
                <p className="muted small">
                  {t('onboarding.join.inviteRepoHint')}{' '}
                  <a
                    href={githubLinks.repoInvitations(owner, repo)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('onboarding.join.inviteRepoLink')} ↗
                  </a>
                </p>
              </>
            )}
            <HelpShot id="invitation" />
          </Step>

          <Step n={2} title={t('onboarding.join.accessTitle')} done={unlocked}>
            <p>{t('onboarding.join.accessText')}</p>
            <GitHubLink
              href={githubLinks.repo(owner, repo)}
              menu={t('onboarding.menu.repo', { repo: full })}
            >
              {t('onboarding.join.accessLink', { repo: full })}
            </GitHubLink>
            {access === 'no' ? (
              <div className="banner banner-warning stack" style={{ gap: 8 }} role="alert">
                <span>{t('onboarding.join.accessMissing')}</span>
                <CopyText
                  text={ownerMessage(t, {
                    owner,
                    repo,
                    link: ownerPageLink(owner, repo, personal ? { kind: 'user' } : {}),
                  })}
                  label={t('fix.copyOwner')}
                  multiline
                />
                <button
                  type="button"
                  className="btn btn-sm ob-again"
                  onClick={() => setAccess('unknown')}
                >
                  {t('onboarding.join.accessAgain')}
                </button>
              </div>
            ) : (
              <div className="row ob-answers">
                <button
                  type="button"
                  className={`btn btn-sm${unlocked ? ' btn-primary' : ''}`}
                  aria-pressed={unlocked}
                  onClick={() => setAccess('yes')}
                >
                  {t('onboarding.join.accessYes')}
                </button>
                <button type="button" className="btn btn-sm" onClick={() => setAccess('no')}>
                  {t('onboarding.join.accessNo')}
                </button>
              </div>
            )}
          </Step>

          <Step
            n={3}
            title={t('onboarding.join.tokenTitle')}
            whatIs={{ term: 'token', topic: 'token' }}
            locked={!unlocked}
            lockedText={t('onboarding.join.tokenLocked')}
          >
            {personal ? (
              <ClassicTokenChecklist owner={owner} />
            ) : (
              <>
                <TokenChecklist owner={owner} repo={full} />
                <HelpShot id="token-form" />
                <HelpShot id="token-permissions" />
              </>
            )}
          </Step>

          <Step
            n={4}
            title={t('onboarding.join.signInTitle')}
            locked={!unlocked}
            lockedText={t('onboarding.join.tokenLocked')}
          >
            <SignInForm from="join" initialRepo={full} lockRepo />
          </Step>
        </ol>
      </main>
      <SiteFooter />
    </div>
  )
}
