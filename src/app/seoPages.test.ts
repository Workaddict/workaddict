import indexHtml from '../../index.html?raw'
import sitemapXml from '../../public/sitemap.xml?raw'
import de from '../i18n/de'
import en from '../i18n/en'
import {
  SEO_LANGUAGES,
  SEO_PAGE_FILES,
  SEO_PAGES,
  SITE_URL,
  seoPagePath,
  seoPageUrl,
  type SeoLanguage,
} from './seoPages'

// Every static search page in the repo, keyed like SEO_PAGE_FILES (`de/clockify-alternative/index.html`).
const rawPages = import.meta.glob<string>(
  ['../../*/index.html', '../../de/*/index.html', '!../../node_modules/**', '!../../dist/**'],
  { query: '?raw', import: 'default', eager: true },
)
const pageHtml = Object.fromEntries(
  Object.entries(rawPages).map(([path, html]) => [path.replace('../../', ''), html]),
)
const publicFiles = Object.keys(import.meta.glob('../../public/**/*')).map((p) =>
  p.replace('../../public', ''),
)

const parse = (html: string) => new DOMParser().parseFromString(html, 'text/html')
const pages = SEO_PAGES.flatMap((page) =>
  SEO_LANGUAGES.map((lang) => {
    const file = `${seoPagePath(page, lang)}index.html`
    return {
      page,
      lang,
      file,
      url: SITE_URL + seoPagePath(page, lang),
      doc: parse(pageHtml[file] ?? ''),
    }
  }),
)
const other = (lang: SeoLanguage): SeoLanguage => (lang === 'en' ? 'de' : 'en')

const meta = (doc: Document, attr: string, value: string) =>
  doc.querySelector(`meta[${attr}="${value}"]`)?.getAttribute('content')
const hrefs = (el: Element | null) =>
  [...(el?.querySelectorAll('a') ?? [])].map((a) => a.getAttribute('href') ?? '')

/** Resolves a relative link on a page to its site path, e.g. `../import-from-clockify/` → `/import-from-clockify/`. */
function sitePath(href: string, pageUrl: string): string {
  const url = new URL(href, pageUrl)
  return url.origin === new URL(SITE_URL).origin ? url.pathname : url.href
}

/** Checks inline scripts: only valid JSON-LD without invented ratings. */
function checkInlineScripts(doc: Document) {
  for (const script of doc.querySelectorAll('script:not([src])')) {
    expect(script.getAttribute('type')).toBe('application/ld+json')
    const data = JSON.parse(script.textContent ?? '') as Record<string, unknown>
    expect(data['@type']).toBe('SoftwareApplication')
    expect(data).not.toHaveProperty('aggregateRating')
    expect(data).not.toHaveProperty('review')
  }
}

