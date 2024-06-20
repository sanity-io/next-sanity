import defaults from '@sanity/prettier-config'

export default {
  ...defaults,
  plugins: [...defaults.plugins, 'prettier-plugin-tailwindcss'],
}
