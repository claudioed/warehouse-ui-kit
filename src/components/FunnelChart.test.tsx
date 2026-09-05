import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FunnelChart } from "./FunnelChart";

// The WMS order funnel shape: received -> allocated -> released, where the
// gap between stages is backordered/cancelled volume.
const STAGES = [
  { label: "Received", value: 1000 },
  { label: "Allocated", value: 820 },
  { label: "Released", value: 700 },
];

describe("FunnelChart", () => {
  it("renders every stage with its value and conversion against entry", () => {
    render(<FunnelChart title="Order funnel" stages={STAGES} />);

    expect(
      screen.getByRole("img", { name: "Order funnel funnel chart" }),
    ).toBeInTheDocument();

    for (const stage of STAGES) {
      expect(screen.getByText(stage.label)).toBeInTheDocument();
    }
    expect(screen.getByText("1,000")).toBeInTheDocument();
    expect(screen.getByText("820")).toBeInTheDocument();
    expect(screen.getByText("700")).toBeInTheDocument();

    expect(screen.getByText("100.0%")).toBeInTheDocument();
    expect(screen.getByText("82.0%")).toBeInTheDocument();
    expect(screen.getByText("70.0%")).toBeInTheDocument();
  });

  it("reports the leakage between consecutive stages", () => {
    render(<FunnelChart stages={STAGES} />);
    expect(screen.getByText("−180 (18.0%)")).toBeInTheDocument();
    expect(screen.getByText("−120 (14.6%)")).toBeInTheDocument();
  });

  it("narrows each stage and joins them with tapering connectors", () => {
    const { container } = render(<FunnelChart stages={STAGES} />);

    // One connector between each adjacent pair of stages.
    expect(container.querySelectorAll("polygon")).toHaveLength(
      STAGES.length - 1,
    );

    // Each stage draws a full-width track plus its own narrower body.
    const rects = Array.from(container.querySelectorAll("rect"));
    expect(rects).toHaveLength(STAGES.length * 2);
    const bodyWidths = [rects[1], rects[3], rects[5]].map((r) =>
      Number(r.getAttribute("width")),
    );
    expect(bodyWidths[1]).toBeLessThan(bodyWidths[0]);
    expect(bodyWidths[2]).toBeLessThan(bodyWidths[1]);
  });

  it("omits a leakage readout when a stage does not shrink", () => {
    const { container } = render(
      <FunnelChart
        stages={[
          { label: "Received", value: 500 },
          { label: "Allocated", value: 500 },
        ]}
      />,
    );
    expect(container.querySelector("svg")?.outerHTML).not.toContain("−");
  });

  it("uses a caller-supplied formatValue for stages and leakage", () => {
    render(
      <FunnelChart
        stages={STAGES}
        formatValue={(v) => `${v} ea`}
      />,
    );
    expect(screen.getByText("1000 ea")).toBeInTheDocument();
    expect(screen.getByText("−180 ea (18.0%)")).toBeInTheDocument();
  });

  it("shows a placeholder conversion instead of NaN when entry is zero", () => {
    const { container } = render(
      <FunnelChart
        stages={[
          { label: "Received", value: 0 },
          { label: "Allocated", value: 0 },
        ]}
      />,
    );
    expect(screen.getAllByText("—")).toHaveLength(2);
    expect(container.querySelector("svg")?.outerHTML).not.toContain("NaN");
  });

  it("renders an empty state and no plot when stages is empty", () => {
    render(<FunnelChart title="Order funnel" stages={[]} />);

    expect(screen.getByText("No data.")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("Order funnel")).toBeInTheDocument();
  });

  it("renders a custom empty state when provided", () => {
    render(
      <FunnelChart stages={[]} emptyState={<span>No orders in window.</span>} />,
    );
    expect(screen.getByText("No orders in window.")).toBeInTheDocument();
  });
});
