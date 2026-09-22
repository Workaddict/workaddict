import { render, screen } from '@testing-library/react'
import '../i18n'
import { isFramed } from './frame'
import { FrameGuard } from './FrameGuard'

describe('frame protection', () => {
  it('detects framing, including a cross-origin parent that throws', () => {
    const self = {} as Window
    expect(isFramed({ top: self, self } as unknown as Window)).toBe(false)
    expect(isFramed({ top: {}, self } as unknown as Window)).toBe(true)
    const crossOrigin = {
      self,
      get top(): Window {
        throw new DOMException('Blocked a frame', 'SecurityError')
      },
    }
    expect(isFramed(crossOrigin as unknown as Window)).toBe(true)
  })

  it('renders the app at top level', () => {
    render(
      <FrameGuard framed={false}>
        <button>Sign in</button>
      </FrameGuard>,
    )
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('shows only a link to open the app in its own tab when framed', () => {
    render(
      <FrameGuard framed>
        <button>Sign in</button>
      </FrameGuard>,
    )
    expect(screen.queryByRole('button', { name: 'Sign in' })).toBeNull()
    const link = screen.getByRole('link', { name: 'Open Workaddict' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
