/**
 * Shared vocabulary for the SVG chart primitives (BarChart, LineChart,
 * FunnelChart).
 *
 * Deliberately tiny and dependency-free: the kit ships no charting library.
 * Every remote already bundles its own React copy through Module Federation;
 * adding a 100kB chart dependency to a shared singleton package is a cost the
 * whole fleet pays on every screen, so these primitives draw plain SVG.
 *
 * Note on colors: CSS custom properties are NOT valid inside SVG presentation
 * attributes (`fill="var(--x)"` is ignored). Every chart therefore sets fill
 * and stroke through the `style` prop, where var() does resolve.
 */

/** One labelled measurement. The shape every chart primitive consumes. */
export interface ChartDatum {
  /** Short category / bucket / timestamp label, e.g. "Allocated" or "09:00". */
  label: string;
  /** The measured number. Non-finite values are treated as missing. */
  value: number;
}

/**
 * Threshold coloring, using the same five semantic lanes as StatusPill and
 * KpiStat's `tone`. A chart never invents its own palette.
 */
export type ChartTone = "neutral" | "accent" | "success" | "warning" | "danger";

export const CHART_TONE_COLOR: Record<ChartTone, string> = {
  neutral: "var(--wh-color-status-neutral)",
  accent: "var(--wh-color-accent)",
  success: "var(--wh-color-status-success)",
  warning: "var(--wh-color-status-warning)",
  danger: "var(--wh-color-status-danger)",
};

/** Placeholder shown for a missing / non-finite measurement. */
export const NO_VALUE = "—";

/**
 * Default value formatter: thousands-grouped integers, one decimal for
 * fractions. Callers with units (%, /hr, currency) pass their own
 * `formatValue` instead.
 */
export function formatChartValue(value: number): string {
  if (!Number.isFinite(value)) return NO_VALUE;
  const fractionDigits = Number.isInteger(value) ? 0 : 1;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

/** Non-finite values (NaN/Infinity from a division upstream) read as 0. */
export function safeValue(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

/**
 * Fraction of the axis a value occupies, given a 0..max domain. Returns 0
 * rather than NaN when every value is zero (an all-quiet shift is a real
 * state, not an error).
 */
export function ratioOfMax(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(Math.max(safeValue(value) / max, 0), 1);
}

/** Largest value in the series, floored at 0 so an empty/negative series
 *  still yields a usable domain. */
export function maxOf(data: readonly ChartDatum[]): number {
  return data.reduce((acc, d) => Math.max(acc, safeValue(d.value)), 0);
}

/**
 * SVG `<text>` has no overflow handling, so long labels would run under the
 * neighbouring bar. Truncate for display; callers get the full string back in
 * a `<title>` tooltip.
 */
export function truncateLabel(label: string, maxChars: number): string {
  if (label.length <= maxChars) return label;
  return `${label.slice(0, Math.max(maxChars - 1, 0))}…`;
}
