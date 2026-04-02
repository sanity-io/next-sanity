import {generateHelpUrl} from '@sanity/generate-help-url'

export function validateStrictSanityLiveProps(props: {includeDrafts?: unknown}): void {
  if (typeof props.includeDrafts !== 'boolean') {
    throw new Error(
      `<SanityLive> requires an explicit \`includeDrafts\` prop (true or false) when \`strict: true\` is set on \`defineLive\`.\n\nMore information: ${generateHelpUrl('next-sanity-live-strict')}`,
      {cause: props},
    )
  }
}

export function validateStrictFetchOptions(options: {
  perspective?: unknown
  stega?: unknown
}): void {
  if (typeof options.perspective === 'undefined' || options.perspective === null) {
    throw new Error(
      `sanityFetch() requires an explicit \`perspective\` option when \`strict: true\` is set on \`defineLive\`.\n\nMore information: ${generateHelpUrl('next-sanity-fetch-strict')}`,
      {cause: options},
    )
  }
  if (typeof options.stega !== 'boolean') {
    throw new Error(
      `sanityFetch() requires an explicit \`stega\` option (true or false) when \`strict: true\` is set on \`defineLive\`.\n\nMore information: ${generateHelpUrl('next-sanity-fetch-strict')}`,
      {cause: options},
    )
  }
}
