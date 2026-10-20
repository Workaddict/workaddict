import type { Role } from '../../domain/types'

export interface TourStep {
  /** Text key under `help.tour.steps`. */
  text: string
  /** `data-tour` value of the highlighted element. */
  target: string
  /** Page the step is on; without one the step stays on the current page. */
  route?: string
  /** Only these roles see the step; everyone when not set. */
  roles?: Role[]
}

const TEAM: Role[] = ['editor', 'leader']

export const TOUR_STEPS: TourStep[] = [
  { text: 'timer', target: 'timer', route: '/' },
  { text: 'entries', target: 'entries', route: '/' },
  { text: 'filter', target: 'filter', route: '/', roles: TEAM },
  { text: 'teamNow', target: 'team-now', route: '/', roles: TEAM },
  { text: 'workGroups', target: 'work-groups', route: '/groups' },
  { text: 'stats', target: 'stats', route: '/stats' },
  { text: 'export', target: 'export', route: '/stats' },
  { text: 'workspace', target: 'workspace' },
  { text: 'menu', target: 'menu' },
  { text: 'roles', target: 'roles', route: '/settings', roles: ['leader'] },
  { text: 'help', target: 'help-guide', route: '/settings' },
]

export function stepsFor(role: Role): TourStep[] {
  return TOUR_STEPS.filter((s) => !s.roles || s.roles.includes(role))
}

/** The first rendered, visible element for a step, if any. */
export function findTarget(target: string): HTMLElement | null {
  const all = document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`)
  for (const el of all) {
    // `checkVisibility` skips elements hidden by CSS (e.g. desktop-only controls on phones).
    if (typeof el.checkVisibility !== 'function' || el.checkVisibility()) return el
  }
  return null
}
