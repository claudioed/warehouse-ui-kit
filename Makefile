# Makefile — the local quality gate for warehouse-ui-kit.
#
# Every target below mirrors a sensor in .github/workflows/ci.yml, so an
# agent or human has the same `make check`/`make check-all` vocabulary
# used across every repo in the warehouse-systems fleet, including the
# eight Go bounded-context repos.

.PHONY: help install lint typecheck test build dependency-audit check check-all

help:
	@echo "warehouse-ui-kit — local quality gate (targets mirror .github/workflows/ci.yml)"
	@echo ""
	@echo "  help              Print this list of targets (default target)"
	@echo "  install           npm ci"
	@echo "  lint              oxlint"
	@echo "  typecheck         tsc -b --noEmit"
	@echo "  test              vitest run"
	@echo "  build             tsc -b && vite build"
	@echo "  dependency-audit  npm audit --audit-level=high"
	@echo ""
	@echo "  check             FAST bundle: lint typecheck test build"
	@echo "  check-all         check + dependency-audit — run this before pushing"

install:
	npm ci

lint:
	npm run lint

typecheck:
	npm run typecheck

test:
	npm test

build:
	npm run build

dependency-audit:
	npm audit --audit-level=high

# The fast self-correction loop: run this after every change, before committing.
check: lint typecheck test build

# The fuller gate a human runs before pushing.
check-all: check dependency-audit
