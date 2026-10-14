import { aiClientLabel } from './aiClient'

describe('aiClientLabel', () => {
  it('names known clients and shows others as sent', () => {
    expect(aiClientLabel('claude-code')).toBe('Claude Code')
    expect(aiClientLabel('my-agent')).toBe('my-agent')
  })

  it('shows nothing for missing or malformed values', () => {
    expect(aiClientLabel(undefined)).toBeNull()
    expect(aiClientLabel('<img src=x>')).toBeNull()
    expect(aiClientLabel('x'.repeat(41))).toBeNull()
  })
})
