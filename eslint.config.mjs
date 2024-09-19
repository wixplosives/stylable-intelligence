import pluginJs from '@eslint/js';
import configPrettier from 'eslint-config-prettier';
import pluginTypescript from 'typescript-eslint';

for (const config of pluginTypescript.configs.recommendedTypeChecked) {
  config.files = ['**/*.{ts,tsx,mts,cts}']; // ensure config only targets TypeScript files
}

/** @type {import('eslint').Linter.Config[]} */
export default [
  { ignores: ['dist/', 'fixtures/', '.vscode-test/'] },
  pluginJs.configs.recommended,
  {
    rules: {
      'no-undef': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  ...pluginTypescript.configs.recommendedTypeChecked,
  { languageOptions: { parserOptions: { projectService: true } } },
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  configPrettier,
];
