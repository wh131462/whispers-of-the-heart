// @ts-check
import eslint from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/**
 * Root ESLint configuration for the monorepo
 * Individual apps can extend or override these settings
 */
export default tseslint.config(
  // Global ignores
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/release/**',
    ],
  },

  // Base JavaScript rules
  eslint.configs.recommended,

  // TypeScript rules
  ...tseslint.configs.recommended,

  // Global settings
  {
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
  },

  // TypeScript file rules
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    rules: {
      // Allow explicit any for flexibility (can be overridden per app)
      '@typescript-eslint/no-explicit-any': 'warn',

      // Require proper typing for unused variables
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Prefer const over let when possible
      'prefer-const': 'error',

      // No console in production code (warning to allow debugging)
      'no-console': 'warn',

      // Consistent return types
      '@typescript-eslint/explicit-function-return-type': 'off',

      // Allow empty functions (useful for default callbacks)
      '@typescript-eslint/no-empty-function': 'off',

      // Ban specific types
      '@typescript-eslint/ban-types': 'off',

      // Allow require statements (needed for some CommonJS modules)
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // JavaScript file rules
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    rules: {
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },

  // Test file rules
  {
    files: ['**/*.{test,spec}.{ts,tsx,js,jsx}', '**/__tests__/**'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Config file rules
  {
    files: ['**/*.config.{ts,js,mjs,cjs}', '**/vite.config.*', '**/turbo.json'],
    rules: {
      'no-console': 'off',
    },
  }
)
