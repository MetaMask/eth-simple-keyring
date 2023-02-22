module.exports = {
  root: true,
  extends: ['@metamask/eslint-config', '@metamask/eslint-config-nodejs'],
  env: {
    commonjs: true,
  },
  overrides: [
    {
      files: ['test/**/*.js'],
      extends: ['@metamask/eslint-config-jest'],
    },
  ],
  rules: {
    'prettier/prettier': ['error', { endOfLine: 'auto' }],
    camelcase: [
      'error',
      {
        allow: ['signTypedData_v1', 'signTypedData_v3', 'signTypedData_v4'],
      },
    ],
  },
};
