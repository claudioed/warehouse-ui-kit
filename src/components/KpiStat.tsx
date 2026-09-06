import type { ReactElement, ReactNode } from "react";
import { Link } from "../navigation/NavigationContext";
import { formatCompact, formatDuration, formatNumber, formatPercent, NO_VALUE } from "../utils/format";

export type KpiTone = "neutral" | "progress" | "success" | "warning" | "danger";

/**
 * How a tile is doing at answering its question at all.
 *
 * - ok          -- a real number from a real endpoint.
 * - no-data     -- the endpoint answered, and the answer is "nothing".
 * - unavailable -- the endpoint did not answer. NOT the same thing, and
 *                  deliberately rendered louder (see KpiStat.css).
 */
export type KpiState = "ok" | "no-data" | "unavailable";

export type KpiFormat =
  | "integer"
  | "percent"
  | "duration"
  | "compact"
  | ((value: number) => string);

const TONE_ACCENT: Record<KpiTone, string> = {
  neutral: "var(--wh-color-accent)",
  progress: "var(--wh-color-status-progress)",
  success: "var(--wh-color-status-success)",
  warning: "var(--wh-color-status-warning)",
  danger: "var(--wh-color-status-danger)",
};

export interface KpiThreshold {
  warnAbove?: number;
  dangerAbove?: number;
  warnBelow?: number;
  dangerBelow?: number;
}

export interface KpiStatProps {
  /** Short, all-caps-styled label, e.g. "PICK QUEUE". */
  label: string;
  /**
   * The headline measurement. `null` renders as "—" -- never as 0, which
   * would assert a reading the system does not have.
   */
  value: ReactNode | number | null;
  /** One-line context under the value, e.g. "tasks pending". */
  caption?: string;
  /**
   * Threshold coloring. Prefer passing a `tone` your BACKEND computed
   * (e.g. /daily-brief's `overAlarmThreshold`, `understaffed`) over
   * inventing cutoffs in the UI -- deciding when a warehouse number is
   * alarming is domain logic and does not belong in the shell.
   */
  tone?: KpiTone;
  /** Purely presentational thresholds (e.g. projection freshness), for
   *  cases where no upstream flag exists. */
  threshold?: KpiThreshold;
  /** Applied only when `value` is a number. Defaults to grouped integers,
   *  so 13480 renders as "13,480" rather than "13480". */
  format?: KpiFormat;
  state?: KpiState;
  /** Movement against the previous comparable window. */
  delta?: { value: number; goodDirection: "up" | "down" };
  /** Optional href -- renders the whole panel as a link into the owning
   *  screen for that metric (drill-down). */
  href?: string;
}

function applyFormat(value: number, format: KpiFormat | undefined): string {
  if (typeof format === "function") return format(value);
  switch (format) {
    case "percent":
      return formatPercent(value);
    case "duration":
      return formatDuration(value);
    case "compact":
      return formatCompact(value);
    default:
      return formatNumber(value);
  }
}

function toneFromThreshold(
  value: number,
  t: KpiThreshold | undefined,
): KpiTone | null {
  if (!t) return null;
  if (t.dangerAbove != null && value > t.dangerAbove) return "danger";
  if (t.dangerBelow != null && value < t.dangerBelow) return "danger";
  if (t.warnAbove != null && value > t.warnAbove) return "warning";
  if (t.warnBelow != null && value < t.warnBelow) return "warning";
  return "success";
}

/**
 * A single control-tower stat panel: big monospace number, label, and a
 * left accent bar colored by tone -- the visual language of Manhattan
 * Active WM's KPI strip and Grafana/Datadog stat panels.
 *
 * Renders whatever it is given and fetches nothing itself. Callers must
 * source real numbers from a real endpoint; do not wire this to fabricated
 * or placeholder data.
 */
export function KpiStat({
  label,
  value,
  caption,
  tone,
  threshold,
  format,
  state = "ok",
  delta,
  href,
}: KpiStatProps): ReactElement {
  const isNumber = typeof value === "number" && Number.isFinite(value);

  const resolvedState: KpiState =
    state !== "ok" ? state : value == null ? "no-data" : "ok";

  const resolvedTone: KpiTone =
    resolvedState === "unavailable"
      ? "warning"
      : (tone ?? (isNumber ? toneFromThreshold(value, threshold) : null) ?? "neutral");

  const rendered: ReactNode =
    resolvedState === "unavailable" || value == null
      ? NO_VALUE
      : isNumber
        ? applyFormat(value, format)
        : value;

  const className = [
    "wh-kpi",
    resolvedState === "unavailable" ? "wh-kpi--unavailable" : "",
    resolvedState === "no-data" ? "wh-kpi--no-data" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <span
        aria-hidden
        className="wh-kpi__accent"
        style={{ ["--wh-kpi-accent" as string]: TONE_ACCENT[resolvedTone] }}
      />
      <span className="wh-kpi__label">{label}</span>
      <span className="wh-kpi__value">{rendered}</span>
      {delta && resolvedState === "ok" && <Delta {...delta} />}
      {(caption || resolvedState === "unavailable") && (
        <span className="wh-kpi__caption">
          {/* When the feed is dead, "no signal" REPLACES the caption. The
              label already names the metric; what the operator needs to
              know here is that nothing is being reported, not what would
              be reported if it were. */}
          {resolvedState === "unavailable" ? "no signal" : caption}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className} data-state={resolvedState}>
        {content}
      </Link>
    );
  }
  return (
    <div className={className} data-state={resolvedState}>
      {content}
    </div>
  );
}

function Delta({
  value,
  goodDirection,
}: {
  value: number;
  goodDirection: "up" | "down";
}): ReactElement {
  const flat = value === 0;
  const up = value > 0;
  const good = flat ? null : (up ? goodDirection === "up" : goodDirection === "down");
  const cls = flat
    ? "wh-kpi__delta wh-kpi__delta--flat"
    : good
      ? "wh-kpi__delta wh-kpi__delta--good"
      : "wh-kpi__delta wh-kpi__delta--bad";
  return (
    <span className={cls}>
      <span aria-hidden>{flat ? "→" : up ? "↑" : "↓"}</span>
      <span className="wh-visually-hidden">
        {flat ? "no change" : up ? "up" : "down"}
      </span>
      {formatNumber(Math.abs(value))}
    </span>
  );
}
