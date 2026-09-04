import type {ClientConfig, SanityClient} from '@sanity/client'
import {evaluate, parse} from 'groq-js'
import {
  defineGenerateStaticParams,
  STATIC_PARAMS_PLACEHOLDER,
  type StaticParams,
} from 'next-sanity/static-params'
import {describe, expect, expectTypeOf, test, vi} from 'vitest'

const dataset = [
  {
    _id: 'a',
    _type: 'post',
    slug: {current: 'aliens'},
    category: {_ref: 'sci-fi'},
    publishedAt: '1979-05-25',
  },
  {_id: 'b', _type: 'post', slug: {current: 'prometheus'}, category: {_ref: 'sci-fi'}},
  {
    _id: 'c',
    _type: 'post',
    slug: {current: 'aliens'},
    category: {_ref: 'horror'},
    publishedAt: '1986-07-18',
  },
  {_id: 'd', _type: 'post', category: {_ref: 'sci-fi'}},
  {_id: 'e', _type: 'author', slug: {current: 'ridley-scott'}},
  {_id: 'sci-fi', _type: 'category', slug: {current: 'sci-fi'}},
  {_id: 'horror', _type: 'category', slug: {current: 'horror'}},
  {_id: 'doc-1', _type: 'doc', slug: {current: 'guides/getting-started'}},
  {_id: 'doc-2', _type: 'doc', slug: {current: 'reference'}},
]

const postQuery = `*[_type == "post" && slug.current == $slug][0]{title, "slug": slug.current, publishedAt}`
const categoryPostQuery = `*[_type == "post" && category->slug.current == $category && slug.current == $slug][0]{title}`
const docQuery = `*[_type == "doc" && string::split(slug.current, "/") == $path][0]{title}`

function createFakeClient(rows?: unknown) {
  const withConfig = vi.fn()
  const fetch = vi.fn(async (query: string, params: Record<string, unknown>) => {
    if (rows !== undefined) return rows
    const value = await evaluate(parse(query), {dataset, params})
    return value.get()
  })
  const client = {withConfig, fetch}
  withConfig.mockReturnValue(client)
  // oxlint-disable-next-line no-unsafe-type-assertion
  return {client: client as unknown as SanityClient, withConfig, fetch}
}

describe('query inference', () => {
  test('a single binding drops [0] and the projection and keeps the type constraint', () => {
    const {client} = createFakeClient()
    const {query} = defineGenerateStaticParams({client, query: postQuery})
    expect(query).toBe('*[_type == "post" && defined(slug.current)]{"slug": slug.current}')
  })

  test('two bindings, one through a dereference', () => {
    const {client} = createFakeClient()
    const {query} = defineGenerateStaticParams({client, query: categoryPostQuery})
    expect(query).toBe(
      '*[_type == "post" && defined(category->.slug.current) && defined(slug.current)]{"category": category->.slug.current, "slug": slug.current}',
    )
  })

  test('the param may sit on the left side of ==', () => {
    const {client} = createFakeClient()
    const {query} = defineGenerateStaticParams({
      client,
      query: '*[_type == "post" && $slug == slug.current][0]',
    })
    expect(query).toBe('*[_type == "post" && defined(slug.current)]{"slug": slug.current}')
  })

  test('a computed binding keeps the whole expression', () => {
    const {client} = createFakeClient()
    const {query} = defineGenerateStaticParams({
      client,
      query: docQuery,
      fallback: {path: [STATIC_PARAMS_PLACEHOLDER]},
    })
    expect(query).toBe(
      '*[_type == "doc" && defined(string::split(slug.current, "/"))]{"path": string::split(slug.current, "/")}',
    )
  })

  test('non-binding conjuncts stay in the filter, printed by groq-js', () => {
    const {client} = createFakeClient()
    const {query} = defineGenerateStaticParams({
      client,
      query:
        '*[_type == "post" && defined(publishedAt) && publishedAt < now() && !(_id in path("drafts.**")) && slug.current == $slug][0]{title}',
    })
    expect(query).toBe(
      '*[_type == "post" && global::defined(publishedAt) && publishedAt < global::now() && !(_id in global::path("drafts.**")) && defined(slug.current)]{"slug": slug.current}',
    )
    expect(parse(query)).toEqual(
      parse(
        '*[_type == "post" && defined(publishedAt) && publishedAt < now() && !(_id in path("drafts.**")) && defined(slug.current)]{"slug": slug.current}',
      ),
    )
  })

  test('a parenthesized binding and chained filters are accepted', () => {
    const {client} = createFakeClient()
    expect(
      defineGenerateStaticParams({
        client,
        query: '*[_type == "post" && (slug.current == $slug)][0]',
      }).query,
    ).toBe('*[_type == "post" && defined(slug.current)]{"slug": slug.current}')
    expect(
      defineGenerateStaticParams({
        client,
        query: '*[_type == "post"][slug.current == $slug][0]{title}',
      }).query,
    ).toBe('*[_type == "post" && defined(slug.current)]{"slug": slug.current}')
  })

  test('the page order, slice, and attribute access after the filter are dropped', () => {
    const {client} = createFakeClient()
    const {query} = defineGenerateStaticParams({
      client,
      query:
        '*[_type == "post" && slug.current == $slug] | order(publishedAt desc)[0...10]{title}.title',
    })
    expect(query).toBe('*[_type == "post" && defined(slug.current)]{"slug": slug.current}')
  })

  test('params outside the root filter are ignored because that part is dropped', () => {
    const {client} = createFakeClient()
    const {query} = defineGenerateStaticParams({
      client,
      query:
        '*[_type == "post" && slug.current == $slug][0]{title, "related": *[_type == "post" && slug.current != $slug && language == $locale][0...3]{title}}',
    })
    expect(query).toBe('*[_type == "post" && defined(slug.current)]{"slug": slug.current}')
  })

  test('order and limit', () => {
    const {client} = createFakeClient()
    const {query} = defineGenerateStaticParams({
      client,
      query: postQuery,
      order: '_updatedAt desc',
      limit: 100,
    })
    expect(query).toBe(
      '*[_type == "post" && defined(slug.current)] | order(_updatedAt desc)[0...100]{"slug": slug.current}',
    )
  })
})

