import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    files: ['**/*.ts'],
    extends: [tseslint.configs.recommended, prettier],
    rules: {
      'no-console': 'error',
    },
  },
);
