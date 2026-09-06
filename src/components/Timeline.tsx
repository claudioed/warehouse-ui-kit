import type { ReactElement, ReactNode } from "react";

/**
 * `unavailable` is deliberately NOT the same as `pending`.
 *
 * - pending      -- the order genuinely has not reached this stage. Normal.
 * - unavailable  -- the owning service did not answer, so whether it
 *                   reached this stage is UNKNOWN. Actionable.
 *
 * These were previously collapsed into a single `pending` step with the
 * copy "Not reached yet, or this service didn't respond", which told an
 * operator a reassuring story about a broken observability path. The
 * ui-kit's own FreshnessBadge already states the principle this restores:
 * surfacing staleness honestly beats a dashboard that looks real-time but
 * is quietly wrong.
 */
export type TimelineStepState =
  | "done"
  | "active"
  | "pending"
  | "unavailable"
  | "warning"
  | "error";

export type TimelineOrientation = "auto" | "horizontal" | "vertical";

export interface TimelineStep {
  id: string;
  /** Owning bounded context, shown as a small caption -- keeps the cross-
   *  service origin of each stage honest instead of pretending this is one
   *  service's data. */
  context: string;
  title: string;
  state: TimelineStepState;
  timestamp?: string;
  /** Free-form detail rendered under the title -- ids, counts, station,
   *  whatever the stage's owning service returned. */
  detail?: ReactNode;
  /** Inline warnings for this stage (e.g. "Line 2 backordered", "Lease
   *  expired once"). Rendered as small warning rows, never a separate
   *  alerts panel. */
  warnings?: string[];
  /** Why this stage is unknown. Only meaningful with state="unavailable";
   *  e.g. "inventory-storage did not respond". */
  unavailableReason?: string;
}

/** Color alone cannot distinguish done from error for a large minority of
 *  operators, so every state also carries a mark. */
const STATE_GLYPH: Record<TimelineStepState, string> = {
  done: "✓",
  active: "•",
  pending: "",
  unavailable: "",
  warning: "!",
  error: "✕",
};

const STATE_LABEL: Record<TimelineStepState, string> = {
  done: "completed",
  active: "in progress",
  pending: "not reached yet",
  unavailable: "no signal",
  warning: "completed with warnings",
  error: "failed",
};

function colorFor(state: TimelineStepState): string {
  switch (state) {
    case "done":
      return "var(--wh-color-status-success)";
    case "active":
      return "var(--wh-color-status-progress)";
    case "warning":
    case "unavailable":
      return "var(--wh-color-status-warning)";
    case "error":
      return "var(--wh-color-status-danger)";
    default:
      return "var(--wh-color-status-neutral)";
  }
}

/**
 * Horizontal (desktop) / vertical (narrow) lifecycle stepper, built for
 * the Order Lifecycle screen's cross-service narrative but generic enough
 * for any multi-stage domain flow.
 *
 * Partial-failure tolerant by construction: render whatever stages DID
 * come back, marking the rest `pending` (not yet) or `unavailable` (not
 * known) -- never blocking the whole timeline on one slow upstream.
 */
export function Timeline({
  steps,
  orientation = "vertical",
}: {
  steps: TimelineStep[];
  orientation?: TimelineOrientation;
}): ReactElement {
  const orientationClass =
    orientation === "horizontal"
      ? "wh-timeline--horizontal"
      : orientation === "auto"
        ? "wh-timeline--horizontal wh-timeline--auto"
        : "";

  return (
    <ol className={`wh-timeline ${orientationClass}`.trim()}>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <li
            key={step.id}
            data-state={step.state}
            className={`wh-timeline__step wh-timeline__step--${step.state}`}
          >
            <div className="wh-timeline__rail">
              <span
                aria-hidden
                className="wh-timeline__dot"
                style={{ ["--wh-timeline-color" as string]: colorFor(step.state) }}
              >
                {STATE_GLYPH[step.state]}
              </span>
              {!isLast && <span aria-hidden className="wh-timeline__connector" />}
            </div>
            <div className="wh-timeline__body">
              <div className="wh-timeline__context">{step.context}</div>
              <div className="wh-timeline__head">
                <span className="wh-timeline__title">{step.title}</span>
                {/* State is otherwise conveyed only by dot color/shape. */}
                <span className="wh-visually-hidden">
                  {STATE_LABEL[step.state]}
                </span>
                {step.timestamp && (
                  <span className="wh-timeline__timestamp">{step.timestamp}</span>
                )}
              </div>
              {step.detail && (
                <div className="wh-timeline__detail">{step.detail}</div>
              )}
              {step.state === "unavailable" && step.unavailableReason && (
                <div className="wh-timeline__unavailable-reason">
                  <span aria-hidden>⚠</span>
                  {step.unavailableReason}
                </div>
              )}
              {step.warnings?.map((w, wi) => (
                <div key={`${step.id}-w${wi}`} className="wh-timeline__warning">
                  <span aria-hidden>⚠</span>
                  {w}
                </div>
              ))}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
