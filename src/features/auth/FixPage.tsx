import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CopyText } from '../../components/CopyText'
import { Icon } from '../../components/Icon'
import { SiteFooter } from '../../components/SiteFooter'
import { useI18n } from '../../i18n'
import { ownerPageLink } from '../onboarding/githubLinks'
import { ownerMessage } from '../onboarding/messages'
import { joinTarget } from '../onboarding/names'
import { GitHubLink, TokenChecklist } from '../onboarding/parts'
import { fixSteps, needsOwner, parseLoginError, setupStepFor } from './fixSteps'
import { useAuth } from './AuthContext'
import { PublicHeader } from './PublicHeader'
import { tokenKind } from './session'
import { signInAttempt, type SignInFrom } from './signInAttempt'
import { useSignIn } from './useSignIn'

function parseFrom(value: string | null): SignInFrom {
  return value === 'setup' || value === 'join' || value === 'add' || value === 'profile'
    ? value
    : 'start'
}

/**
 * Page for one failed sign-in (`#/fix?e=…&repo=…&from=…`): what went wrong, the steps the member
 * can take, a message for the owner where one has to act, and a retry. Nothing else, so the right
 * button is easy to find. Also reachable while signed in, for adding a project or replacing a
 * rejected token; the current profile then stays signed in.
 */
export function FixPage() {
  const { t, time } = useI18n()
  const [params] = useSearchParams()
  const error = parseLoginError(params.get('e'))
  const rawRepo = (params.get('repo') ?? '').trim()
  const target = joinTarget(rawRepo)
  const from = parseFrom(params.get('from'))
  const { submit, busy } = useSignIn()
  const signedIn = useAuth().state.status === 'ready'
  const [checkedAt, setCheckedAt] = useState<Date | null>(null)

  // The attempt is only in memory while the tab lives; after a reload the page shows the steps
  // without "Try again".
  const held = signInAttempt.get()
  const attempt = held && held.repo.trim() === rawRepo ? held : null
  const kind = attempt ? tokenKind(attempt.token) : null

  const at = Number(params.get('at'))
  const resetAt = attempt?.failure.resetAt ?? (at > 0 ? new Date(at) : undefined)
  const resetTime = resetAt ? time(resetAt) : undefined

  const full = target ? `${target.owner}/${target.repo}` : rawRepo.slice(0, 100)
  const title = t(`login.errors.${error}`, {
    repo: full || '…',
    owner: target?.owner ?? '…',
    time: resetTime ?? '…',
  })
  const steps = fixSteps(t, error, {
    owner: target?.owner,
    repo: target?.repo,
    token: kind,
    time: resetTime,
  })

  const member = attempt?.failure.user?.login
  const forOwner =
    target && needsOwner(error, kind)
      ? ownerMessage(t, {
          owner: target.owner,
          repo: target.repo,
          memberLogin: member,
          link: ownerPageLink(target.owner, target.repo, {
            member,
            kind:
              params.get('kind') === 'user' || error === 'personalRepoNotAccessible'
                ? 'user'
                : undefined,
          }),
        })
      : null

  // From the setup wizard, go back to the step that most likely needs to be redone.
  const setupStep = from === 'setup' ? setupStepFor(error) : null
  const repoParam = target ? `${target.owner}/${target.repo}` : ''
  const change =
    from === 'setup'
      ? setupStep
        ? `/setup?step=${setupStep}`
        : '/setup'
      : from === 'join' && target
        ? `/join?repo=${repoParam}`
        : from === 'add'
          ? `/add-project${target ? `?repo=${repoParam}` : ''}`
          : from === 'profile' && target
            ? `/replace-token?repo=${repoParam}`
            : '/'
  // Signed in, "Back" returns to the tracker of the current profile.
  const back = signedIn ? '/' : change
  const backLabel = signedIn ? t('profiles.back') : t('fix.back')

  useEffect(() => {
    document.documentElement.scrollTop = 0
  }, [error])

  const retry = async () => {
    if (!attempt) return
    const { token, repo, save, profileId, reused, newVault } = attempt
    await submit({ token, repo, save, from, profileId, reused, newVault }, { replace: true })
    setCheckedAt(new Date())
  }

  return (
    <div className="landing">
      <PublicHeader />
      <main className="ob-main">
        <Link to={back} state={{ resume: true }} className="ob-back">
          ← {backLabel}
        </Link>
        <div className="stack" style={{ gap: 6 }}>
          <span className="fix-eyebrow">{t('fix.title')}</span>
          <h1>{title}</h1>
          {steps.length > 1 && <p className="muted">{t('fix.intro')}</p>}
        </div>

        <ol className="ob-steps fix-steps">
          {steps.map((step, i) => (
            <li key={i} className="card fix-step">
              {steps.length > 1 && (
                <span className="step-num" aria-hidden="true">
                  {i + 1}
                </span>
              )}
              <div className="fix-step-body">
                <p>{step.text}</p>
                {step.link && (
                  <GitHubLink href={step.link.href} menu={step.link.menu} primary>
                    {step.link.label}
                  </GitHubLink>
                )}
                {step.tokenChecklist && (
                  <TokenChecklist owner={target?.owner} repo={target ? full : undefined} />
                )}
              </div>
            </li>
          ))}
        </ol>

        {setupStep && (
          <p className="banner banner-info fix-setup-step">
            {t('fix.setupStep', { title: t(`onboarding.setup.${setupStep}Title`) })}{' '}
            <Link to={change}>{t('fix.setupStepLink')}</Link>
          </p>
        )}

        {forOwner && target && (
          <section className="card help-section">
            <h2>{t('fix.ownerTitle')}</h2>
            <p>{t('fix.ownerText', { owner: target.owner })}</p>
            <CopyText text={forOwner} label={t('fix.copyOwner')} />
          </section>
        )}

        <div className="row fix-actions">
          {attempt ? (
            <>
              <button
                type="button"
                className="btn btn-primary btn-lg"
                disabled={busy}
                onClick={() => void retry()}
              >
                <Icon name="github" size={18} />
                {busy ? t('login.checking') : t('fix.retry')}
              </button>
              <Link to={change} state={{ resume: true }} className="btn btn-lg">
                {t('fix.change')}
              </Link>
            </>
          ) : from === 'profile' && target ? (
            <Link to={change} className="btn btn-primary btn-lg">
              {t('profiles.replaceToken')}
            </Link>
          ) : (
            <Link to={back} state={{ resume: true }} className="btn btn-primary btn-lg">
              {backLabel}
            </Link>
          )}
        </div>
        {checkedAt && !busy && (
          <p className="muted small" role="status">
            {t('fix.checkedAgain', { time: time(checkedAt) })}
          </p>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
