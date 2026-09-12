import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

/**
 * Shared lint rules.
 *
 * Most of what is here is ordinary hygiene. The rules that matter most for this
 * project are the *structural* ones in `./node.js` and `./next.js`: they turn
 * the project's architectural invariants into build failures, so an AI editing
 * one app cannot quietly break another or leak a database credential into a
 * public site.
 */
export const base = tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      // An unused variable is usually a half-finished edit.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // `any` erases the type safety the whole setup depends on.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',

      // A floating promise is how "it saved" turns into "it didn't".
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/require-await': 'error',

      // Prefer explicit narrowing over truthiness on possibly-null values.
      '@typescript-eslint/strict-boolean-expressions': [
        'warn',
        { allowNullableBoolean: true, allowNullableString: true },
      ],

      'no-console': 'off',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
  {
    // Tests may be looser: fixtures are often deliberately malformed.
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  prettier,
);

export default base;
