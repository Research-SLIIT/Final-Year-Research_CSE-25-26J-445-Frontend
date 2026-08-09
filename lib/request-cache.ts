/**
 * Per-session cache for analysis results, keyed by company.
 *
 * Tabs unmount their content when you switch away from them, so without this
 * every trip between Risk and Price Forecast re-ran the whole analysis — SSE
 * streams, predictions, history, the lot. The company is fixed by the route and
 * these results do not change between two clicks, so the first request for a
 * given company wins and the rest of the visit reads from memory.
 *
 * In-flight requests are shared, not just settled ones: two tabs mounting at
 * once (or an effect firing twice under StrictMode) join the same promise
 * instead of racing two identical requests.
 *
 * Lifetime is the page session. A full reload starts clean, and any
 * user-initiated refresh passes `force` to go back to the network.
 */

interface CacheEntry<T> {
  promise: Promise<T>
  value?: T
  settled: boolean
}

const cache = new Map<string, CacheEntry<unknown>>()

export interface CacheOptions {
  /** Bypass any cached value and replace it with a fresh request. */
  force?: boolean
}

/**
 * Run `factory` at most once per key, or again on `force`.
 * A rejected request is evicted so the next attempt can retry.
 */
export function cachedRequest<T>(
  key: string,
  factory: () => Promise<T>,
  options: CacheOptions = {},
): Promise<T> {
  if (!options.force) {
    const existing = cache.get(key) as CacheEntry<T> | undefined
    if (existing) return existing.promise
  }

  const entry: CacheEntry<T> = {
    settled: false,
    promise: factory().then(
      (value) => {
        entry.value = value
        entry.settled = true
        return value
      },
      (error) => {
        // Never cache a failure — the next mount should be free to retry.
        if (cache.get(key) === (entry as CacheEntry<unknown>)) cache.delete(key)
        throw error
      },
    ),
  }

  cache.set(key, entry as CacheEntry<unknown>)
  return entry.promise
}

/**
 * Read a settled value without triggering a request.
 *
 * This is what makes a tab switch feel instant: the hook can paint the cached
 * result during render instead of flashing a skeleton while a resolved promise
 * makes its way through a microtask.
 */
export function peekCache<T>(key: string): T | undefined {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  return entry?.settled ? entry.value : undefined
}

/** Drop cached entries — all of them, or those under a key prefix. */
export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    cache.clear()
    return
  }
  for (const key of [...cache.keys()]) {
    if (key.startsWith(prefix)) cache.delete(key)
  }
}
