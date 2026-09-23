import { afterEach, describe, expect, it, vi } from 'vitest'
import i18n from '../../i18n'
import { ghCommands, githubLinks, inviteLink } from './githubLinks'
import { inviteMessage, ownerMessage } from './messages'
import { isLogin, isRepoName, joinTarget, parseUsernames } from './names'
import { emptySetup, loadSetup, saveSetup, SETUP_STEPS, stepsFor } from './setupState'

const t = i18n.getFixedT('en')

describe('names', () => {
  it.each(['my-team', 'a', 'Team-Wels', 'x1-y2', 'a'.repeat(39)])('accepts login %s', (v) => {
    expect(isLogin(v)).toBe(true)
  })

  it.each(['', '-team', 'team-', 'my--team', 'my team', 'a;b', '$(x)', 'a'.repeat(40), 'ä'])(
    'rejects login %s',
    (v) => expect(isLogin(v)).toBe(false),
  )

  it('checks repository names', () => {
    expect(isRepoName('time-data')).toBe(true)
    expect(isRepoName('time_data.v2')).toBe(true)
    expect(isRepoName('.')).toBe(false)
    expect(isRepoName('time data')).toBe(false)
    expect(isRepoName('a/b')).toBe(false)
  })

  it('splits usernames and keeps shell metacharacters out', () => {
    expect(parseUsernames('anna, ben\n@carla  anna')).toEqual({
      valid: ['anna', 'ben', 'carla'],
      invalid: [],
    })
    expect(parseUsernames('anna; rm -rf ~')).toEqual({
      valid: ['rm'],
      invalid: ['anna;', '-rf', '~'],
    })
    expect(parseUsernames('$(whoami) `id` "x"').valid).toEqual([])
  })

  it('reads the repository of an invite link', () => {
    expect(joinTarget('my-team/time-data')).toEqual({ owner: 'my-team', repo: 'time-data' })
    expect(joinTarget('not a repo')).toBeNull()
    expect(joinTarget('my--team/x')).toBeNull()
    expect(joinTarget(null)).toBeNull()
  })
})

describe('githubLinks', () => {
  it('prefills the new repository form', () => {
    const url = new URL(githubLinks.newRepo('my-team', 'time-data'))
    expect(url.origin + url.pathname).toBe('https://github.com/new')
    expect(url.searchParams.get('owner')).toBe('my-team')
    expect(url.searchParams.get('name')).toBe('time-data')
    expect(url.searchParams.get('visibility')).toBe('private')
  })

  it('only passes the parameters GitHub actually applies', () => {
    // Checked against GitHub on 2026-09-23: the form applies `name` and `description` and ignores
    // `target_name`, `expires_in` and `contents`. Sending them would promise a prefill that the
    // page does not deliver, so the checklist walks the user through those fields instead.
    const url = new URL(githubLinks.newToken())
    expect(url.pathname).toBe('/settings/personal-access-tokens/new')
    expect(Object.fromEntries(url.searchParams)).toEqual({
      name: 'Workaddict',
      description: 'Time tracking with Workaddict',
    })
    expect(url.searchParams.has('target_name')).toBe(false)
  })

  it('builds the organization pages', () => {
    expect(githubLinks.pendingTokens('my-team')).toBe(
      'https://github.com/organizations/my-team/settings/personal-access-token-requests',
    )
    expect(githubLinks.memberPrivileges('my-team')).toBe(
      'https://github.com/organizations/my-team/settings/member_privileges',
    )
    expect(githubLinks.tokenPolicy('my-team')).toBe(
      'https://github.com/organizations/my-team/settings/personal-access-tokens',
    )
    expect(githubLinks.orgInvitation('my-team')).toBe('https://github.com/orgs/my-team/invitation')
    expect(githubLinks.people('my-team')).toBe('https://github.com/orgs/my-team/people')
    expect(githubLinks.repoAccess('my-team', 'time-data')).toBe(
      'https://github.com/my-team/time-data/settings/access',
    )
  })

  it('encodes names in paths', () => {
    expect(githubLinks.repo('a b', 'c/d')).toBe('https://github.com/a%20b/c%2Fd')
  })

  it('builds the invite link from the current page', () => {
    expect(inviteLink('my-team', 'time-data', 'https://workaddict.me/#/settings')).toBe(
      'https://workaddict.me/#/join?repo=my-team/time-data',
    )
    expect(inviteLink('my-team', 'time-data', 'https://x.github.io/app/')).toBe(
      'https://x.github.io/app/#/join?repo=my-team/time-data',
    )
  })
})

describe('ghCommands', () => {
  it('sets everything up on first use', () => {
    expect(ghCommands('my-team', ['anna', 'ben'], { repo: 'time-data' })).toEqual([
      'gh auth refresh -h github.com -s admin:org',
      'gh repo create my-team/time-data --private',
      'gh api -X PATCH orgs/my-team -f default_repository_permission=write',
      'gh api -X PUT orgs/my-team/memberships/anna -f role=member',
      'gh api -X PUT orgs/my-team/memberships/ben -f role=member',
    ])
  })

  it('only invites members later on', () => {
    expect(ghCommands('my-team', ['anna'])).toEqual([
      'gh auth refresh -h github.com -s admin:org',
      'gh api -X PUT orgs/my-team/memberships/anna -f role=member',
    ])
  })

  it('produces lines without shell quoting, so they work in Bash and PowerShell', () => {
    const lines = ghCommands('my-team', parseUsernames('anna, $(x), ben').valid, {
      repo: 'time-data',
    })
    for (const line of lines) expect(line).toMatch(/^[\w .:/=-]+$/)
  })
})

