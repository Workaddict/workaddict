import type { ReactNode } from 'react'
import { CopyText } from '../../components/CopyText'
import { Icon } from '../../components/Icon'
import { useI18n } from '../../i18n'
import { githubLinks } from './githubLinks'

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
  children,
}: {
  n: number
  title: string
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
