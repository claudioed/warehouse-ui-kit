import type { CSSProperties, ReactElement } from "react";

/**
 * Every status string this pill can render, gathered directly from each
 * bounded context's own domain enum -- see the CLAUDE.md ubiquitous-
 * language section of each repo. DO NOT invent UI-only status labels: the
 * whole point of this component is that an ops person reading a screen in
 * fulfillment-mfe and a screen in order-mgmt-mfe sees the exact same word
 * for "this hasn't started yet" wherever it appears.
 *
 * Grouped by owning context; add new statuses here as new lifecycle states
 * ship in the source Go domain, not ad hoc in a screen component.
 */
export type DomainStatus =
  // order-management: Order.Status
  | "Received"
  | "Allocated"
  | "PartiallyAllocated"
  | "Backordered"
  | "Released"
  | "PartiallyReleased"
  | "Cancelled"
  // order-management: OrderLine.LineStatus
  | "Pending"
  // fulfillment-execution: Task.Status
  | "PENDING"
  | "CLAIMED"
  | "COMPLETED"
  // inventory-storage: StockUnit state
  | "Available"
  | "Reserved"
  | "Picked"
  | "Removed"
  | "Unlocated"
  // facility-layout: LocationSlot state
  | "Occupied"
  | "Free"
  | "Decommissioned"
  // workforce-management: shift/associate state
  | "OnShift"
  | "OnBreak"
  | "OffShift"
  // generic fallback for anything not yet enumerated above -- renders as
  // neutral rather than throwing, so a new backend status never crashes a
  // screen; but treat every appearance of this fallback as a TODO to add
  // the real status to this union.
  | (string & {});

type Tone = "neutral" | "progress" | "success" | "warning" | "danger";

/**
 * The full status -> tone mapping. This is the ONE place that decides
 * "is this status good, bad, or in-progress" across the whole console.
 */
const STATUS_TONE: Record<string, Tone> = {
  // terminal / good
  Released: "success",
  PartiallyReleased: "success",
  Allocated: "success",
  COMPLETED: "success",
  Available: "success",
  Occupied: "success",
  OnShift: "success",
  // in progress / neutral-active
  Received: "progress",
  Pending: "neutral",
  PENDING: "neutral",
  CLAIMED: "progress",
  Reserved: "progress",
  PartiallyAllocated: "progress",
  OnBreak: "progress",
  Free: "neutral",
  // needs attention
  Backordered: "warning",
  Picked: "neutral",
  // terminal / bad or exceptional
  Cancelled: "danger",
  Removed: "danger",
  Unlocated: "danger",
  Decommissioned: "neutral",
  OffShift: "neutral",
};

const TONE_VARS: Record<Tone, { fg: string; bg: string }> = {
  neutral: {
    fg: "var(--wh-color-status-neutral)",
    bg: "var(--wh-color-status-neutral-bg)",
  },
  progress: {
    fg: "var(--wh-color-status-progress)",
    bg: "var(--wh-color-status-progress-bg)",
  },
  success: {
    fg: "var(--wh-color-status-success)",
    bg: "var(--wh-color-status-success-bg)",
  },
  warning: {
    fg: "var(--wh-color-status-warning)",
    bg: "var(--wh-color-status-warning-bg)",
  },
  danger: {
    fg: "var(--wh-color-status-danger)",
    bg: "var(--wh-color-status-danger-bg)",
  },
};

export interface StatusPillProps {
  status: DomainStatus;
  /** Override the derived tone -- escape hatch, prefer extending STATUS_TONE. */
  tone?: Tone;
  size?: "sm" | "md";
}

/**
 * Renders any domain status (order, line, task, work-unit, stock, slot,
 * shift) as a consistent pill. Unknown statuses fall back to neutral gray
 * rather than throwing, so a backend adding a new enum value never breaks
 * a screen -- but check STATUS_TONE for missing entries when you see gray
 * where you expected a color.
 */
export function StatusPill({
  status,
  tone,
  size = "md",
}: StatusPillProps): ReactElement {
  const resolvedTone = tone ?? STATUS_TONE[status] ?? "neutral";
  const { fg, bg } = TONE_VARS[resolvedTone];
  const style: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    color: fg,
    background: bg,
    borderRadius: "var(--wh-radius-pill)",
    fontWeight: 600,
    lineHeight: 1,
    whiteSpace: "nowrap",
    fontSize: size === "sm" ? "var(--wh-font-size-xs)" : "var(--wh-font-size-sm)",
    padding: size === "sm" ? "3px 8px" : "5px 10px",
  };
  return (
    <span style={style} data-status={status} data-tone={resolvedTone}>
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: fg,
          flexShrink: 0,
        }}
      />
      {status}
    </span>
  );
}