describe('ownerMessage', () => {
  const base = { owner: 'my-team', repo: 'time-data', memberLogin: 'anna' } as const

  it('lists membership, write access and approval for an organization repo', () => {
    const text = ownerMessage(t, {
      ...base,
      ownerType: 'Organization',
      problem: 'noAccess',
      fineGrained: true,
    })
    expect(text).toContain('cannot access the repository my-team/time-data')
    expect(text).toContain('My GitHub username: anna')
    expect(text).toContain('https://github.com/orgs/my-team/people')
    expect(text).toContain('https://github.com/my-team/time-data/settings/access')
    expect(text).toContain(
      'https://github.com/organizations/my-team/settings/personal-access-token-requests',
    )
    // A token made for the member's own account gives the same 404 as a missing invitation, so
    // the message has to name that case; otherwise the owner checks three correct things and the
    // member is still locked out.
    expect(text).toContain('my-team as its resource owner')
  })

  it('leaves out the resource-owner hint where it cannot apply', () => {
    const classic = ownerMessage(t, {
      ...base,
      ownerType: 'Organization',
      problem: 'noAccess',
      fineGrained: false,
    })
    expect(classic).not.toContain('resource owner')

    const readOnly = ownerMessage(t, {
      ...base,
      ownerType: 'Organization',
      problem: 'readOnly',
      fineGrained: true,
    })
    expect(readOnly).not.toContain('resource owner')
  })

  it('leaves out approval for classic tokens and unknown members', () => {
    const text = ownerMessage(t, {
      owner: 'my-team',
      repo: 'time-data',
      ownerType: 'Organization',
      problem: 'noAccess',
      fineGrained: false,
    })
    expect(text).not.toContain('personal-access-token-requests')
    expect(text).not.toContain('username')
  })

  it('asks for write access when the member can only read', () => {
    const text = ownerMessage(t, {
      ...base,
      ownerType: 'Organization',
      problem: 'readOnly',
      fineGrained: true,
    })
    expect(text).toContain('can only read the repository my-team/time-data')
    expect(text).toContain('Write access')
    expect(text).not.toContain('personal-access-token-requests')
  })

  it('asks for a collaborator invitation for a personal repo', () => {
    const text = ownerMessage(t, {
      ...base,
      owner: 'ben',
      ownerType: 'User',
      problem: 'noAccess',
      fineGrained: false,
    })
    expect(text).toContain('collaborator with Write access to ben/time-data')
    expect(text).not.toContain('/orgs/')
  })
})

describe('inviteMessage', () => {
  const m = { link: 'https://app/#/join?repo=my-team/time-data', org: 'my-team', repo: 'time-data' }

  it('says to accept the invitation first and links the join flow', () => {
    const text = inviteMessage(t, { ...m, approvalRequired: false })
    expect(text.indexOf('orgs/my-team/invitation')).toBeLessThan(text.indexOf(m.link))
    expect(text).not.toMatch(/approve/)
  })

  it('mentions approval only when the owner kept it on', () => {
    expect(inviteMessage(t, { ...m, approvalRequired: true })).toMatch(/approve/)
  })

  it('is translated', () => {
    expect(inviteMessage(i18n.getFixedT('de'), { ...m, approvalRequired: true })).toMatch(
      /freigeben/,
    )
  })
})

describe('setup state', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('round-trips through storage', () => {
    const s = {
      mode: 'team' as const,
      org: 'my-team',
      repo: 'data',
      done: ['org', 'repo'] as const,
      approval: 'on' as const,
    }
    saveSetup({ ...s, done: [...s.done] })
    expect(loadSetup()).toEqual({ ...s, done: ['org', 'repo'] })
  })

  it('ignores broken or foreign values', () => {
    localStorage.setItem('workaddict.setup', '{"org":5,"done":["x","org"],"approval":"maybe"}')
    expect(loadSetup()).toEqual({ ...emptySetup(), done: ['org'] })
    localStorage.setItem('workaddict.setup', 'not json')
    expect(loadSetup()).toEqual(emptySetup())
  })

  it('treats progress saved before solo mode existed as a team setup', () => {
    localStorage.setItem('workaddict.setup', '{"org":"my-team","repo":"data","done":["org"]}')
    expect(loadSetup().mode).toBe('team')
    // Without a name there is nothing to infer from, so the wizard asks again.
    localStorage.setItem('workaddict.setup', '{"org":"","repo":"data","done":[]}')
    expect(loadSetup().mode).toBeNull()
  })

  it('counts only the steps of the chosen mode', () => {
    expect(stepsFor('solo')).toEqual(['repo', 'token'])
    expect(stepsFor('team')).toEqual(SETUP_STEPS)
  })

  it('works when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(loadSetup()).toEqual(emptySetup())
    expect(() => saveSetup(emptySetup())).not.toThrow()
  })
})
