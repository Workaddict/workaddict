import { ROLES, type Access, type Role } from './types'

export type Action =
  | 'editOthersEntries'
  | 'manageWorkspace'
  | 'import'
  | 'reassignEntries'
  | 'viewLiveActivity'
  | 'stopOthersTimer'
  | 'assignRoles'

const RANK: Record<Role, number> = { worker: 0, editor: 1, leader: 2 }

const MIN_ROLE: Record<Exclude<Action, 'assignRoles'>, Role> = {
  editOthersEntries: 'editor',
  manageWorkspace: 'editor',
  import: 'leader',
  reassignEntries: 'leader',
  viewLiveActivity: 'editor',
  stopOthersTimer: 'editor',
}

export function isRole(value: unknown): value is Role {
  return (ROLES as readonly unknown[]).includes(value)
}

/** Reads `roles.json` content defensively: unknown values are dropped (→ worker). */
export function parseRoles(raw: unknown): Record<string, Role> {
  const roles: Record<string, Role> = {}
  const map = (raw as { roles?: unknown } | null)?.roles
  if (!map || typeof map !== 'object') return roles
  for (const [login, role] of Object.entries(map)) {
    if (isRole(role)) roles[login] = role
  }
  return roles
}

export function effectiveRole(login: string, roles: Record<string, Role>, owners: ReadonlySet<string>): Role {
  if (owners.has(login)) return 'leader'
  return roles[login] ?? 'worker'
}

export function accessFor(login: string, roles: Record<string, Role>, owners: ReadonlySet<string>): Access {
  return { login, role: effectiveRole(login, roles, owners), owner: owners.has(login) }
}

/** Whether `access` allows `action`. Assigning roles is reserved for owners, not a role. */
export function can(access: Access, action: Action): boolean {
  if (action === 'assignRoles') return access.owner
  return RANK[access.role] >= RANK[MIN_ROLE[action]]
}
