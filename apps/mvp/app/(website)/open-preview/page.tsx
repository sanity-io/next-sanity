import {draftMode} from 'next/headers'

export default async function OpenPreviewPage() {
  const {isEnabled} = await draftMode()

  return (
    <main>
      <h1>Open preview integration fixture</h1>
      <p data-testid="open-preview-draft-mode">Draft content: {isEnabled ? 'visible' : 'hidden'}</p>
    </main>
  )
}
