import { useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Spinner } from '../../components/bits'
import { Modal } from '../../components/Modal'
import { formatHM } from '../../domain/time'
import { useI18n } from '../../i18n'
import { useSessionData } from '../auth/AuthContext'
import { keys, useMembers } from '../data/hooks'
import { useErrorText } from '../data/useErrorText'
import { isStorageError } from '../../storage'
import {
  CLOCKIFY_REGIONS,
  ClockifyClient,
  isClockifyError,
  type ClockifyRegion,
  type ClockifyUser,
  type ClockifyWorkspace,
} from './clockify/client'
import { ClockifyFetcher } from './clockify/fetcher'
import { convertClockify, formerMemberLogins, type ConvertResult, type UserMapping } from './convert'

const NO_USERS: ClockifyUser[] = []

type Step = 'key' | 'workspace' | 'meta' | 'map' | 'fetch' | 'preview' | 'write' | 'done'

/** Pre-selects a team login when the Clockify name or email local part matches it. */
function suggestMapping(users: ClockifyUser[], logins: string[]): Record<string, UserMapping> {
  const byLower = new Map(logins.map((l) => [l.toLowerCase(), l]))
  const taken = new Set<string>()
  const mapping: Record<string, UserMapping> = {}
  for (const u of users) {
    const candidates = [u.name, u.email?.split('@')[0] ?? ''].map((s) => s.trim().toLowerCase())
    const login = candidates.map((c) => byLower.get(c)).find((l) => l && !taken.has(l))
    if (login) {
      taken.add(login)
      mapping[u.id] = { kind: 'login', login }
    } else {
      mapping[u.id] = { kind: 'former' }
    }
  }
  return mapping
}

function encodeMapping(m: UserMapping | undefined): string {
  if (!m || m.kind === 'skip') return 'skip'
  return m.kind === 'former' ? 'former' : `login:${m.login}`
}

function decodeMapping(v: string): UserMapping {
  if (v.startsWith('login:')) return { kind: 'login', login: v.slice('login:'.length) }
  return v === 'former' ? { kind: 'former' } : { kind: 'skip' }
}

/**
 * One-time Clockify import. The API key lives only in this component's state (and the client
 * built from it) and is gone when the wizard closes.
 */
