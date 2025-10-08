import globals from 'globals';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';

// ESLint flat config
export default [
  {
    // Global ignores
    ignores: ['dist/', 'node_modules/', 'vite.config.ts', 'eslint.config.js'],
  },

  // TypeScript + React files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
  parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': hooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // Merge recommended rules from plugins where available
  ...(tsPlugin.configs?.recommended?.rules),
  ...(reactPlugin.configs?.recommended?.rules),
  ...(reactPlugin.configs?.['jsx-runtime']?.rules),
  ...(hooksPlugin.configs?.recommended?.rules),
  ...(jsxA11yPlugin.configs?.recommended?.rules),
      // Project-specific overrides
      'react/prop-types': 'off', // Not needed with TypeScript
    },
  },
];
