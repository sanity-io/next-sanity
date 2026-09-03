import {generateHelpUrl} from '@sanity/generate-help-url'

export function validateStrictFetchOptions(options: {perspective?: unknown}): void {
  if (typeof options.perspective === 'undefined' || options.perspective === null) {
    throw new Error(
      `sanityFetch() requires an explicit \`perspective\` option when \`strict: true\` is set on \`defineLive\` without a \`perspective\` resolver.\n\nMore information: ${generateHelpUrl('next-sanity-fetch-strict')}`,
      {cause: options},
    )
  }
}
