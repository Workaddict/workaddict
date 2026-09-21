import { describe, expect, it } from 'vitest'
import { accessFor, can, effectiveRole, parseRoles, type Action } from './permissions'
import type { Access, Role } from './types'

const matrix: [Action, Record<Role, boolean>][] = [
  ['editOthersEntries', { worker: false, editor: true, leader: true }],
  ['manageWorkspace', { worker: false, editor: true, leader: true }],
  ['import', { worker: false, editor: false, leader: true }],
  ['reassignEntries', { worker: false, editor: false, leader: true }],
  ['viewLiveActivity', { worker: false, editor: true, leader: true }],
  ['stopOthersTimer', { worker: false, editor: true, leader: true }],
  ['assignRoles', { worker: false, editor: false, leader: false }],
]

describe('permission matrix', () => {
  for (const [action, byRole] of matrix) {
    for (const [role, allowed] of Object.entries(byRole) as [Role, boolean][]) {
      it(`${role} ${allowed ? 'may' : 'may not'} ${action}`, () => {
        const access: Access = { login: 'x', role, owner: false }
        expect(can(access, action)).toBe(allowed)
      })
    }
  }

  it('lets owners do everything, including assigning roles', () => {
    const owner = accessFor('alice', {}, new Set(['alice']))
    expect(owner).toEqual({ login: 'alice', role: 'leader', owner: true })
    for (const [action] of matrix) expect(can(owner, action)).toBe(true)
  })
})

describe('effective role', () => {
  it('defaults to worker without assignment', () => {
    expect(effectiveRole('bob', {}, new Set())).toBe('worker')
  })

  it('uses the assigned role', () => {
    expect(effectiveRole('carol', { carol: 'editor' }, new Set())).toBe('editor')
  })

  it('keeps owners team leaders regardless of roles.json', () => {
    expect(effectiveRole('alice', { alice: 'worker' }, new Set(['alice']))).toBe('leader')
  })
})

describe('parseRoles', () => {
  it('drops unknown role values', () => {
    expect(parseRoles({ roles: { dave: 'admin', carol: 'editor' } })).toEqual({ carol: 'editor' })
  })

  it('treats missing or malformed files as empty', () => {
    expect(parseRoles(null)).toEqual({})
    expect(parseRoles({ roles: 'x' })).toEqual({})
    expect(parseRoles([])).toEqual({})
  })
})
