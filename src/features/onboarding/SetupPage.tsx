import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CopyText } from '../../components/CopyText'
import { SiteFooter } from '../../components/SiteFooter'
import { useI18n } from '../../i18n'
import { PublicHeader } from '../auth/PublicHeader'
import { SignInForm } from '../auth/SignInForm'
import { DEFAULT_REPO_NAME, ghCommands, githubLinks, inviteLink } from './githubLinks'
import { inviteMessage } from './messages'
import { isLogin, isRepoName, parseUsernames } from './names'
import { GhCommandsField, GitHubLink, Step, TokenChecklist } from './parts'
import {
  emptySetup,
  SETUP_STEPS,
  stepsFor,
  useSetupState,
  type SetupMode,
  type SetupStep,
} from './setupState'

/**
 * The owner's guided setup. A team gets the full path (organization, shared access, invitations);
 * one person setting this up for themselves only needs a private repository and a token.
 */
export function SetupPage() {
  const { t } = useI18n()
  const [state, setState] = useSetupState()
  const [users, setUsers] = useState('')

  useEffect(() => {
    document.documentElement.scrollTop = 0
  }, [])

  const mode = state.mode
  const solo = mode === 'solo'
  const org = state.org.trim()
  const repo = state.repo.trim()
  const orgValid = isLogin(org)
  const repoValid = isRepoName(repo)
  const ready = orgValid && repoValid
  const names = {
    org: orgValid ? org : solo ? 'my-name' : 'my-team',
    repo: repoValid ? repo : DEFAULT_REPO_NAME,
  }

  const steps = stepsFor(mode ?? 'team')
  const stepNo = (s: SetupStep) => steps.indexOf(s) + 1
  const doneCount = state.done.filter((s) => steps.includes(s)).length

  const isDone = (s: SetupStep) => state.done.includes(s)
  const setDone = (s: SetupStep) => (done: boolean) =>
    setState((prev) => ({
      ...prev,
      done: done
        ? SETUP_STEPS.filter((x) => x === s || prev.done.includes(x))
        : prev.done.filter((x) => x !== s),
    }))

  const chooseMode = (next: SetupMode) => setState((prev) => ({ ...prev, mode: next }))

  const parsedUsers = parseUsernames(users)
  const link = ready && !solo ? inviteLink(org, repo) : ''

  return (
    <div className="landing">
      <PublicHeader />
      <main className="ob-main">
        <Link to="/" className="ob-back">
          ← {t('onboarding.back')}
        </Link>
        <div className="stack" style={{ gap: 6 }}>
          <h1>{t('onboarding.setup.title')}</h1>
          <p className="muted">
            {t(solo ? 'onboarding.setup.soloIntro' : 'onboarding.setup.intro')}
          </p>
        </div>

        {mode === null && (
          <div className="card stack" style={{ gap: 12 }}>
            <h2 className="h3">{t('onboarding.setup.modeTitle')}</h2>
            <div className="row ob-modes">
              <button type="button" className="btn ob-mode" onClick={() => chooseMode('solo')}>
                <strong>{t('onboarding.setup.modeSolo')}</strong>
                <span className="muted small">{t('onboarding.setup.modeSoloHint')}</span>
              </button>
              <button
                type="button"
                className="btn btn-primary ob-mode"
                onClick={() => chooseMode('team')}
              >
                <strong>{t('onboarding.setup.modeTeam')}</strong>
                <span className="muted small">{t('onboarding.setup.modeTeamHint')}</span>
              </button>
            </div>
            <p className="muted small">{t('onboarding.setup.modeLater')}</p>
          </div>
        )}

        {mode !== null && (
          <>
            <div className="card ob-names">
              <div className="field">
                <label className="field">
                  <span>{t(solo ? 'onboarding.setup.user' : 'onboarding.setup.org')}</span>
                  <input
                    className="input"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder={solo ? 'my-name' : 'my-team'}
                    value={state.org}
                    aria-invalid={org !== '' && !orgValid}
                    onChange={(e) => setState((prev) => ({ ...prev, org: e.target.value }))}
                  />
                </label>
                <p className={`small${org !== '' && !orgValid ? ' ob-invalid' : ' muted'}`}>
                  {org !== '' && !orgValid
                    ? t(solo ? 'onboarding.setup.userInvalid' : 'onboarding.setup.orgInvalid')
                    : t(solo ? 'onboarding.setup.userHint' : 'onboarding.setup.orgHint')}
                </p>
              </div>
              <label className="field">
                <span>{t('onboarding.setup.repo')}</span>
                <input
                  className="input"
                  autoComplete="off"
                  spellCheck={false}
                  value={state.repo}
                  aria-invalid={!repoValid}
                  onChange={(e) => setState((prev) => ({ ...prev, repo: e.target.value }))}
                />
              </label>
              {!repoValid && (
                <p className="small ob-invalid">{t('onboarding.setup.repoInvalid')}</p>
              )}
            </div>

            <div className="row">
              <span className="muted small" role="status">
                {t('onboarding.setup.progress', { done: doneCount, total: steps.length })}
              </span>
              <span className="spacer" />
              <button
                type="button"
                className="link-btn"
                onClick={() => setState((prev) => ({ ...prev, mode: null }))}
              >
                {t('onboarding.setup.modeChange')}
              </button>
              <button type="button" className="link-btn" onClick={() => setState(emptySetup())}>
                {t('onboarding.setup.reset')}
              </button>
            </div>

            {!ready && (
              <div className="banner banner-info" role="note">
                {t('onboarding.setup.needNames')}
              </div>
            )}

            <ol className="ob-steps">
              {!solo && (
                <Step
                  n={stepNo('org')}
                  title={t('onboarding.setup.orgTitle')}
                  done={isDone('org')}
                  onDone={setDone('org')}
                >
                  <p>{t('onboarding.setup.orgText', names)}</p>
                  <p className="muted small">{t('onboarding.setup.orgWhy')}</p>
                  <GitHubLink
                    href={githubLinks.createOrg()}
                    menu={t('onboarding.menu.createOrg')}
                    primary
                  >
                    {t('onboarding.setup.orgLink')}
                  </GitHubLink>
                </Step>
              )}

              <Step
                n={stepNo('repo')}
                title={t('onboarding.setup.repoTitle')}
                done={isDone('repo')}
                onDone={setDone('repo')}
              >
                <p>
                  {t(solo ? 'onboarding.setup.soloRepoText' : 'onboarding.setup.repoText', names)}
                </p>
                {ready && (
                  <GitHubLink
                    href={githubLinks.newRepo(org, repo)}
                    menu={t('onboarding.menu.newRepo')}
                    primary
                  >
                    {t('onboarding.setup.repoLink', names)}
                  </GitHubLink>
                )}
              </Step>

              {!solo && (
                <Step
                  n={stepNo('base')}
                  title={t('onboarding.setup.baseTitle')}
                  done={isDone('base')}
                  onDone={setDone('base')}
                >
                  <p>{t('onboarding.setup.baseText')}</p>
                  <div className="banner banner-warning" role="note">
                    {t('onboarding.setup.baseCaveat', names)}
                  </div>
                  {ready && (
                    <GitHubLink
                      href={githubLinks.memberPrivileges(org)}
                      menu={t('onboarding.menu.memberPrivileges')}
                      primary
                    >
                      {t('onboarding.setup.baseLink')}
                    </GitHubLink>
                  )}
                </Step>
              )}

              {!solo && (
                <Step
                  n={stepNo('approval')}
                  title={t('onboarding.setup.approvalTitle')}
                  done={isDone('approval')}
                  onDone={setDone('approval')}
                >
                  <p>{t('onboarding.setup.approvalText')}</p>
                  <div
                    className="stack"
                    style={{ gap: 8 }}
                    role="radiogroup"
                    aria-label={t('onboarding.setup.approvalTitle')}
                  >
                    <label className="checkbox ob-choice">
                      <input
                        type="radio"
                        name="approval"
                        checked={state.approval === 'off'}
                        onChange={() => setState((prev) => ({ ...prev, approval: 'off' }))}
                      />
                      <span>
                        <strong>{t('onboarding.setup.approvalOff')}</strong>
                        <br />
                        <span className="muted small">{t('onboarding.setup.approvalOffHint')}</span>
                      </span>
                    </label>
                    <label className="checkbox ob-choice">
                      <input
                        type="radio"
                        name="approval"
                        checked={state.approval === 'on'}
                        onChange={() => setState((prev) => ({ ...prev, approval: 'on' }))}
                      />
                      <span>
                        <strong>{t('onboarding.setup.approvalOn')}</strong>
                        <br />
                        <span className="muted small">{t('onboarding.setup.approvalOnHint')}</span>
                      </span>
                    </label>
                  </div>
                  {ready && (
                    <GitHubLink
                      href={githubLinks.tokenPolicy(org)}
                      menu={t('onboarding.menu.tokenPolicy')}
                      primary
                    >
                      {t('onboarding.setup.approvalLink')}
                    </GitHubLink>
                  )}
                </Step>
              )}

              {!solo && (
                <Step
                  n={stepNo('invite')}
                  title={t('onboarding.setup.inviteTitle')}
                  done={isDone('invite')}
                  onDone={setDone('invite')}
                >
                  <p>{t('onboarding.setup.inviteText')}</p>
                  {ready && (
                    <GitHubLink
                      href={githubLinks.people(org)}
                      menu={t('onboarding.menu.people')}
                      primary
                    >
                      {t('onboarding.setup.inviteLink')}
                    </GitHubLink>
                  )}
                  {ready && (
                    <details className="ob-cli">
                      <summary>{t('onboarding.setup.cliTitle')}</summary>
                      <p>{t('onboarding.setup.cliText')}</p>
                      <GhCommandsField
                        users={users}
                        onUsers={setUsers}
                        invalid={parsedUsers.invalid}
                        commands={ghCommands(org, parsedUsers.valid, { repo })}
                      />
                    </details>
                  )}
                </Step>
              )}

              <Step
                n={stepNo('token')}
                title={t('onboarding.setup.tokenTitle')}
                done={isDone('token')}
                onDone={setDone('token')}
              >
                <p>{t(solo ? 'onboarding.setup.soloTokenText' : 'onboarding.setup.tokenText')}</p>
                {ready && <TokenChecklist owner={org} repo={`${org}/${repo}`} />}
              </Step>

              {!solo && (
                <Step
                  n={stepNo('share')}
                  title={t('onboarding.setup.shareTitle')}
                  done={isDone('share')}
                  onDone={setDone('share')}
                >
                  <p>{t('onboarding.setup.shareText')}</p>
                  {ready && (
                    <>
                      <CopyText text={link} label={t('onboarding.setup.copyLink')} visible />
                      <CopyText
                        text={inviteMessage(t, {
                          link,
                          org,
                          repo,
                          approvalRequired: state.approval === 'on',
                        })}
                        label={t('onboarding.setup.copyMessage')}
                        visible
                        multiline
                      />
                      {state.approval === 'on' && (
                        <div className="banner banner-info stack" style={{ gap: 6 }}>
                          <span>{t('onboarding.setup.shareApproval')}</span>
                          <GitHubLink
                            href={githubLinks.pendingTokens(org)}
                            menu={t('onboarding.menu.pendingTokens')}
                          >
                            {t('onboarding.setup.pendingLink')}
                          </GitHubLink>
                        </div>
                      )}
                    </>
                  )}
                </Step>
              )}

              <Step n={steps.length + 1} title={t('onboarding.setup.signInTitle')}>
                <p>{t('onboarding.setup.signInText')}</p>
                {ready && <SignInForm key={`${org}/${repo}`} initialRepo={`${org}/${repo}`} />}
                {solo && <p className="muted small">{t('onboarding.setup.soloLater')}</p>}
              </Step>
            </ol>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
