const path = require('path')

module.exports = {
  root: true,
  plugins: ['simple-import-sort'],
  extends: [
    'sanity/react',
    'sanity/typescript',
    '@sanity/eslint-config-studio',
    'plugin:@next/next/recommended',
    'prettier',
  ],
  rules: {
    'simple-import-sort/imports': 'warn',
    'simple-import-sort/exports': 'warn',
    'react-hooks/exhaustive-deps': 'error',
  },
}