describe('definition-time validation', () => {
  test('a syntax error names the position and keeps the GroqSyntaxError as cause', () => {
    const {client} = createFakeClient()
    try {
      defineGenerateStaticParams({client, query: '*[_type == "post" && slug.current == $slug!!]'})
      expect.unreachable()
    } catch (error) {
      expect(error).toMatchObject({cause: {name: 'GroqSyntaxError', position: 41}})
      expect(error).toMatchInlineSnapshot(`
        [Error: defineGenerateStaticParams: invalid GROQ in query at position 41
          "*[_type == \\"post\\" && slug.current == $slug!!]"
          Syntax error in GROQ query at position 41: Unexpected end of query]
      `)
    }
  })

  test.each([
    ['*[_type == "post" && slug.current match $slug][0]', 'slug.current match $slug'],
    [
      '*[_type == "post" && references($ref) && slug.current == $slug][0]',
      'global::references($ref)',
    ],
    [
      '*[_type == "post" && (slug.current == $slug || _id == $slug)][0]',
      '(slug.current == $slug || _id == $slug)',
    ],
    ['*[_type == "post" && slug.current == $slug + $suffix][0]', 'slug.current == $slug + $suffix'],
    ['*[_type == "post" && $slug == slug.current + $suffix][0]', '$slug == slug.current + $suffix'],
  ])('rejects a $param that is not bound with == in %s', (query, offending) => {
    const {client} = createFakeClient()
    expect(() => defineGenerateStaticParams({client, query})).toThrow(
      `defineGenerateStaticParams: every $param in the root filter must be bound as \`<expression> == $param\` in a top-level &&, found ${offending}`,
    )
  })

  test('rejects a binding between two params', () => {
    const {client} = createFakeClient()
    expect(() =>
      defineGenerateStaticParams({client, query: '*[_type == "post" && $a == $b][0]'}),
    ).toThrow('defineGenerateStaticParams: `$a == $b` binds a param to another param')
  })

  test('rejects a param bound twice', () => {
    const {client} = createFakeClient()
    expect(() =>
      defineGenerateStaticParams({
        client,
        query: '*[_type == "post" && slug.current == $slug && _id == $slug][0]',
      }),
    ).toThrow('defineGenerateStaticParams: `$slug` is bound twice, by slug.current and _id')
  })

  test.each([
    '*[_type == "post"][0]',
    '*[_type == "post" && defined(slug.current)]{"slug": slug.current}',
  ])('rejects a query without bindings: %s', (query) => {
    const {client} = createFakeClient()
    expect(() => defineGenerateStaticParams({client, query})).toThrow(
      'defineGenerateStaticParams: the query binds no $param, add a conjunct such as `slug.current == $slug`',
    )
  })

  test.each([
    '{"post": *[_type == "post" && slug.current == $slug][0]}',
    '*{title}',
    '*[_type == "post"]{title}[slug.current == $slug][0]',
  ])('rejects a query that does not start with a filter on *: %s', (query) => {
    const {client} = createFakeClient()
    expect(() => defineGenerateStaticParams({client, query})).toThrow(
      'defineGenerateStaticParams: the query must start with `*[...]`',
    )
  })

  test('rejects an order clause that does not parse', () => {
    const {client} = createFakeClient()
    expect(() =>
      defineGenerateStaticParams({client, query: postQuery, order: 'desc _updatedAt'}),
    ).toThrow(/invalid GROQ in query/)
  })

  test('rejects a non-positive limit', () => {
    const {client} = createFakeClient()
    expect(() => defineGenerateStaticParams({client, query: postQuery, limit: 0})).toThrow(
      '`limit` must be a positive integer, got 0',
    )
  })

  test('rejects a fallback key that is not a bound param', () => {
    const {client} = createFakeClient()
    expect(() =>
      defineGenerateStaticParams({client, query: postQuery, fallback: {slugg: 'x'}}),
    ).toThrow(
      'defineGenerateStaticParams: `fallback.slugg` does not match a $param, bound params: slug',
    )
  })

  test.each<StaticParams>([
    {slug: ''},
    {path: []},
    {path: ['']},
    {path: ['ok', '']},
    {category: 'ok', slug: ''},
  ])('rejects the fallback %j at definition time', (fallback) => {
    const {client} = createFakeClient()
    const params = Object.keys(fallback)
    const key = params.at(-1)
    const query = `*[_type == "post" && ${params.map((name) => `slug.current == $${name}`).join(' && ')}][0]`
    expect(() => defineGenerateStaticParams({client, query, fallback})).toThrow(
      new TypeError(
        `defineGenerateStaticParams: \`fallback.${key}\` must be a non-empty string or a non-empty array of non-empty strings`,
      ),
    )
  })
})

