import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'mcp/dist', 'coverage', 'openspec'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    // Clock times and calendar days must use the effective time zone (src/timeZone.ts), never
    // the browser's zone, which privacy browsers report as UTC. src/domain/zoned.ts is the one
    // place that may call the zone-dependent APIs; tests pin the process zone and build dates
    // freely, and the demo data only needs to look plausible.
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      '**/*.test.{ts,tsx}',
      'src/test/**',
      'src/domain/zoned.ts',
      'src/features/auth/demoData.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'date-fns',
              importNames: [
                'addDays',
                'addMonths',
                'addWeeks',
                'differenceInCalendarDays',
                'eachDayOfInterval',
                'endOfDay',
                'endOfMonth',
                'endOfWeek',
                'endOfYear',
                'format',
                'getHours',
                'isSameDay',
                'isSameMonth',
                'isSameWeek',
                'isToday',
                'isYesterday',
                'parse',
                'parseISO',
                'setHours',
                'setMinutes',
                'startOfDay',
                'startOfMonth',
                'startOfWeek',
                'startOfYear',
                'subDays',
                'subMonths',
                'subWeeks',
              ],
              message: 'Use the zone-aware helper from src/domain/zoned.ts.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'CallExpression[callee.property.name=/^(get|set)(FullYear|Month|Date|Day|Hours|Minutes|Seconds)$/]',
          message: 'Local Date getters/setters use the browser zone; use src/domain/zoned.ts.',
        },
        {
          selector:
            'CallExpression[callee.property.name=/^(toDateString|toTimeString|toLocaleDateString|toLocaleTimeString|toLocaleString)$/]',
          message: 'Browser-zone formatting; use format() from src/domain/zoned.ts.',
        },
        {
          selector: "NewExpression[callee.name='Date'][arguments.length>=2]",
          message:
            'new Date(y, m, d, …) uses the browser zone; use fromWallClock() from src/domain/zoned.ts.',
        },
      ],
    },
  },
  {
    // Shared with the MCP server, which runs in Node: no browser APIs, except in the blob cache
    // that the server replaces with its own.
    files: ['src/storage/**/*.ts', 'src/domain/**/*.ts'],
    ignores: ['**/*.test.ts', 'src/storage/github/blobCache.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        ...[
          'window',
          'document',
          'localStorage',
          'sessionStorage',
          'indexedDB',
          'navigator',
          'location',
        ].map((name) => ({ name, message: 'src/storage and src/domain also run in Node (mcp/).' })),
      ],
    },
  },
  {
    files: ['mcp/**/*.{ts,mjs}'],
    languageOptions: { globals: globals.node },
  },
)
