# AGENTS.md

## Cursor Cloud specific instructions

Nx (v23) integrated monorepo for **Kodem**. See `.cursor/rules/nx.md` for structure standards.

### Applications

| App | Path | Stack | Dev command | URL |
|-----|------|-------|-------------|-----|
| **app** | `apps/app` | Next.js SaaS UI | `CI=true npx nx dev app` | http://localhost:3000 |
| **marketing** | `apps/marketing` | Astro marketing site | `CI=true npx nx dev marketing` | http://localhost:4321 |
| **api** | `apps/api` | NestJS backend | `CI=true npx nx serve api` | http://localhost:3333/api |
| **worker** | `apps/worker` | NestJS engine runner | `CI=true npx nx serve worker` | http://localhost:3334/worker |

### Library layout (`libs/`)

```
platform/     auth, subscription, ai
workspace/    core, events, profile, insights, recommendations
modules/      crm (+ digital-card, etc. later)
engines/      discovery, insight, recommendation, rule, learning, pipeline, shared
integrations/ external adapters
database/     prisma + repositories
shared/       ui, types
```

Import via `@kodem/<category>/<lib>` (e.g. `@kodem/workspace/core`, `@kodem/modules/crm`).

Nx tags: `scope:platform|workspace|module|engine|integration|database|shared`.

### Execution flow

```
Module/API → Event → Worker → Engines → BKM artifacts → Module/UI
```

### Commands

- Lint: `CI=true npx nx run-many -t lint`
- Build all: `npm run build`
- DB: `npm run db:generate` / `npm run db:migrate` / `npm run db:migrate:deploy`

### Database

- PostgreSQL via `DATABASE_URL` (Docker Compose provides Postgres locally; Azure Database for PostgreSQL Flexible Server in deployed environments).
- Optional local SQLite fallback when `DATABASE_URL` starts with `file:`.

### Docker (local smoke test)

```bash
cp .env.example .env   # edit POSTGRES_PASSWORD and JWT_SECRET
docker compose up -d --build
curl http://localhost:3000/api/health
```

### Deploy (CI/CD)

Target is **Azure Container Apps**, images in **Azure Container Registry**, data in **Azure Database for PostgreSQL Flexible Server**. Full runbook: [`deploy/azure/README.md`](deploy/azure/README.md).

| Trigger | Workflow | Environment | GitHub Environment | App | API |
|---------|----------|-------------|--------------------|-----|-----|
| Push to `dev` | `deploy-dev.yml` | `dev` | `development` | `app.dev.kodem.co.il` | `api.dev.kodem.co.il` |
| Tag `v-*` on `main` | `deploy-prod.yml` | `prod` | `production` | `app.kodem.co.il` | `api.kodem.co.il` |

Both call `deploy.yml`: lint → build/push three images to ACR → `az deployment group create` with `deploy/azure/main.bicep` → health check. `dev` / `prod` name the Azure resource suffix and the Bicep parameter file; the GitHub Environment holding the credentials is passed separately as `github_environment`, since GitHub Environments cannot be renamed. The hostnames live in `deploy/azure/main.parameters.<env>.json`.

**GitHub Environment variables**: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, `AZURE_RESOURCE_GROUP`, `AZURE_CONTAINER_REGISTRY`, optional `APP_CUSTOM_DOMAIN`, `API_CUSTOM_DOMAIN`, `POSTGRES_LOCATION`, `POSTGRES_VERSION` and `OAUTH_*_CLIENT_ID`.

`POSTGRES_LOCATION` exists because a subscription is not allowed to provision flexible servers in every region; when it cannot, ARM reports `The value of the 'Version' should be in: []`. The deploy job recognises that message and prints what to do about it.

**GitHub Environment secrets**: `POSTGRES_ADMIN_PASSWORD`, `JWT_SECRET`, optional `OAUTH_*_CLIENT_SECRET`.

Authentication is OIDC federated credentials — no Azure passwords in GitHub. Images are built as **linux/amd64**, which Container Apps runs natively.

**Azure bootstrap** (once per environment): `ENVIRONMENT=dev GITHUB_REPO=<owner>/<repo> bash deploy/azure/bootstrap-azure.sh`, or `./deploy/azure/bootstrap-azure.ps1 -Environment dev -GithubRepo <owner>/<repo>` on Windows — creates the resource group, registry, pull identity and OIDC app registration, then prints the GitHub configuration to apply. Keep the two scripts in sync. Default region is `northeurope`; before creating anything the script checks the subscription can provision Container Apps, the registry and PostgreSQL there, and stops with nearby regions that work if it cannot.

**Release to production:**

```bash
git checkout main && git pull
git tag v-1.0.0
git push origin v-1.0.0
```

### Caveats

- Prefix Nx with `CI=true` for non-interactive runs.
- Within `libs/shared/ui`, use **relative** imports between files in the same project.
- Prisma pinned to v6.
- If `npx nx` fails (missing `.nx/nxw.js`), use `node node_modules/nx/dist/bin/nx.js`.
- Next.js app image bakes `API_ORIGIN` at Docker build time: `http://api:3333` for Compose, `http://kodem-api` for Container Apps (the api container app name is its internal DNS name). The public api domain is for direct callers; the web app keeps proxying `/api/*` internally.
- A new Azure environment needs one deploy with `custom_domains=false` before the DNS records for its hostnames can exist. See [`deploy/azure/README.md`](deploy/azure/README.md).
