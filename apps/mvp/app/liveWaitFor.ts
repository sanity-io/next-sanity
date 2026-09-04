/**
 * Opt-in `waitFor` prop for `<SanityLive>`, enabled with `SANITY_LIVE_WAIT_FOR_FUNCTION=true`.
 * Leave it unset until `functions/invalidate-sync-tags` is deployed. Without the function, live events never arrive.
 */
export const liveWaitFor: 'function' | undefined =
  process.env.SANITY_LIVE_WAIT_FOR_FUNCTION === 'true' ? 'function' : undefined
