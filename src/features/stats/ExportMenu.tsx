import type { KeyboardEvent } from 'react'
import { Icon } from '../../components/Icon'
import { Popover } from '../../components/Popover'
import { useI18n } from '../../i18n'
import { EXPORT_GROUPS, type ExportFormat } from '../export/formats'

/** Arrow keys, Home and End move between the menu items. */
function moveFocus(e: KeyboardEvent<HTMLDivElement>) {
  const items = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')]
  const i = items.indexOf(document.activeElement as HTMLButtonElement)
  const next = {
    ArrowDown: (i + 1) % items.length,
    ArrowUp: (i - 1 + items.length) % items.length,
    Home: 0,
    End: items.length - 1,
  }[e.key]
  if (next === undefined) return
  e.preventDefault()
  items[next]?.focus()
}

export function ExportMenu({
  exporting,
  disabled,
  onExport,
}: {
  exporting: ExportFormat | null
  disabled: boolean
  onExport: (format: ExportFormat) => void
}) {
  const { t } = useI18n()
  return (
    <Popover
      label={t('stats.export')}
      buttonClassName="btn"
      hasPopup="menu"
      restoreFocus
      popClassName="export-menu"
      disabled={disabled}
      busy={!!exporting}
      button={
        <>
          {exporting ? <span className="spinner" /> : <Icon name="download" size={16} />}
          <span>{t('stats.export')}</span>
          <Icon name="chevron" size={14} />
        </>
      }
    >
      {(close) => (
        <div role="menu" aria-label={t('stats.export')} onKeyDown={moveFocus}>
          {EXPORT_GROUPS.map(({ group, formats }, gi) => (
            <div key={group} role="group" aria-labelledby={`export-group-${group}`}>
              <div className="export-menu-heading" id={`export-group-${group}`}>
                {t(`stats.exportGroups.${group}`)}
              </div>
              {formats.map((f, fi) => (
                <button
                  key={f}
                  type="button"
                  role="menuitem"
                  className="picker-option"
                  autoFocus={gi === 0 && fi === 0}
                  onClick={() => {
                    close()
                    onExport(f)
                  }}
                >
                  <Icon name={f === 'pdf' ? 'download' : 'chart'} size={16} />
                  <span>{t(`stats.exportFormats.${f}`)}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </Popover>
  )
}
