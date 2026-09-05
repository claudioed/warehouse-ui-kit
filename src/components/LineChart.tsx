import type { CSSProperties, ReactElement, ReactNode } from "react";
import {
  CHART_TONE_COLOR,
  formatChartValue,
  safeValue,
  truncateLabel,
} from "./chartCommon";
import type { ChartDatum, ChartTone } from "./chartCommon";

const VIEW_W = 320;
const PAD_X = 3;
/** Vertical breathing room so the stroke and the end dot are never clipped. */
const PAD_Y = 4;
const LABEL_BAND = 14;

export interface LineChartThreshold {
  /** Where to draw the reference line, in the same units as the series. */
  value: number;
  /** Optional caption drawn at the right end, e.g. "target 95%". */
  label?: string;
  /** Defaults to warning -- a target line is a "watch this" mark, not a
   *  failure. Pass danger for a hard SLA breach line. */
  tone?: ChartTone;
}

export interface LineChartProps {
  /** The series in chronological order. `label` is the x-axis tick text
   *  (only the first and last are drawn -- this is a dashboard sparkline,
   *  not a full axis). */
  data: ChartDatum[];
  /** Short heading rendered above the plot, e.g. "PICKS PER HOUR". */
  title?: string;
  /** Value formatter used in the point tooltips. Defaults to grouped
   *  numbers; pass your own for units. */
  formatValue?: (value: number) => string;
  /** Optional target / threshold reference line. Its value is included in
   *  the y-domain so the line is always on screen. */
  threshold?: LineChartThreshold;
  /** Line color lane, same five tones as StatusPill/KpiStat. */
  tone?: ChartTone;
  /** Plot height in user units, excluding the x-label band. */
  height?: number;
  /** Rendered instead of the plot when `data` is empty. */
  emptyState?: ReactNode;
}

/**
 * A dependency-free SVG line chart / sparkline for a single time series --
 * throughput per hour, backlog over a shift, accuracy trend across days.
 *
 * The y-domain is derived from the data (plus the threshold, when given) and
 * padded, so it does NOT start at zero: this is a shape-of-the-trend chart,
 * and a zero-based axis flattens the exact wobble an operator is watching
 * for. Use BarChart when magnitude comparison matters more than trend.
 *
 * Renders exactly the numbers it is given and fetches nothing itself.
 * Callers must source real values from a real endpoint.
 */
export function LineChart({
  data,
  title,
  formatValue = formatChartValue,
  threshold,
  tone = "accent",
  height = 88,
  emptyState,
}: LineChartProps): ReactElement {
  const lineColor = CHART_TONE_COLOR[tone];
  const plotH = Math.max(height, 32);
  const viewH = plotH + LABEL_BAND;

  const labelStyle: CSSProperties = {
    fontSize: "var(--wh-font-size-xs)",
    fill: "var(--wh-color-text-faint)",
  };

  let plot: ReactElement | null = null;

  if (data.length > 0) {
    const values = data.map((d) => safeValue(d.value));
    const domainValues =
      threshold && Number.isFinite(threshold.value)
        ? [...values, threshold.value]
        : values;

    const rawMin = Math.min(...domainValues);
    const rawMax = Math.max(...domainValues);
    // A perfectly flat series has zero range; pinning it to the vertical
    // middle beats dividing by zero and rendering NaN coordinates.
    const flat = rawMax - rawMin === 0;
    const pad = flat ? 1 : (rawMax - rawMin) * 0.1;
    const lo = rawMin - pad;
    const hi = rawMax + pad;

    const usableH = plotH - PAD_Y * 2;
    const usableW = VIEW_W - PAD_X * 2;
    const n = data.length;

    const xAt = (i: number): number =>
      n === 1 ? VIEW_W / 2 : PAD_X + (i / (n - 1)) * usableW;
    const yAt = (value: number): number =>
      PAD_Y + (1 - (safeValue(value) - lo) / (hi - lo)) * usableH;

    const points = values.map((v, i) => `${xAt(i)},${yAt(v)}`).join(" ");
    const lastX = xAt(n - 1);
    const lastY = yAt(values[n - 1]);

    const areaPath =
      n >= 2
        ? `M ${xAt(0)},${plotH} L ${values
            .map((v, i) => `${xAt(i)},${yAt(v)}`)
            .join(" L ")} L ${lastX},${plotH} Z`
        : null;

    const thresholdTone = threshold?.tone ?? "warning";

    plot = (
      <svg
        viewBox={`0 0 ${VIEW_W} ${viewH}`}
        role="img"
        aria-label={title ? `${title} line chart` : "Line chart"}
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        {areaPath && (
          <path d={areaPath} style={{ fill: lineColor, opacity: 0.12 }} />
        )}
        {threshold && Number.isFinite(threshold.value) && (
          <g>
            <line
              x1={0}
              y1={yAt(threshold.value)}
              x2={VIEW_W}
              y2={yAt(threshold.value)}
              style={{
                stroke: CHART_TONE_COLOR[thresholdTone],
                strokeWidth: 1,
                strokeDasharray: "4 3",
                opacity: 0.8,
              }}
            />
            {threshold.label && (
              <text
                x={VIEW_W}
                y={Math.max(yAt(threshold.value) - 3, 8)}
                textAnchor="end"
                style={{
                  fontSize: "var(--wh-font-size-xs)",
                  fill: CHART_TONE_COLOR[thresholdTone],
                }}
              >
                {threshold.label}
              </text>
            )}
          </g>
        )}
        {n >= 2 && (
          <polyline
            points={points}
            style={{
              fill: "none",
              stroke: lineColor,
              strokeWidth: 2,
              strokeLinejoin: "round",
              strokeLinecap: "round",
            }}
          />
        )}
        <circle cx={lastX} cy={lastY} r={2.5} style={{ fill: lineColor }} />
        {data.map((datum, i) => (
          // Invisible hit targets: the native tooltip is the only readout
          // this primitive offers, and a 2px line is impossible to hover.
          <circle
            key={`${datum.label}-${i}`}
            cx={xAt(i)}
            cy={yAt(values[i])}
            r={6}
            style={{ fill: "transparent" }}
          >
            <title>{`${datum.label}: ${formatValue(datum.value)}`}</title>
          </circle>
        ))}
        <text x={PAD_X} y={plotH + 11} textAnchor="start" style={labelStyle}>
          {truncateLabel(data[0].label, 12)}
        </text>
        {n >= 2 && (
          <text
            x={VIEW_W - PAD_X}
            y={plotH + 11}
            textAnchor="end"
            style={labelStyle}
          >
            {truncateLabel(data[n - 1].label, 12)}
          </text>
        )}
      </svg>
    );
  }

  return (
    <figure
      style={{
        margin: 0,
        display: "flex",
        flexDirection: "column",
        gap: "var(--wh-space-2)",
      }}
    >
      {title && (
        <figcaption
          style={{
            fontSize: "var(--wh-font-size-xs)",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--wh-color-text-muted)",
          }}
        >
          {title}
        </figcaption>
      )}
      {plot ?? (
        <div
          style={{
            padding: "var(--wh-space-5)",
            textAlign: "center",
            color: "var(--wh-color-text-muted)",
            fontSize: "var(--wh-font-size-sm)",
          }}
        >
          {emptyState ?? "No data."}
        </div>
      )}
    </figure>
  );
}
