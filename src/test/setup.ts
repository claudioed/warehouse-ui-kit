import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// RTL does not auto-clean without globals mode; unmount between tests so a
// getByText never matches a leftover tree from the previous case.
afterEach(() => {
  cleanup();
});
