import js from '@eslint/js';
import globals from 'globals';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import prettierConfig from 'eslint-config-prettier';

const recommendedTypeChecked =
  tsPlugin.configs['recommended-type-checked'] ?? tsPlugin.configs.recommendedTypeChecked;
const stylisticTypeChecked =
  tsPlugin.configs['stylistic-type-checked'] ?? tsPlugin.configs.stylisticTypeChecked;

const combinedTsRules = {
  ...(recommendedTypeChecked?.rules ?? {}),
  ...(stylisticTypeChecked?.rules ?? {}),
};

const combinedReactRules = {
  ...(reactPlugin.configs.recommended?.rules ?? {}),
  ...(reactPlugin.configs['jsx-runtime']?.rules ?? {}),
};

const combinedHooksRules = hooksPlugin.configs.recommended?.rules ?? {};
const combinedA11yRules = jsxA11yPlugin.configs.recommended?.rules ?? {};
const prettierOverrideRules = prettierConfig?.rules ?? {};

// ESLint flat config aligned with TypeScript + React best practices
export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
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
      ...js.configs.recommended.rules,
      ...combinedTsRules,
      ...combinedReactRules,
      ...combinedHooksRules,
      ...combinedA11yRules,
      ...prettierOverrideRules,
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', disallowTypeAnnotations: false },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
