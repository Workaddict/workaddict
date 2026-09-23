import type { TFunction } from 'i18next'
import { githubLinks } from './githubLinks'

export type OwnerType = 'User' | 'Organization'

/** What the owner has to look at: the member can't reach the repository, or can't write to it. */
export type OwnerProblem = 'noAccess' | 'readOnly'

export interface OwnerMessageInput {
  /** The member's GitHub login, when known (after a token was checked). */
  memberLogin?: string
  owner: string
  repo: string
  ownerType: OwnerType
  problem: OwnerProblem
  /** The member uses a fine-grained token, which may be waiting for approval. */
  fineGrained: boolean
}

/**
 * Plain-text message a member sends to the repository owner, in the current language. It names the
 * member, the repository and the problem, and links the owner's GitHub pages. It never contains the
 * member's token.
 */
export function ownerMessage(t: TFunction, m: OwnerMessageInput): string {
  const full = `${m.owner}/${m.repo}`
  const access = githubLinks.repoAccess(m.owner, m.repo)
  const checks: string[] = []
  if (m.problem === 'readOnly') {
    checks.push(t('onboarding.ownerMsg.checkWrite', { repo: full, link: access }))
  } else if (m.ownerType === 'Organization') {
    checks.push(
      t('onboarding.ownerMsg.checkMember', { org: m.owner, link: githubLinks.people(m.owner) }),
    )
    checks.push(t('onboarding.ownerMsg.checkWrite', { repo: full, link: access }))
    if (m.fineGrained) {
      checks.push(
        t('onboarding.ownerMsg.checkApproval', { link: githubLinks.pendingTokens(m.owner) }),
      )
    }
  } else {
    checks.push(t('onboarding.ownerMsg.checkCollaborator', { repo: full, link: access }))
  }
  // A fine-grained token created for the member's own account gives the same 404 as a missing
  // invitation, and the app cannot tell them apart. Without this line the owner checks three
  // things that are all fine and the member stays stuck.
  const closing =
    m.problem === 'noAccess' && m.ownerType === 'Organization' && m.fineGrained
      ? [t('onboarding.ownerMsg.elseResourceOwner', { org: m.owner }), '']
      : []
  return [
    t('onboarding.ownerMsg.greeting'),
    '',
    t(m.problem === 'readOnly' ? 'onboarding.ownerMsg.readOnly' : 'onboarding.ownerMsg.noAccess', {
      repo: full,
    }),
    ...(m.memberLogin ? [t('onboarding.ownerMsg.login', { login: m.memberLogin })] : []),
    '',
    t('onboarding.ownerMsg.pleaseCheck'),
    ...checks.map((c) => `- ${c}`),
    '',
    ...closing,
    t('onboarding.ownerMsg.thanks'),
  ].join('\n')
}

export interface InviteMessageInput {
  link: string
  org: string
  repo: string
  approvalRequired: boolean
}

/** The owner's invitation for new members, in the current language. */
export function inviteMessage(t: TFunction, m: InviteMessageInput): string {
  return [
    t('onboarding.inviteMsg.intro', { repo: `${m.org}/${m.repo}` }),
    '',
    `1. ${t('onboarding.inviteMsg.accept', { org: m.org, link: githubLinks.orgInvitation(m.org) })}`,
    `2. ${t('onboarding.inviteMsg.open', { link: m.link })}`,
    ...(m.approvalRequired ? ['', t('onboarding.inviteMsg.approval')] : []),
  ].join('\n')
}
