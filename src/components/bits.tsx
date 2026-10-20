import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useIsExpert } from '../hintLevel'
import type { Member, Project } from '../domain/types'
import { Icon, type IconName } from './Icon'

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="center" role="status">
      <div className="row">
        <div className="spinner" />
        {label && <span className="muted">{label}</span>}
      </div>
    </div>
  )
}

/** The next step an empty state offers: a link or a button. */
export type EmptyAction = { label: string } & ({ to: string } | { onClick: () => void })

/**
 * Shown where there is nothing yet. The hint explains what will appear (hidden in Expert mode);
 * the action offers the next step, only where the user may take it.
 */
export function EmptyState({
  icon = 'clock',
  title,
  hint,
  action,
  children,
}: {
  icon?: IconName
  title: string
  hint?: string
  action?: EmptyAction
  children?: ReactNode
}) {
  const expert = useIsExpert()
  return (
    <div className="empty-state">
      <Icon name={icon} size={32} />
      <strong>{title}</strong>
      {hint && !expert && <span className="small">{hint}</span>}
      {action &&
        ('to' in action ? (
          <Link className="btn btn-sm empty-action" to={action.to}>
            {action.label}
          </Link>
        ) : (
          <button type="button" className="btn btn-sm empty-action" onClick={action.onClick}>
            {action.label}
          </button>
        ))}
      {children}
    </div>
  )
}

export function Avatar({ member, large }: { member: Member; large?: boolean }) {
  const cls = `avatar${large ? ' avatar-lg' : ''}`
  if (member.avatarUrl) {
    return <img className={cls} src={member.avatarUrl} alt="" referrerPolicy="no-referrer" />
  }
  return (
    <span className={cls} aria-hidden="true">
      {member.login.slice(0, 2)}
    </span>
  )
}

export function MemberLabel({ member }: { member: Member }) {
  return (
    <span className="row" style={{ gap: 6 }}>
      <Avatar member={member} />
      <span>{member.login}</span>
    </span>
  )
}

/** Shows a project with its color; a missing (deleted) project shows as "No project". */
export function ProjectChip({ project }: { project: Project | undefined }) {
  const { t } = useTranslation()
  return (
    <span className={`project-chip${project ? '' : ' faint'}`}>
      <span className="dot" style={{ background: project?.color }} />
      <span>{project ? project.name : t('common.noProject')}</span>
    </span>
  )
}
