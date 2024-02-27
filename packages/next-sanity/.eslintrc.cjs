module.exports = {
  root: true,
  plugins: ['simple-import-sort'],
  extends: ['sanity/react', 'sanity/typescript', 'plugin:@next/next/recommended', 'prettier'],
  rules: {
    'simple-import-sort/imports': 'warn',
    'simple-import-sort/exports': 'warn',
    'react-hooks/exhaustive-deps': 'error',
  },
}