describe('generateStaticParams', () => {
  test('reconfigures the client for build-time reads', () => {
    const {client, withConfig} = createFakeClient()
    defineGenerateStaticParams({client, query: postQuery})
    expect(withConfig).toHaveBeenCalledExactlyOnceWith({
      perspective: 'published',
      useCdn: true,
      stega: false,
      resultSourceMap: false,
    } satisfies ClientConfig)
  })

  test('maps documents to params, drops null values, and removes duplicates', async () => {
    const {client} = createFakeClient()
    const {generateStaticParams} = defineGenerateStaticParams({client, query: postQuery})
    const result = await generateStaticParams()
    expectTypeOf(result).toEqualTypeOf<Record<string, string>[]>()
    expect(result).toEqual([{slug: 'aliens'}, {slug: 'prometheus'}])
  })

  test('the Shape generic types the result', async () => {
    const {client} = createFakeClient()
    const {generateStaticParams} = defineGenerateStaticParams<{slug: string}>({
      client,
      query: postQuery,
    })
    expectTypeOf(await generateStaticParams()).toEqualTypeOf<{slug: string}[]>()
  })

  test('kept conjuncts run against the dataset', async () => {
    const {client} = createFakeClient()
    const {generateStaticParams} = defineGenerateStaticParams({
      client,
      query: '*[_type == "post" && defined(publishedAt) && slug.current == $slug][0]{title}',
    })
    await expect(generateStaticParams()).resolves.toEqual([{slug: 'aliens'}])
  })

  test('without parent params every binding is emitted', async () => {
    const {client} = createFakeClient()
    const {generateStaticParams} = defineGenerateStaticParams({client, query: categoryPostQuery})
    await expect(generateStaticParams()).resolves.toEqual([
      {category: 'sci-fi', slug: 'aliens'},
      {category: 'sci-fi', slug: 'prometheus'},
      {category: 'horror', slug: 'aliens'},
    ])
  })

  test('a parent param turns its binding into a constraint', async () => {
    const {client, fetch} = createFakeClient()
    const {generateStaticParams} = defineGenerateStaticParams({client, query: categoryPostQuery})
    await expect(generateStaticParams({params: {category: 'horror'}})).resolves.toEqual([
      {slug: 'aliens'},
    ])
    expect(fetch).toHaveBeenLastCalledWith(
      '*[_type == "post" && category->.slug.current == $category && defined(slug.current)]{"slug": slug.current}',
      {category: 'horror'},
    )
    await expect(generateStaticParams({params: {category: 'drama'}})).resolves.toEqual([
      {slug: STATIC_PARAMS_PLACEHOLDER},
    ])
  })

  test('parent params that are not bound in the query are ignored', async () => {
    const {client, fetch} = createFakeClient()
    const {generateStaticParams} = defineGenerateStaticParams({client, query: postQuery})
    await expect(generateStaticParams({params: {perspective: 'published'}})).resolves.toEqual([
      {slug: 'aliens'},
      {slug: 'prometheus'},
    ])
    expect(fetch).toHaveBeenLastCalledWith(expect.any(String), {})
  })

  test('rejects a call whose parent params cover every binding', async () => {
    const {client} = createFakeClient()
    const {generateStaticParams} = defineGenerateStaticParams({client, query: postQuery})
    await expect(generateStaticParams({params: {slug: 'aliens'}})).rejects.toThrow(
      'defineGenerateStaticParams: the parent params already bind every $param, nothing is left to generate',
    )
  })

  test('catch-all params are arrays of strings when the fallback says so', async () => {
    const {client} = createFakeClient()
    const {generateStaticParams} = defineGenerateStaticParams({
      client,
      query: docQuery,
      fallback: {path: [STATIC_PARAMS_PLACEHOLDER]},
    })
    const result = await generateStaticParams()
    expectTypeOf(result).toEqualTypeOf<{path: string[]}[]>()
    expect(result).toEqual([{path: ['guides', 'getting-started']}, {path: ['reference']}])
  })

  test('drops rows whose value has the wrong kind for the fallback', async () => {
    const {client} = createFakeClient([
      {slug: 'ok'},
      {slug: ['not', 'a', 'string']},
      {slug: 42},
      null,
      {slug: 'ok-2'},
    ])
    const {generateStaticParams} = defineGenerateStaticParams({client, query: postQuery})
    await expect(generateStaticParams()).resolves.toEqual([{slug: 'ok'}, {slug: 'ok-2'}])
  })

  test('drops rows with an empty string or an empty catch-all', async () => {
    const {client} = createFakeClient([{slug: ''}, {slug: 'ok'}])
    const {generateStaticParams} = defineGenerateStaticParams({client, query: postQuery})
    await expect(generateStaticParams()).resolves.toEqual([{slug: 'ok'}])

    const catchAll = createFakeClient([{path: []}, {path: ['a', '']}, {path: ['a', 'b']}])
    const docs = defineGenerateStaticParams({
      client: catchAll.client,
      query: docQuery,
      fallback: {path: ['_']},
    })
    await expect(docs.generateStaticParams()).resolves.toEqual([{path: ['a', 'b']}])
  })

  test('returns the placeholder when nothing matches', async () => {
    const {client} = createFakeClient()
    const {generateStaticParams} = defineGenerateStaticParams({
      client,
      query: '*[_type == "movie" && slug.current == $slug][0]',
    })
    await expect(generateStaticParams()).resolves.toEqual([{slug: '__placeholder__'}])
    expect(STATIC_PARAMS_PLACEHOLDER).toBe('__placeholder__')
  })

  test('returns the explicit fallback when nothing matches', async () => {
    const {client} = createFakeClient([{path: []}])
    const {generateStaticParams} = defineGenerateStaticParams({
      client,
      query: docQuery,
      fallback: {path: ['nothing', 'here']},
    })
    await expect(generateStaticParams()).resolves.toEqual([{path: ['nothing', 'here']}])
  })

  test('throws when the query result is not an array', async () => {
    const {client} = createFakeClient({slug: 'not-a-list'})
    const {generateStaticParams} = defineGenerateStaticParams({client, query: postQuery})
    await expect(generateStaticParams()).rejects.toThrow(
      'expected the query to return an array, got object',
    )
  })
})
