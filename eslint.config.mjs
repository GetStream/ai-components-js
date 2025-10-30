import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import importPlugin from 'eslint-plugin-import';

export default tseslint.config(
  {
    ignores: ['dist'],
  },
  {
    name: 'default',
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['packages/**/src/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      import: importPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      camelcase: 'off',
      semi: ['warn', 'always'],
      eqeqeq: ['error', 'smart'],
      'default-case': 'off',
      'array-callback-return': 'error',
      'arrow-body-style': 'off',
      'comma-dangle': 'off',
      'jsx-quotes': ['error', 'prefer-single'],
      'linebreak-style': ['error', 'unix'],
      'no-console': 'off',
      'no-mixed-spaces-and-tabs': 'warn',
      'no-self-compare': 'error',
      'no-underscore-dangle': 'off',
      'no-use-before-define': 'off',
      'no-useless-concat': 'error',
      'no-var': 'error',
      'no-script-url': 'error',
      'no-continue': 'off',
      'object-shorthand': 'warn',
      'prefer-const': 'warn',
      'require-await': 'off',
      'sort-imports': [
        'error',
        {
          allowSeparatedGroups: true,
          ignoreCase: true,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
        },
      ],
      'sort-keys': 'off',
      'valid-typeof': 'error',
      'max-classes-per-file': 'off',
      'no-unused-expressions': 'off',
      'import/prefer-default-export': 'off',
      'import/extensions': 'off',
      // "import/no-extraneous-dependencies": [
      // 	"warn",
      // 	{
      // 		devDependencies: false,
      // 		optionalDependencies: false,
      // 		peerDependencies: false,
      // 	},
      // ],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-unsafe-function-type': 'error',
      '@typescript-eslint/no-wrapper-object-types': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-empty-function': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-empty-generator-function': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
