import {createGroqBuilder} from 'groqd'

import type {AllSanitySchemaTypes, internalGroqTypeReferenceTo} from './sanity.types.ts'

type SchemaConfig = {
  schemaTypes: AllSanitySchemaTypes
  referenceSymbol: typeof internalGroqTypeReferenceTo
}
export const q = createGroqBuilder<SchemaConfig>()
