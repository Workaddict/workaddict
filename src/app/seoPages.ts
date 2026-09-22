// Static search pages (plain HTML entries next to index.html, no React).
// Shared by vite.config.ts (build inputs), the app's links to them, and the SEO tests.
// Keep free of browser globals and build-time constants: vite.config.ts imports it in Node.

export const SITE_URL = 'https://workaddict.me/'

export const SEO_PAGES = ['clockify-alternative', 'import-from-clockify'] as const
export type SeoPage = (typeof SEO_PAGES)[number]

export const SEO_LANGUAGES = ['en', 'de'] as const
export type SeoLanguage = (typeof SEO_LANGUAGES)[number]

/** Path of a page relative to the site root, e.g. `de/import-from-clockify/`. */
export function seoPagePath(page: SeoPage, lang: SeoLanguage): string {
  return lang === 'en' ? `${page}/` : `${lang}/${page}/`
}

/** Relative link from the app (served at the site root) to a page in the given UI language. */
export function seoPageUrl(page: SeoPage, lang: string): string {
  return `./${seoPagePath(page, lang.startsWith('de') ? 'de' : 'en')}`
}

/** Every page's HTML file relative to the project root, e.g. `de/clockify-alternative/index.html`. */
export const SEO_PAGE_FILES: string[] = SEO_PAGES.flatMap((page) =>
  SEO_LANGUAGES.map((lang) => `${seoPagePath(page, lang)}index.html`),
)
