import type { ReactElement, ReactNode } from "react";

export type TimelineStepState = "done" | "active" | "pending" | "warning" | "error";

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
   *  alerts panel -- see the Order Lifecycle screen design rationale. */
  warnings?: string[];
}

const STATE_COLOR: Record<TimelineStepState, string> = {
  done: "var(--wh-color-status-success)",
  active: "var(--wh-color-status-progress)",
  pending: "var(--wh-color-status-neutral)",
  warning: "var(--wh-color-status-warning)",
  error: "var(--wh-color-status-danger)",
};

/**
 * Horizontal (desktop) / vertical (narrow) lifecycle stepper. Built for
 * exactly one job: the Order Lifecycle screen's "Received -> Allocated ->
 * Released -> WorkUnit -> Task(s) -> Sealed" cross-service narrative, but
 * generic enough for any other multi-stage domain flow the console needs
 * later.
 *
 * Partial-failure tolerant by construction: a step with state="pending"
 * and no detail simply renders as "not reached yet / data unavailable" --
 * callers should render whatever stages DID come back rather than
 * blocking the whole timeline on one slow/down upstream service.
 */
export function Timeline({ steps }: { steps: TimelineStep[] }): ReactElement {
  return (
    <ol
      style={{
        listStyle: "none",
        margin: 0,
        padding: 0,
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}
    >
      {steps.map((step, i) => {
        const color = STATE_COLOR[step.state];
        const isLast = i === steps.length - 1;
        return (
          <li key={step.id} style={{ display: "flex", gap: "var(--wh-space-4)" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: 20,
                flexShrink: 0,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: step.state === "pending" ? "transparent" : color,
                  border: `2px solid ${color}`,
                  marginTop: 4,
                  flexShrink: 0,
                }}
              />
              {!isLast && (
                <span
                  aria-hidden
                  style={{
                    width: 2,
                    flex: 1,
                    minHeight: 32,
                    background: "var(--wh-color-border)",
                    marginTop: 2,
                  }}
                />
              )}
            </div>
            <div style={{ paddingBottom: "var(--wh-space-5)", flex: 1 }}>
              <div
                style={{
                  fontSize: "var(--wh-font-size-xs)",
                  color: "var(--wh-color-text-faint)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  fontWeight: 600,
                }}
              >
                {step.context}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "var(--wh-space-2)",
                  marginTop: 2,
                }}
              >
                <span style={{ fontWeight: 600, fontSize: "var(--wh-font-size-md)" }}>
                  {step.title}
                </span>
                {step.timestamp && (
                  <span
                    style={{
                      fontSize: "var(--wh-font-size-xs)",
                      color: "var(--wh-color-text-muted)",
                      fontFamily: "var(--wh-font-mono)",
                    }}
                  >
                    {step.timestamp}
                  </span>
                )}
              </div>
              {step.detail && (
                <div
                  style={{
                    marginTop: 4,
                    fontSize: "var(--wh-font-size-sm)",
                    color: "var(--wh-color-text-muted)",
                  }}
                >
                  {step.detail}
                </div>
              )}
              {step.warnings?.map((w, wi) => (
                <div
                  key={wi}
                  style={{
                    marginTop: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: "var(--wh-font-size-xs)",
                    color: "var(--wh-color-status-warning)",
                    background: "var(--wh-color-status-warning-bg)",
                    borderRadius: "var(--wh-radius-sm)",
                    padding: "4px 8px",
                    width: "fit-content",
                  }}
                >
                  ⚠ {w}
                </div>
              ))}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
