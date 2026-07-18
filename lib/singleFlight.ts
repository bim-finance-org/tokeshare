// Per-instance single-flight: concurrent callers for the same key share one
// in-flight promise. Wrapping a cache-miss fetch with this collapses a stampede
// (N simultaneous requests when the cache expires → N paid API calls) into a
// single upstream call whose result everyone waits on.
const inFlight = new Map<string, Promise<unknown>>();

export function singleFlight<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = fn().finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}
