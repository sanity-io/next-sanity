// https://ai-schema-preview.vercel.app/?prompt=A+sci+fi+horror+movie+reviews+site
import {defineArrayMember, defineField, defineType} from 'sanity'

export default [
  defineType({
    name: 'movie',
    type: 'document',
    fields: [
      defineField({
        name: 'title',
        type: 'string',
        validation: (rule) => rule.required(),
      }),
      defineField({
        name: 'slug',
        type: 'slug',
        validation: (rule) => rule.required(),
        options: {source: 'title', maxLength: 96},
      }),
      defineField({
        name: 'releaseDate',
        type: 'date',
        validation: (rule) => rule.required(),
      }),
      defineField({name: 'description', type: 'text'}),
      defineField({
        name: 'content',
        type: 'array',
        of: [
          defineArrayMember({type: 'block'}),
          defineArrayMember({type: 'image', options: {hotspot: true}}),
        ],
      }),
      defineField({
        name: 'poster',
        type: 'image',
        options: {hotspot: true},
        validation: (rule) => rule.required(),
      }),
      defineField({name: 'trailer', type: 'url'}),
      defineField({
        name: 'tags',
        type: 'array',
        of: [defineArrayMember({type: 'string'})],
      }),
      defineField({
        name: 'category',
        type: 'reference',
        to: [{type: 'category'}],
        validation: (rule) => rule.required(),
      }),
      defineField({
        name: 'ratings',
        type: 'array',
        of: [defineArrayMember({type: 'rating'})],
      }),
    ],
  }),
  defineType({
    name: 'category',
    type: 'document',
    fields: [
      defineField({
        name: 'title',
        type: 'string',
        validation: (rule) => rule.required(),
      }),
      defineField({
        name: 'slug',
        type: 'slug',
        validation: (rule) => rule.required(),
      }),
      defineField({name: 'description', type: 'text'}),
    ],
  }),
  defineType({
    name: 'rating',
    type: 'object',
    fields: [
      defineField({
        name: 'score',
        type: 'number',
        validation: (rule) => rule.required().min(0).max(10),
      }),
      defineField({name: 'review', type: 'text'}),
      defineField({
        name: 'author',
        type: 'reference',
        to: [{type: 'user'}],
        validation: (rule) => rule.required(),
      }),
      defineField({
        name: 'authorName',
        type: 'string',
        validation: (rule) => rule.required(),
      }),
    ],
  }),
  defineType({
    name: 'review',
    type: 'document',
    fields: [
      defineField({
        name: 'title',
        type: 'string',
        validation: (rule) => rule.required(),
      }),
      defineField({
        name: 'movie',
        type: 'reference',
        to: [{type: 'movie'}],
        validation: (rule) => rule.required(),
      }),
      defineField({
        name: 'slug',
        type: 'slug',
        validation: (rule) => rule.required(),
        options: {source: 'title', maxLength: 96},
      }),
      defineField({
        name: 'publishDate',
        type: 'datetime',
        validation: (rule) => rule.required(),
      }),
      defineField({
        name: 'content',
        type: 'array',
        of: [
          defineArrayMember({type: 'block'}),
          defineArrayMember({type: 'image', options: {hotspot: true}}),
        ],
      }),
      defineField({
        name: 'author',
        type: 'reference',
        to: [{type: 'user'}],
        validation: (rule) => rule.required(),
      }),
      defineField({
        name: 'ratings',
        type: 'array',
        of: [defineArrayMember({type: 'rating'})],
      }),
    ],
  }),
  defineType({
    name: 'user',
    type: 'document',
    fields: [
      defineField({
        name: 'name',
        type: 'string',
        validation: (rule) => rule.required(),
      }),
      defineField({
        name: 'email',
        type: 'string',
        validation: (rule) => rule.required(),
      }),
      defineField({
        name: 'reviews',
        type: 'array',
        of: [defineArrayMember({type: 'review'})],
      }),
      defineField({
        name: 'slug',
        type: 'slug',
        validation: (rule) => rule.required(),
        options: {source: 'name', maxLength: 96},
      }),
      defineField({name: 'avatar', type: 'image'}),
      defineField({
        name: 'favoriteMovies',
        type: 'array',
        of: [defineArrayMember({type: 'reference', to: [{type: 'movie'}]})],
      }),
    ],
  }),
]
