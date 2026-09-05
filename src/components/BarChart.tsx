import type { CSSProperties, ReactElement, ReactNode } from "react";
import {
  CHART_TONE_COLOR,
  formatChartValue,
  maxOf,
  ratioOfMax,
  truncateLabel,
} from "./chartCommon";
import type { ChartDatum, ChartTone } from "./chartCommon";

/** Fixed user-space width; the svg scales to its container via width: 100%. */
const VIEW_W = 320;

/* ---- horizontal geometry ------------------------------------------- */
const ROW_H = 24;
const BAR_H = 11;
const LABEL_W = 88;
const LABEL_GAP = 8;
const VALUE_W = 48;
const TRACK_X = LABEL_W + LABEL_GAP;
const TRACK_W = VIEW_W - VALUE_W - TRACK_X;

/* ---- vertical geometry --------------------------------------------- */
const VALUE_BAND = 14;
const LABEL_BAND = 16;

export interface BarChartProps {
  /** Categories to plot, in the order they should read. */
  data: ChartDatum[];
  /** Short heading rendered above the plot, e.g. "ORDERS BY STATUS". */
  title?: string;
  /** Value formatter for the per-bar readout. Defaults to grouped numbers;
   *  pass your own for units ("1,204 /hr", "98.2%", "$12.4k"). */
  formatValue?: (value: number) => string;
  /**
   * Horizontal (default) reads better for named categories -- the labels get
   * a real column instead of being crushed under a tick. Vertical suits
   * ordered/time-like buckets where the sequence is the point.
   */
  orientation?: "horizontal" | "vertical";
  /** Threshold coloring, same five lanes as StatusPill/KpiStat. */
  tone?: ChartTone;
  /** Plot height in user units, vertical orientation only. Horizontal derives
   *  its height from the row count so bars never squash. */
  height?: number;
  /** Rendered instead of the plot when `data` is empty. */
  emptyState?: ReactNode;
}

/**
 * A dependency-free SVG bar chart for comparing a handful of named
 * categories -- order funnel stages, inventory adjustment reasons, tasks per
 * work type. Sized for a dashboard card, not for exploratory analysis: no
 * zoom, no legend, no tooltip beyond the native `<title>`.
 *
 * Bars share a 0..max domain. Negative values are clamped to a zero-length
 * bar (the numeric readout still shows the real figure) -- these charts plot
 * counts and rates, where a negative means an upstream bug worth seeing
 * rather than a direction worth drawing.
 *
 * Renders exactly the numbers it is given and fetches nothing itself.
 * Callers must source real values from a real endpoint.
 */
export function BarChart({
  data,
  title,
  formatValue = formatChartValue,
  orientation = "horizontal",
  tone = "accent",
  height = 128,
  emptyState,
}: BarChartProps): ReactElement {
  const barColor = CHART_TONE_COLOR[tone];

  const labelStyle: CSSProperties = {
    fontSize: "var(--wh-font-size-xs)",
    fill: "var(--wh-color-text-muted)",
  };
  const valueStyle: CSSProperties = {
    fontFamily: "var(--wh-font-mono)",
    fontSize: "var(--wh-font-size-xs)",
    fill: "var(--wh-color-text)",
  };
  const trackStyle: CSSProperties = { fill: "var(--wh-color-border-subtle)" };
  const barStyle: CSSProperties = { fill: barColor };

  const max = maxOf(data);

  let plot: ReactElement | null = null;

  if (data.length === 0) {
    plot = null;
  } else if (orientation === "horizontal") {
    const viewH = data.length * ROW_H;
    plot = (
      <svg
        viewBox={`0 0 ${VIEW_W} ${viewH}`}
        role="img"
        aria-label={title ? `${title} bar chart` : "Bar chart"}
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        {data.map((datum, i) => {
          const y = i * ROW_H + ROW_H / 2;
          const ratio = ratioOfMax(datum.value, max);
          // A non-zero measurement always gets a visible sliver: a bar of
          // width 0 is indistinguishable from "no bar rendered".
          const barW = ratio > 0 ? Math.max(TRACK_W * ratio, 2) : 0;
          return (
            <g key={`${datum.label}-${i}`}>
              <title>{`${datum.label}: ${formatValue(datum.value)}`}</title>
              <text
                x={LABEL_W}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                style={labelStyle}
              >
                {truncateLabel(datum.label, 14)}
              </text>
              <rect
                x={TRACK_X}
                y={y - BAR_H / 2}
                width={TRACK_W}
                height={BAR_H}
                rx={2}
                style={trackStyle}
              />
              {barW > 0 && (
                <rect
                  x={TRACK_X}
                  y={y - BAR_H / 2}
                  width={barW}
                  height={BAR_H}
                  rx={2}
                  style={barStyle}
                />
              )}
              <text
                x={VIEW_W}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                style={valueStyle}
              >
                {formatValue(datum.value)}
              </text>
            </g>
          );
        })}
      </svg>
    );
  } else {
    const plotH = Math.max(height, 40);
    const viewH = VALUE_BAND + plotH + LABEL_BAND;
    const baseline = VALUE_BAND + plotH;
    const slotW = VIEW_W / data.length;
    const barW = Math.min(slotW * 0.62, 36);
    const labelChars = Math.max(3, Math.floor(slotW / 5.5));
    plot = (
      <svg
        viewBox={`0 0 ${VIEW_W} ${viewH}`}
        role="img"
        aria-label={title ? `${title} bar chart` : "Bar chart"}
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        <line
          x1={0}
          y1={baseline}
          x2={VIEW_W}
          y2={baseline}
          style={{ stroke: "var(--wh-color-border)", strokeWidth: 1 }}
        />
        {data.map((datum, i) => {
          const cx = i * slotW + slotW / 2;
          const ratio = ratioOfMax(datum.value, max);
          const barH = ratio > 0 ? Math.max(plotH * ratio, 2) : 0;
          return (
            <g key={`${datum.label}-${i}`}>
              <title>{`${datum.label}: ${formatValue(datum.value)}`}</title>
              {barH > 0 && (
                <rect
                  x={cx - barW / 2}
                  y={baseline - barH}
                  width={barW}
                  height={barH}
                  rx={2}
                  style={barStyle}
                />
              )}
              <text
                x={cx}
                y={baseline - barH - 4}
                textAnchor="middle"
                style={valueStyle}
              >
                {formatValue(datum.value)}
              </text>
              <text
                x={cx}
                y={baseline + 12}
                textAnchor="middle"
                style={labelStyle}
              >
                {truncateLabel(datum.label, labelChars)}
              </text>
            </g>
          );
        })}
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
