import { useCallback, useEffect, useRef, useState } from "react";

/**
 * An HTTP error carrying the status, so callers can tell "this order does
 * not exist" (404) apart from "the service is down" (5xx / network) and
 * write different copy for each. Screens previously printed
 * `error.message`, which leaked an internal URL to the operator and made
 * those two very different situations look identical.
 */
export class FetchError extends Error {
  readonly status: number | null;
  readonly url: string;

  constructor(message: string, status: number | null, url: string) {
    super(message);
    this.name = "FetchError";
    this.status = status;
    this.url = url;
  }
}

export interface FetchState<T> {
  /**
   * The last GOOD payload, retained across a failed refresh. A polling
   * console must not blank itself because one request in a hundred timed
   * out. Null only before the first success.
   */
  data: T | null;
  /** True only while there is nothing to show yet -- the first load.
   *  Background refreshes do NOT set this, so a polling screen stops
   *  flashing its skeleton on every tick. */
  loading: boolean;
  /** A request is in flight over data that is already on screen. */
  refreshing: boolean;
  error: Error | null;
  /** Data is on screen but the most recent attempt failed, so what you are
   *  looking at is older than it appears. Pair with FreshnessBadge. */
  stale: boolean;
  /** epoch ms of the last successful load, for "updated 4s ago". */
  lastUpdatedAt: number | null;
  refetch: () => void;
}

export interface UseFetchOptions {
  /**
   * Poll interval in ms. There is deliberately NO DEFAULT.
   *
   * Two endpoints in this fleet publish Kafka events as a side effect of
   * being read (wes-work-planning's `/paths/{id}/telemetry` and
   * `/rebalance`), and both are already fetched through this hook by
   * planning-mfe. A default interval would silently turn every consumer
   * into an event producer. Opt in per call site, and only for endpoints
   * you know are side-effect free.
   */
  pollMs?: number;
  /** Skip fetching without unmounting -- e.g. no order id typed yet. */
  enabled?: boolean;
  /** Suspend polling while the tab is hidden. On by default: an ops console
   *  is left open all shift, and a background tab should not keep hammering
   *  six services. */
  pauseWhenHidden?: boolean;
}

/**
 * Minimal typed-fetch hook shared by every remote. Deliberately NOT a
 * heavier data-fetching library (react-query et al) for v1 -- these are
 * mostly read-only operational screens polling REST GETs, and pulling in a
 * shared query-cache singleton across federated remotes is its own can of
 * worms (cache key collisions, duplicate QueryClient instances).
 *
 * A stale request in flight is ignored when a newer one starts, so slow
 * responses can never clobber fresher state.
 */
export function useFetch<T>(
  url: string | null,
  opts?: UseFetchOptions,
): FetchState<T> {
  const { pollMs, enabled = true, pauseWhenHidden = true } = opts ?? {};
  const active = enabled && url !== null;

  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    refreshing: boolean;
    error: Error | null;
    lastUpdatedAt: number | null;
  }>({
    data: null,
    loading: active,
    refreshing: false,
    error: null,
    lastUpdatedAt: null,
  });

  // Reset when the target changes, DURING render rather than in an effect.
  // React re-renders immediately without committing the intermediate tree,
  // so the screen never paints one URL's data under another's -- which a
  // reset-in-effect would allow for exactly one frame.
  const [targetUrl, setTargetUrl] = useState(url);
  if (targetUrl !== url) {
    setTargetUrl(url);
    setState({
      data: null,
      loading: active,
      refreshing: false,
      error: null,
      lastUpdatedAt: null,
    });
  }

  const requestId = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async () => {
    if (!url) return;
    const id = ++requestId.current;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((s) => ({
      ...s,
      loading: s.data === null,
      refreshing: s.data !== null,
      error: null,
    }));

    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        throw new FetchError(
          `Request failed with ${res.status} ${res.statusText}`,
          res.status,
          url,
        );
      }
      const data = (await res.json()) as T;
      if (id !== requestId.current) return;
      setState({
        data,
        loading: false,
        refreshing: false,
        error: null,
        lastUpdatedAt: Date.now(),
      });
    } catch (err) {
      if (controller.signal.aborted || id !== requestId.current) return;
      const error =
        err instanceof Error ? err : new FetchError(String(err), null, url);
      // Keep whatever is already on screen. Blanking the view on a
      // transient failure is what made polling unusable before.
      setState((s) => ({ ...s, loading: false, refreshing: false, error }));
    }
  }, [url]);

  useEffect(() => {
    if (!active) return;

    // run() marks the request in-flight before awaiting fetch(). An HTTP
    // call is precisely the "synchronizing with an external system" case
    // this rule carves out; the in-flight state cannot be derived during
    // render because it is caused by the effect itself, not by a prop.
    // eslint-disable-next-line react/set-state-in-effect
    void run();

    if (!pollMs) return;

    let interval: ReturnType<typeof setInterval> | undefined;

    const start = (): void => {
      if (interval === undefined) {
        interval = setInterval(() => void run(), pollMs);
      }
    };
    const stop = (): void => {
      if (interval !== undefined) {
        clearInterval(interval);
        interval = undefined;
      }
    };

    const onVisibility = (): void => {
      if (document.visibilityState === "visible") {
        void run();
        start();
      } else {
        stop();
      }
    };

    if (!(pauseWhenHidden && document.visibilityState === "hidden")) {
      start();
    }
    if (pauseWhenHidden) {
      document.addEventListener("visibilitychange", onVisibility);
    }

    return () => {
      stop();
      if (pauseWhenHidden) {
        document.removeEventListener("visibilitychange", onVisibility);
      }
    };
  }, [active, run, pollMs, pauseWhenHidden]);

  // Abort any in-flight request on unmount.
  useEffect(() => () => abortRef.current?.abort(), []);

  return {
    data: state.data,
    loading: state.loading,
    refreshing: state.refreshing,
    error: state.error,
    stale: state.data !== null && state.error !== null,
    lastUpdatedAt: state.lastUpdatedAt,
    refetch: run,
  };
}
