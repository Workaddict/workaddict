// Bundles the server and the shared Workaddict code it imports (../src) into one file, so
// `npx workaddict-mcp` needs no runtime dependencies.
import { build } from 'esbuild'

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  banner: {
    js: [
      '#!/usr/bin/env node',
      // Bundled CommonJS dependencies may call require().
      "import { createRequire as __createRequire } from 'node:module';",
      'const require = __createRequire(import.meta.url);',
    ].join('\n'),
  },
  legalComments: 'linked',
  logLevel: 'info',
})
