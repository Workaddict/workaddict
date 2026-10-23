import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CopyText } from '../../components/CopyText'
import { Icon } from '../../components/Icon'
import { SiteFooter } from '../../components/SiteFooter'
import { useI18n } from '../../i18n'
import { useAuth } from '../auth/AuthContext'
import { PublicHeader } from '../auth/PublicHeader'
import { SignInForm } from '../auth/SignInForm'
import { DEFAULT_REPO_NAME, ghCommands, githubLinks, inviteLink } from './githubLinks'
import { inviteMessage } from './messages'
import { isLogin, isRepoName, parseUsernames } from './names'
import { GhCommandsField, GitHubLink, StepCheck, TokenChecklist } from './parts'
import {
  forgetLookups,
  lookupAccount,
  lookupRepo,
  type AccountKind,
  type RepoKind,
} from './publicGitHub'
import {
  emptySetup,
  isPersonal,
  SETUP_MODES,
  SETUP_STEPS,
  stepsFor,
  useSetupState,
  type SetupMode,
  type SetupStep,
} from './setupState'
import { HelpShot } from '../help/HelpShot'
import type { ShotId } from '../help/shots'
import { WhatIs } from '../help/Term'

/** One page of the wizard: who it is for, the account name, each setup step, then sign-in. */
type ScreenId = 'who' | 'account' | SetupStep | 'signIn'

const MODE_LABEL = {
  solo: ['onboarding.setup.modeSolo', 'onboarding.setup.modeSoloHint'],
  team: ['onboarding.setup.modeTeam', 'onboarding.setup.modeTeamHint'],
  'personal-team': ['onboarding.setup.modePersonalTeam', 'onboarding.setup.modePersonalTeamHint'],
} as const

function isScreenId(value: string | null): value is ScreenId {
  return (
    value === 'who' ||
    value === 'account' ||
    value === 'signIn' ||
    (SETUP_STEPS as readonly string[]).includes(value ?? '')
  )
}

/** The GitHub screen each step sends the user to. */
const STEP_SHOTS: Partial<Record<SetupStep, ShotId[]>> = {
  org: ['org-new'],
  repo: ['repo-new'],
  base: ['base-permission'],
  approval: ['token-policy'],
  invite: ['org-invite'],
  collaborators: ['repo-access'],
  token: ['token-form', 'token-permissions'],
}

function isStep(screen: ScreenId): screen is SetupStep {
  return screen !== 'who' && screen !== 'account' && screen !== 'signIn'
}

/** Waits a moment after typing before asking GitHub, so each keystroke is not a request. */
const LOOKUP_DELAY_MS = 500

/**
 * The owner's guided setup as a wizard: one page at a time, moving on with "Next". A team gets
 * either an organization (safest tokens) or a repository in the owner's personal account (classic
 * tokens for members); one person only needs a private repository and a token. The page is in the
 * address (`?step=`), so the browser's back button and the fix page's links work.
 */
