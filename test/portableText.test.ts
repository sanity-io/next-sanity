import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {createPortableTextComponent} from '../src'

const blocks = [
  {
    _key: 'a',
    _type: 'block',
    style: 'normal',
    children: [{_key: 'z', _type: 'span', text: 'Portable'}],
  },
  {
    _key: 'b',
    _type: 'image',
    asset: {
      _ref: 'image-61ab90e8be7a74ef2ce4d84bf3d544fc4115b2d8-400x400-png',
    },
  },
]

test('pt: can render portable text', () => {
  const PortableText = createPortableTextComponent({
    projectId: 'next',
    dataset: 'js',
    serializers: {text: ({children}) => `[text]${children}[/text]`},
  })

  expect(renderToStaticMarkup(React.createElement(PortableText, {blocks}))).toMatchInlineSnapshot(
    `"<div><p>[text]Portable[/text]</p><figure><img src=\\"https://cdn.sanity.io/images/next/js/61ab90e8be7a74ef2ce4d84bf3d544fc4115b2d8-400x400.png\\"/></figure></div>"`
  )
})

test('pt: can override serializers', () => {
  const PortableText = createPortableTextComponent({
    projectId: 'next',
    dataset: 'js',
    serializers: {text: ({children}) => `[text]${children}[/text]`},
  })

  const text = ({children}) => `Fancy: ${children}`

  expect(
    renderToStaticMarkup(React.createElement(PortableText, {blocks, serializers: {text}}))
  ).toMatchInlineSnapshot(
    `"<div><p>Fancy: Portable</p><figure><img src=\\"https://cdn.sanity.io/images/next/js/61ab90e8be7a74ef2ce4d84bf3d544fc4115b2d8-400x400.png\\"/></figure></div>"`
  )
})
