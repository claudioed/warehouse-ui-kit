/**
 * Stylesheets are imported here rather than beside each component because
 * tsconfig.app.json enables `allowArbitraryExtensions`, under which a
 * relative `import "./Foo.css"` resolves against a sibling `Foo.d.css.ts`
 * instead of falling back to vite/client's `*.css` wildcard. Collecting
 * them in the entry point keeps one declared cascade order and avoids a
 * generated declaration file per component.
 *
 * `cssCodeSplit: false` folds all of this into a single dist/ui-kit.css,
 * which every consumer already pulls in via
 * `import "@warehouse/ui-kit/tokens.css"`. That is why adding component
 * styles required no change in any of the six remotes.
 *
 * Order matters: tokens first (they define every custom property the
 * component sheets reference).
 */
import "./tokens/tokens.css";
import "./components/AppShell.css";
import "./components/KpiStat.css";
import "./components/LaunchTile.css";
import "./components/Timeline.css";

export { StatusPill } from "./components/StatusPill";
export type { DomainStatus, StatusPillProps } from "./components/StatusPill";

export { Timeline } from "./components/Timeline";
export type { TimelineStep, TimelineStepState } from "./components/Timeline";

export { Card } from "./components/Card";

export { DataTable } from "./components/DataTable";
export type { Column, DataTableProps } from "./components/DataTable";

export { FreshnessBadge } from "./components/FreshnessBadge";

export { KpiStat } from "./components/KpiStat";
export type {
  KpiStatProps,
  KpiTone,
  KpiState,
  KpiFormat,
  KpiThreshold,
} from "./components/KpiStat";

export { LaunchTile } from "./components/LaunchTile";
export type { LaunchTileProps } from "./components/LaunchTile";

export { AppShell, Breadcrumbs } from "./components/AppShell";
export type { NavItem } from "./components/AppShell";

/* ---- navigation -----------------------------------------------------
   Lets the host inject its router's Link so nav clicks stop being full
   document navigations. The kit never imports react-router itself. */
export {
  NavigationProvider,
  useLinkComponent,
} from "./navigation/NavigationContext";
export type {
  LinkComponent,
  LinkProps,
} from "./navigation/NavigationContext";

/* ---- charts: dependency-free SVG primitives ------------------------- */
export { BarChart } from "./components/BarChart";
export type { BarChartProps } from "./components/BarChart";

export { LineChart } from "./components/LineChart";
export type {
  LineChartProps,
  LineChartThreshold,
} from "./components/LineChart";

export { FunnelChart } from "./components/FunnelChart";
export type { FunnelChartProps } from "./components/FunnelChart";

export type { ChartDatum, ChartTone } from "./components/chartCommon";

export { useFetch, FetchError } from "./hooks/useFetch";
export type { FetchState, UseFetchOptions } from "./hooks/useFetch";

/* ---- shared formatters ----------------------------------------------
   One place that decides how a quantity is written, for the same reason
   StatusPill is the one place that decides how a status is colored. */
export {
  NO_VALUE,
  formatNumber,
  formatCompact,
  formatPercent,
  formatDuration,
  formatInstant,
  secondsSince,
} from "./utils/format";
