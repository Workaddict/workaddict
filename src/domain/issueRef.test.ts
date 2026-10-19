import { describe, expect, it } from 'vitest'
import {
  boardUrl,
  cleanRepos,
  isBoardRef,
  isIssueRef,
  issueUrl,
  parseBoardInput,
  parseIssueInput,
  parseRepoInput,
  reposOf,
} from './issueRef'

const one = { repos: ['acme/web'] }
const two = { repos: ['acme/web', 'acme/api'] }

describe('parseIssueInput', () => {
  it.each([
    ['acme/web#42', 'acme/web#42'],
    ['  acme/web#42  ', 'acme/web#42'],
    ['https://github.com/acme/web/issues/42', 'acme/web#42'],
    ['https://github.com/acme/web/pull/17#discussion_r1', 'acme/web#17'],
    ['https://www.github.com/acme/web/issues/42?x=1', 'acme/web#42'],
    ['http://github.com/my-org/my.repo_x/issues/7/', 'my-org/my.repo_x#7'],
  ])('normalizes %s', (input, ref) => {
    expect(parseIssueInput(input, null)).toEqual({ ok: true, ref })
  })

  it('treats empty input as no link', () => {
    expect(parseIssueInput('  ', one)).toEqual({ ok: true, ref: null })
  })

  it('resolves the short form through the first linked repository', () => {
    expect(parseIssueInput('#42', one)).toEqual({ ok: true, ref: 'acme/web#42' })
    expect(parseIssueInput('42', one)).toEqual({ ok: true, ref: 'acme/web#42' })
    expect(parseIssueInput('#42', two)).toEqual({ ok: true, ref: 'acme/web#42' })
  })

  it('refuses the short form without a linked repository', () => {
    expect(parseIssueInput('#42', { repos: [] })).toEqual({ ok: false, reason: 'noRepo' })
    expect(parseIssueInput('#42', null)).toEqual({ ok: false, reason: 'noRepo' })
  })

  it('resolves repo#42 through the linked repository of that name', () => {
    expect(parseIssueInput('api#7', two)).toEqual({ ok: true, ref: 'acme/api#7' })
    expect(parseIssueInput('API#7', two)).toEqual({ ok: true, ref: 'acme/api#7' })
    expect(parseIssueInput('docs#7', two)).toEqual({ ok: false, reason: 'unknownRepo' })
    expect(parseIssueInput('api#7', null)).toEqual({ ok: false, reason: 'noRepo' })
    expect(parseIssueInput('web#7', { repos: ['acme/web', 'other/web'] })).toEqual({
      ok: false,
      reason: 'ambiguousRepo',
    })
  })

  it('reads the issue from a board card link', () => {
    const card =
      'https://github.com/orgs/Team-Wels/projects/1/views/1?pane=issue&itemId=256793971&issue=Team-Wels%7CTeam-Wels-ITPProjekt%7C104'
    expect(parseIssueInput(card, null)).toEqual({
      ok: true,
      ref: 'Team-Wels/Team-Wels-ITPProjekt#104',
    })
    expect(
      parseIssueInput('https://github.com/users/alice/projects/2?issue=alice|notes|7', null),
    ).toEqual({
      ok: true,
      ref: 'alice/notes#7',
    })
  })

  it('refuses a board link without a card', () => {
    const board = { repos: [], board: 'orgs/acme/projects/3' }
    expect(parseIssueInput('https://github.com/orgs/acme/projects/3', board)).toEqual({
      ok: false,
      reason: 'boardLink',
    })
    expect(
      parseIssueInput('https://github.com/orgs/acme/projects/3?pane=issue&itemId=9', null),
    ).toEqual({ ok: false, reason: 'boardLink' })
  })

  it('resolves the short form through used repositories after linked ones', () => {
    expect(parseIssueInput('#42', { repos: [] }, ['acme/api', 'acme/web'])).toEqual({
      ok: true,
      ref: 'acme/api#42',
    })
    expect(parseIssueInput('#42', one, ['acme/api'])).toEqual({ ok: true, ref: 'acme/web#42' })
    expect(parseIssueInput('api#7', one, ['acme/api'])).toEqual({ ok: true, ref: 'acme/api#7' })
    expect(parseIssueInput('ACME/WEB', one, ['acme/web'])).toEqual({ ok: false, reason: 'format' })
  })

  it('asks for a card link when a board has no known repository', () => {
    const board = { board: 'orgs/acme/projects/3' }
    expect(parseIssueInput('#42', board)).toEqual({ ok: false, reason: 'boardNoRepo' })
    expect(parseIssueInput('api#42', board)).toEqual({ ok: false, reason: 'boardNoRepo' })
    expect(parseIssueInput('#42', board, ['acme/api'])).toEqual({ ok: true, ref: 'acme/api#42' })
  })

  it.each([
    'fix login',
    'acme/web#042',
    'acme/web#0',
    'acme/web',
    'acme/../#1',
    'javascript:alert(1)',
    'https://gitlab.com/acme/web/issues/1',
    'https://github.com/acme/web/commit/abc',
    'ac me/web#1',
    '#0',
  ])('rejects %s', (input) => {
    expect(parseIssueInput(input, one)).toEqual({ ok: false, reason: 'format' })
  })
})

