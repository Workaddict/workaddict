import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Avatar } from '../../components/bits'
import { useToast } from '../../components/Toasts'
import { ROLES, type Role } from '../../domain/types'
import { useI18n } from '../../i18n'
import { useSessionData } from '../auth/AuthContext'
import { useAccess, useSetRole, useTeamRoles } from '../data/hooks'
import { useErrorToast } from '../data/useErrorText'

export const TEAM_SECTION_ID = 'team'

export function RoleBadge({ role, owner }: { role: Role; owner?: boolean }) {
  const { t } = useI18n()
  return (
    <span className={`chip role-chip role-${role}`}>
      {owner ? `${t('roles.owner')} · ` : ''}
      {t(`roles.${role}`)}
    </span>
  )
}

/** Members with their roles; owners can change the role of every non-owner member. */
export function TeamRolesSection() {
  const { t } = useI18n()
  const { adapter } = useSessionData()
  const access = useAccess()
  const team = useTeamRoles()
  const toast = useToast()
  const onError = useErrorToast()
  const setRole = useSetRole({ onSuccess: () => toast.info(t('roles.saved')), onError })
  const canAssign = access.can('assignRoles') && !adapter.readOnly
  const ref = useRef<HTMLElement>(null)
  const scrollTo = (useLocation().state as { scrollTo?: string } | null)?.scrollTo

  useEffect(() => {
    if (scrollTo === TEAM_SECTION_ID) ref.current?.scrollIntoView({ block: 'start' })
  }, [scrollTo])

  return (
    <section className="section" id={TEAM_SECTION_ID} ref={ref}>
      <h2>{t('roles.title')}</h2>
      <div className="card settings-list">
        {(team.data?.members ?? []).map((m) => (
          <div className="settings-row" key={m.login}>
            <span className="row">
              <Avatar member={m} />
              <strong>{m.login}</strong>
            </span>
            {canAssign && !m.owner ? (
              <select
                className="select"
                aria-label={t('roles.roleOf', { login: m.login })}
                value={m.role}
                disabled={setRole.isPending}
                onChange={(e) => setRole.mutate({ login: m.login, role: e.target.value as Role })}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {t(`roles.${r}`)}
                  </option>
                ))}
              </select>
            ) : (
              <RoleBadge role={m.role} owner={m.owner} />
            )}
          </div>
        ))}
        <div className="settings-row">
          <span className="muted small">
            {canAssign ? t('roles.ownerHint') : t('roles.readOnlyHint')} {t('roles.matrix')}
          </span>
        </div>
        <div className="settings-row">
          <span className="muted small">{t('roles.enforcement')}</span>
        </div>
      </div>
    </section>
  )
}
