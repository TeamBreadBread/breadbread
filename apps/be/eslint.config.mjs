import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    files: ['**/*.ts'],
    extends: [tseslint.configs.recommended, prettier],
    rules: {
      'no-console': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'none',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  // generate-openapi.ts는 콘솔 출력이 의도적
  {
    files: ['scripts/generate-openapi.ts'],
    rules: {
      'no-console': 'off',
    },
  },
);