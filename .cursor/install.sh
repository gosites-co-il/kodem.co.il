#!/usr/bin/env bash
# Idempotent Cloud Agent setup for the Kodem Nx monorepo.
# Prepares PostgreSQL, Node dependencies, the Prisma client and the database.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

PG_VERSION=16
PG_CLUSTER=main
DB_NAME=kodem
DB_USER=kodem
DB_PASSWORD=change-me-local

echo "==> Ensuring PostgreSQL ${PG_VERSION} is installed"
if ! command -v pg_ctlcluster >/dev/null 2>&1; then
  sudo DEBIAN_FRONTEND=noninteractive apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
    "postgresql-${PG_VERSION}" postgresql-contrib
fi

echo "==> Starting PostgreSQL cluster"
if ! pg_lsclusters -h 2>/dev/null | awk '{print $4}' | grep -q online; then
  sudo pg_ctlcluster "${PG_VERSION}" "${PG_CLUSTER}" start || true
fi
# Wait for the socket/port to accept connections.
for _ in $(seq 1 30); do
  if sudo -u postgres pg_isready -q; then break; fi
  sleep 1
done

echo "==> Ensuring role and database exist"
sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD}';
  END IF;
END \$\$;
SQL
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  sudo -u postgres createdb -O "${DB_USER}" "${DB_NAME}"
fi

echo "==> Writing root .env (local dev defaults) if missing"
if [ ! -f .env ]; then
  cp .env.example .env
  # .env.example ships empty OAuth client IDs; passport rejects empty strings,
  # so provide the same local placeholders docker-compose uses for a bootable API.
  sed -i \
    -e 's/^GOOGLE_CLIENT_ID=$/GOOGLE_CLIENT_ID=google-client-id/' \
    -e 's/^GOOGLE_CLIENT_SECRET=$/GOOGLE_CLIENT_SECRET=google-client-secret/' \
    .env
fi

echo "==> Installing Node dependencies (npm ci)"
npm ci

echo "==> Generating Prisma client"
npm run db:generate

echo "==> Applying database migrations"
npm run db:migrate:deploy

echo "==> Install complete"
