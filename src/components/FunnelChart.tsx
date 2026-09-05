import type { CSSProperties, ReactElement, ReactNode } from "react";
import {
  CHART_TONE_COLOR,
  NO_VALUE,
  formatChartValue,
  maxOf,
  safeValue,
  truncateLabel,
} from "./chartCommon";
import type { ChartDatum, ChartTone } from "./chartCommon";

const VIEW_W = 320;
const LABEL_END = 96;
const TRACK_X0 = 104;
const TRACK_X1 = 232;
const TRACK_W = TRACK_X1 - TRACK_X0;
const CENTER = (TRACK_X0 + TRACK_X1) / 2;
const VALUE_END = 276;
const PCT_END = VIEW_W;
const STAGE_H = 20;
/** Vertical band between two stages, where the leakage readout goes. */
const GAP_H = 18;

export interface FunnelChartProps {
  /** Ordered stages, widest first -- e.g. received → allocated → released.
   *  Order is taken as given; the component does not sort. */
  stages: ChartDatum[];
  /** Short heading rendered above the funnel, e.g. "ORDER FUNNEL". */
  title?: string;
  /** Value formatter for stage counts and drop-off. Defaults to grouped
   *  numbers. */
  formatValue?: (value: number) => string;
  /** Funnel body color lane. Leakage is always drawn in the danger lane. */
  tone?: ChartTone;
  /** Rendered instead of the funnel when `stages` is empty. */
  emptyState?: ReactNode;
}

function conversionPct(value: number, base: number): string {
  if (base <= 0) return NO_VALUE;
  return `${((safeValue(value) / base) * 100).toFixed(1)}%`;
}

/**
 * A stage-based funnel: each stage is a centered bar whose width is its share
 * of the entry stage, with the two neighbours joined by a tapering connector
 * so the narrowing reads at a glance.
 *
 * The gap between stages carries the number that actually matters
 * operationally -- the leakage. For the WMS order funnel (received →
 * allocated → released) that drop-off is exactly the backordered and
 * cancelled volume, so it is computed from consecutive stages rather than
 * asked for as a separate prop: the funnel cannot disagree with itself.
 *
 * A stage larger than its predecessor is drawn, not hidden -- widths are
 * scaled against the largest stage so nothing overflows the track, while
 * conversion stays measured against the entry stage. Backwards growth in a
 * funnel means a projection bug worth seeing.
 *
 * Renders exactly the numbers it is given and fetches nothing itself.
 * Callers must source real values from a real endpoint.
 */
export function FunnelChart({
  stages,
  title,
  formatValue = formatChartValue,
  tone = "accent",
  emptyState,
}: FunnelChartProps): ReactElement {
  const bodyColor = CHART_TONE_COLOR[tone];
  const leakColor = CHART_TONE_COLOR.danger;

  const labelStyle: CSSProperties = {
    fontSize: "var(--wh-font-size-xs)",
    fill: "var(--wh-color-text-muted)",
  };
  const valueStyle: CSSProperties = {
    fontFamily: "var(--wh-font-mono)",
    fontSize: "var(--wh-font-size-xs)",
    fill: "var(--wh-color-text)",
  };
  const pctStyle: CSSProperties = {
    fontFamily: "var(--wh-font-mono)",
    fontSize: "var(--wh-font-size-xs)",
    fill: "var(--wh-color-text-faint)",
  };

  let plot: ReactElement | null = null;

  if (stages.length > 0) {
    const entry = safeValue(stages[0].value);
    // Scale against the widest stage so an anomalous bulge stays inside the
    // track; conversion percentages still read against the entry stage.
    const scaleBase = Math.max(maxOf(stages), 0);
    const viewH = stages.length * STAGE_H + (stages.length - 1) * GAP_H;

    const widthAt = (value: number): number => {
      if (scaleBase <= 0) return 0;
      const ratio = Math.min(Math.max(safeValue(value) / scaleBase, 0), 1);
      return ratio > 0 ? Math.max(TRACK_W * ratio, 2) : 0;
    };
    const topAt = (i: number): number => i * (STAGE_H + GAP_H);

    plot = (
      <svg
        viewBox={`0 0 ${VIEW_W} ${viewH}`}
        role="img"
        aria-label={title ? `${title} funnel chart` : "Funnel chart"}
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        {/* Tapering connectors, drawn first so the stage bars sit on top. */}
        {stages.slice(0, -1).map((stage, i) => {
          const wA = widthAt(stage.value);
          const wB = widthAt(stages[i + 1].value);
          const bottomA = topAt(i) + STAGE_H;
          const topB = topAt(i + 1);
          return (
            <polygon
              key={`connector-${stage.label}-${i}`}
              points={[
                `${CENTER - wA / 2},${bottomA}`,
                `${CENTER + wA / 2},${bottomA}`,
                `${CENTER + wB / 2},${topB}`,
                `${CENTER - wB / 2},${topB}`,
              ].join(" ")}
              style={{ fill: bodyColor, opacity: 0.16 }}
            />
          );
        })}

        {/* Leakage between consecutive stages -- the backorder/cancel volume. */}
        {stages.slice(0, -1).map((stage, i) => {
          const drop = safeValue(stage.value) - safeValue(stages[i + 1].value);
          if (drop <= 0) return null;
          const prev = safeValue(stage.value);
          const pct = prev > 0 ? `${((drop / prev) * 100).toFixed(1)}%` : NO_VALUE;
          return (
            <text
              key={`leak-${stage.label}-${i}`}
              x={CENTER}
              y={topAt(i) + STAGE_H + GAP_H / 2 + 4}
              textAnchor="middle"
              style={{
                fontFamily: "var(--wh-font-mono)",
                fontSize: "var(--wh-font-size-xs)",
                fill: leakColor,
              }}
            >
              {`−${formatValue(drop)} (${pct})`}
            </text>
          );
        })}

        {stages.map((stage, i) => {
          const top = topAt(i);
          const w = widthAt(stage.value);
          const mid = top + STAGE_H / 2;
          return (
            <g key={`${stage.label}-${i}`}>
              <title>{`${stage.label}: ${formatValue(stage.value)}`}</title>
              <text
                x={LABEL_END}
                y={mid}
                textAnchor="end"
                dominantBaseline="middle"
                style={labelStyle}
              >
                {truncateLabel(stage.label, 15)}
              </text>
              <rect
                x={TRACK_X0}
                y={top}
                width={TRACK_W}
                height={STAGE_H}
                rx={2}
                style={{ fill: "var(--wh-color-border-subtle)", opacity: 0.6 }}
              />
              {w > 0 && (
                <rect
                  x={CENTER - w / 2}
                  y={top}
                  width={w}
                  height={STAGE_H}
                  rx={2}
                  style={{ fill: bodyColor }}
                />
              )}
              <text
                x={VALUE_END}
                y={mid}
                textAnchor="end"
                dominantBaseline="middle"
                style={valueStyle}
              >
                {formatValue(stage.value)}
              </text>
              <text
                x={PCT_END}
                y={mid}
                textAnchor="end"
                dominantBaseline="middle"
                style={pctStyle}
              >
                {conversionPct(stage.value, entry)}
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
