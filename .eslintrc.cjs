const {readGitignoreFiles} = require('eslint-gitignore')

module.exports = {
  root: true,
  ignorePatterns: readGitignoreFiles({cwd: __dirname}),
  plugins: ['prettier', 'simple-import-sort'],
  extends: [
    'sanity/react',
    'sanity/typescript',
    '@sanity/eslint-config-studio',
    'next/core-web-vitals',
    'plugin:prettier/recommended',
  ],
  rules: {
    'simple-import-sort/imports': 'warn',
    'simple-import-sort/exports': 'warn',
    'react-hooks/exhaustive-deps': 'error',
  },
}