describe('isIssueRef / issueUrl', () => {
  it('accepts only the stored format', () => {
    expect(isIssueRef('acme/web#42')).toBe(true)
    expect(isIssueRef('acme/..#42')).toBe(false)
    expect(isIssueRef('javascript:alert(1)')).toBe(false)
    expect(isIssueRef(42)).toBe(false)
  })

  it('links to the issue page', () => {
    expect(issueUrl('acme/web#42')).toBe('https://github.com/acme/web/issues/42')
  })
})

describe('boards', () => {
  it.each([
    ['https://github.com/orgs/Team-Wels/projects/1', 'orgs/Team-Wels/projects/1'],
    [
      'https://github.com/orgs/Team-Wels/projects/1/views/2?pane=issue',
      'orgs/Team-Wels/projects/1',
    ],
    ['  https://github.com/Users/alice/projects/12  ', 'users/alice/projects/12'],
  ])('normalizes %s', (input, ref) => {
    expect(parseBoardInput(input)).toBe(ref)
    expect(isBoardRef(ref)).toBe(true)
  })

  it.each([
    'https://github.com/acme/web',
    'orgs/acme/projects/1',
    'https://github.com/orgs/acme/projects/0',
  ])('rejects %s', (input) => expect(parseBoardInput(input)).toBeNull())

  it('is not taken for a repository', () => {
    expect(parseRepoInput('https://github.com/orgs/acme/projects/1')).toBeNull()
  })

  it('links to the board', () => {
    expect(boardUrl('orgs/acme/projects/3')).toBe('https://github.com/orgs/acme/projects/3')
    expect(isBoardRef('orgs/acme/projects/3/views/1')).toBe(false)
  })

  it('collects repositories of issue links in order', () => {
    expect(reposOf(['acme/api#1', undefined, 'bad', 'Acme/API#2', 'acme/web#3'])).toEqual([
      'acme/api',
      'acme/web',
    ])
  })
})

describe('parseRepoInput / cleanRepos', () => {
  it.each([
    ['acme/web', 'acme/web'],
    ['https://github.com/acme/web', 'acme/web'],
    ['https://github.com/acme/web.git', 'acme/web'],
    ['https://github.com/acme/web/tree/main', 'acme/web'],
    ['git@github.com:acme/web.git', 'acme/web'],
  ])('normalizes %s', (input, repo) => {
    expect(parseRepoInput(input)).toBe(repo)
  })

  it.each(['acme', 'acme/web#1', 'https://gitlab.com/acme/web', 'acme/..'])(
    'rejects %s',
    (input) => {
      expect(parseRepoInput(input)).toBeNull()
    },
  )

  it('drops invalid entries and case-insensitive duplicates, at most 20', () => {
    expect(cleanRepos(['acme/web', 'Acme/Web', 'bad', 3, 'acme/api'])).toEqual([
      'acme/web',
      'acme/api',
    ])
    expect(cleanRepos(Array.from({ length: 25 }, (_, i) => `acme/r${i}`))).toHaveLength(20)
    expect(cleanRepos('acme/web')).toEqual([])
  })
})
