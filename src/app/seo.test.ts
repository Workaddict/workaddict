import html from '../../index.html?raw'
import robots from '../../public/robots.txt?raw'
import sitemapXml from '../../public/sitemap.xml?raw'
import en from '../i18n/en'

const publicFiles = Object.keys(import.meta.glob('../../public/*'))
const doc = new DOMParser().parseFromString(html, 'text/html')
const meta = (attr: string, value: string) =>
  doc.querySelector(`meta[${attr}="${value}"]`)?.getAttribute('content')

describe('index.html search setup', () => {
  it('has a descriptive title and description', () => {
    expect(doc.title).toContain('Workaddict')
    expect(doc.title).toContain('Clockify alternative')
    const description = meta('name', 'description') ?? ''
    expect(description.length).toBeLessThanOrEqual(160)
    expect(description).toContain('open-source')
    expect(description).toContain('GitHub repository')
  })

  it('declares the canonical URL and link preview tags', () => {
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://workaddict.me/',
    )
    expect(meta('property', 'og:url')).toBe('https://workaddict.me/')
    expect(meta('property', 'og:image')).toBe('https://workaddict.me/og-image.png')
    expect(meta('name', 'twitter:card')).toBe('summary_large_image')
    expect(meta('name', 'twitter:image')).toBe('https://workaddict.me/og-image.png')
  })

  it('has crawlable fallback content in sync with the start page', () => {
    const headings = doc.querySelectorAll('#root h1')
    expect(headings).toHaveLength(1)
    expect(headings[0]?.textContent?.trim()).toBe(en.landing.headline)
    expect(doc.querySelector('#root')?.textContent).toContain(en.landing.highlights.importTitle)
  })

  it('needs no change to the Content Security Policy', () => {
    expect(doc.querySelectorAll('[style]')).toHaveLength(0)
    expect(doc.querySelectorAll('style')).toHaveLength(0)
    // The only inline script is structured data, which browsers never execute.
    const inline = [...doc.querySelectorAll('script:not([src])')]
    expect(inline.map((s) => s.getAttribute('type'))).toEqual(['application/ld+json'])
  })

  it('describes the app as structured data', () => {
    const block = doc.querySelector('script[type="application/ld+json"]')
    const data = JSON.parse(block?.textContent ?? '') as Record<string, unknown>
    expect(data['@type']).toBe('SoftwareApplication')
    expect(data.name).toBe('Workaddict')
    expect(data.offers).toMatchObject({ price: '0' })
    expect(data).not.toHaveProperty('aggregateRating')
    expect(data).not.toHaveProperty('review')
  })
})

describe('crawl files', () => {
  it('robots.txt allows crawling and points to the sitemap', () => {
    expect(robots).toContain('Allow: /')
    expect(robots).toContain('Sitemap: https://workaddict.me/sitemap.xml')
  })

  it('sitemap.xml lists the site (all pages: seoPages.test.ts)', () => {
    const sitemap = new DOMParser().parseFromString(sitemapXml, 'application/xml')
    const locs = [...sitemap.getElementsByTagName('loc')].map((l) => l.textContent)
    expect(locs).toContain('https://workaddict.me/')
  })

  it('serves the preview image from the site itself', () => {
    expect(publicFiles).toContain('../../public/og-image.png')
  })
})
