import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // `dist/` is the Vite build output (generated); `node_modules/` is ignored automatically by
  // flat config, but listing it here too doesn't hurt and documents the intent.
  globalIgnores(['dist', 'node_modules']),
  {
    // App code: browser-only (React SPA, no SSR/Node APIs at runtime).
    files: ['src/**/*.{js,jsx}'],
    extends: [js.configs.recommended],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Only the two classic hooks rules, not `reactHooks.configs.flat.recommended` in full:
      // eslint-plugin-react-hooks 7.x bundles the much stricter React Compiler rule set
      // (`set-state-in-effect`, `refs`, `purity`, `immutability`, etc.) as "recommended". Those
      // rules flag long-standing, working patterns already used throughout this codebase (e.g.
      // syncing local state from async-loaded Supabase data in a `useEffect`, mutating a ref
      // during render in `useCountUp.js`). Adopting them wholesale would mean rewriting large
      // parts of a production app's data flow, which is out of scope for "add a linter" — keep
      // just rules-of-hooks (real correctness rule) and exhaustive-deps (real risk of stale
      // closures) for now.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Downgraded from the plugin's default "error" to "warn": this rule only affects React
      // Fast Refresh ergonomics in dev (a file that mixes component + non-component exports
      // falls back to a full reload instead of HMR), not correctness. Several files here export
      // components alongside helpers by design — `AuthContext.jsx` (`AuthProvider` + `useAuth`,
      // the standard context+hook pairing), `src/components/ui/button.jsx` (shadcn/ui-generated;
      // `Button` + `buttonVariants`, not meant to be hand-edited per CLAUDE.md), and
      // `DataTable.jsx` (`DataTable` + the `textCell`/`numberCell`/`dateCell`/`selectCell` helpers
      // documented in CLAUDE.md as shared across the CRUD pages). Splitting those apart would be
      // a structural rewrite of existing conventions, not a lint fix.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    // Root-level tooling configs (vite/vitest/tailwind/postcss/pwa-assets) run under Node, not
    // the browser, and some (tailwind.config.js) still use `require()` alongside `export default`.
    files: ['*.config.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
  },
])
