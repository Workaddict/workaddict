import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useId, useMemo, useState, type FormEvent } from 'react'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/Toasts'
import { localDateTime, durationMs, formatHM } from '../../domain/time'
import type { TimeEntry } from '../../domain/types'
import { useI18n } from '../../i18n'
import { useSessionData } from '../auth/AuthContext'
import { useAllEntries, useMembers } from '../data/hooks'
import { useErrorToast } from '../data/useErrorText'

const FORMER = 'clockify.'

/**
 * Moves the entries of one member to another, e.g. to change how Clockify users were mapped
 * after the import. Team leaders only (checked again by the storage layer).
 */
export function ReassignEntriesModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const { adapter } = useSessionData()
  const qc = useQueryClient()
  const toast = useToast()
  const onError = useErrorToast()
  const entries = useAllEntries().data
  const members = useMembers().data

  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [useCutoff, setUseCutoff] = useState(false)
  const [cutoff, setCutoff] = useState('')
  const hintId = useId()

  const byLogin = useMemo(() => {
    const m = new Map<string, TimeEntry[]>()
    for (const e of entries ?? []) m.set(e.login, [...(m.get(e.login) ?? []), e])
    return m
  }, [entries])

  const sources = [...byLogin.keys()].sort()
  const targets = [...new Set([...(members ?? []).map((m) => m.login), ...sources])]
    .filter((l) => l !== from)
    .sort()
  const before = useCutoff ? localDateTime(cutoff, '00:00') : null
  const cutoffInvalid = useCutoff && before === null
  const moving = (byLogin.get(from) ?? []).filter(
    (e) => !before || new Date(e.start).getTime() < before.getTime(),
  )
  const hours = formatHM(moving.reduce((ms, e) => ms + durationMs(e.start, e.end), 0))

  const reassign = useMutation({
    mutationFn: () => adapter.reassignEntries(from, to, before ? { before } : undefined),
    onSuccess: (count) => {
      toast.info(t('reassign.done', { count, to }))
      onClose()
    },
    onError,
    onSettled: () => qc.invalidateQueries(),
  })

  const label = (login: string) =>
    login.startsWith(FORMER) ? t('reassign.former', { login }) : login

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (from && to && moving.length > 0 && !cutoffInvalid) reassign.mutate()
  }

  return (
    <Modal title={t('reassign.title')} onClose={onClose} dismissible={!reassign.isPending}>
      <form className="stack" onSubmit={submit}>
        <p className="muted small">{t('reassign.intro')}</p>
        <label className="field">
          <span>{t('reassign.from')}</span>
          <select
            className="select"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value)
              if (e.target.value === to) setTo('')
            }}
          >
            <option value="">{t('reassign.choose')}</option>
            {sources.map((l) => (
              <option key={l} value={l}>
                {label(l)} ({t('reassign.count', { count: byLogin.get(l)!.length })})
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t('reassign.to')}</span>
          <select className="select" value={to} onChange={(e) => setTo(e.target.value)}>
            <option value="">{t('reassign.choose')}</option>
            {targets.map((l) => (
              <option key={l} value={l}>
                {label(l)}
              </option>
            ))}
          </select>
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={useCutoff}
            onChange={(e) => setUseCutoff(e.target.checked)}
          />
          <span>{t('reassign.onlyBefore')}</span>
        </label>
        {useCutoff && (
          <div className="stack" style={{ gap: 4 }}>
            <label className="field">
              <span>{t('reassign.cutoff')}</span>
              <input
                className="input"
                type="date"
                value={cutoff}
                aria-invalid={cutoffInvalid}
                aria-describedby={hintId}
                onChange={(e) => setCutoff(e.target.value)}
              />
            </label>
            <span id={hintId} className="muted small">
              {t('reassign.cutoffHint')}
            </span>
          </div>
        )}
        {from && to && !cutoffInvalid && (
          <div className={`banner ${moving.length > 0 ? 'banner-info' : 'banner-warning'}`}>
            {moving.length > 0
              ? t('reassign.preview', {
                  count: moving.length,
                  hours,
                  from: label(from),
                  to: label(to),
                })
              : t('reassign.nothing')}
          </div>
        )}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose} disabled={reassign.isPending}>
            {t('common.cancel')}
          </button>
          <button
            className="btn btn-primary"
            disabled={!from || !to || moving.length === 0 || cutoffInvalid || reassign.isPending}
          >
            {t('reassign.confirm', { count: moving.length })}
          </button>
        </div>
      </form>
    </Modal>
  )
}
