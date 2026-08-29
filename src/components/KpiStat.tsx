import type { CSSProperties, ReactElement, ReactNode } from "react";

export type KpiTone = "neutral" | "success" | "warning" | "danger";

const TONE_ACCENT: Record<KpiTone, string> = {
  neutral: "var(--wh-color-accent)",
  success: "var(--wh-color-status-success)",
  warning: "var(--wh-color-status-warning)",
  danger: "var(--wh-color-status-danger)",
};

export interface KpiStatProps {
  /** Short, all-caps-styled label, e.g. "PICK QUEUE". */
  label: string;
  /** The headline number or short string, e.g. 42 or "3 of 12". */
  value: ReactNode;
  /** One-line context under the value, e.g. "tasks pending". */
  caption?: string;
  /**
   * Threshold coloring, the same "is this good/bad" judgment StatusPill
   * makes for domain statuses -- here applied to a metric instead. Default
   * neutral (brand-blue accent bar) when the caller has no threshold logic
   * yet; wire real thresholds as they're defined per metric.
   */
  tone?: KpiTone;
  /** Optional href -- renders the whole panel as a link into the owning
   *  screen for that metric (drill-down), matching how Manhattan Active's
   *  control-tower tiles and Grafana panels both link through to detail. */
  href?: string;
}

/**
 * A single control-tower stat panel: big monospace number, label, and a
 * left accent bar colored by tone -- the same visual language used by
 * Manhattan Active WM's KPI strip and Grafana/Datadog stat panels. This is
 * the ui-kit's building block for "at a glance, is this metric fine or
 * not" -- pair several in a row for an operations overview screen.
 *
 * Deliberately renders whatever `value` is given rather than fetching
 * anything itself: callers must source real numbers from a real endpoint.
 * Do not wire this to fabricated or placeholder data.
 */
export function KpiStat({
  label,
  value,
  caption,
  tone = "neutral",
  href,
}: KpiStatProps): ReactElement {
  const accent = TONE_ACCENT[tone];
  const style: CSSProperties = {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: "var(--wh-space-1)",
    background: "var(--wh-color-bg-raised)",
    border: "1px solid var(--wh-color-border)",
    borderRadius: "var(--wh-radius-lg)",
    padding: "var(--wh-space-4) var(--wh-space-5)",
    paddingLeft: "calc(var(--wh-space-5) + 3px)",
    overflow: "hidden",
    minWidth: 160,
    textDecoration: "none",
    color: "inherit",
  };

  const content = (
    <>
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: accent,
        }}
      />
      <span
        style={{
          fontSize: "var(--wh-font-size-xs)",
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--wh-color-text-muted)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--wh-font-mono)",
          fontSize: "var(--wh-font-size-2xl)",
          fontWeight: 600,
          lineHeight: 1.1,
          color: "var(--wh-color-text)",
        }}
      >
        {value}
      </span>
      {caption && (
        <span
          style={{
            fontSize: "var(--wh-font-size-xs)",
            color: "var(--wh-color-text-faint)",
          }}
        >
          {caption}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <a href={href} style={style}>
        {content}
      </a>
    );
  }
  return <div style={style}>{content}</div>;
}
