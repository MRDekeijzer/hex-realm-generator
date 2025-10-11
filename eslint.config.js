import js from '@eslint/js';
import globals from 'globals';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import prettierConfig from 'eslint-config-prettier';

/** @typedef {import('eslint').Linter.FlatConfig} FlatConfig */
/** @typedef {import('eslint').Linter.RulesRecord} RulesRecord */

/**
 * Narrows a plugin module to an object that may expose flat configs.
 * @param {unknown} plugin
 * @returns {{ configs?: unknown }}
 */
const ensurePlugin = (plugin) => {
  if (typeof plugin === 'object' && plugin !== null) {
    return /** @type {{ configs?: unknown }} */ (plugin);
  }

  return /** @type {{ configs?: unknown }} */ ({});
};

/**
 * Narrows a formatter module to an object that may expose rules.
 * @param {unknown} module
 * @returns {{ rules?: unknown }}
 */
const ensureRulesModule = (module) => {
  if (typeof module === 'object' && module !== null) {
    return /** @type {{ rules?: unknown }} */ (module);
  }

  return /** @type {{ rules?: unknown }} */ ({});
};

/**
 * Safely normalizes plugin configs to ensure we only work with plain objects.
 * @param {unknown} configs
 * @returns {Record<string, FlatConfig>}
 */
const normalizePluginConfigs = (configs) => {
  if (typeof configs === 'object' && configs !== null) {
    return /** @type {Record<string, FlatConfig>} */ (configs);
  }

  return {};
};

/**
 * Ensures rule collections are treated as typed rule records.
 * @param {unknown} rules
 * @returns {RulesRecord}
 */
const normalizeRules = (rules) => {
  if (typeof rules === 'object' && rules !== null) {
    return /** @type {RulesRecord} */ (rules);
  }

  return {};
};

const tsPluginModule = ensurePlugin(tsPlugin);
const reactPluginModule = ensurePlugin(reactPlugin);
const hooksPluginModule = ensurePlugin(hooksPlugin);
const jsxA11yPluginModule = ensurePlugin(jsxA11yPlugin);
const jsPluginModule = ensurePlugin(js);
const prettierModule = ensureRulesModule(prettierConfig);

const tsPluginConfigs = normalizePluginConfigs(tsPluginModule.configs);
const reactPluginConfigs = normalizePluginConfigs(reactPluginModule.configs);
const hooksPluginConfigs = normalizePluginConfigs(hooksPluginModule.configs);
const a11yPluginConfigs = normalizePluginConfigs(jsxA11yPluginModule.configs);
const jsConfigs = normalizePluginConfigs(jsPluginModule.configs);

const recommendedTypeChecked =
  tsPluginConfigs['recommended-type-checked'] ?? tsPluginConfigs.recommendedTypeChecked;
const stylisticTypeChecked =
  tsPluginConfigs['stylistic-type-checked'] ?? tsPluginConfigs.stylisticTypeChecked;

const combinedTsRules = {
  ...normalizeRules(recommendedTypeChecked?.rules),
  ...normalizeRules(stylisticTypeChecked?.rules),
};

const combinedReactRules = {
  ...normalizeRules(reactPluginConfigs.recommended?.rules),
  ...normalizeRules(reactPluginConfigs['jsx-runtime']?.rules),
};

const combinedHooksRules = normalizeRules(hooksPluginConfigs.recommended?.rules);
const combinedA11yRules = normalizeRules(a11yPluginConfigs.recommended?.rules);
const prettierOverrideRules = normalizeRules(prettierModule.rules);
const jsRecommendedRules = normalizeRules(jsConfigs.recommended?.rules);

// ESLint flat config aligned with TypeScript + React best practices
export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'prettier.config.js', 'tailwind.config.ts'],
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
      '@typescript-eslint': tsPluginModule,
      react: reactPluginModule,
      'react-hooks': hooksPluginModule,
      'jsx-a11y': jsxA11yPluginModule,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...jsRecommendedRules,
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
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/no-unescaped-entities': 'off',
      'jsx-a11y/label-has-associated-control': 'off',
      'jsx-a11y/no-noninteractive-element-interactions': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
    },
  },
];