export default function ImportWizard({ onClose }: { onClose: () => void }) {
  const { t, locale } = useI18n()
  const { adapter } = useSessionData()
  const members = useMembers().data ?? []
  const qc = useQueryClient()
  const storageErrorText = useErrorText()

  const [step, setStep] = useState<Step>('key')
  const [apiKey, setApiKey] = useState('')
  const [region, setRegion] = useState<ClockifyRegion>('global')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paused, setPaused] = useState<Date | null | undefined>(undefined)
  const [workspaces, setWorkspaces] = useState<ClockifyWorkspace[]>([])
  const [workspaceId, setWorkspaceId] = useState('')
  const [mapping, setMapping] = useState<Record<string, UserMapping>>({})
  const [result, setResult] = useState<ConvertResult | null>(null)
  /** Data already in the repository (replaced by the import); null while unknown. */
  const [existing, setExisting] = useState<{ entries: number; projects: number; tags: number } | null>(
    null,
  )
  const [replaceConfirmed, setReplaceConfirmed] = useState(false)
  const [, setTick] = useState(0)
  // Held in state (mutated in place, re-rendered via `tick`) so render can read their progress.
  const [client, setClient] = useState<ClockifyClient | null>(null)
  const [fetcher, setFetcher] = useState<ClockifyFetcher | null>(null)

  const clockifyErrorText = (e: unknown): string => {
    if (!isClockifyError(e)) return t('import.errors.unknown')
    if (e.kind === 'rateLimit') {
      return e.resetAt
        ? t('import.errors.rateLimit', { time: format(e.resetAt, 'p', { locale }) })
        : t('import.pausedUnknown')
    }
    return t(`import.errors.${e.kind}`)
  }

  // ---- key → workspace -----------------------------------------------------

  const checkKey = async (e: FormEvent) => {
    e.preventDefault()
    if (!apiKey.trim()) return
    setBusy(true)
    setError(null)
    const c = new ClockifyClient({ apiKey, region })
    try {
      const [user, list] = await Promise.all([c.getUser(), c.listWorkspaces()])
      if (list.length === 0) {
        setError(t('import.errors.noWorkspace'))
        return
      }
      setClient(c)
      setWorkspaces(list)
      const preferred = list.find((w) => w.id === user.activeWorkspace) ?? list[0]!
      setWorkspaceId(preferred.id)
      if (list.length === 1) void loadMeta(preferred.id, c)
      else setStep('workspace')
    } catch (err) {
      setError(clockifyErrorText(err))
    } finally {
      setBusy(false)
    }
  }

  // ---- fetching (metadata and entries share the pause/continue logic) ------

  const runFetcher = async (f: ClockifyFetcher): Promise<boolean> => {
    setBusy(true)
    setError(null)
    setPaused(undefined)
    try {
      await f.run(() => setTick((n) => n + 1))
      return true
    } catch (err) {
      if (isClockifyError(err, 'rateLimit')) setPaused(err.resetAt ?? null)
      else setError(clockifyErrorText(err))
      return false
    } finally {
      setBusy(false)
    }
  }

  const loadMeta = async (wsId: string, c = client!) => {
    const f = fetcher ?? new ClockifyFetcher(c, wsId)
    setFetcher(f)
    setStep('meta')
    if (await runFetcher(f)) {
      const team = await qc.ensureQueryData({
        queryKey: keys.members,
        queryFn: () => adapter.listMembers(),
      })
      setMapping(
        suggestMapping(
          f.users.items,
          team.map((m) => m.login),
        ),
      )
      setStep('map')
    }
  }

  const loadExisting = async () => {
    try {
      const [entries, ws] = await Promise.all([adapter.listAllEntries(), adapter.getWorkspace()])
      setExisting({ entries: entries.length, projects: ws.projects.length, tags: ws.tags.length })
    } catch (err) {
      setError(storageErrorText(err))
    }
  }

  const toPreview = (f = fetcher!) => {
    setError(null)
    setResult(convertClockify(f.result(), mapping, new Date()))
    setStep('preview')
    void loadExisting()
  }

  const hasExisting =
    existing !== null && existing.entries + existing.projects + existing.tags > 0

  const loadEntries = async () => {
    const f = fetcher!
    f.selectUsers(f.users.items.filter((u) => mapping[u.id]?.kind !== 'skip').map((u) => u.id))
    setStep('fetch')
    if ((await runFetcher(f)) && f.result().noAccess.length === 0) toPreview()
  }

  const resume = () => {
    if (step === 'meta') void loadMeta(workspaceId)
    else void loadEntries()
  }

  // ---- write -----------------------------------------------------------------

  const write = async () => {
    if (!result) return
    setStep('write')
    setError(null)
    const ws = workspaces.find((w) => w.id === workspaceId)?.name ?? ''
    const memberCount = Object.keys(result.report.byLogin).length
    try {
      await adapter.importData(
        { workspace: result.workspace, entries: result.entries },
        `Clockify workspace "${ws}" – ${result.entries.length} entries, ${memberCount} members`,
        { overwrite: hasExisting && replaceConfirmed },
      )
      await qc.invalidateQueries()
      setStep('done')
    } catch (err) {
      setError(storageErrorText(err))
      setStep('preview')
      // Data may have appeared meanwhile: refresh so the replace warning shows up.
      if (isStorageError(err, 'notEmpty')) void loadExisting()
    }
  }

  // ---- mapping validation ------------------------------------------------------

  const users = fetcher?.users.items ?? NO_USERS
  const duplicates = useMemo(() => {
    const counts = new Map<string, number>()
    for (const m of Object.values(mapping)) {
      if (m.kind === 'login') counts.set(m.login, (counts.get(m.login) ?? 0) + 1)
    }
    return new Set([...counts].filter(([, n]) => n > 1).map(([l]) => l))
  }, [mapping])
  // Same numbering as convertClockify(): only users kept as former members are counted.
  const formerLogins = useMemo(
    () => formerMemberLogins(users.filter((u) => mapping[u.id]?.kind === 'former')),
    [users, mapping],
  )
  const anySelected = users.some((u) => (mapping[u.id]?.kind ?? 'skip') !== 'skip')

  // ---- render ------------------------------------------------------------------

  const requestCounter = client && (
    <p className="muted small">
      {t('import.requests', { count: client.requestCount })} · {t('import.requestsNote')}
    </p>
  )

  const pauseBanner =
    paused !== undefined ? (
      <div className="banner banner-warning row wrap">
        <span className="spacer">
          {paused
            ? t('import.paused', { time: format(paused, 'p', { locale }) })
            : t('import.pausedUnknown')}
        </span>
        <button className="btn btn-sm" onClick={resume} disabled={busy}>
          {t('import.resume')}
        </button>
      </div>
    ) : null

  const errorBanner = error && (
    <div className="banner banner-error" role="alert">
      {error}
    </div>
  )

  const cancelButton = (
    <button className="btn" onClick={onClose} disabled={step === 'write'}>
      {step === 'done' ? t('common.close') : t('common.cancel')}
    </button>
  )

  let body: ReactNode
  switch (step) {
    case 'key':
      body = (
        <form className="stack" onSubmit={checkKey}>
          <p className="muted">{t('import.keyIntro')}</p>
          <label className="field">
            <span>{t('import.keyLabel')}</span>
            <input
              className="input"
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              aria-invalid={error ? true : undefined}
            />
          </label>
          <label className="field">
            <span>{t('import.region')}</span>
            <select
              className="select"
              value={region}
              onChange={(e) => setRegion(e.target.value as ClockifyRegion)}
            >
              {CLOCKIFY_REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {t(`import.regions.${r.id}`)}
                </option>
              ))}
            </select>
          </label>
          <p className="muted small">{t('import.keyNote')}</p>
          {errorBanner}
          <div className="modal-actions">
            {cancelButton}
            <button className="btn btn-primary" type="submit" disabled={busy || !apiKey.trim()}>
              {busy ? t('import.checking') : t('import.next')}
            </button>
          </div>
        </form>
      )
      break

    case 'workspace':
      body = (
        <div className="stack">
          <p className="muted">{t('import.workspaceIntro')}</p>
          <label className="field">
            <span>{t('import.workspace')}</span>
            <select
              className="select"
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
          <div className="modal-actions">
            {cancelButton}
            <button className="btn btn-primary" onClick={() => void loadMeta(workspaceId)}>
              {t('import.next')}
            </button>
          </div>
        </div>
      )
      break

    case 'meta':
      body = (
        <div className="stack">
          {busy && <Spinner label={t('import.loadingMeta')} />}
          {pauseBanner}
          {errorBanner}
          {error && (
            <button className="btn" onClick={resume}>
              {t('common.retry')}
            </button>
          )}
          {requestCounter}
          <div className="modal-actions">{cancelButton}</div>
        </div>
      )
      break

    case 'map':
      body = (
        <div className="stack">
          <p className="muted">{t('import.mapIntro')}</p>
          <div>
            <div className="import-map-row">
              <span className="label">{t('import.mapUser')}</span>
              <span className="label">{t('import.mapTarget')}</span>
            </div>
            {users.map((u) => {
              const m = mapping[u.id]
              const dup = m?.kind === 'login' && duplicates.has(m.login)
              return (
                <label key={u.id} className="import-map-row">
                  <span>
                    <strong>{u.name}</strong>{' '}
                    {u.status && u.status !== 'ACTIVE' && (
                      <span className="faint small">({t('import.deactivated')})</span>
                    )}
                    <br />
                    <span className="muted small">{u.email}</span>
                  </span>
                  <select
                    className="select"
                    aria-invalid={dup || undefined}
                    style={dup ? { borderColor: 'var(--danger)' } : undefined}
                    value={encodeMapping(m)}
                    onChange={(e) =>
                      setMapping((prev) => ({ ...prev, [u.id]: decodeMapping(e.target.value) }))
                    }
                  >
                    {members.map((mem) => (
                      <option key={mem.login} value={`login:${mem.login}`}>
                        {mem.login}
                      </option>
                    ))}
                    <option value="former">
                      {t('import.former', {
                        login: formerLogins.get(u.id) ?? formerMemberLogins([u]).get(u.id),
                      })}
                    </option>
                    <option value="skip">{t('import.skip')}</option>
                  </select>
                </label>
              )
            })}
          </div>
          {duplicates.size > 0 && (
            <div className="banner banner-error" role="alert">
              {t('import.duplicateLogin')}
            </div>
          )}
          {!anySelected && <p className="muted small">{t('import.nothingSelected')}</p>}
          <div className="modal-actions">
            {cancelButton}
            <button
              className="btn btn-primary"
              disabled={duplicates.size > 0 || !anySelected}
              onClick={() => void loadEntries()}
            >
              {t('import.loadEntries')}
            </button>
          </div>
        </div>
      )
      break

    case 'fetch': {
      const f = fetcher!
      const names = new Map(users.map((u) => [u.id, u.name]))
      const noAccess = f.entriesDone ? f.result().noAccess : []
      body = (
        <div className="stack">
          <p className="muted">{t('import.fetchIntro')}</p>
          <ul className="import-list">
            {[...f.progress.values()].map((p) => (
              <li key={p.userId}>
                <strong>{names.get(p.userId)}</strong>{' '}
                <span className="muted">
                  {p.status === 'done'
                    ? t('import.userDone', { count: p.entries.items.length })
                    : p.status === 'noAccess'
                      ? t('import.userNoAccess')
                      : p.entries.items.length > 0
                        ? t('import.userLoading', { count: p.entries.items.length })
                        : t('import.userPending')}
                </span>
              </li>
            ))}
          </ul>
          {requestCounter}
          {pauseBanner}
          {errorBanner}
          {error && (
            <button className="btn" onClick={resume}>
              {t('common.retry')}
            </button>
          )}
          {noAccess.length > 0 && (
            <div className="banner banner-warning">
              {t('import.noAccess', { names: noAccess.map((id) => names.get(id)).join(', ') })}
            </div>
          )}
          <div className="modal-actions">
            {cancelButton}
            {noAccess.length > 0 && (
              <button className="btn btn-primary" onClick={() => toPreview()}>
                {t('import.continueWithout')}
              </button>
            )}
          </div>
        </div>
      )
      break
    }

    case 'preview':
    case 'write': {
      const r = result!.report
      const totalMs = Object.values(r.byLogin).reduce((s, x) => s + x.ms, 0)
      body = (
        <div className="stack">
          <p className="muted">{t('import.previewIntro')}</p>
          <p>
            <strong>{t('import.projects')}:</strong> {r.projectCount} ·{' '}
            <strong>{t('import.tags')}:</strong> {r.tagCount}
          </p>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('import.member')}</th>
                  <th className="num">{t('import.entries')}</th>
                  <th className="num">{t('import.hours')}</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(r.byLogin)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([login, s]) => (
                    <tr key={login}>
                      <td>{login}</td>
                      <td className="num">{s.entries}</td>
                      <td className="num">{formatHM(s.ms)}</td>
                    </tr>
                  ))}
                <tr>
                  <td>
                    <strong>{t('import.total')}</strong>
                  </td>
                  <td className="num">
                    <strong>{result!.entries.length}</strong>
                  </td>
                  <td className="num">
                    <strong>{formatHM(totalMs)}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('import.project')}</th>
                  <th className="num">{t('import.hours')}</th>
                </tr>
              </thead>
              <tbody>
                {r.msByProject.map((p) => (
                  <tr key={p.projectId ?? '-'}>
                    <td>{p.name ?? t('common.noProject')}</td>
                    <td className="num">{formatHM(p.ms)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="import-list muted small">
            {r.skippedRunning > 0 && <li>{t('import.skippedRunning', { count: r.skippedRunning })}</li>}
            {r.skippedInvalid > 0 && <li>{t('import.skippedInvalid', { count: r.skippedInvalid })}</li>}
            {r.unknownProjectRefs + r.droppedTagRefs > 0 && (
              <li>{t('import.unknownRefs', { count: r.unknownProjectRefs + r.droppedTagRefs })}</li>
            )}
            {r.withTask + r.billable > 0 && (
              <li>{t('import.notCarried', { task: r.withTask, billable: r.billable })}</li>
            )}
            {r.skippedUsers.length + r.noAccessUsers.length > 0 && (
              <li>
                {t('import.skippedUsers', {
                  names: [...r.skippedUsers, ...r.noAccessUsers].join(', '),
                })}
              </li>
            )}
            <li>{t('import.timeZone')}</li>
          </ul>
          {hasExisting && (
            <div className="banner banner-error stack" role="alert">
              <span>{t('import.replaceWarning', existing!)}</span>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={replaceConfirmed}
                  onChange={(e) => setReplaceConfirmed(e.target.checked)}
                  disabled={step === 'write'}
                />
                <strong>{t('import.replaceConfirm')}</strong>
              </label>
            </div>
          )}
          {errorBanner}
          {step === 'write' && <Spinner label={t('import.writing')} />}
          <div className="modal-actions">
            {cancelButton}
            <button
              className={`btn ${hasExisting ? 'btn-danger' : 'btn-primary'}`}
              onClick={() => void write()}
              disabled={step === 'write' || existing === null || (hasExisting && !replaceConfirmed)}
            >
              {hasExisting
                ? t('import.confirmReplace', { count: result!.entries.length })
                : t('import.confirm', { count: result!.entries.length })}
            </button>
          </div>
        </div>
      )
      break
    }

    case 'done':
      body = (
        <div className="stack">
          <p>
            {t('import.done', {
              entries: result!.entries.length,
              projects: result!.report.projectCount,
              tags: result!.report.tagCount,
            })}
          </p>
          <div className="banner banner-info">{t('import.deleteKey')}</div>
          <div className="modal-actions">{cancelButton}</div>
        </div>
      )
      break
  }

  return (
    <Modal
      title={step === 'done' ? t('import.doneTitle') : t('import.title')}
      onClose={onClose}
      wide
      dismissible={false}
    >
      {body}
    </Modal>
  )
}
