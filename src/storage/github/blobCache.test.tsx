import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, waitFor } from '@testing-library/react'
import { createStore, keys, set } from 'idb-keyval'
import { AuthProvider } from '../../features/auth/AuthContext'
import { clearBlobCache, createBlobCache } from './blobCache'

const idb = () => createStore('workaddict-cache', 'blobs')
const stored = () => keys(idb())

const SESSION = JSON.stringify({ mode: 'github', token: 't', repo: 'team/data', branch: 'main' })

function renderAuth() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthProvider>
        <span />
      </AuthProvider>
    </QueryClientProvider>,
  )
}

describe('blob cache lifetime', () => {
  beforeEach(async () => {
    await clearBlobCache()
    localStorage.clear()
    sessionStorage.clear()
    // Session restores fail (no network in tests); only the cache matters here.
    vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')))
  })
  afterEach(() => vi.unstubAllGlobals())

  it('writes nothing to IndexedDB without persistence', async () => {
    const cache = createBlobCache({ persist: false })
    await cache.set('sha1', '[]')
    expect(await cache.get('sha1')).toBe('[]')
    expect(await stored()).toEqual([])
  })

  it('persists and reuses content across instances when remembered', async () => {
    await createBlobCache({ persist: true }).set('sha1', '[]')
    expect(await stored()).toEqual(['sha1'])
    expect(await createBlobCache({ persist: true }).get('sha1')).toBe('[]')
  })

  it('wipes leftover content on startup without a remembered session', async () => {
    await set('sha1', 'private', idb())
    sessionStorage.setItem('workaddict.session', SESSION) // a tab-only session is not remembered
    renderAuth()
    await waitFor(async () => expect(await stored()).toEqual([]))
  })

  it('keeps content on startup with a remembered session', async () => {
    await set('sha1', 'private', idb())
    localStorage.setItem('workaddict.session', SESSION)
    renderAuth()
    await new Promise((r) => setTimeout(r, 20))
    expect(await stored()).toEqual(['sha1'])
  })
})
