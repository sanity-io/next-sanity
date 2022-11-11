import _config from 'sanity.config'
import {NextStudio, useConfigWithBasePath} from 'src/studio'

export default function StudioPage() {
  const config = useConfigWithBasePath(_config)

  return (
    <NextStudio
      config={config}
      // Turn off login in production so that anyone can look around in the Studio and see how it works
      // eslint-disable-next-line no-process-env
      unstable_noAuthBoundary={process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'}
    />
  )
}
