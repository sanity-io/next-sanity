import withBundleAnalyzer from '@next/bundle-analyzer'

// function requireResolve(id) {
//   return import.meta.resolve(id).replace('file://', '')
// }

/** @type {import('next').NextConfig} */
const nextConfig = {
  // basePath: process.env.NEXT_PUBLIC_TEST_BASE_PATH,
  // trailingSlash: true,
  experimental: {
    reactCompiler: true,
    // turbo: {
    //   resolveAlias: {
    //     // '@sanity/vision': '@sanity/vision/lib/index.mjs',
    //     // 'sanity/_singletons': 'sanity/lib/_singletons.mjs',
    //     // 'sanity/desk': 'sanity/lib/desk.mjs',
    //     // 'sanity/presentation': 'sanity/lib/presentation.mjs',
    //     // 'sanity/router': 'sanity/lib/router.mjs',
    //     // 'sanity/structure': 'sanity/lib/structure.mjs',
    //     // sanity: 'sanity/lib/index.mjs',
    //     'react-rx': {
    //       browser: 'react-rx/dist/index.compiled.js',
    //     },
    //   },
    // },
  },
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  productionBrowserSourceMaps: true,
  env: {
    // Matches the behavior of `sanity dev` which sets styled-components to use the fastest way of inserting CSS rules in both dev and production. It's default behavior is to disable it in dev mode.
    SC_DISABLE_SPEEDY: 'false',
  },

  async headers() {
    return [
      {
        // @TODO fix Presentation to never load itself recursively in an iframe
        source: '/studio/(.*)?', // Matches all studio routes
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ]
  },
}

export default withBundleAnalyzer({
  // eslint-disable-next-line no-process-env
  enabled: process.env.ANALYZE === 'true',
})(nextConfig)
