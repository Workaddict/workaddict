import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import '../../i18n'
import de from '../../i18n/help.de'
import en from '../../i18n/help.en'
import { HelpShot } from './HelpShot'
import { AVAILABLE_SHOTS, SHOT_IDS } from './shots'

// Only the file names; nothing is loaded.
const files = Object.keys(import.meta.glob('/public/img/help/*.webp'))

describe('setup screenshots', () => {
  it('shows the screenshot with a description of what to look for', () => {
    render(<HelpShot id="token-form" available={new Set(['token-form'])} />)
    const img = screen.getByRole('img', { name: /fine-grained token form/ })
    expect(img.getAttribute('src')).toMatch(/img\/help\/token-form\.webp$/)
  })

  it('keeps the description when the image does not load', () => {
    render(
      <p>
        Step text
        <HelpShot id="repo-new" available={new Set(['repo-new'])} />
      </p>,
    )
    fireEvent.error(screen.getByRole('img'))
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText(/Create a new repository/)).toBeInTheDocument()
    expect(screen.getByText('Step text')).toBeInTheDocument()
  })

  it('shows nothing for a screenshot that was not added yet', () => {
    const { container } = render(<HelpShot id="invitation" available={new Set()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('describes every screenshot in both languages, and every listed file exists', () => {
    for (const id of SHOT_IDS) {
      expect(en.shots[id], id).toBeTruthy()
      expect(de.shots[id], id).toBeTruthy()
    }
    for (const id of AVAILABLE_SHOTS) expect(files).toContain(`/public/img/help/${id}.webp`)
  })
})
