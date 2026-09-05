import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BarChart } from "./BarChart";

const FUNNEL = [
  { label: "Received", value: 1204 },
  { label: "Allocated", value: 980 },
  { label: "Released", value: 742 },
];

describe("BarChart", () => {
  it("renders a labelled bar per datum with formatted values", () => {
    render(<BarChart title="Order funnel" data={FUNNEL} />);

    expect(
      screen.getByRole("img", { name: "Order funnel bar chart" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Order funnel")).toBeInTheDocument();

    for (const datum of FUNNEL) {
      expect(screen.getByText(datum.label)).toBeInTheDocument();
    }
    expect(screen.getByText("1,204")).toBeInTheDocument();
    expect(screen.getByText("980")).toBeInTheDocument();
    expect(screen.getByText("742")).toBeInTheDocument();
  });

  it("scales bar widths against the largest value", () => {
    const { container } = render(<BarChart data={FUNNEL} />);
    // Each row draws a full-width track plus a value-width bar.
    const rects = Array.from(container.querySelectorAll("rect"));
    expect(rects).toHaveLength(FUNNEL.length * 2);

    const widths = rects.map((r) => Number(r.getAttribute("width")));
    const trackWidth = widths[0];
    // The largest datum fills the track; the others are strictly narrower.
    expect(widths[1]).toBeCloseTo(trackWidth, 5);
    expect(widths[3]).toBeLessThan(widths[1]);
    expect(widths[5]).toBeLessThan(widths[3]);
  });

  it("uses a caller-supplied formatValue", () => {
    render(
      <BarChart
        data={[{ label: "Accuracy", value: 98.2 }]}
        formatValue={(v) => `${v.toFixed(1)}%`}
      />,
    );
    expect(screen.getByText("98.2%")).toBeInTheDocument();
  });

  it("renders vertical orientation with axis baseline and labels", () => {
    const { container } = render(
      <BarChart title="Throughput" data={FUNNEL} orientation="vertical" />,
    );
    expect(container.querySelector("line")).toBeInTheDocument();
    expect(screen.getByText("Received")).toBeInTheDocument();
    expect(screen.getByText("1,204")).toBeInTheDocument();
  });

  it("renders an empty state and no plot when data is empty", () => {
    render(<BarChart title="Order funnel" data={[]} />);

    expect(screen.getByText("No data.")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    // Title still renders so the card does not collapse into a blank box.
    expect(screen.getByText("Order funnel")).toBeInTheDocument();
  });

  it("renders a custom empty state when provided", () => {
    render(<BarChart data={[]} emptyState={<span>No orders today.</span>} />);
    expect(screen.getByText("No orders today.")).toBeInTheDocument();
  });

  it("produces no NaN geometry when every value is zero", () => {
    const { container } = render(
      <BarChart
        data={[
          { label: "Received", value: 0 },
          { label: "Allocated", value: 0 },
        ]}
      />,
    );
    const svg = container.querySelector("svg");
    expect(svg?.outerHTML).not.toContain("NaN");
    // A zero measurement draws the track but no bar.
    expect(container.querySelectorAll("rect")).toHaveLength(2);
  });

  it("clamps negative values to a zero-length bar but still shows the number", () => {
    const { container } = render(
      <BarChart
        data={[
          { label: "Adjustments", value: 50 },
          { label: "Reversals", value: -12 },
        ]}
      />,
    );
    expect(screen.getByText("-12")).toBeInTheDocument();
    expect(container.querySelector("svg")?.outerHTML).not.toContain("NaN");
    // 2 tracks + 1 bar: the negative datum contributes no bar rect.
    expect(container.querySelectorAll("rect")).toHaveLength(3);
  });
});