describe('static search pages', () => {
  it('has one HTML file per page and language, all built by Vite', () => {
    expect(Object.keys(pageHtml).sort()).toEqual([...SEO_PAGE_FILES].sort())
  })

  it.each(pages)('$file has a complete head', ({ doc, lang, url, file }) => {
    // cspPlugin injects the policy by replacing exactly this tag.
    expect(pageHtml[file]).toContain('<meta charset="UTF-8" />')
    expect(doc.documentElement.lang).toBe(lang)
    expect(doc.title).toContain('Workaddict')
    expect(doc.title).toContain('Clockify')
    const description = meta(doc, 'name', 'description') ?? ''
    expect(description.length).toBeGreaterThan(50)
    expect(description.length).toBeLessThanOrEqual(160)
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(url)
    expect(meta(doc, 'property', 'og:url')).toBe(url)
    expect(meta(doc, 'property', 'og:image')).toBe(`${SITE_URL}og-image.png`)
    expect(meta(doc, 'name', 'twitter:card')).toBe('summary_large_image')
    expect(doc.querySelectorAll('h1')).toHaveLength(1)
  })

  it.each(pages)('$file links its language pair', ({ doc, page, lang, url }) => {
    const alt = (hreflang: string) =>
      doc.querySelector(`link[rel="alternate"][hreflang="${hreflang}"]`)?.getAttribute('href')
    expect(alt(lang)).toBe(url)
    expect(alt(other(lang))).toBe(SITE_URL + seoPagePath(page, other(lang)))
    expect(alt('x-default')).toBe(SITE_URL + seoPagePath(page, 'en'))
    const switchLink = doc.querySelector(`.page-nav a[hreflang="${other(lang)}"]`)
    expect(sitePath(switchLink?.getAttribute('href') ?? '', url)).toBe(
      `/${seoPagePath(page, other(lang))}`,
    )
  })

  it.each(pages)('$file shares the header and footer links', ({ doc, lang, url }) => {
    const langPrefix = lang === 'en' ? '/' : `/${lang}/`
    const expected = [
      '/',
      ...SEO_PAGES.map((page) => `${langPrefix}${page}/`),
      'https://github.com/Workaddict/workaddict',
      'https://github.com/Workaddict/workaddict/issues',
      'https://github.com/Workaddict/workaddict/blob/main/SECURITY.md',
      'https://github.com/BenediktLehner',
      'https://github.com/Workaddict/workaddict/blob/main/LICENSE',
    ]
    const footer = hrefs(doc.querySelector('footer')).map((h) => sitePath(h, url))
    expect(footer.sort()).toEqual(expected.sort())
    const header = hrefs(doc.querySelector('header')).map((h) => sitePath(h, url))
    expect(header).toContain('/')
    expect(header).toHaveLength(3)
  })

  it.each(pages)('$file needs no change to the Content Security Policy', ({ doc }) => {
    expect(doc.querySelectorAll('[style]')).toHaveLength(0)
    expect(doc.querySelectorAll('style')).toHaveLength(0)
    expect(doc.querySelectorAll('script[src]')).toHaveLength(0)
    checkInlineScripts(doc)
    for (const el of doc.querySelectorAll('[src], link[href]')) {
      const ref = el.getAttribute('src') ?? el.getAttribute('href') ?? ''
      if (el.matches('link[rel="canonical"], link[rel="alternate"]')) continue
      expect(ref.startsWith('/')).toBe(true)
    }
  })

  it.each(pages)('$file shows only images that exist, with alt text and size', ({ doc }) => {
    for (const img of doc.querySelectorAll('img')) {
      expect(img.hasAttribute('alt')).toBe(true)
      expect(img.getAttribute('width')).toMatch(/^\d+$/)
      expect(img.getAttribute('height')).toMatch(/^\d+$/)
      expect(publicFiles).toContain(img.getAttribute('src'))
    }
  })

  it('describes the app as structured data on the Clockify alternative pages', () => {
    for (const { doc, page } of pages) {
      const blocks = doc.querySelectorAll('script[type="application/ld+json"]')
      expect(blocks).toHaveLength(page === 'clockify-alternative' ? 1 : 0)
    }
  })

  it('shows an honest, dated comparison', () => {
    for (const { doc, page, lang } of pages) {
      if (page !== 'clockify-alternative') continue
      expect(doc.querySelectorAll('table td .no').length).toBeGreaterThan(0)
      expect(doc.querySelector('.table-note')?.textContent).toMatch(/20\d\d/)
      const text = doc.body.textContent?.toLowerCase() ?? ''
      for (const word of ['expensive', 'teuer', 'gdpr', 'dsgvo']) {
        expect(text, `${lang}: ${word}`).not.toContain(word)
      }
    }
  })

  it('quotes the import labels exactly as the app shows them', () => {
    const labels = {
      en: [
        en.import.start,
        en.import.keyLabel,
        en.import.region,
        en.import.mapTarget,
        en.import.loadEntries,
        en.reassign.start,
      ],
      de: [
        de.import.start,
        de.import.keyLabel,
        de.import.region,
        de.import.mapTarget,
        de.import.loadEntries,
        de.reassign.start,
      ],
    }
    for (const lang of SEO_LANGUAGES) {
      const text = parse(
        pageHtml[`${seoPagePath('import-from-clockify', lang)}index.html`] ?? '',
      ).body.textContent?.replace(/\s+/g, ' ')
      for (const label of labels[lang]) expect(text).toContain(label)
    }
  })
})

describe('sitemap', () => {
  it('lists exactly the canonical URLs of all pages', () => {
    const sitemap = new DOMParser().parseFromString(sitemapXml, 'application/xml')
    const locs = [...sitemap.getElementsByTagName('loc')].map((l) => l.textContent)
    const canonicals = [indexHtml, ...pages.map((p) => pageHtml[p.file] ?? '')].map((html) =>
      parse(html).querySelector('link[rel="canonical"]')?.getAttribute('href'),
    )
    expect(locs.sort()).toEqual(canonicals.sort())
  })
})

describe('links from the app', () => {
  it('uses relative URLs in the UI language', () => {
    expect(seoPageUrl('clockify-alternative', 'en')).toBe('./clockify-alternative/')
    expect(seoPageUrl('import-from-clockify', 'de')).toBe('./de/import-from-clockify/')
    expect(seoPageUrl('import-from-clockify', 'de-AT')).toBe('./de/import-from-clockify/')
  })
})
