import { format } from 'date-fns'
import type { ReactNode } from 'react'
import { CopyText } from '../../components/CopyText'
import { useI18n } from '../../i18n'
import { parseRepo, type LoginCheck } from '../../storage'
import { tokenKind } from '../auth/session'
import { githubLinks } from './githubLinks'
import { ownerMessage, type OwnerMessageInput } from './messages'
import { GitHubLink } from './parts'

type LoginFailure = Extract<LoginCheck, { ok: false }>

/**
 * A failed sign-in: what went wrong, what the user can check themselves, and, where an owner has
 * to act, a ready-made message for them. The causes come from `checkLogin`'s owner lookup.
 */
export function LoginDiagnosis({
  failure,
  token,
  repo,
}: {
  failure: LoginFailure
  token: string
  repo: string
}) {
  const { t, locale } = useI18n()
  const parsed = parseRepo(repo)
  const owner = parsed?.owner ?? ''
  const name = parsed?.repo ?? ''
  const full = parsed ? `${owner}/${name}` : repo.trim()
  const fineGrained = tokenKind(token) === 'fineGrained'
  const classic = tokenKind(token) === 'classic'
  const { error } = failure

  const title = t(`login.errors.${error}`, {
    repo: full,
    owner,
    time: failure.resetAt ? format(failure.resetAt, 'p', { locale }) : '…',
  })

  const message = (m: Pick<OwnerMessageInput, 'problem' | 'ownerType'>) =>
    ownerMessage(t, {
      ...m,
      owner,
      repo: name,
      memberLogin: failure.user?.login,
      fineGrained,
    })

  let details: ReactNode = null
  let forOwner: string | null = null

  if (error === 'ownerNotFound') {
    details = <p>{t('onboarding.diagnosis.ownerNotFound')}</p>
  } else if (error === 'orgRepoNotAccessible' || error === 'repoNotFound') {
    const org = owner
    details = (
      <>
        <p>{t('onboarding.diagnosis.likelyCauses')}</p>
        <ol className="ob-list">
          {fineGrained && (
            <li>
              {t('onboarding.diagnosis.approval', { org })}{' '}
              <GitHubLink
                href={githubLinks.pendingTokens(org)}
                menu={t('onboarding.menu.pendingTokens')}
              >
                {t('onboarding.diagnosis.approvalLink')}
              </GitHubLink>
            </li>
          )}
          <li>
            {t('onboarding.diagnosis.invitation', { org })}{' '}
            <GitHubLink
              href={githubLinks.orgInvitation(org)}
              menu={t('onboarding.menu.orgInvitation')}
            >
              {t('onboarding.diagnosis.invitationLink')}
            </GitHubLink>
          </li>
          <li>
            {t('onboarding.diagnosis.repoOpen')}{' '}
            <GitHubLink
              href={githubLinks.repo(owner, name)}
              menu={t('onboarding.menu.repo', { repo: full })}
            >
              {t('onboarding.diagnosis.repoOpenLink', { repo: full })}
            </GitHubLink>
          </li>
          {classic ? (
            <li>{t('onboarding.diagnosis.classicScope')}</li>
          ) : (
            <>
              <li>
                {t('onboarding.diagnosis.resourceOwner', { org, repo: full })}{' '}
                <GitHubLink href={githubLinks.tokens()} menu={t('onboarding.menu.tokens')}>
                  {t('onboarding.diagnosis.tokensLink')}
                </GitHubLink>
              </li>
              <li>
                {t('onboarding.diagnosis.createdBefore')}{' '}
                <GitHubLink href={githubLinks.newToken(org)} menu={t('onboarding.menu.newToken')}>
                  {t('onboarding.diagnosis.newTokenLink')}
                </GitHubLink>
              </li>
            </>
          )}
          <li>{t('onboarding.diagnosis.repoName')}</li>
        </ol>
      </>
    )
    forOwner = message({ problem: 'noAccess', ownerType: 'Organization' })
  } else if (error === 'ownRepoNotAccessible') {
    details = (
      <p>
        {t('onboarding.diagnosis.ownRepo', { repo: full })}{' '}
        <GitHubLink href={githubLinks.tokens()} menu={t('onboarding.menu.tokens')}>
          {t('onboarding.diagnosis.tokensLink')}
        </GitHubLink>
      </p>
    )
  } else if (error === 'personalRepoNotAccessible') {
    if (fineGrained) {
      details = (
        <p>
          {t('onboarding.diagnosis.personalFineGrained', { owner })}{' '}
          <GitHubLink href={githubLinks.classicToken()} menu={t('onboarding.menu.tokens')}>
            {t('onboarding.diagnosis.classicLink')}
          </GitHubLink>
        </p>
      )
    } else {
      details = (
        <p>
          {t('onboarding.diagnosis.personalInvite', { owner })}{' '}
          <GitHubLink
            href={githubLinks.repoInvitations(owner, name)}
            menu={t('onboarding.menu.repoInvitations')}
          >
            {t('onboarding.diagnosis.invitationLink')}
          </GitHubLink>
        </p>
      )
      forOwner = message({ problem: 'noAccess', ownerType: 'User' })
    }
  } else if (error === 'noPushAccess') {
    details = (
      <ul className="ob-list">
        <li>
          {t('onboarding.diagnosis.readOnlyToken')}{' '}
          <GitHubLink href={githubLinks.newToken(owner)} menu={t('onboarding.menu.newToken')}>
            {t('onboarding.diagnosis.newTokenLink')}
          </GitHubLink>
        </li>
        <li>{t('onboarding.diagnosis.readOnlyRole')}</li>
      </ul>
    )
    forOwner = message({ problem: 'readOnly', ownerType: failure.ownerType ?? 'Organization' })
  }

  return (
    <div className="banner banner-error ob-diagnosis" role="alert">
      <strong>{title}</strong>
      {details}
      {forOwner && (
        <div className="stack" style={{ gap: 6 }}>
          <span>{t('onboarding.diagnosis.askOwner')}</span>
          <CopyText text={forOwner} label={t('onboarding.diagnosis.copyOwnerMessage')} multiline />
        </div>
      )}
    </div>
  )
}
