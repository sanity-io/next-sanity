/**
 * Fallback flow for browsers that reject the draft-mode cookies set from a
 * cross-site Presentation iframe (e.g. Firefox with Enhanced Tracking
 * Protection configured to block all third-party cookies, where even CHIPS
 * `Partitioned` cookies are "rejected as third-party").
 *
 * `defineEnableDraftMode` sets the cookies and then redirects back to itself
 * with {@link probeSearchParam} to verify the browser actually stored them.
 * When the probe request arrives without the draft-mode cookie, the route
 * serves the interstitial rendered by {@link renderCookieAccessInterstitial}
 * instead of silently redirecting to a preview that can never enter draft
 * mode. The interstitial requests unpartitioned cookie access through the
 * Storage Access API and retries, or explains how to unblock the preview when
 * the browser refuses.
 *
 * @see https://github.com/sanity-io/next-sanity/issues/3919
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Storage_Access_API
 */

/**
 * Search param used by `defineEnableDraftMode` to verify that the browser
 * stored the draft-mode cookies. Its value is the number of Set-Cookie
 * attempts made so far, so the interstitial can stop auto-retrying.
 *
 * @internal
 */
export const probeSearchParam = 'sanity-preview-probe'

/**
 * Automatic retries stop once this many Set-Cookie attempts have been probed;
 * beyond it the interstitial only retries on explicit user interaction.
 *
 * @internal
 */
export const maxAutoCookieAttempts = 2

/**
 * @internal
 */
export interface CookieAccessInterstitialOptions {
  /** How many Set-Cookie attempts have been probed so far */
  attempt: number
}

/**
 * Renders the interstitial shown inside the Presentation iframe when the
 * browser refused to store the draft-mode cookies. All dynamic values are
 * numbers or compile-time constants, so the markup cannot be influenced by
 * request input.
 *
 * @internal
 */
export function renderCookieAccessInterstitial(options: CookieAccessInterstitialOptions): string {
  const attempt = Math.max(0, Math.trunc(options.attempt))
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>Allow preview cookies</title>
    <style>
      :root {
        color-scheme: light dark;
      }
      body {
        margin: 0;
        min-height: 100dvh;
        display: grid;
        place-items: center;
        font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
        background: light-dark(#fff, #13141b);
        color: light-dark(#13141b, #e2e3e9);
      }
      main {
        max-width: 28rem;
        padding: 2rem 1.5rem;
        text-align: center;
      }
      h1 {
        font-size: 1.125rem;
        margin: 0 0 0.5rem;
      }
      p {
        font-size: 0.875rem;
        line-height: 1.5;
        margin: 0 0 1rem;
        color: light-dark(#515360, #9a9cab);
      }
      button {
        font: inherit;
        font-weight: 600;
        padding: 0.5rem 1.25rem;
        border-radius: 0.375rem;
        border: 1px solid transparent;
        background: #556bfc;
        color: #fff;
        cursor: pointer;
      }
      button:hover {
        background: #4055f1;
      }
      a {
        color: light-dark(#556bfc, #7b8cff);
      }
      #status {
        font-size: 0.8125rem;
        min-height: 1.25rem;
        margin: 0.75rem 0 0;
      }
      [hidden] {
        display: none !important;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Allow preview cookies</h1>
      <p>
        Your browser blocked the cookies needed to preview drafts while this site is embedded in
        Sanity Studio.
      </p>
      <button id="continue" hidden>Allow preview cookies</button>
      <div id="guidance" hidden>
        <p>
          To preview drafts inside the Studio, allow cross-site cookies for this site in your
          browser &mdash; in Firefox, open the shield icon in the address bar and turn off Enhanced
          Tracking Protection for the Studio, then reload the preview.
        </p>
        <p><a id="new-tab" target="_blank">Open the preview in a new tab</a> instead.</p>
      </div>
      <p id="status" role="status"></p>
      <noscript>
        <p>
          JavaScript is disabled. Allow cross-site cookies for this site in your browser settings,
          or open this URL directly in a new tab.
        </p>
      </noscript>
    </main>
    <script>
      ;(function () {
        'use strict'
        var PROBE_PARAM = ${JSON.stringify(probeSearchParam)}
        var attempt = ${attempt}
        var maxAutoAttempts = ${maxAutoCookieAttempts}
        var button = document.getElementById('continue')
        var guidance = document.getElementById('guidance')
        var status = document.getElementById('status')

        var enableUrl = new URL(location.href)
        enableUrl.searchParams.delete(PROBE_PARAM)
        document.getElementById('new-tab').href = enableUrl.href

        function retry() {
          var url = new URL(location.href)
          url.searchParams.set(PROBE_PARAM, String(attempt + 1))
          location.replace(url.pathname + url.search)
        }

        function showGuidance(message) {
          status.textContent = message
          guidance.hidden = false
        }

        var supported =
          typeof document.hasStorageAccess === 'function' &&
          typeof document.requestStorageAccess === 'function'
        if (!supported) {
          showGuidance('')
          return
        }

        button.hidden = false
        button.addEventListener('click', function () {
          status.textContent = ''
          document.requestStorageAccess().then(
            function () {
              status.textContent = 'Access granted, loading preview\\u2026'
              retry()
            },
            function () {
              showGuidance('Your browser denied storage access.')
            },
          )
        })

        if (attempt >= maxAutoAttempts) {
          showGuidance('The preview cookies are still blocked after granting access.')
          return
        }

        // If storage access was granted in an earlier session it can be
        // re-activated without a user gesture, so retry automatically.
        if (navigator.permissions && typeof navigator.permissions.query === 'function') {
          navigator.permissions.query({name: 'storage-access'}).then(function (result) {
            if (result.state !== 'granted') return
            document.requestStorageAccess().then(function () {
              status.textContent = 'Loading preview\\u2026'
              retry()
            }, function () {})
          }, function () {})
        }
      })()
    </script>
  </body>
</html>
`
}
