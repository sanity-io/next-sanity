module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['prettier', 'react'],
  extends: [
    'sanity/react',
    'sanity/typescript',
    'plugin:prettier/recommended',
    'plugin:react-hooks/recommended',
  ],
  env: {
    browser: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    'no-undef': 'off',
  },
}
