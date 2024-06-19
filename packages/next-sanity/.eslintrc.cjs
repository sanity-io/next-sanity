module.exports = {
  root: true,
  plugins: ['simple-import-sort', 'react', 'react-hooks', 'react-compiler'],
  extends: [
    'sanity/react',
    'sanity/typescript',
    'prettier',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  rules: {
    'simple-import-sort/imports': 'warn',
    'simple-import-sort/exports': 'warn',
    'react-hooks/exhaustive-deps': 'error',
    'react-compiler/react-compiler': 'error',
    'dot-notation': 'off',
  },
}
