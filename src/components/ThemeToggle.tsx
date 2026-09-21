import { useI18n } from '../i18n'
import { toggleTheme, useResolvedTheme } from '../theme'
import { Icon } from './Icon'

/** One-click switch between light and dark; the icon shows the theme it switches to. */
export function ThemeToggle() {
  const { t } = useI18n()
  const target = useResolvedTheme() === 'dark' ? 'light' : 'dark'
  const label = t(target === 'dark' ? 'common.switchToDark' : 'common.switchToLight')
  return (
    <button type="button" className="btn btn-icon" onClick={toggleTheme} title={label} aria-label={label}>
      <Icon name={target === 'dark' ? 'moon' : 'sun'} size={18} />
    </button>
  )
}
