import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  typegen: {schema: '../studio/schema.json', formatGeneratedCode: false},
})
