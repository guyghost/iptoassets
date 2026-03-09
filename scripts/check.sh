#!/usr/bin/env bash
set -euo pipefail

echo "==> Running lint..."
pnpm lint

echo "==> Running typecheck..."
pnpm typecheck

echo "==> Running tests..."
pnpm test

echo "==> All checks passed!"
