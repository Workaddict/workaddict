import { Link } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { TipButton } from '../../components/InfoTip'
import { useIsExpert } from '../../hintLevel'
import { useI18n } from '../../i18n'
import { useSessionData } from '../auth/AuthContext'
import { useAccess, useMembers, useMyTimer, useWorkspace } from '../data/hooks'
import { dismissChecklist, useChecklistState } from './checklistState'
import { helpPath } from './topics'
import { useWelcome } from './tourStore'

interface Item {
  id: string
  label: string
  done: boolean
  optional?: boolean
  /** Where the item is done, or the help topic when the role cannot do it. */
  to: string
}

/**
 * "First steps" card on the tracker. Items tick themselves off from the workspace data; the card
 * disappears for good once every required item is done, and can be dismissed. Hidden in Expert
 * mode, in the demo, and for members who used the app before the help was added.
 */
export function FirstSteps({ hasOwnEntry }: { hasOwnEntry: boolean }) {
  const { t } = useI18n()
  const { session } = useSessionData()
  const expert = useIsExpert()
  const access = useAccess()
  const welcome = useWelcome(false)
  const { dismissed, aiOpened } = useChecklistState()
  const workspace = useWorkspace().data
  const members = useMembers().data
  const timer = useMyTimer()

  if (expert || dismissed || welcome.existing || session.mode === 'demo' || !workspace) return null

  const manage = access.can('manageWorkspace')
  const items: Item[] = [
    { id: 'track', label: t('help.checklist.track'), done: hasOwnEntry || !!timer, to: '/' },
  ]
  if (manage) {
    items.push(
      {
        id: 'project',
        label: t('help.checklist.project'),
        done: workspace.projects.length > 0,
        to: '/groups',
      },
      { id: 'tag', label: t('help.checklist.tag'), done: workspace.tags.length > 0, to: '/groups' },
    )
  }
  if (access.owner || access.role === 'leader') {
    items.push({
      id: 'team',
      label: t('help.checklist.team'),
      done: (members?.length ?? 0) > 1,
      to: '/settings',
    })
  }
  items.push({
    id: 'ai',
    label: t('help.checklist.ai'),
    done: aiOpened,
    optional: true,
    to: '/connect-ai',
  })

  const required = items.filter((i) => !i.optional)
  const doneCount = required.filter((i) => i.done).length
  if (doneCount === required.length) return null

  return (
    <section className="card checklist" aria-labelledby="first-steps-title">
      <div className="checklist-head">
        <h2 id="first-steps-title">{t('help.checklist.title')}</h2>
        <span className="small muted">
          {t('help.checklist.progress', { done: doneCount, total: required.length })}
        </span>
        <span className="spacer" />
        <TipButton
          className="btn btn-icon btn-sm"
          onClick={dismissChecklist}
          tip={t('help.checklist.dismiss')}
        >
          <Icon name="x" size={14} />
        </TipButton>
      </div>
      <div
        className="checklist-progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={required.length}
        aria-valuenow={doneCount}
        aria-label={t('help.checklist.title')}
      >
        <span style={{ width: `${(doneCount / required.length) * 100}%` }} />
      </div>
      <ul>
        {items.map((i) => (
          <li key={i.id} className={i.done ? 'is-done' : undefined}>
            <span className="check" aria-hidden="true">
              {i.done && <Icon name="check" size={12} />}
            </span>
            <span className="label">
              {i.label}
              <span className="visually-hidden">{i.done ? ' ✓' : ''}</span>
            </span>
            {!i.done && i.to !== '/' && (
              <Link className="small" to={i.to}>
                {t('help.checklist.open')} →
              </Link>
            )}
          </li>
        ))}
        {!manage && (
          <li>
            <span className="check" aria-hidden="true">
              <Icon name="help" size={12} />
            </span>
            <Link className="small" to={helpPath('work-groups')}>
              {t('help.checklist.projectWorker')} →
            </Link>
          </li>
        )}
      </ul>
    </section>
  )
}
