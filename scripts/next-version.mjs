// The next app version, from the conventional commits since the last v* tag.
// `feat` bumps the minor version, `fix` and `perf` the patch version, a `!` after the type or a
// `BREAKING CHANGE:` footer the major version; anything else (chore, docs, ci, ...) releases nothing.
// Run by deploy.yml: `node scripts/next-version.mjs >> "$GITHUB_OUTPUT"`.
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const HEADER = /^(\w+)(\([^)]*\))?(!)?:/

/** 'major', 'minor', 'patch' or null for one commit message. */
export function bumpOf(message) {
  const m = HEADER.exec(message)
  if ((m && m[3]) || /^BREAKING[ -]CHANGE:/m.test(message)) return 'major'
  if (!m) return null
  if (m[1] === 'feat') return 'minor'
  if (m[1] === 'fix' || m[1] === 'perf') return 'patch'
  return null
}

/** The version after `last` (e.g. '1.0.0') for these commit messages, or null if none releases. */
export function nextVersion(last, messages) {
  const bumps = new Set(messages.map(bumpOf))
  const [major, minor, patch] = last.split('.').map(Number)
  if (bumps.has('major')) return `${major + 1}.0.0`
  if (bumps.has('minor')) return `${major}.${minor + 1}.0`
  if (bumps.has('patch')) return `${major}.${minor}.${patch + 1}`
  return null
}

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' })
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const tag = git('describe', '--tags', '--abbrev=0', '--match', 'v[0-9]*').trim()
  const messages = git('log', `${tag}..HEAD`, '--format=%B%x00')
    .split('\0')
    .map((m) => m.trim())
    .filter(Boolean)
  const next = nextVersion(tag.slice(1), messages)
  console.log(`previous=${tag}`)
  console.log(`version=${next ?? tag.slice(1)}`)
  console.log(`release=${next !== null}`)
}
