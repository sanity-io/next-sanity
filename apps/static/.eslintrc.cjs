const path = require('path')
const {readGitignoreFiles} = require('eslint-gitignore')

module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  ignorePatterns: readGitignoreFiles({cwd: path.resolve('../..', __dirname)}),
  plugins: ['simple-import-sort'],
  extends: ['next/core-web-vitals', 'prettier'],
  rules: {
    'simple-import-sort/imports': 'warn',
    'simple-import-sort/exports': 'warn',
    'jsx-a11y/alt-text': 'off',
  },
}
