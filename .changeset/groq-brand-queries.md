---
'next-sanity': minor
---

feat: infer `sanityFetch` and `usePresentationQuery` types from branded `.groq` queries

Keep a query in its own `.groq` file, import it, and `sanityFetch` and `usePresentationQuery` know what comes back and which params it needs. You don't pass a generic, and you don't need a `SanityQueries` entry.

Before, the result type came from a TypeGen `SanityQueries` registration or a hand-written annotation, and `params` accepted any object:

```ts
const postsBySearch = defineQuery(
  `*[_type == "post" && title match $q] | order(publishedAt desc) [$start...$end] {_id, title, slug}`,
)

// `data` is typed only if `sanity typegen` registered this exact string in `SanityQueries`.
// `params` is plain `QueryParams`, so a typo in `$start` slips through.
const {data} = await sanityFetch({query: postsBySearch, params: {q, start: 0, end: 10}})
```

After:

```ts
import postsBySearch from './postsBySearch.groq' with {type: 'text'}

const {data} = await sanityFetch({query: postsBySearch, params: {q, start: 0, end: 10}})
//     ^? the query's result type, stega-branded unless you pass `stega: false`
await sanityFetch({query: postsBySearch, params: {q}})
//                                       ^^^^^^ error: `start` and `end` are missing

// In a Client Component, with `<VisualEditing />` on the page:
const {data: preview} = usePresentationQuery({query: postsBySearch, params: {q, start: 0, end: 10}})
//     ^? the same result type while Presentation Tool is connected, otherwise `null`
```

This works with any query string that carries the `__groqResult` and `__groqParams` brands. The default export of a `.groq` file imported through [`@sanity-labs/groq-content-mapper`](https://github.com/sanity-labs/groq-content-mapper) is one. The mapper runs on TypeScript 7.1 and later with `tsc --runExternalCode`, and is configured in `tsconfig.json`:

```jsonc
{
  "contentMappers": [
    {
      "package": "@sanity-labs/groq-content-mapper",
      "extensions": [".groq"],
      "options": {
        "schema": "./schema.json", // the file `sanity schema extract` writes by default
        // "schemas": [{"include": "src/queries/shop", "schema": "schemas/shop.json"}], // only needed if you query more than one project or dataset
      },
    },
  ],
}
```

Reading the brand is experimental, both in `@sanity/client` and here, and it follows `@sanity-labs/groq-content-mapper` as that package evolves. Plain strings, `defineQuery`, TypeGen `SanityQueries` registrations, explicit type arguments and wrappers that are generic over the query string resolve exactly as before. Leaving `params` out is still accepted for every query, as it is for `client.fetch`.

Raised minimums, all for the new types:

- `@sanity/client` dependency `^7.28.0` (was `^7.27.0`) and peer `^7.28.0 || ^8.11.0` (was `^7.26.2 || ^8.0.0`). These are the first v7 and v8 releases that export `ClientParams` and read the brand in `ClientReturn`. `@sanity/client` v7 stays supported, so Node 20 apps keep working.
- `@sanity/visual-editing` `^6.2.0` (was `^6.0.4`), the first release whose `usePresentationQuery` checks `params` against the brand. Its `engines.node` is `>=22.12`, the same as the `6.0.4` this replaces, so this bump doesn't change the Node versions `next-sanity` actually needs. `next-sanity`'s own `engines.node` is unchanged.

`client.fetch` on a client from `next-sanity`'s `createClient` infers the same types.
