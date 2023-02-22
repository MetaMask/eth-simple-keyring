module.exports = {
  root: true,
  extends: ['@metamask/eslint-config', '@metamask/eslint-config-nodejs'],
  env: {
    commonjs: true,
  },
  overrides: [
    {
      files: ['test/**/*.ts'],
      extends: ['@metamask/eslint-config-jest'],
    },
  ],
  rules: {
    'prettier/prettier': ['error', { endOfLine: 'auto' }],
    'node/no-unpublished-import': 0,
    camelcase: [
      'error',
      {
        allow: ['signTypedData_v1', 'signTypedData_v3', 'signTypedData_v4'],
      },
    ],
  },
  parserOptions: {
    sourceType: 'module',
  },
  ignorePatterns: ['.eslintrc.js'],
  parser: '@typescript-eslint/parser',
};
