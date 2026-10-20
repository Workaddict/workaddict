import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import '../i18n'
import { setHintLevel } from '../hintLevel'
import { Term } from '../features/help/Term'
import { TipButton } from './InfoTip'

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
afterEach(() => {
  vi.useRealTimers()
  setHintLevel('guided')
})

describe('TipButton', () => {
  it('shows its tip on mouse hover and hides it on leave', () => {
    render(<TipButton tip="Switch theme">☾</TipButton>)
    const btn = screen.getByRole('button', { name: 'Switch theme' })
    fireEvent.pointerEnter(btn, { pointerType: 'mouse' })
    act(() => vi.advanceTimersByTime(350))
    expect(screen.getByRole('tooltip')).toHaveTextContent('Switch theme')
    expect(btn).toHaveAttribute('aria-describedby', screen.getByRole('tooltip').id)
    fireEvent.pointerLeave(btn, { pointerType: 'mouse' })
    act(() => vi.advanceTimersByTime(10))
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('shows its tip on keyboard focus and closes on Escape', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<TipButton tip="Stop">■</TipButton>)
    await user.tab()
    expect(screen.getByRole('tooltip')).toHaveTextContent('Stop')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('stays inside a 320 px wide screen', () => {
    vi.stubGlobal('innerWidth', 320)
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(200)
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(40)
    render(<TipButton tip="Stop the timer of carol">■</TipButton>)
    const btn = screen.getByRole('button')
    btn.getBoundingClientRect = () => ({ left: 290, right: 316, top: 100, bottom: 126, width: 26, height: 26 }) as DOMRect
    fireEvent.pointerEnter(btn, { pointerType: 'mouse' })
    act(() => vi.advanceTimersByTime(350))
    const tip = screen.getByRole('tooltip')
    expect(tip.style.left).toBe('112px')
    expect(tip.style.top).toBe('54px')
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('runs the action on a short tap without leaving a tip open', () => {
    const onClick = vi.fn()
    render(
      <TipButton tip="Stop" onClick={onClick}>
        ■
      </TipButton>,
    )
    const btn = screen.getByRole('button', { name: 'Stop' })
    fireEvent.pointerDown(btn, { pointerType: 'touch' })
    fireEvent.pointerUp(btn, { pointerType: 'touch' })
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalledOnce()
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('shows the tip on a long press instead of running the action', () => {
    const onClick = vi.fn()
    render(
      <TipButton tip="Stop" onClick={onClick}>
        ■
      </TipButton>,
    )
    const btn = screen.getByRole('button', { name: 'Stop' })
    fireEvent.pointerDown(btn, { pointerType: 'touch' })
    act(() => vi.advanceTimersByTime(600))
    fireEvent.pointerUp(btn, { pointerType: 'touch' })
    fireEvent.click(btn)
    expect(onClick).not.toHaveBeenCalled()
    expect(screen.getByRole('tooltip')).toHaveTextContent('Stop')
  })
})

describe('Term', () => {
  const renderTerm = () =>
    render(
      <MemoryRouter>
        <p>
          Open the <Term id="workspace" /> menu. <button type="button">Outside</button>
        </p>
      </MemoryRouter>,
    )

  it('explains itself on tap with a link to its topic, and closes on an outside tap', () => {
    renderTerm()
    const term = screen.getByRole('button', { name: 'Workspace' })
    fireEvent.pointerDown(term, { pointerType: 'touch' })
    fireEvent.click(term)
    const tip = screen.getByRole('tooltip')
    expect(tip).toHaveTextContent(/saved on this device together with its token/)
    expect(screen.getByRole('link', { name: /Learn more/ })).toHaveAttribute('href', '/help/workspaces')
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Outside' }), { pointerType: 'touch' })
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('is plain text in Expert mode', () => {
    setHintLevel('expert')
    renderTerm()
    expect(screen.queryByRole('button', { name: 'Workspace' })).toBeNull()
    expect(screen.getByText(/Open the Workspace menu/)).toBeInTheDocument()
  })
})
