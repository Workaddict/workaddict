import { useState, type ReactNode } from 'react'
import { CopyText } from '../../components/CopyText'
import { Icon } from '../../components/Icon'
import { useI18n } from '../../i18n'
import { githubLinks } from './githubLinks'
import { WhatIs } from '../help/Term'
import type { TopicId } from '../help/topics'

/** A link to a GitHub page, with the menu path that leads to the same page if GitHub moves it. */
export function GitHubLink({
  href,
  menu,
  children,
  primary = false,
}: {
  href: string
  /** Translated menu path, e.g. from `onboarding.menu.*`. */
  menu: string
  children: ReactNode
  primary?: boolean
}) {
  const { t } = useI18n()
  return (
    <span className="gh-link">
      <a
        className={primary ? 'btn btn-sm btn-primary' : undefined}
        href={href}
        target="_blank"
        rel="noreferrer"
      >
        {primary && <Icon name="github" size={14} />}
        {children} ↗
      </a>
      <span className="muted small">
        {t('onboarding.onGitHub')} {menu}
      </span>
    </span>
  )
}

/** One numbered step of the setup wizard or the join flow. */
export function Step({
  n,
  title,
  done,
  onDone,
  locked,
  lockedText,
  whatIs,
  children,
}: {
  n: number
  title: string
  /** Explains the step's main term ("What is a token?") with a link to its help topic. */
  whatIs?: { term: 'data-repo' | 'token' | 'workspace'; topic: TopicId }
  done?: boolean
  onDone?: (done: boolean) => void
  locked?: boolean
  lockedText?: string
  children?: ReactNode
}) {
  const { t } = useI18n()
  return (
    <li className={`card ob-step${done ? ' is-done' : ''}${locked ? ' is-locked' : ''}`}>
      <div className="ob-step-head">
        <span className="step-num" aria-hidden="true">
          {done ? <Icon name="check" size={16} /> : n}
        </span>
        <h2>{title}</h2>
        {whatIs && <WhatIs term={whatIs.term} topic={whatIs.topic} />}
        {onDone && !locked && (
          <label className="checkbox ob-done">
            <input type="checkbox" checked={!!done} onChange={(e) => onDone(e.target.checked)} />
            <span>{t('onboarding.done')}</span>
          </label>
        )}
      </div>
      {locked ? (
        lockedText && <p className="muted">{lockedText}</p>
      ) : (
        <div className="ob-step-body">{children}</div>
      )}
    </li>
  )
}

/**
 * What to fill in on GitHub's token form. The form is prefilled, but GitHub has had bugs with the
 * preselected owner and drops other fields when the owner changes, so the list asks to select the
 * owner again and to check Contents afterwards.
 */
export function TokenChecklist({ owner, repo }: { owner?: string; repo?: string }) {
  const { t } = useI18n()
  return (
    <div className="stack" style={{ gap: 8 }}>
      <p className="muted small">{t('onboarding.token.intro')}</p>
      <ol className="ob-list">
        <li>{t('onboarding.token.sudo')}</li>
        <li>
          {owner ? t('onboarding.token.owner', { owner }) : t('onboarding.token.ownerGeneric')}
        </li>
        <li>{t('onboarding.token.expiry')}</li>
        <li>{repo ? t('onboarding.token.repo', { repo }) : t('onboarding.token.repoGeneric')}</li>
        <li>{t('onboarding.token.contents')}</li>
        <li>{t('onboarding.token.generate')}</li>
      </ol>
      <GitHubLink href={githubLinks.newToken()} menu={t('onboarding.menu.newToken')} primary>
        {t('onboarding.token.open')}
      </GitHubLink>
    </div>
  )
}

/** Username input and the generated GitHub CLI commands. */
export function GhCommandsField({
  users,
  onUsers,
  invalid,
  commands,
}: {
  users: string
  onUsers: (value: string) => void
  invalid: string[]
  commands: string[]
}) {
  const { t } = useI18n()
  return (
    <div className="stack" style={{ gap: 8 }}>
      <label className="field">
        <span>{t('onboarding.setup.cliUsers')}</span>
        <input
          className="input"
          autoComplete="off"
          spellCheck={false}
          placeholder="anna, ben"
          value={users}
          aria-invalid={invalid.length > 0}
          onChange={(e) => onUsers(e.target.value)}
        />
      </label>
      {invalid.length > 0 && (
        <span className="small ob-invalid" role="alert">
          {t('onboarding.setup.cliInvalid', { names: invalid.join(', ') })}
        </span>
      )}
      <CopyText
        text={commands.join('\n')}
        label={t('onboarding.setup.cliCopy')}
        visible
        multiline
      />
    </div>
  )
}

/**
 * The end of a setup step: what the user sees on GitHub when it is done, and, once the user comes
 * back from a GitHub page opened in this step, the question whether it worked plus common mistakes.
 */
export function StepCheck({
  doneWhen,
  help,
  returned,
  done,
  onDone,
}: {
  doneWhen: string
  /** Common mistakes, one per line. */
  help: string
  /** The user came back from a GitHub page opened in this step. */
  returned: boolean
  done: boolean
  onDone: () => void
}) {
  const { t } = useI18n()
  const [showHelp, setShowHelp] = useState(false)
  if (done) return null
  return (
    <>
      {returned ? (
        <div className="banner banner-info stack ob-return" role="status">
          <strong>{t('onboarding.setup.returnTitle')}</strong>
          <span>{doneWhen}</span>
          <div className="row ob-answers">
            <button type="button" className="btn btn-sm btn-primary" onClick={onDone}>
              {t('onboarding.setup.returnYes')}
            </button>
            <button type="button" className="btn btn-sm" onClick={() => setShowHelp(true)}>
              {t('onboarding.setup.returnNo')}
            </button>
          </div>
        </div>
      ) : (
        <p className="small ob-done-when">
          <strong>{t('onboarding.setup.doneWhen')}</strong> {doneWhen}
        </p>
      )}
      {showHelp && (
        <div className="banner banner-warning stack ob-help" role="note">
          <strong>{t('onboarding.setup.helpTitle')}</strong>
          <ul className="ob-list">
            {help.split('\n').map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}

/**
 * A classic token's checklist, for members of a repository in a personal account: fine-grained
 * tokens can't reach a repository where the user is only a collaborator.
 */
export function ClassicTokenChecklist({ owner }: { owner: string }) {
  const { t } = useI18n()
  return (
    <div className="stack" style={{ gap: 8 }}>
      <p>{t('onboarding.join.classicIntro', { owner })}</p>
      <div className="banner banner-warning" role="note">
        {t('onboarding.join.classicWarning')}
      </div>
      <ol className="ob-list">
        <li>{t('onboarding.token.sudo')}</li>
        <li>{t('onboarding.join.classicNote')}</li>
        <li>{t('onboarding.join.classicExpiry')}</li>
        <li>{t('onboarding.join.classicScope')}</li>
        <li>{t('onboarding.join.classicGenerate')}</li>
      </ol>
      <GitHubLink
        href={githubLinks.classicToken()}
        menu={t('onboarding.menu.classicToken')}
        primary
      >
        {t('onboarding.join.classicOpen')}
      </GitHubLink>
    </div>
  )
}
