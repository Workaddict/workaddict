import { defineConfig } from 'vitest/config'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import pkg from './package.json' with { type: 'json' }

// Strict CSP for the production build only (the dev server relies on inline scripts).
// Scripts only from our own origin, network only to the GitHub API and Clockify (one-time import).
// Trusted Types: no string may reach an HTML/script sink, and no policy may be created.
// `frame-ancestors` is absent because browsers ignore it in a <meta> CSP and GitHub Pages cannot
// send headers; framing is refused in the app instead (src/app/FrameGuard.tsx).
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: blob: https://avatars.githubusercontent.com",
  "font-src 'self' data:",
  'connect-src https://api.github.com https://*.clockify.me',
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "require-trusted-types-for 'script'",
  "trusted-types 'none'",
].join('; ')

function cspPlugin(): Plugin {
  return {
    name: 'inject-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<meta charset="UTF-8" />',
        `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
      )
    },
  }
}

export default defineConfig({
  plugins: [react(), cspPlugin()],
  // Relative base: works on any GitHub Pages path (hash routing, so no deep-link rewrites needed).
  base: './',
  // Only the version string reaches the bundle, not the whole manifest.
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    chunkSizeWarningLimit: 1500,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
