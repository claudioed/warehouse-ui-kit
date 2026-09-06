import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useFetch, FetchError } from "./useFetch";

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: async () => body,
  } as Response;
}

describe("useFetch", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("loads once and reports the payload", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ depth: 12 }));

    const { result } = renderHook(() => useFetch<{ depth: number }>("/queues"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ depth: 12 });
    expect(result.current.stale).toBe(false);
    expect(result.current.lastUpdatedAt).toBeTypeOf("number");
  });

  /**
   * The defect this guards: the previous implementation set `data: null`
   * in its catch block, so a single failed poll blanked the entire
   * dashboard. On a wall display that turns one dropped packet into an
   * empty screen.
   */
  it("keeps the last good data when a refresh fails, and marks it stale", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ depth: 12 }))
      .mockResolvedValueOnce(jsonResponse(null, 503));

    const { result } = renderHook(() => useFetch<{ depth: number }>("/queues"));
    await waitFor(() => expect(result.current.data).toEqual({ depth: 12 }));

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.data).toEqual({ depth: 12 }); // NOT blanked
    expect(result.current.stale).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it("does not re-enter the loading state on a background refresh", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ depth: 1 }));

    const { result } = renderHook(() => useFetch<{ depth: number }>("/queues"));
    await waitFor(() => expect(result.current.data).not.toBeNull());

    act(() => {
      result.current.refetch();
    });

    // Skeletons must not flash over data that is already on screen.
    expect(result.current.loading).toBe(false);
    await waitFor(() => expect(result.current.refreshing).toBe(false));
  });

  it("surfaces the HTTP status so callers can tell 404 from 503", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(null, 404));

    const { result } = renderHook(() => useFetch("/orders/nope/lifecycle"));

    await waitFor(() => expect(result.current.error).not.toBeNull());
    const err = result.current.error as FetchError;
    expect(err).toBeInstanceOf(FetchError);
    expect(err.status).toBe(404);
    // The operator-facing screen must be able to avoid printing the URL.
    expect(err.message).not.toContain("http");
  });

  /**
   * wes-work-planning's /paths/{id}/telemetry and /rebalance publish Kafka
   * events when read, and planning-mfe already fetches them through this
   * hook. A default poll interval would make every consumer an event
   * producer, so polling must stay strictly opt-in.
   */
  it("never polls unless pollMs is explicitly supplied", async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ ok: true }));

    renderHook(() => useFetch("/paths/pick-zone-a/telemetry"));
    await vi.advanceTimersByTimeAsync(120_000);

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("polls on the requested interval when asked to", async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ ok: true }));

    renderHook(() => useFetch("/daily-brief", { pollMs: 1000 }));
    await vi.advanceTimersByTimeAsync(3_100);

    expect(vi.mocked(fetch).mock.calls.length).toBeGreaterThanOrEqual(3);
    vi.useRealTimers();
  });

  it("does not fetch at all when url is null or disabled", () => {
    const { result } = renderHook(() => useFetch(null));
    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);

    renderHook(() => useFetch("/orders/1", { enabled: false }));
    expect(fetch).not.toHaveBeenCalled();
  });
});
