import type { InputHTMLAttributes } from 'react'
import { timeInputAttrs, useTimeFormat } from '../timeFormat'

export function TimeInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const f = useTimeFormat()
  return <input className="input time-input" {...timeInputAttrs(f)} {...props} />
}
