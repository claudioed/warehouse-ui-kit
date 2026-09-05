import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LineChart } from "./LineChart";

const SERIES = [
  { label: "09:00", value: 120 },
  { label: "10:00", value: 168 },
  { label: "11:00", value: 141 },
  { label: "12:00", value: 195 },
];

describe("LineChart", () => {
  it("renders a polyline through every point with first/last axis labels", () => {
    const { container } = render(
      <LineChart title="Picks per hour" data={SERIES} />,
    );

    expect(
      screen.getByRole("img", { name: "Picks per hour line chart" }),
    ).toBeInTheDocument();

    const polyline = container.querySelector("polyline");
    expect(polyline).toBeInTheDocument();
    const points = polyline?.getAttribute("points")?.trim().split(/\s+/) ?? [];
    expect(points).toHaveLength(SERIES.length);
    expect(points.join(" ")).not.toContain("NaN");

    // Only the endpoints get axis ticks -- this is a sparkline, not a full axis.
    expect(screen.getByText("09:00")).toBeInTheDocument();
    expect(screen.getByText("12:00")).toBeInTheDocument();
    expect(screen.queryByText("10:00")).not.toBeInTheDocument();
  });

  it("plots the highest value above the lowest value", () => {
    const { container } = render(<LineChart data={SERIES} />);
    const points = (container.querySelector("polyline")?.getAttribute("points") ?? "")
      .trim()
      .split(/\s+/)
      .map((p) => Number(p.split(",")[1]));

    // SVG y grows downward, so bigger values sit at smaller y.
    // Values are 120, 168, 141, 195 -> y order must be 195 < 168 < 141 < 120.
    expect(points[3]).toBeLessThan(points[1]);
    expect(points[1]).toBeLessThan(points[2]);
    expect(points[2]).toBeLessThan(points[0]);
  });

  it("draws a threshold line with its caption", () => {
    const { container } = render(
      <LineChart
        data={SERIES}
        threshold={{ value: 150, label: "target 150" }}
      />,
    );
    expect(container.querySelector("line")).toBeInTheDocument();
    expect(screen.getByText("target 150")).toBeInTheDocument();
  });

  it("keeps a threshold outside the data range on screen", () => {
    const { container } = render(
      <LineChart data={SERIES} height={100} threshold={{ value: 400 }} />,
    );
    const y = Number(container.querySelector("line")?.getAttribute("y1"));
    expect(Number.isFinite(y)).toBe(true);
    expect(y).toBeGreaterThanOrEqual(0);
    expect(y).toBeLessThanOrEqual(100);
  });

  it("exposes each point's value through a native title tooltip", () => {
    const { container } = render(<LineChart data={SERIES} />);
    const titles = Array.from(container.querySelectorAll("title")).map(
      (t) => t.textContent,
    );
    expect(titles).toContain("10:00: 168");
  });

  it("renders a dot but no polyline for a single point", () => {
    const { container } = render(
      <LineChart data={[{ label: "09:00", value: 42 }]} />,
    );
    expect(container.querySelector("polyline")).not.toBeInTheDocument();
    // The emphasised end dot plus one invisible hover target.
    expect(container.querySelectorAll("circle")).toHaveLength(2);
    expect(container.querySelector("svg")?.outerHTML).not.toContain("NaN");
  });

  it("centres a perfectly flat series instead of dividing by zero", () => {
    const { container } = render(
      <LineChart
        height={100}
        data={[
          { label: "09:00", value: 50 },
          { label: "10:00", value: 50 },
        ]}
      />,
    );
    const points = (container.querySelector("polyline")?.getAttribute("points") ?? "")
      .trim()
      .split(/\s+/)
      .map((p) => Number(p.split(",")[1]));
    expect(points.every(Number.isFinite)).toBe(true);
    expect(points[0]).toBeCloseTo(points[1], 5);
    expect(points[0]).toBeCloseTo(50, 5);
  });

  it("renders an empty state and no plot when data is empty", () => {
    render(<LineChart title="Picks per hour" data={[]} />);

    expect(screen.getByText("No data.")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("Picks per hour")).toBeInTheDocument();
  });

  it("renders a custom empty state when provided", () => {
    render(<LineChart data={[]} emptyState={<span>No shift data yet.</span>} />);
    expect(screen.getByText("No shift data yet.")).toBeInTheDocument();
  });
});
