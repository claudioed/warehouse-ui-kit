/**
 * Shared formatters.
 *
 * Three near-duplicate implementations existed before this file:
 * chartCommon.formatChartValue, FreshnessBadge.formatLag, and the console's
 * own ReportDashboard.formatInstant. Consolidated here so a quantity is
 * written the same way wherever it appears -- the same argument StatusPill
 * makes for status words.
 */

/** What every formatter renders when there is genuinely no value.
 *  NEVER substitute 0: "no reading" and "a reading of zero" are different
 *  operational facts, and several upstream reports (notably
 *  labor-performance's meanEfficiencyPct) return null meaning the former. */
export const NO_VALUE = "—";

/** Thousands-grouped integer; one decimal for fractions. */
export function formatNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return NO_VALUE;
  const fractionDigits = Number.isInteger(value) ? 0 : 1;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

/** Compact form for tiles that must stay legible across a room: 12.4k. */
export function formatCompact(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return NO_VALUE;
  return value.toLocaleString("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  });
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return NO_VALUE;
  return `${formatNumber(value)}%`;
}

/**
 * Seconds as a short duration: 45s, 12m, 3h 04m, 2d 06h.
 * Used for freshness lag, dwell time and avgClaimToCompleteSeconds.
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) return NO_VALUE;
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) {
    const h = Math.floor(s / 3600);
    const m = Math.round((s % 3600) / 60);
    return m === 0 ? `${h}h` : `${h}h ${String(m).padStart(2, "0")}m`;
  }
  const d = Math.floor(s / 86400);
  const h = Math.round((s % 86400) / 3600);
  return h === 0 ? `${d}d` : `${d}d ${String(h).padStart(2, "0")}h`;
}

/**
 * An ISO-8601 instant in the viewer's local time. Returns the raw string
 * unchanged when it isn't parseable, rather than rendering "Invalid Date"
 * -- an unrecognised timestamp is still evidence and should be readable.
 */
export function formatInstant(iso: string | null | undefined): string {
  if (!iso) return NO_VALUE;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Elapsed time since an instant, as a duration. Null-safe. */
export function secondsSince(
  iso: string | null | undefined,
  now: number = Date.now(),
): number | null {
  if (!iso) return null;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.max(0, (now - parsed.getTime()) / 1000);
}