export function SetupPage() {
  const { t } = useI18n()
  // Signed in, the wizard adds a workspace; "Back" returns to "Add workspace".
  const signedIn = useAuth().state.status === 'ready'
  const [state, setState] = useSetupState()
  const [params, setParams] = useSearchParams()
  const [users, setUsers] = useState('')
  // The step whose GitHub link was opened, and the step the user came back to.
  const [awaiting, setAwaiting] = useState<SetupStep | null>(null)
  const [returned, setReturned] = useState<SetupStep | null>(null)
  const [editRepo, setEditRepo] = useState(() => state.repo !== DEFAULT_REPO_NAME)
  const [account, setAccount] = useState<{ name: string; kind: AccountKind } | null>(null)
  const [publicRepo, setPublicRepo] = useState<{ name: string; kind: RepoKind } | null>(null)
  const [recheck, setRecheck] = useState(0)
  const autoDoneFor = useRef<string | null>(null)

  const mode = state.mode
  const personal = isPersonal(mode)
  const solo = mode === 'solo'
  const team = mode === 'team'
  const org = state.org.trim()
  const repo = state.repo.trim()
  const orgValid = isLogin(org)
  const repoValid = isRepoName(repo)
  const ready = orgValid && repoValid
  const names = { org, repo }
  const fullRepo = `${org}/${repo}`

  const steps = stepsFor(mode ?? 'team')
  const isDone = (s: SetupStep) => state.done.includes(s)
  const firstOpen: ScreenId = steps.find((s) => !state.done.includes(s)) ?? 'signIn'
  const screens: ScreenId[] = mode === null ? ['who'] : ['who', 'account', ...steps, 'signIn']
  const accountKind: AccountKind = account?.name === org ? account.kind : 'unknown'
  const repoKind: RepoKind = publicRepo?.name === fullRepo ? publicRepo.kind : 'unknown'

  // The page in the address wins; without one, continue where the user left off. Steps need
  // valid names, so they fall back to the name page until then.
  const requested = params.get('step')
  let screen: ScreenId =
    isScreenId(requested) && screens.includes(requested)
      ? requested
      : mode === null
        ? 'who'
        : ready
          ? firstOpen
          : 'account'
  if (!ready && screen !== 'who') screen = mode === null ? 'who' : 'account'
  const index = screens.indexOf(screen)

  // Slide from the right when moving on, from the left when going back (also via browser back).
  const [shown, setShown] = useState<{ screen: ScreenId; dir: 'next' | 'back' }>({
    screen,
    dir: 'next',
  })
  if (shown.screen !== screen) {
    setShown({
      screen,
      dir: screens.indexOf(screen) >= screens.indexOf(shown.screen) ? 'next' : 'back',
    })
  }

  // Pin the opening page in the address, so choosing a path or typing a name never moves on by
  // itself; only "Next" and "Back" change the page.
  useEffect(() => {
    if (!isScreenId(requested)) setParams({ step: screen }, { replace: true })
  }, [requested, screen, setParams])

  // A new page starts at the top with focus on its title, for keyboard and screen reader users.
  useEffect(() => {
    document.documentElement.scrollTop = 0
    document.getElementById('ob-screen-title')?.focus({ preventScroll: true })
  }, [screen])

  // Advice from GitHub's public API: does the account exist, and is it a user or an organization?
  useEffect(() => {
    if (!orgValid) return
    let live = true
    const timer = setTimeout(() => {
      void lookupAccount(org).then((kind) => live && setAccount({ name: org, kind }))
    }, LOOKUP_DELAY_MS)
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [org, orgValid, recheck])

  useEffect(() => {
    if (!ready) return
    let live = true
    const name = `${org}/${repo}`
    const timer = setTimeout(() => {
      void lookupRepo(org, repo).then((kind) => live && setPublicRepo({ name, kind }))
    }, LOOKUP_DELAY_MS)
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [org, repo, ready])

  // An organization that already exists on GitHub needs no "create" step; ticked once per name,
  // so "Not done yet" sticks.
  useEffect(() => {
    if (!team || accountKind !== 'org' || autoDoneFor.current === org) return
    autoDoneFor.current = org
    setState((prev) =>
      prev.done.includes('org')
        ? prev
        : { ...prev, done: SETUP_STEPS.filter((x) => x === 'org' || prev.done.includes(x)) },
    )
  }, [team, accountKind, org, setState])

  // Back from a GitHub page opened in a step: ask whether it worked.
  useEffect(() => {
    if (!awaiting) return
    let left = false
    const leave = () => {
      left = true
    }
    const back = () => {
      if (!left) return
      setReturned(awaiting)
      setAwaiting(null)
      if (awaiting === 'org') {
        forgetLookups(`account:${org.toLowerCase()}`)
        setRecheck((n) => n + 1)
      }
    }
    const visibility = () => (document.visibilityState === 'hidden' ? leave() : back())
    window.addEventListener('blur', leave)
    window.addEventListener('focus', back)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      window.removeEventListener('blur', leave)
      window.removeEventListener('focus', back)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [awaiting, org])

  const go = (to: ScreenId) => {
    setReturned(null)
    setAwaiting(null)
    setParams({ step: to })
  }
  const next = () => go(screens[index + 1] ?? 'signIn')
  const back = () => go(screens[index - 1] ?? 'who')
  const markDone = (s: SetupStep) => {
    setState((prev) => ({
      ...prev,
      done: SETUP_STEPS.filter((x) => x === s || prev.done.includes(x)),
    }))
    next()
  }
  const undo = (s: SetupStep) =>
    setState((prev) => ({ ...prev, done: prev.done.filter((x) => x !== s) }))
  const chooseMode = (m: SetupMode) => setState((prev) => ({ ...prev, mode: m }))
  const startOver = () => {
    setState(emptySetup())
    setEditRepo(false)
    go('who')
  }

  const parsedUsers = parseUsernames(users)
  const link = ready && !solo ? inviteLink(org, repo, personal ? { kind: 'user' } : {}) : ''

  const title =
    screen === 'who'
      ? t('onboarding.setup.modeTitle')
      : screen === 'account'
        ? t('onboarding.setup.namesTitle')
        : t(`onboarding.setup.${screen}Title`)

  /** The setup step's own content; links to GitHub inside it start the "back from GitHub" check. */
  const stepBody = (s: SetupStep, children: ReactNode) => (
    <div
      className="ob-step-body"
      onClick={(e) => {
        if (e.target instanceof Element && e.target.closest('a[target="_blank"]')) setAwaiting(s)
      }}
    >
      {children}
      {STEP_SHOTS[s]?.map((id) => (
        <HelpShot key={id} id={id} />
      ))}
      <StepCheck
        doneWhen={t(`onboarding.setup.${s}DoneWhen`, names)}
        help={t(`onboarding.setup.${s}Help`, names)}
        returned={returned === s}
        done={isDone(s)}
        onDone={() => markDone(s)}
      />
      {isDone(s) && (
        <p className="small ob-found">
          <Icon name="check" size={14} /> {t('onboarding.setup.doneMark')}{' '}
          <button type="button" className="link-btn small" onClick={() => undo(s)}>
            {t('onboarding.setup.notDone')}
          </button>
        </p>
      )}
    </div>
  )

  const content: Record<ScreenId, () => ReactNode> = {
    who: () => (
      <>
        <div className="ob-modes" role="radiogroup" aria-labelledby="ob-screen-title">
          {SETUP_MODES.map((m) => (
            <label key={m} className={`ob-mode${mode === m ? ' is-selected' : ''}`}>
              <input
                type="radio"
                className="visually-hidden"
                name="setup-mode"
                value={m}
                checked={mode === m}
                onChange={() => chooseMode(m)}
              />
              <span className="ob-mode-mark" aria-hidden="true">
                <Icon name="check" size={14} />
              </span>
              <span className="ob-mode-text">
                <strong>{t(MODE_LABEL[m][0])}</strong>
                <span className="muted small">{t(MODE_LABEL[m][1])}</span>
              </span>
            </label>
          ))}
        </div>
        {mode === null || solo ? (
          <p className="muted small">{t('onboarding.setup.modeLater')}</p>
        ) : (
          <TeamPathComparison />
        )}
      </>
    ),
    account: () => (
      <div className="ob-names-fields">
        <div className="field">
          <label className="field">
            <span>{t(personal ? 'onboarding.setup.user' : 'onboarding.setup.org')}</span>
            <input
              className="input"
              autoComplete="off"
              spellCheck={false}
              placeholder={personal ? 'my-name' : 'my-team'}
              value={state.org}
              aria-invalid={org !== '' && !orgValid}
              onChange={(e) => setState((prev) => ({ ...prev, org: e.target.value }))}
            />
          </label>
          {org !== '' && !orgValid ? (
            <p className="small ob-invalid">
              {t(personal ? 'onboarding.setup.userInvalid' : 'onboarding.setup.orgInvalid')}
            </p>
          ) : personal && accountKind === 'missing' ? (
            <p className="small ob-invalid">{t('onboarding.setup.accountMissing')}</p>
          ) : (
            <p className="small muted">
              {team && accountKind === 'org'
                ? t('onboarding.setup.orgFound', { org })
                : team && accountKind === 'missing'
                  ? t('onboarding.setup.orgMissing')
                  : t(personal ? 'onboarding.setup.userHint' : 'onboarding.setup.orgHint')}
            </p>
          )}
        </div>
        {team && accountKind === 'user' && (
          <div className="banner banner-info stack ob-account-notice" role="status">
            <span>{t('onboarding.setup.accountIsUser', { name: org })}</span>
            <div className="row wrap">
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => chooseMode('personal-team')}
              >
                {t('onboarding.setup.switchToPersonal')}
              </button>
            </div>
            <span className="small">{t('onboarding.setup.accountIsUserOr')}</span>
          </div>
        )}
        {personal && accountKind === 'org' && (
          <div className="banner banner-info stack ob-account-notice" role="status">
            <span>{t('onboarding.setup.accountIsOrg', { name: org })}</span>
            <div className="row wrap">
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => chooseMode('team')}
              >
                {t('onboarding.setup.switchToTeam')}
              </button>
            </div>
          </div>
        )}
        {editRepo || !repoValid ? (
          <div className="field">
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
            <p className={`small${repoValid ? ' muted' : ' ob-invalid'}`}>
              {t(repoValid ? 'onboarding.setup.repoHint' : 'onboarding.setup.repoInvalid')}
            </p>
          </div>
        ) : (
          <p className="ob-repo-line">
            <span>{t('onboarding.setup.repoLine', { repo: `${org || '…'}/${repo}` })}</span>{' '}
            <button type="button" className="link-btn small" onClick={() => setEditRepo(true)}>
              {t('onboarding.setup.repoChange')}
            </button>
          </p>
        )}
        {repoKind === 'public' && (
          <div className="banner banner-warning" role="alert">
            {t('onboarding.setup.repoPublic', { repo: fullRepo })}
          </div>
        )}
        <p className="ob-code-note small">
          <Icon name="check" size={14} /> {t('onboarding.setup.codeNote')}
        </p>
      </div>
    ),
    org: () =>
      stepBody(
        'org',
        <>
          <p>{t('onboarding.setup.orgText', names)}</p>
          {accountKind === 'org' && (
            <p className="small ob-found">
              <Icon name="check" size={14} /> {t('onboarding.setup.orgFound', { org })}
            </p>
          )}
          <p className="muted small">
            {t('onboarding.setup.orgWhy')} {t('onboarding.setup.orgNote')}
          </p>
          <GitHubLink href={githubLinks.createOrg()} menu={t('onboarding.menu.createOrg')} primary>
            {t('onboarding.setup.orgLink')}
          </GitHubLink>
        </>,
      ),
    repo: () =>
      stepBody(
        'repo',
        <>
          <p>
            {t(personal ? 'onboarding.setup.soloRepoText' : 'onboarding.setup.repoText', names)}
          </p>
          <GitHubLink
            href={githubLinks.newRepo(org, repo)}
            menu={t(personal ? 'onboarding.menu.newRepoOwn' : 'onboarding.menu.newRepo')}
            primary
          >
            {t('onboarding.setup.repoLink', names)}
          </GitHubLink>
        </>,
      ),
    base: () =>
      stepBody(
        'base',
        <>
          <p>{t('onboarding.setup.baseText')}</p>
          <div className="banner banner-warning" role="note">
            {t('onboarding.setup.baseCaveat', names)}
          </div>
          <GitHubLink
            href={githubLinks.memberPrivileges(org)}
            menu={t('onboarding.menu.memberPrivileges')}
            primary
          >
            {t('onboarding.setup.baseLink')}
          </GitHubLink>
        </>,
      ),
    approval: () =>
      stepBody(
        'approval',
        <>
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
          <GitHubLink
            href={githubLinks.tokenPolicy(org)}
            menu={t('onboarding.menu.tokenPolicy')}
            primary
          >
            {t('onboarding.setup.approvalLink')}
          </GitHubLink>
        </>,
      ),
    invite: () =>
      stepBody(
        'invite',
        <>
          <p>{t('onboarding.setup.inviteText')}</p>
          <GitHubLink href={githubLinks.people(org)} menu={t('onboarding.menu.people')} primary>
            {t('onboarding.setup.inviteLink')}
          </GitHubLink>
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
        </>,
      ),
    collaborators: () =>
      stepBody(
        'collaborators',
        <>
          <p>{t('onboarding.setup.collaboratorsText')}</p>
          <GitHubLink
            href={githubLinks.repoAccess(org, repo)}
            menu={t('onboarding.menu.repoAccess')}
            primary
          >
            {t('onboarding.setup.collaboratorsLink')}
          </GitHubLink>
        </>,
      ),
    token: () =>
      stepBody(
        'token',
        <>
          <p>
            {t(
              solo
                ? 'onboarding.setup.soloTokenText'
                : personal
                  ? 'onboarding.setup.personalTokenText'
                  : 'onboarding.setup.tokenText',
            )}
          </p>
          <TokenChecklist owner={org} repo={fullRepo} />
        </>,
      ),
    share: () =>
      stepBody(
        'share',
        <>
          <p>{t(personal ? 'onboarding.setup.personalShareText' : 'onboarding.setup.shareText')}</p>
          <CopyText text={link} label={t('onboarding.setup.copyLink')} visible />
          <CopyText
            text={inviteMessage(t, {
              link,
              org,
              repo,
              approvalRequired: team && state.approval === 'on',
              kind: personal ? 'user' : undefined,
            })}
            label={t('onboarding.setup.copyMessage')}
            visible
            multiline
          />
          {team && state.approval === 'on' && (
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
        </>,
      ),
    signIn: () => (
      <div className="ob-step-body">
        <p>{t('onboarding.setup.signInText')}</p>
        <SignInForm key={fullRepo} from="setup" initialRepo={fullRepo} />
        {solo && <p className="muted small">{t('onboarding.setup.soloLater')}</p>}
      </div>
    ),
  }

  // The main button: choose and continue, mark a step done, or just continue past a done step.
  const primary =
    screen === 'who' ? (
      <button type="button" className="btn btn-primary" disabled={mode === null} onClick={next}>
        {t('onboarding.setup.next')} →
      </button>
    ) : screen === 'account' ? (
      <button
        type="button"
        className="btn btn-primary"
        disabled={!ready}
        onClick={() =>
          // An organization found on GitHub counts as created, even before its tick is saved.
          go(
            steps.find((x) => !isDone(x) && !(x === 'org' && team && accountKind === 'org')) ??
              'signIn',
          )
        }
      >
        {t('onboarding.setup.next')} →
      </button>
    ) : isStep(screen) ? (
      isDone(screen) ? (
        <button type="button" className="btn btn-primary" onClick={next}>
          {t('onboarding.setup.next')} →
        </button>
      ) : (
        returned !== screen && (
          <button type="button" className="btn btn-primary" onClick={() => markDone(screen)}>
            {t('onboarding.setup.doneNext')} →
          </button>
        )
      )
    ) : null

  return (
    <div className="landing">
      <PublicHeader />
      <main className="ob-main">
        <Link to={signedIn ? '/add-project' : '/'} className="ob-back">
          ← {t(signedIn ? 'profiles.back' : 'onboarding.back')}
        </Link>
        <div className="stack" style={{ gap: 6 }}>
          <h1>{t(solo ? 'onboarding.setup.soloTitle' : 'onboarding.setup.title')}</h1>
          {screen === 'who' && (
            <>
              <p className="muted">
                {t(solo ? 'onboarding.setup.soloIntro' : 'onboarding.setup.intro')}
              </p>
              <p className="ob-code-note">
                <Icon name="check" size={14} /> {t('onboarding.setup.codeNote')}
              </p>
            </>
          )}
        </div>

        <div className="ob-wizard-head">
          <span className="small muted" role="status">
            {mode === null
              ? t('onboarding.setup.stepFirst')
              : t('onboarding.setup.stepOf', { n: index + 1, total: screens.length })}
          </span>
          {mode !== null && (
            <button type="button" className="link-btn small" onClick={startOver}>
              {t('onboarding.setup.reset')}
            </button>
          )}
          <progress
            className="ob-progress"
            value={mode === null ? 0 : index + 1}
            max={screens.length}
            aria-hidden="true"
          />
        </div>

        <section
          key={screen}
          className={`card ob-screen slide-${shown.dir}`}
          aria-labelledby="ob-screen-title"
        >
          <h2 id="ob-screen-title" className="ob-screen-title" tabIndex={-1}>
            {title}
          </h2>
          {screen === 'repo' && <WhatIs term="data-repo" topic="token" />}
          {screen === 'token' && <WhatIs term="token" topic="token" />}
          {content[screen]()}
          <div className="ob-nav">
            {index > 0 ? (
              <button type="button" className="btn" onClick={back}>
                ← {t('onboarding.setup.back')}
              </button>
            ) : (
              <span />
            )}
            {primary}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

/** Honest pros and cons of the two team paths, shown when either is selected. */
function TeamPathComparison() {
  const { t } = useI18n()
  const column = (title: string, pros: string[], cons: string[], recommended = false) => (
    <div className={`ob-compare-col${recommended ? ' is-recommended' : ''}`}>
      <h3 className="ob-compare-title">
        {title}
        {recommended && <span className="badge">{t('onboarding.setup.compareRecommended')}</span>}
      </h3>
      <p className="visually-hidden">{t('onboarding.setup.pros')}</p>
      <ul className="ob-compare-list">
        {pros.map((p) => (
          <li key={p} className="is-pro">
            <span aria-hidden="true">+</span> {p}
          </li>
        ))}
      </ul>
      <p className="visually-hidden">{t('onboarding.setup.cons')}</p>
      <ul className="ob-compare-list">
        {cons.map((c) => (
          <li key={c} className="is-con">
            <span aria-hidden="true">−</span> {c}
          </li>
        ))}
      </ul>
    </div>
  )
  return (
    <div className="ob-compare" role="group" aria-labelledby="ob-compare-title">
      <h3 className="small ob-compare-head" id="ob-compare-title">
        {t('onboarding.setup.compareTitle')}
      </h3>
      <div className="ob-compare-cols">
        {column(
          t('onboarding.setup.compareOrg'),
          [t('onboarding.setup.compareOrgPro1'), t('onboarding.setup.compareOrgPro2')],
          [t('onboarding.setup.compareOrgCon1'), t('onboarding.setup.compareOrgCon2')],
          true,
        )}
        {column(
          t('onboarding.setup.comparePersonal'),
          [t('onboarding.setup.comparePersonalPro1'), t('onboarding.setup.comparePersonalPro2')],
          [t('onboarding.setup.comparePersonalCon1'), t('onboarding.setup.comparePersonalCon2')],
        )}
      </div>
      <p className="muted small">{t('onboarding.setup.compareBoth')}</p>
    </div>
  )
}
