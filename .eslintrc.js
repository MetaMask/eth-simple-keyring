module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  extends: ['@metamask/eslint-config', '@metamask/eslint-config-nodejs'],

  overrides: [
    {
      files: ['**/*.test.ts'],
      extends: ['@metamask/eslint-config-jest'],
      rules: {
        'node/no-unpublished-require': 0,
      },
    },
    {
      files: ['*.ts'],
      extends: ['@metamask/eslint-config-typescript'],
    },
  ],

  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
    node: {
      tryExtensions: ['.js', '.json', '.node', '.ts'],
    },
  },

  // This is necessary to run eslint on Windows and not get a thousand CRLF errors
  rules: { 'prettier/prettier': ['error', { endOfLine: 'auto' }] },

  ignorePatterns: [
    '!.eslintrc.js',
    '!.prettierrc.js',
    'dist/**/*',
    'jest.config.ts',
  ],
};
