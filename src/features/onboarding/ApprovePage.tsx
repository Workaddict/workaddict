import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CopyText } from '../../components/CopyText'
import { SiteFooter } from '../../components/SiteFooter'
import { useI18n } from '../../i18n'
import { PublicHeader } from '../auth/PublicHeader'
import { appLink, githubLinks } from './githubLinks'
import { memberNote } from './messages'
import { isLogin, isRepoName } from './names'
import { GitHubLink, Step } from './parts'

/**
 * The page a member sends to the repository owner (`#/approve?org=…&repo=…&member=…[&kind=user]`)
 * when they cannot sign in: one button per thing only the owner can do. Works signed in and out,
 * since owners usually use the app themselves.
 */
export function ApprovePage() {
  const { t } = useI18n()
  const [params] = useSearchParams()
  const org = params.get('org') ?? ''
  const repo = params.get('repo') ?? ''
  const rawMember = params.get('member') ?? ''
  const member = isLogin(rawMember) ? rawMember : undefined
  const personal = params.get('kind') === 'user'
  const valid = isLogin(org) && isRepoName(repo)
  const full = `${org}/${repo}`

  useEffect(() => {
    document.documentElement.scrollTop = 0
  }, [])

  return (
    <div className="landing">
      <PublicHeader />
      <main className="ob-main">
        <Link to="/" className="ob-back">
          ← {t('approve.back')}
        </Link>
        {!valid ? (
          <div className="banner banner-warning" role="alert">
            {t('approve.broken')}
          </div>
        ) : (
          <>
            <div className="stack" style={{ gap: 6 }}>
              <h1>{member ? t('approve.title', { member }) : t('approve.titleNeutral')}</h1>
              <p className="muted">
                {t(personal ? 'approve.introUser' : 'approve.intro', { repo: full, org })}
              </p>
            </div>

            {personal ? (
              <ol className="ob-steps">
                <Step n={1} title={t('approve.collaboratorTitle')}>
                  <p>{t('approve.collaboratorText')}</p>
                  <GitHubLink
                    href={githubLinks.repoAccess(org, repo)}
                    menu={t('onboarding.menu.repoAccess')}
                    primary
                  >
                    {t('approve.accessLink')}
                  </GitHubLink>
                </Step>
              </ol>
            ) : (
              <>
                <ol className="ob-steps">
                  <Step n={1} title={t('approve.pendingTitle')}>
                    <p>{t('approve.pendingText')}</p>
                    <GitHubLink
                      href={githubLinks.pendingTokens(org)}
                      menu={t('onboarding.menu.pendingTokens')}
                      primary
                    >
                      {t('approve.pendingLink')}
                    </GitHubLink>
                    <p className="muted small">{t('approve.emptyHint', { org })}</p>
                    <CopyText
                      text={memberNote(t, { org, link: appLink('/help/token') })}
                      label={
                        member ? t('approve.copyNote', { member }) : t('approve.copyNoteNeutral')
                      }
                    />
                  </Step>
                  <Step n={2} title={t('approve.peopleTitle')}>
                    <p>{t('approve.peopleText', { org })}</p>
                    <GitHubLink href={githubLinks.people(org)} menu={t('onboarding.menu.people')}>
                      {t('approve.peopleLink')}
                    </GitHubLink>
                  </Step>
                  <Step n={3} title={t('approve.accessTitle')}>
                    <p>{t('approve.accessText', { repo: full })}</p>
                    <GitHubLink
                      href={githubLinks.repoAccess(org, repo)}
                      menu={t('onboarding.menu.repoAccess')}
                    >
                      {t('approve.accessLink')}
                    </GitHubLink>
                  </Step>
                </ol>

                <section className="card help-section">
                  <h2>{t('approve.tipTitle')}</h2>
                  <p>{t('approve.tipText')}</p>
                  <GitHubLink
                    href={githubLinks.tokenPolicy(org)}
                    menu={t('onboarding.menu.tokenPolicy')}
                  >
                    {t('approve.tipLink')}
                  </GitHubLink>
                </section>
              </>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
