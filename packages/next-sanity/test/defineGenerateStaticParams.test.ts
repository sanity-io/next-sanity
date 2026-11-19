import {describe, expect, expectTypeOf, test, vi} from 'vitest'

import {
  defineGenerateStaticParams,
  type DefineGenerateStaticParamsOptions,
  type GenerateStaticParams,
  type GenerateStaticParamsType,
  type SanityClient,
  type SlugDocumentType,
} from '../src/index'

function createMockClient(result: Array<{slug: string}>) {
  const fetch = vi.fn(async (..._args: unknown[]) => result)
  // oxlint-disable-next-line no-unsafe-type-assertion
  const client = {fetch} as unknown as SanityClient
  return {client, fetch}
}

describe('defineGenerateStaticParams runtime', () => {
  test('fetches published documents of the type that have a slug', async () => {
    const {client, fetch} = createMockClient([{slug: 'first'}, {slug: 'second'}])

    const {generateStaticParams} = defineGenerateStaticParams({client, type: 'post'})
    expect(fetch).not.toHaveBeenCalled()
    const params = await generateStaticParams()

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith(
      '*[_type == $type && defined(slug.current)]{"slug": slug.current}',
      {type: 'post'},
      {perspective: 'published', stega: false},
    )
    expect(params).toEqual([{slug: 'first'}, {slug: 'second'}])
  })

  test('only varies the query params with `type`', async () => {
    const {client, fetch} = createMockClient([{slug: 'one'}])

    await defineGenerateStaticParams({client, type: 'project'}).generateStaticParams()

    expect(fetch).toHaveBeenCalledWith(expect.any(String), {type: 'project'}, expect.anything())
  })

  test('returns a placeholder slug when there are no documents', async () => {
    const {client} = createMockClient([])

    const params = await defineGenerateStaticParams({client, type: 'post'}).generateStaticParams()

    expect(params).toEqual([{slug: '__placeholder__'}])
  })
})

describe('defineGenerateStaticParams types', () => {
  // No test or source file in this package registers `SanityTypegen`, so the type resolves to the fallback.
  test('falls back to string without registered TypeGen types', () => {
    expectTypeOf<GenerateStaticParamsType>().toEqualTypeOf<string>()
    expectTypeOf<DefineGenerateStaticParamsOptions['type']>().toEqualTypeOf<string>()
    expectTypeOf<
      ReturnType<typeof defineGenerateStaticParams>
    >().toEqualTypeOf<GenerateStaticParams>()
    expectTypeOf<Awaited<ReturnType<GenerateStaticParams['generateStaticParams']>>>().toEqualTypeOf<
      Array<{slug: string}>
    >()
  })

  test('only allows document types with a top-level slug', () => {
    type Slug = {_type: 'slug'; current?: string; source?: string}
    type Post = {_id: string; _type: 'post'; title?: string; slug?: Slug}
    type Project = {_id: string; _type: 'project'; slug: Slug}
    type Settings = {_id: string; _type: 'settings'; title?: string}
    type Page = {_id: string; _type: 'page'; seo?: {slug?: Slug}}
    type StringSlug = {_id: string; _type: 'stringSlug'; slug?: string}
    type SlugObject = {_type: 'objectWithSlug'; slug?: Slug}
    type AllSchemaTypes = Slug | Post | Project | Settings | Page | StringSlug | SlugObject

    type Allowed = SlugDocumentType<AllSchemaTypes>
    expectTypeOf<Allowed>().toEqualTypeOf<'post' | 'project'>()
    expectTypeOf<'post'>().toExtend<Allowed>()
    expectTypeOf<'project'>().toExtend<Allowed>()
    expectTypeOf<'settings'>().not.toExtend<Allowed>()
    expectTypeOf<'page'>().not.toExtend<Allowed>()
    expectTypeOf<'stringSlug'>().not.toExtend<Allowed>()
    expectTypeOf<'objectWithSlug'>().not.toExtend<Allowed>()
    expectTypeOf<'slug'>().not.toExtend<Allowed>()
  })

  test('reads the types registered on `SanityTypegen`', () => {
    type Registered = {
      AllSanitySchemaTypes:
        | {_id: string; _type: 'post'; slug?: {current?: string}}
        | {_id: string; _type: 'settings'}
    }
    expectTypeOf<GenerateStaticParamsType<Registered>>().toEqualTypeOf<'post'>()
  })
})
