#!/usr/bin/env bash
set -euo pipefail

echo "Starting PostgreSQL..."
docker compose up -d

echo "Waiting for PostgreSQL..."
until docker compose exec -T postgres pg_isready -U ipms > /dev/null 2>&1; do
  sleep 1
done

echo "Running migrations..."
cd packages/infrastructure && DATABASE_URL=postgresql://ipms:ipms@localhost:5432/ipms pnpm db:migrate
cd ../..

echo "Starting dev server..."
DATABASE_URL=postgresql://ipms:ipms@localhost:5432/ipms pnpm dev
