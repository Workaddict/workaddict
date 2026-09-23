import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CopyText } from '../../components/CopyText'
import { SiteFooter } from '../../components/SiteFooter'
import { useI18n } from '../../i18n'
import { LoginPage } from '../auth/LoginPage'
import { PublicHeader } from '../auth/PublicHeader'
import { SignInForm } from '../auth/SignInForm'
import { githubLinks } from './githubLinks'
import { ownerMessage } from './messages'
import { joinTarget } from './names'
import { GitHubLink, Step, TokenChecklist } from './parts'

/** A logged-out page opened from an invite link: invitation, access check, token, sign-in. */
export function JoinPage() {
  const [params] = useSearchParams()
  const target = joinTarget(params.get('repo'))
  if (!target) return <LoginPage notice="invalidInvite" />
  return <JoinFlow owner={target.owner} repo={target.repo} />
}

function JoinFlow({ owner, repo }: { owner: string; repo: string }) {
  const { t } = useI18n()
  const full = `${owner}/${repo}`
  const [invited, setInvited] = useState(false)
  const [access, setAccess] = useState<'unknown' | 'yes' | 'no'>('unknown')
  const unlocked = access === 'yes'

  useEffect(() => {
    document.documentElement.scrollTop = 0
  }, [])

  return (
    <div className="landing">
      <PublicHeader />
      <main className="ob-main">
        <Link to="/" className="ob-back">
          ← {t('onboarding.back')}
        </Link>
        <div className="stack" style={{ gap: 6 }}>
          <h1>{t('onboarding.join.title', { repo: full })}</h1>
          <p className="muted">{t('onboarding.join.intro')}</p>
        </div>

        <ol className="ob-steps">
          <Step n={1} title={t('onboarding.join.inviteTitle')} done={invited} onDone={setInvited}>
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
              <a href={githubLinks.repoInvitations(owner, repo)} target="_blank" rel="noreferrer">
                {t('onboarding.join.inviteRepoLink')} ↗
              </a>
            </p>
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
                    ownerType: 'Organization',
                    problem: 'noAccess',
                    fineGrained: false,
                  })}
                  label={t('onboarding.diagnosis.copyOwnerMessage')}
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
            locked={!unlocked}
            lockedText={t('onboarding.join.tokenLocked')}
          >
            <TokenChecklist owner={owner} repo={full} />
          </Step>

          <Step
            n={4}
            title={t('onboarding.join.signInTitle')}
            locked={!unlocked}
            lockedText={t('onboarding.join.tokenLocked')}
          >
            <SignInForm initialRepo={full} lockRepo />
          </Step>
        </ol>
      </main>
      <SiteFooter />
    </div>
  )
}
