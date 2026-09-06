import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { KpiStat } from "./KpiStat";

describe("KpiStat", () => {
  it("groups thousands rather than printing a raw integer", () => {
    render(<KpiStat label="Pick queue" value={13480} />);
    expect(screen.getByText("13,480")).toBeInTheDocument();
  });

  it("renders a missing value as an em dash, never as zero", () => {
    render(<KpiStat label="Pick queue" value={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  /**
   * The defect this guards: a failed tile used to be forced to
   * tone="neutral", so a metric whose feed was dead rendered in the calm
   * brand-blue accent -- quieter than a healthy busy tile. Absence of
   * signal must be visually louder than any real reading.
   */
  it("marks an unavailable feed distinctly from a real zero", () => {
    const { container: unavailable } = render(
      <KpiStat label="Backlog" value={null} state="unavailable" />,
    );
    const unavailableTile = unavailable.querySelector(".wh-kpi");
    expect(unavailableTile).toHaveAttribute("data-state", "unavailable");
    expect(unavailableTile).toHaveClass("wh-kpi--unavailable");
    expect(screen.getByText("no signal")).toBeInTheDocument();

    const { container: healthy } = render(
      <KpiStat label="Backlog" value={0} caption="tasks pending" />,
    );
    const healthyTile = healthy.querySelector(".wh-kpi");
    expect(healthyTile).toHaveAttribute("data-state", "ok");
    expect(healthyTile).not.toHaveClass("wh-kpi--unavailable");
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("derives tone from a threshold so callers stop hand-computing it", () => {
    const { container } = render(
      <KpiStat
        label="Pick queue"
        value={42}
        threshold={{ warnAbove: 5, dangerAbove: 20 }}
      />,
    );
    expect(
      container.querySelector<HTMLElement>(".wh-kpi__accent")?.style.getPropertyValue(
        "--wh-kpi-accent",
      ),
    ).toBe("var(--wh-color-status-danger)");
  });

  it("applies the requested format to numeric values", () => {
    render(<KpiStat label="Lag" value={3720} format="duration" />);
    expect(screen.getByText("1h 02m")).toBeInTheDocument();
  });

  it("reports delta direction to assistive tech, not just by color", () => {
    render(
      <KpiStat
        label="Throughput"
        value={120}
        delta={{ value: -8, goodDirection: "up" }}
      />,
    );
    expect(screen.getByText("down")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("stays a plain div when no href is given, and a link when one is", () => {
    const { container, rerender } = render(
      <KpiStat label="Sites" value={3} />,
    );
    expect(container.querySelector("a.wh-kpi")).toBeNull();

    rerender(<KpiStat label="Sites" value={3} href="/facility" />);
    expect(container.querySelector("a.wh-kpi")).toHaveAttribute(
      "href",
      "/facility",
    );
  });
});
