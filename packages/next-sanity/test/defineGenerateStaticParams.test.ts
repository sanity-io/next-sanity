import type {ClientConfig, SanityClient} from '@sanity/client'
import {evaluate, parse} from 'groq-js'
import {defineGenerateStaticParams} from 'next-sanity/static-params'
import {describe, expect, expectTypeOf, test, vi} from 'vitest'

const dataset = [
  {_id: 'a', _type: 'post', slug: {current: 'aliens'}, category: {_ref: 'sci-fi'}},
  {_id: 'b', _type: 'post', slug: {current: 'prometheus'}, category: {_ref: 'sci-fi'}},
  {_id: 'c', _type: 'post', slug: {current: 'aliens'}, category: {_ref: 'horror'}},
  {_id: 'd', _type: 'post', category: {_ref: 'sci-fi'}},
  {_id: 'e', _type: 'author', slug: {current: 'ridley-scott'}},
  {_id: 'sci-fi', _type: 'category', slug: {current: 'sci-fi'}},
  {_id: 'horror', _type: 'category', slug: {current: 'horror'}},
  {_id: 'doc-1', _type: 'doc', slug: {current: 'guides/getting-started'}},
  {_id: 'doc-2', _type: 'doc', slug: {current: 'reference'}},
]

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

describe('query assembly', () => {
  test('single param', () => {
    const {client} = createFakeClient()
    const {query} = defineGenerateStaticParams({
      client,
      filter: '_type == "post"',
      params: {slug: 'slug.current'},
      fallback: {slug: '_'},
    })
    expect(query).toBe('*[_type == "post"]{"slug": slug.current}')
  })

  test('multiple params keep declaration order', () => {
    const {client} = createFakeClient()
    const {query} = defineGenerateStaticParams({
      client,
      filter: '_type == "post"',
      params: {category: 'category->slug.current', slug: 'slug.current'},
      fallback: {category: '_', slug: '_'},
    })
    expect(query).toBe(
      '*[_type == "post"]{"category": category->slug.current, "slug": slug.current}',
    )
  })

  test('catch-all param', () => {
    const {client} = createFakeClient()
    const {query} = defineGenerateStaticParams({
      client,
      filter: '_type == "doc"',
      params: {path: 'string::split(slug.current, "/")'},
      fallback: {path: ['_']},
    })
    expect(query).toBe('*[_type == "doc"]{"path": string::split(slug.current, "/")}')
  })

  test('order and limit', () => {
    const {client} = createFakeClient()
    const {query} = defineGenerateStaticParams({
      client,
      filter: '_type == "post"',
      params: {slug: 'slug.current'},
      fallback: {slug: '_'},
      order: '_updatedAt desc',
      limit: 100,
    })
    expect(query).toBe('*[_type == "post"] | order(_updatedAt desc)[0...100]{"slug": slug.current}')
  })
})

