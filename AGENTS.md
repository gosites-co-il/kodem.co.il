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
- DB: `npm run db:generate` / `npm run db:push`

### Caveats

- Prefix Nx with `CI=true` for non-interactive runs.
- Within `libs/shared/ui`, use **relative** imports between files in the same project.
- Prisma pinned to v6. DB: `libs/database/prisma/kodem.db`.
- If `npx nx` fails (missing `.nx/nxw.js`), use `node node_modules/nx/dist/bin/nx.js`.
