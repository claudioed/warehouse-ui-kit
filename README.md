# @warehouse/ui-kit

Shared design tokens and React component library for the
[warehouse-systems](https://github.com/claudioed?tab=repositories&q=warehouse) micro-frontend
console. Consumed by `warehouse-console` (the shell) and every remote micro-frontend
(`order-mgmt-mfe`, `inventory-mfe`, `planning-mfe`, `fulfillment-mfe`, `workforce-mfe`,
`facility-mfe`), each living inside its own bounded-context repo.

This package is the **one place** that decides:
- Design tokens (color, spacing, type, motion) — `src/tokens/tokens.css`
- Domain-status → visual-tone mapping (`StatusPill`) — every context's Order/Task/WorkUnit/
  Reservation/Slot status renders identically everywhere it appears
- Shared layout primitives (`Card`, `DataTable`, `Timeline`, `KpiStat`, `LaunchTile`)
- The persistent app chrome (`AppShell`) reused by the shell and by any remote run standalone
  in local dev

A remote hand-rolling its own palette or status colors instead of consuming these is a bug,
not a style choice — visual consistency across a micro-frontend boundary is the #1 place MFE
UX fails.

## Study project disclaimer

This repository, and every other repository in the `warehouse-systems` set, is a personal
study project exploring Domain-Driven Design, hexagonal architecture, and (for this repo)
micro-frontend composition patterns. It is not production software and has no support
guarantees.

## Development

```bash
npm install
npm run typecheck   # tsc -b --noEmit
npm run lint        # oxlint
npm run build        # tsc -b && vite build -> dist/
```

Consumers reference this package via `file:../../warehouse-ui-kit` in local development;
there is no npm registry publish step yet (single-workspace, pre-1.0).

## Components

| Component | Purpose |
|---|---|
| `StatusPill` | Renders any domain status (Order, Task, WorkUnit, Reservation, Slot, shift) with a consistent tone |
| `Timeline` | Horizontal step timeline — powers the Order Lifecycle screen |
| `Card` | Bordered content panel with optional title/actions header |
| `DataTable` | Typed, column-driven table |
| `FreshnessBadge` | Surfaces analytics-projection lag from each service's `/reports/*/freshness` endpoint |
| `KpiStat` | Control-tower stat panel (big number, label, threshold-colored accent bar) |
| `LaunchTile` | Fiori-style launchpad tile linking into a bounded context's screen |
| `AppShell` | Persistent top nav + site-switcher slot |
| `useFetch` | Minimal typed-fetch hook shared by every remote |
