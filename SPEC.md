# Project: warehouse-ui-kit (@warehouse/ui-kit)

> **NOTE FOR claudioed:** this content is meant to be AGENTS.md/CLAUDE.md
> for this repo, but writing either of those filenames is blocked by an
> approval guard that requires your own confirmation (protected
> agent-instruction files, first-ever write on this repo). Please review
> this file and, if it looks right, rename it to AGENTS.md yourself (and
> symlink CLAUDE.md -> AGENTS.md, matching every other repo in the fleet)
> — or ask me to try again with your explicit go-ahead.

Shared design tokens and React component library for the
`warehouse-systems` micro-frontend console. Consumed by `warehouse-console`
(the shell) and every remote micro-frontend
(`order-mgmt-mfe`/`inventory-mfe`/`planning-mfe`/`fulfillment-mfe`/
`workforce-mfe`/`facility-mfe`/`process-path-mfe`/`labor-mfe`), each living
inside its own bounded-context repo.

> **Study project.** Personal DDD/hexagonal-architecture/micro-frontend
> learning exercise. Not a production system; no uptime or support
> guarantee.

## What this repo is the ONE place for

- Design tokens (color, spacing, type, motion) — `src/tokens/tokens.css`
- Domain-status → visual-tone mapping (`StatusPill`) — every context's
  Order/Task/WorkUnit/Reservation/Slot status renders identically
  everywhere it appears
- Shared layout primitives (`Card`, `DataTable`, `Timeline`, `KpiStat`,
  `LaunchTile`) and dependency-free SVG chart primitives (`BarChart`,
  `LineChart`, `FunnelChart` — no charting library dependency, deliberately)
- The persistent app chrome (`AppShell`) reused by the shell and by any
  remote run standalone in local dev

A remote hand-rolling its own palette or status colors instead of
consuming these is a bug, not a style choice — visual consistency across a
micro-frontend boundary is the #1 place MFE UX fails. If you're asked to
add a domain-status color or a new chart type, it almost always belongs
here, not in the consuming remote.

## Non-negotiables (read before touching a component or the build)

1. **No npm registry publish step exists (single-workspace, pre-1.0).**
   Every consumer (the shell and every remote) references this package via
   `file:../../warehouse-ui-kit` in local development — there is no
   version to bump for a normal change, just commit/push/merge and the
   next `npm install` in a consumer picks it up from the local path.

2. **Docker builds of a CONSUMING remote cannot use the committed
   lockfile or a host `node_modules` for this package.** Both leave the
   Linux native bindings missing and kill `vite build` with `Cannot find
   native binding ... @rolldown/binding-linux-*` (a known npm/cli issue).
   If asked to fix a remote's Dockerfile build against this package: base
   `node:22-bookworm-slim` (NOT an alpine image — npm 11 rejects
   npm-10-authored lockfiles outright, and glibc matches the published
   `*-gnu` bindings), exclude `node_modules`/`dist` via `.dockerignore`,
   `rm -rf node_modules package-lock.json` in the ui-kit build stage (it
   arrives as a named build context from a developer checkout), `COPY
   package.json ./` only, then `npm install --no-save`.

3. **Never convert a consuming remote's `vite.config.ts` to the callback
   form** (`defineConfig(({ command }) => ({...}))`) to set a deployment
   `base`. Every remote has a `vitest.config.ts` doing `mergeConfig(
   viteConfig, defineConfig({...}))`, and Vite throws `Error: Cannot merge
   config in form of callback` on a function export — killing the ENTIRE
   test suite, not just one test. Keep the object form and derive the
   base statically instead (`const IS_BUILD =
   process.argv.includes("build")`).

4. **A built remote's `dist/remoteEntry.js` being a ~144-byte relative
   re-export is CORRECT, not broken.** After a build with a
   `/mfes/<context>/` base, `remoteEntry.js` imports a relative
   `./assets/virtual_mf-REMOTE_ENTRY_ID...js` path — grepping it for
   `/mfes/<context>/` returns zero matches. That's expected:
   `dist/index.html` carries the absolute prefixed URLs, every JS chunk
   uses relative ESM imports, and the preload helper resolves via `new
   URL("../" + e, import.meta.url)`, making chunk resolution
   origin-relative to wherever `remoteEntry.js` was fetched from — exactly
   what a path-mounted remote needs. Don't "fix" this by forcing an
   absolute publicPath; verify instead by serving the built image and
   fetching through the real gateway path.

5. **A remote with no `test` script in `package.json` silently never runs
   any `.test.ts` file added to it** — `npm test` fails with `Missing
   script: "test"` and nothing in CI catches it unless that repo's own
   `web:` CI job actually invokes `npm test` (verify it does; several
   remotes historically didn't have a test runner wired at all). When
   adding this package's components to a new remote, check `npm run` in
   that remote's `web/` directory before assuming a test file executes.

## Key commands

```bash
npm ci                # or npm install
npm run typecheck     # tsc -b --noEmit
npm run lint          # oxlint (see .oxlintrc.json)
npm test              # vitest run (jsdom + React Testing Library)
npm run test:watch    # vitest watch mode
npm run build          # tsc -b && vite build -> dist/
make check            # mirrors ci.yml: lint + typecheck + test + build + audit
```

CI (`.github/workflows/ci.yml` + `codeql.yml`) runs lint/typecheck/test/
build/`npm audit` on every push/PR, plus CodeQL. `Makefile` (added Phase 1
of the harness-coverage-expansion plan) gives this repo the same `make
check`/`make check-all` vocabulary as the rest of the fleet.