describe('definition-time validation', () => {
  test('syntax error in a param expression names the key, expression, and position', () => {
    const {client} = createFakeClient()
    expect(() =>
      defineGenerateStaticParams({
        client,
        filter: '_type == "post"',
        params: {slug: 'slug.current!!'},
        fallback: {slug: '_'},
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [Error: defineGenerateStaticParams: invalid GROQ in params.slug at position 11
        "slug.current!!"
        Syntax error in GROQ query at position 11: Unexpected end of query]
    `)
  })

  test('syntax error in the filter', () => {
    const {client} = createFakeClient()
    expect(() =>
      defineGenerateStaticParams({
        client,
        filter: '_type == "post" &&',
        params: {slug: 'slug.current'},
        fallback: {slug: '_'},
      }),
    ).toThrow(/invalid GROQ in filter at position 18\n {2}"_type == \\"post\\" &&"/)
  })

  test('a param expression that would escape the projection is rejected on its own', () => {
    const {client} = createFakeClient()
    expect(() =>
      defineGenerateStaticParams({
        client,
        filter: '_type == "post"',
        params: {slug: 'slug.current}, "x": 1'},
        fallback: {slug: '_'},
      }),
    ).toThrow(/invalid GROQ in params\.slug/)
  })

  test('syntax error in order is reported on the assembled query', () => {
    const {client} = createFakeClient()
    expect(() =>
      defineGenerateStaticParams({
        client,
        filter: '_type == "post"',
        params: {slug: 'slug.current'},
        fallback: {slug: '_'},
        order: 'desc _updatedAt',
      }),
    ).toThrow(/invalid GROQ in query/)
  })

  test('the thrown error keeps the GroqSyntaxError as cause', () => {
    const {client} = createFakeClient()
    try {
      defineGenerateStaticParams({
        client,
        filter: '',
        params: {slug: 'slug.current'},
        fallback: {slug: '_'},
      })
      expect.unreachable()
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect(error).toMatchObject({cause: {name: 'GroqSyntaxError', position: 0}})
    }
  })

  test('rejects an empty params object and a non-positive limit', () => {
    const {client} = createFakeClient()
    expect(() =>
      defineGenerateStaticParams({client, filter: '_type == "post"', params: {}, fallback: {}}),
    ).toThrow(TypeError)
    expect(() =>
      defineGenerateStaticParams({
        client,
        filter: '_type == "post"',
        params: {slug: 'slug.current'},
        fallback: {slug: '_'},
        limit: 0,
      }),
    ).toThrow(/`limit` must be a positive integer, got 0/)
  })

  test.each([{slug: ''}, {path: []}, {path: ['']}, {path: ['ok', '']}, {category: 'ok', slug: ''}])(
    'rejects the fallback %j at definition time',
    (fallback) => {
      const {client} = createFakeClient()
      const key = Object.keys(fallback).at(-1)
      expect(() =>
        defineGenerateStaticParams({
          client,
          filter: '_type == "post"',
          params: Object.fromEntries(Object.keys(fallback).map((name) => [name, 'slug.current'])),
          fallback,
        }),
      ).toThrow(
        new TypeError(
          `defineGenerateStaticParams: \`fallback.${key}\` must be a non-empty string or a non-empty array of non-empty strings`,
        ),
      )
    },
  )
})

describe('generateStaticParams', () => {
  test('reconfigures the client for build-time reads', () => {
    const {client, withConfig} = createFakeClient()
    defineGenerateStaticParams({
      client,
      filter: '_type == "post"',
      params: {slug: 'slug.current'},
      fallback: {slug: '_'},
    })
    expect(withConfig).toHaveBeenCalledExactlyOnceWith({
      perspective: 'published',
      useCdn: true,
      stega: false,
      resultSourceMap: false,
    } satisfies ClientConfig)
  })

  test('maps documents to params, drops null values, and removes duplicates', async () => {
    const {client} = createFakeClient()
    const {generateStaticParams} = defineGenerateStaticParams({
      client,
      filter: '_type == "post"',
      params: {slug: 'slug.current'},
      fallback: {slug: '_'},
    })
    const result = await generateStaticParams()
    expectTypeOf(result).toEqualTypeOf<{slug: string}[]>()
    expect(result).toEqual([{slug: 'aliens'}, {slug: 'prometheus'}])
  })

  test('keeps duplicate slugs apart when another param differs', async () => {
    const {client} = createFakeClient()
    const {generateStaticParams} = defineGenerateStaticParams({
      client,
      filter: '_type == "post"',
      params: {category: 'category->slug.current', slug: 'slug.current'},
      fallback: {category: '_', slug: '_'},
    })
    await expect(generateStaticParams()).resolves.toEqual([
      {category: 'sci-fi', slug: 'aliens'},
      {category: 'sci-fi', slug: 'prometheus'},
      {category: 'horror', slug: 'aliens'},
    ])
  })

  test('catch-all params are arrays of strings', async () => {
    const {client} = createFakeClient()
    const {generateStaticParams} = defineGenerateStaticParams({
      client,
      filter: '_type == "doc"',
      params: {path: 'string::split(slug.current, "/")'},
      fallback: {path: ['_']},
    })
    const result = await generateStaticParams()
    expectTypeOf(result).toEqualTypeOf<{path: string[]}[]>()
    expect(result).toEqual([{path: ['guides', 'getting-started']}, {path: ['reference']}])
  })

  test('drops rows whose value has the wrong kind for the declared fallback', async () => {
    const {client} = createFakeClient([
      {slug: 'ok'},
      {slug: ['not', 'a', 'string']},
      {slug: 42},
      null,
      {slug: 'ok-2'},
    ])
    const {generateStaticParams} = defineGenerateStaticParams({
      client,
      filter: '_type == "post"',
      params: {slug: 'slug.current'},
      fallback: {slug: '_'},
    })
    await expect(generateStaticParams()).resolves.toEqual([{slug: 'ok'}, {slug: 'ok-2'}])
  })

  test('drops rows with an empty string or an empty catch-all', async () => {
    const {client} = createFakeClient([{slug: ''}, {slug: 'ok'}])
    const {generateStaticParams} = defineGenerateStaticParams({
      client,
      filter: '_type == "post"',
      params: {slug: 'slug.current'},
      fallback: {slug: '_'},
    })
    await expect(generateStaticParams()).resolves.toEqual([{slug: 'ok'}])

    const catchAll = createFakeClient([{path: []}, {path: ['a', '']}, {path: ['a', 'b']}])
    const docs = defineGenerateStaticParams({
      client: catchAll.client,
      filter: '_type == "doc"',
      params: {path: 'string::split(slug.current, "/")'},
      fallback: {path: ['_']},
    })
    await expect(docs.generateStaticParams()).resolves.toEqual([{path: ['a', 'b']}])
  })

  test('returns the fallback when only empty catch-alls match', async () => {
    const {client} = createFakeClient([{path: []}])
    const {generateStaticParams} = defineGenerateStaticParams({
      client,
      filter: '_type == "doc"',
      params: {path: 'string::split(slug.current, "/")'},
      fallback: {path: ['__placeholder__']},
    })
    await expect(generateStaticParams()).resolves.toEqual([{path: ['__placeholder__']}])
  })

  test('returns the fallback when nothing matches', async () => {
    const {client} = createFakeClient()
    const {generateStaticParams} = defineGenerateStaticParams({
      client,
      filter: '_type == "movie"',
      params: {slug: 'slug.current'},
      fallback: {slug: '__placeholder__'},
    })
    await expect(generateStaticParams()).resolves.toEqual([{slug: '__placeholder__'}])
  })

  test('forwards parent segment params as GROQ params', async () => {
    const {client, fetch} = createFakeClient()
    const {generateStaticParams} = defineGenerateStaticParams({
      client,
      filter: '_type == "post" && category->slug.current == $category',
      params: {slug: 'slug.current'},
      fallback: {slug: '__placeholder__'},
    })
    await expect(generateStaticParams({params: {category: 'horror'}})).resolves.toEqual([
      {slug: 'aliens'},
    ])
    await expect(generateStaticParams({params: {category: 'drama'}})).resolves.toEqual([
      {slug: '__placeholder__'},
    ])
    expect(fetch).toHaveBeenLastCalledWith(expect.any(String), {category: 'drama'})
  })

  test('throws when the query result is not an array', async () => {
    const {client} = createFakeClient({slug: 'not-a-list'})
    const {generateStaticParams} = defineGenerateStaticParams({
      client,
      filter: '_type == "post"',
      params: {slug: 'slug.current'},
      fallback: {slug: '_'},
    })
    await expect(generateStaticParams()).rejects.toThrow(
      'expected the query to return an array, got object',
    )
  })
})
