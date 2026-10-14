import { describe, expect, it } from 'vitest'
import { cleanRepos, isIssueRef, issueUrl, parseIssueInput, parseRepoInput } from './issueRef'

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

  it('resolves the short form through one linked repository', () => {
    expect(parseIssueInput('#42', one)).toEqual({ ok: true, ref: 'acme/web#42' })
    expect(parseIssueInput('42', one)).toEqual({ ok: true, ref: 'acme/web#42' })
  })

  it('refuses the short form without exactly one linked repository', () => {
    expect(parseIssueInput('#42', two)).toEqual({ ok: false, reason: 'ambiguousRepo' })
    expect(parseIssueInput('#42', { repos: [] })).toEqual({ ok: false, reason: 'ambiguousRepo' })
    expect(parseIssueInput('#42', null)).toEqual({ ok: false, reason: 'ambiguousRepo' })
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
