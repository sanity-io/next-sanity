/**
 * From: https://github.com/vercel/next.js/blob/5469e6427b54ab7e9876d4c85b47f9c3afdc5c1f/packages/next/src/shared/lib/router/utils/path-has-prefix.ts#L10-L17
 * Checks if a given path starts with a given prefix. It ensures it matches
 * exactly without containing extra chars. e.g. prefix /docs should replace
 * for /docs, /docs/, /docs/a but not /docsss
 * @param path The path to check.
 * @param prefix The prefix to check against.
 */
function pathHasPrefix(path: string, prefix: string): boolean {
  if (typeof path !== 'string') {
    return false
  }

  const {pathname} = parsePath(path)
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

/**
 * From: https://github.com/vercel/next.js/blob/5469e6427b54ab7e9876d4c85b47f9c3afdc5c1f/packages/next/src/shared/lib/router/utils/parse-path.ts#L6-L22
 * Given a path this function will find the pathname, query and hash and return
 * them. This is useful to parse full paths on the client side.
 * @param path A path to parse e.g. /foo/bar?id=1#hash
 */
function parsePath(path: string): {
  pathname: string
  query: string
  hash: string
} {
  const hashIndex = path.indexOf('#')
  const queryIndex = path.indexOf('?')
  const hasQuery = queryIndex > -1 && (hashIndex < 0 || queryIndex < hashIndex)

  if (hasQuery || hashIndex > -1) {
    return {
      pathname: path.substring(0, hasQuery ? queryIndex : hashIndex),
      query: hasQuery ? path.substring(queryIndex, hashIndex > -1 ? hashIndex : undefined) : '',
      hash: hashIndex > -1 ? path.slice(hashIndex) : '',
    }
  }

  return {pathname: path, query: '', hash: ''}
}

/**
 * From: https://github.com/vercel/next.js/blob/5469e6427b54ab7e9876d4c85b47f9c3afdc5c1f/packages/next/src/shared/lib/router/utils/add-path-prefix.ts#L3C1-L14C2
 * Adds the provided prefix to the given path. It first ensures that the path
 * is indeed starting with a slash.
 */
export function addPathPrefix(path: string, prefix?: string): string {
  if (!path.startsWith('/') || !prefix) {
    return path
  }
  // If the path is exactly '/' then return just the prefix
  if (path === '/' && prefix) {
    return prefix
  }

  const {pathname, query, hash} = parsePath(path)
  return `${prefix}${pathname}${query}${hash}`
}

/**
 * From: https://github.com/vercel/next.js/blob/5469e6427b54ab7e9876d4c85b47f9c3afdc5c1f/packages/next/src/shared/lib/router/utils/remove-path-prefix.ts#L3-L39
 * Given a path and a prefix it will remove the prefix when it exists in the
 * given path. It ensures it matches exactly without containing extra chars
 * and if the prefix is not there it will be noop.
 *
 * @param path The path to remove the prefix from.
 * @param prefix The prefix to be removed.
 */
export function removePathPrefix(path: string, prefix: string): string {
  // If the path doesn't start with the prefix we can return it as is. This
  // protects us from situations where the prefix is a substring of the path
  // prefix such as:
  //
  // For prefix: /blog
  //
  //   /blog -> true
  //   /blog/ -> true
  //   /blog/1 -> true
  //   /blogging -> false
  //   /blogging/ -> false
  //   /blogging/1 -> false
  if (!pathHasPrefix(path, prefix)) {
    return path
  }

  // Remove the prefix from the path via slicing.
  const withoutPrefix = path.slice(prefix.length)

  // If the path without the prefix starts with a `/` we can return it as is.
  if (withoutPrefix.startsWith('/')) {
    return withoutPrefix
  }

  // If the path without the prefix doesn't start with a `/` we need to add it
  // back to the path to make sure it's a valid path.
  return `/${withoutPrefix}`
}

/**
 * From: https://github.com/vercel/next.js/blob/dfe7fc03e2268e7cb765dce6a89e02c831c922d5/packages/next/src/client/normalize-trailing-slash.ts#L16
 * Normalizes the trailing slash of a path according to the `trailingSlash` option
 * in `next.config.js`.
 */
export const normalizePathTrailingSlash = (path: string, trailingSlash: boolean): string => {
  const {pathname, query, hash} = parsePath(path)
  if (trailingSlash) {
    if (pathname.endsWith('/')) {
      return `${pathname}${query}${hash}`
    }
    return `${pathname}/${query}${hash}`
  }

  return `${removeTrailingSlash(pathname)}${query}${hash}`
}

/**
 * From: https://github.com/vercel/next.js/blob/dfe7fc03e2268e7cb765dce6a89e02c831c922d5/packages/next/src/shared/lib/router/utils/remove-trailing-slash.ts#L8
 * Removes the trailing slash for a given route or page path. Preserves the
 * root page. Examples:
 *   - `/foo/bar/` -> `/foo/bar`
 *   - `/foo/bar` -> `/foo/bar`
 *   - `/` -> `/`
 */
function removeTrailingSlash(route: string) {
  return route.replace(/\/$/, '') || '/'
}
