import type { ReactElement } from "react";

/**
 * Every reports endpoint across all 6 services exposes a sibling
 * `/reports/<name>/freshness` route (projection lag). This badge is the
 * ONE place that renders it, so no dashboard screen silently presents
 * analytics data as if it were live. Surfacing staleness honestly beats
 * a dashboard that looks real-time but is quietly 20 minutes behind.
 */
export function FreshnessBadge({
  lagSeconds,
  staleThresholdSeconds = 120,
}: {
  lagSeconds: number | null;
  staleThresholdSeconds?: number;
}): ReactElement {
  if (lagSeconds === null) {
    return (
      <span style={badgeStyle("neutral")}>
        <Dot tone="neutral" /> freshness unknown
      </span>
    );
  }
  const stale = lagSeconds > staleThresholdSeconds;
  return (
    <span style={badgeStyle(stale ? "warning" : "success")}>
      <Dot tone={stale ? "warning" : "success"} />
      {formatLag(lagSeconds)} behind
    </span>
  );
}

function formatLag(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

function Dot({ tone }: { tone: "neutral" | "warning" | "success" }): ReactElement {
  const color =
    tone === "success"
      ? "var(--wh-color-status-success)"
      : tone === "warning"
        ? "var(--wh-color-status-warning)"
        : "var(--wh-color-status-neutral)";
  return (
    <span
      aria-hidden
      style={{ width: 6, height: 6, borderRadius: "50%", background: color }}
    />
  );
}

function badgeStyle(tone: "neutral" | "warning" | "success") {
  const bg =
    tone === "success"
      ? "var(--wh-color-status-success-bg)"
      : tone === "warning"
        ? "var(--wh-color-status-warning-bg)"
        : "var(--wh-color-status-neutral-bg)";
  const fg =
    tone === "success"
      ? "var(--wh-color-status-success)"
      : tone === "warning"
        ? "var(--wh-color-status-warning)"
        : "var(--wh-color-status-neutral)";
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: "var(--wh-font-size-xs)",
    color: fg,
    background: bg,
    borderRadius: "var(--wh-radius-pill)",
    padding: "2px 8px",
  } as const;
}
