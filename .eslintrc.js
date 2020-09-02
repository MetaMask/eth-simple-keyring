module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2018,
  },
  extends: [
    '@metamask/eslint-config',
    '@metamask/eslint-config/config/nodejs',
  ],
  plugins: [
    'json',
  ],
  overrides: [{
    files: [
      '.eslintrc.js',
    ],
    parserOptions: {
      sourceType: 'script',
    },
  }],
  rules: {
    'camelcase': ['error', {
      'allow': [
        'signTypedData_v1',
        'signTypedData_v3',
        'signTypedData_v4',
      ],
    }],
  },
}
