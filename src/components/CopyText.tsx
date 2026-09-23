import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import { Icon } from './Icon'

/**
 * A copy button for a text. With `visible`, the text is always shown in a read-only field;
 * otherwise the field only appears when the clipboard is unavailable, selected so the user can
 * copy it by hand.
 */
export function CopyText({
  text,
  label,
  visible = false,
  multiline = false,
}: {
  text: string
  label: string
  visible?: boolean
  multiline?: boolean
}) {
  const { t } = useI18n()
  // The result belongs to the text it was produced for, so a changed text starts fresh.
  const [result, setResult] = useState<{ text: string; kind: 'copied' | 'failed' } | null>(null)
  const state = result?.text === text ? result.kind : 'idle'
  const fieldRef = useRef<HTMLTextAreaElement & HTMLInputElement>(null)

  useEffect(() => {
    if (state !== 'copied') return
    const id = setTimeout(() => setResult(null), 2000)
    return () => clearTimeout(id)
  }, [state])

  useEffect(() => {
    if (state === 'failed') fieldRef.current?.select()
  }, [state])

  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('no clipboard')
      await navigator.clipboard.writeText(text)
      setResult({ text, kind: 'copied' })
    } catch {
      setResult({ text, kind: 'failed' })
    }
  }

  const showField = visible || state === 'failed'
  return (
    <div className="copy-text">
      {showField &&
        (multiline ? (
          <textarea
            ref={fieldRef}
            className="input copy-field"
            readOnly
            rows={Math.min(12, text.split('\n').length + 1)}
            value={text}
            aria-label={label}
            onFocus={(e) => e.currentTarget.select()}
          />
        ) : (
          <input
            ref={fieldRef}
            className="input copy-field"
            readOnly
            value={text}
            aria-label={label}
            onFocus={(e) => e.currentTarget.select()}
          />
        ))}
      <div className="row copy-actions">
        <button type="button" className="btn btn-sm" onClick={() => void copy()}>
          <Icon name={state === 'copied' ? 'check' : 'copy'} size={14} />
          {state === 'copied' ? t('common.copied') : label}
        </button>
        {state === 'failed' && (
          <span className="muted small" role="status">
            {t('common.copyManually')}
          </span>
        )}
      </div>
    </div>
  )
}
