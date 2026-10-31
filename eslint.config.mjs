// ESLint flat config per Astro + TypeScript.
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

export default [
  {
    ignores: ['dist/', '.astro/', 'node_modules/'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    // Codice che gira su Node: Netlify Functions e file di configurazione.
    // `globals.node` include anche le API web del runtime (fetch, Response,
    // URL), quindi copre le funzioni in stile v2.
    files: ['netlify/**/*.mjs', '*.config.mjs'],
    languageOptions: {
      globals: globals.node,
    },
  },
];
