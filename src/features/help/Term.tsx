import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { useTip } from '../../components/InfoTip'
import { useIsExpert } from '../../hintLevel'
import { useI18n } from '../../i18n'
import { helpPath, termPath, type TermId, type TopicId } from './topics'

/**
 * A glossary term with a dotted underline that explains itself in one sentence, with a link to
 * its help topic. In Expert mode it is plain text. Mark only the first occurrence on a page.
 */
export function Term({ id, children }: { id: TermId; children?: ReactNode }) {
  const { t } = useI18n()
  const expert = useIsExpert()
  const label = children ?? t(`help.glossary.terms.${id}.term`)
  const {
    open,
    setTrigger,
    props: p,
    onTriggerClick,
    tip,
  } = useTip<HTMLButtonElement>(
    <>
      <span>{t(`help.glossary.terms.${id}.short`)}</span>{' '}
      <Link to={termPath(id)} className="infotip-link">
        {t('help.learnMore')} →
      </Link>
    </>,
    { touch: 'tap', interactive: true },
  )
  if (expert) return <>{label}</>
  return (
    <>
      <button
        type="button"
        className="term"
        ref={setTrigger}
        aria-describedby={p['aria-describedby']}
        aria-expanded={open}
        onPointerEnter={p.onPointerEnter}
        onPointerLeave={p.onPointerLeave}
        onPointerDown={p.onPointerDown}
        onFocus={p.onFocus}
        onBlur={p.onBlur}
        onClick={onTriggerClick}
      >
        {label}
      </button>
      {tip}
    </>
  )
}

/** The "?" next to a complex feature: opens its help topic. */
export function HelpButton({ topic, newTab }: { topic: TopicId; newTab?: boolean }) {
  const { t } = useI18n()
  const label = t('help.helpFor', { topic: t(`help.topics.${topic}`) })
  const {
    setTrigger,
    props: p,
    onTriggerClick,
    tip,
  } = useTip<HTMLAnchorElement>(label, {
    touch: 'longPress',
  })
  const common = {
    className: 'help-btn',
    'aria-label': label,
    'aria-describedby': p['aria-describedby'],
    onPointerEnter: p.onPointerEnter,
    onPointerLeave: p.onPointerLeave,
    onPointerDown: p.onPointerDown,
    onPointerUp: p.onPointerUp,
    onPointerCancel: p.onPointerCancel,
    onContextMenu: p.onContextMenu,
    onFocus: p.onFocus,
    onBlur: p.onBlur,
  }
  const icon = <Icon name="help" size={14} />
  return (
    <>
      {newTab ? (
        // Opened from forms (sign-in) in a new tab, so typed input is kept.
        <a
          {...common}
          ref={setTrigger}
          href={`#${helpPath(topic)}`}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => !onTriggerClick() && e.preventDefault()}
        >
          {icon}
        </a>
      ) : (
        <Link
          {...common}
          ref={setTrigger}
          to={helpPath(topic)}
          onClick={(e) => !onTriggerClick() && e.preventDefault()}
        >
          {icon}
        </Link>
      )}
      {tip}
    </>
  )
}

/** "What is a token?" with the term's tip and the "?" to its topic, for setup and join steps. */
export function WhatIs({
  term,
  topic,
}: {
  term: 'data-repo' | 'token' | 'workspace'
  topic: TopicId
}) {
  const { t } = useI18n()
  const expert = useIsExpert()
  return (
    <p className="small what-is">
      {!expert && <Term id={term}>{t(`help.whatIs.${term}`)}</Term>}
      <HelpButton topic={topic} newTab />
    </p>
  )
}
