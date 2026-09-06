import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Timeline, type TimelineStep } from "./Timeline";

const STEPS: TimelineStep[] = [
  {
    id: "received",
    context: "order-management",
    title: "Order received",
    state: "done",
    timestamp: "Sep 4, 11:32 AM",
  },
  {
    id: "reserved",
    context: "inventory-storage",
    title: "Stock reserved",
    state: "unavailable",
    unavailableReason: "inventory-storage did not respond",
  },
  {
    id: "released",
    context: "wes-work-planning",
    title: "Work released",
    state: "pending",
  },
];

describe("Timeline", () => {
  /**
   * The defect this guards: "not reached yet" and "that service is down"
   * were both rendered as state="pending" with identical copy, so a broken
   * observability path looked exactly like an order progressing normally.
   */
  it("distinguishes an unavailable stage from a merely pending one", () => {
    const { container } = render(<Timeline steps={STEPS} />);

    const unavailable = container.querySelector('[data-state="unavailable"]');
    const pending = container.querySelector('[data-state="pending"]');

    expect(unavailable).toBeInTheDocument();
    expect(pending).toBeInTheDocument();
    expect(unavailable).not.toBe(pending);

    expect(unavailable).toHaveClass("wh-timeline__step--unavailable");
    expect(pending).toHaveClass("wh-timeline__step--pending");
  });

  it("names the service that went quiet instead of implying 'not yet'", () => {
    render(<Timeline steps={STEPS} />);
    expect(
      screen.getByText("inventory-storage did not respond"),
    ).toBeInTheDocument();
  });

  it("exposes each step's state to assistive tech, not by color alone", () => {
    render(<Timeline steps={STEPS} />);
    expect(screen.getByText("completed")).toBeInTheDocument();
    expect(screen.getByText("no signal")).toBeInTheDocument();
    expect(screen.getByText("not reached yet")).toBeInTheDocument();
  });

  it("renders an ordered list with one item per step", () => {
    const { container } = render(<Timeline steps={STEPS} />);
    expect(container.querySelectorAll("ol > li")).toHaveLength(STEPS.length);
  });

  it("supports the horizontal orientation its docs always promised", () => {
    const { container } = render(
      <Timeline steps={STEPS} orientation="horizontal" />,
    );
    expect(container.querySelector("ol")).toHaveClass("wh-timeline--horizontal");
  });

  it("defaults to vertical so existing callers are unchanged", () => {
    const { container } = render(<Timeline steps={STEPS} />);
    const list = container.querySelector("ol");
    expect(list).toHaveClass("wh-timeline");
    expect(list).not.toHaveClass("wh-timeline--horizontal");
  });
});
