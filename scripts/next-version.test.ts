// @ts-expect-error plain ESM script without type declarations
import { bumpOf, nextVersion } from './next-version.mjs'

describe('bumpOf', () => {
  it('reads the bump from the commit type', () => {
    expect(bumpOf('feat: start page link')).toBe('minor')
    expect(bumpOf('feat(help): guided tour')).toBe('minor')
    expect(bumpOf('fix: compact entry buttons')).toBe('patch')
    expect(bumpOf('perf: faster week view')).toBe('patch')
    expect(bumpOf('chore(deps): bump actions/setup-node (#13)')).toBeNull()
    expect(bumpOf('docs: README')).toBeNull()
    expect(bumpOf('Merge pull request #12 from x/y')).toBeNull()
  })

  it('treats ! and BREAKING CHANGE as major', () => {
    expect(bumpOf('feat!: new storage layout')).toBe('major')
    expect(bumpOf('refactor(storage)!: drop v0 files')).toBe('major')
    expect(bumpOf('feat: x\n\nBREAKING CHANGE: old exports are gone')).toBe('major')
  })
})

describe('nextVersion', () => {
  it('applies the largest bump once', () => {
    expect(nextVersion('1.0.0', ['fix: a', 'feat: b', 'feat: c', 'chore: d'])).toBe('1.1.0')
    expect(nextVersion('1.1.0', ['fix: a', 'fix: b'])).toBe('1.1.1')
    expect(nextVersion('1.4.2', ['feat: a', 'fix!: b'])).toBe('2.0.0')
  })

  it('releases nothing for chores only', () => {
    expect(nextVersion('1.1.0', ['chore(deps): bump', 'docs: typo'])).toBeNull()
    expect(nextVersion('1.1.0', [])).toBeNull()
  })
})
