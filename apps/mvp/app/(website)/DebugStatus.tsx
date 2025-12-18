'use client'

import {useVisualEditingEnvironment} from 'next-sanity/hooks'

export function DebugStatus() {
  const environment = useVisualEditingEnvironment()

  // oxlint-disable-next-line no-console
  console.log({environment})

  return (
    <>
      <p>Environment: {JSON.stringify(environment)}</p>
    </>
  )
}
