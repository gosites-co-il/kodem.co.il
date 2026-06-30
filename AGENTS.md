# AGENTS.md

## Cursor Cloud specific instructions

This is an Nx (v23) integrated monorepo for **Kodem** — a PLG AI business intelligence platform. Package manager: npm.

### Applications

| App | Path | Stack | Dev command | URL |
|-----|------|-------|-------------|-----|
| **app** | `apps/app` | Next.js 16 (SaaS UI) | `CI=true npx nx dev app` | http://localhost:3000 |
| **web** | `apps/web` | Astro (marketing) | `CI=true npx nx dev web` | http://localhost:4321 |
| **api** | `apps/api` | NestJS (backend) | `CI=true npx nx serve api` | http://localhost:3333/api |
| **worker** | `apps/worker` | NestJS (engine runner) | `CI=true npx nx serve worker` | http://localhost:3334/worker |

### Libraries (`libs/`)

| Lib | Purpose | Tag |
|-----|---------|-----|
| `core` | Workspace, User, Member, Role, IDs | `layer:core` |
| `business` | BusinessProfile, Lead, Contact, etc. | `layer:domain` |
| `events` | Event schema, bus, store interface | `layer:core` |
| `engines` | Discovery, Insight, Recommendation, Rule, Learning | `layer:engines` |
| `ai` | LLM abstraction, prompts | `layer:ai` |
| `insights` | Insight schema & formatting | `layer:domain` |
| `recommendations` | Action generation & prioritization | `layer:domain` |
| `integrations` | External system adapters | `layer:integration` |
| `database` | Prisma client & repositories | `layer:core` |
| `auth` | JWT, sessions, RBAC | `layer:core` |
| `subscription` | Plans & entitlements | `layer:domain` |
| `ui` | Shared React design system (shadcn) | `layer:domain` |

Path aliases: `@kodem/<lib>` (see `tsconfig.base.json`).

### Execution flow

```
User Action → API → Event created → Worker consumes → Engines run → DB → App shows results
```

Engines are **never** triggered from UI or API request lifecycle — only from the worker.

### Standard commands

- Lint: `CI=true npx nx run-many -t lint`
- Test: `CI=true npx nx run-many -t test`
- Build all: `npm run build`
- DB: `npm run db:generate` / `npm run db:push`

### Non-obvious caveats

- Prefix Nx commands with `CI=true` to skip interactive telemetry prompts.
- `apps/app` and `apps/api` both expose `/api` paths but on different servers (3000 vs 3333).
- Within `libs/ui`, use **relative** imports between files in the same project (not `@kodem/ui/...`).
- `apps/app:lint` may crash with circular JSON from legacy `eslint-config-next` under ESLint 9.
- Jest must stay on v30; environment packages pinned to `^30`.
- Prisma is pinned to v6 (v7 has breaking config changes). SQLite DB at `libs/database/prisma/kodem.db`.
- If `npx nx` fails with missing `.nx/nxw.js`, run via `node node_modules/nx/dist/bin/nx.js` instead.
