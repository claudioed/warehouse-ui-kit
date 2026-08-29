import { useEffect, useRef, useState } from "react";

export interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Minimal typed-fetch hook shared by every remote. Deliberately NOT a
 * heavier data-fetching library (react-query et al) for v1 -- these are
 * mostly read-only operational screens polling REST GETs, and pulling in
 * a shared query-cache singleton across federated remotes is its own can
 * of worms (cache key collisions, duplicate QueryClient instances). Swap
 * this out repo-wide, in one place, if/when the screens need real caching
 * or mutation support.
 *
 * Polls at `pollMs` when provided (used by the live telemetry/backlog
 * screens); a stale request in flight is ignored when a newer one starts,
 * so slow responses can never clobber fresher state (the "abandoned
 * request" race every naive polling hook gets wrong).
 */
export function useFetch<T>(
  url: string | null,
  opts?: { pollMs?: number },
): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: url !== null,
    error: null,
  });
  const requestId = useRef(0);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;

    async function run() {
      const id = ++requestId.current;
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = await fetch(url as string);
        if (!res.ok) {
          throw new Error(`${res.status} ${res.statusText} for ${url}`);
        }
        const data = (await res.json()) as T;
        if (!cancelled && id === requestId.current) {
          setState({ data, loading: false, error: null });
        }
      } catch (err) {
        if (!cancelled && id === requestId.current) {
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err : new Error(String(err)),
          });
        }
      }
    }

    run();
    let interval: ReturnType<typeof setInterval> | undefined;
    if (opts?.pollMs) {
      interval = setInterval(run, opts.pollMs);
    }
    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, opts?.pollMs]);

  return state;
}
