import {VisualEditing} from 'next-sanity/visual-editing'
import {draftMode} from 'next/headers'

import {SanityLive} from '../sanity'
import {PresentationStatus} from './PresentationStatus'

export default async function SiteLayout({children}: {children: React.ReactNode}) {
  const {isEnabled} = await draftMode()
  return (
    <>
      <p id="draft-mode">{isEnabled ? 'DRAFT' : 'PUBLISHED'}</p>
      <PresentationStatus />
      {children}
      <SanityLive includeDrafts={isEnabled} />
      {isEnabled && <VisualEditing />}
    </>
  )
}
