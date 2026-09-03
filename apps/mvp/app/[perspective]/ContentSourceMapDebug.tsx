import type {ContentSourceMap} from 'next-sanity'

export function ContentSourceMapDebug({sourceMap}: {sourceMap: ContentSourceMap | null}) {
  return (
    <script data-sanity-content-source-map type="application/json">
      {JSON.stringify(sourceMap)}
    </script>
  )
}
