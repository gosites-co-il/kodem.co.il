# Kodem Platform

Engine-driven PLG business intelligence — Nx integrated monorepo.

Structure follows [`.cursor/rules/nx.md`](.cursor/rules/nx.md).

## Applications

| App | Purpose | Dev |
|-----|---------|-----|
| `apps/app` | Next.js SaaS UI | `CI=true npx nx dev app` |
| `apps/marketing` | Astro marketing site | `CI=true npx nx dev marketing` |
| `apps/api` | NestJS backend | `CI=true npx nx serve api` |
| `apps/worker` | Engine runner | `CI=true npx nx serve worker` |

## Libraries

```
libs/platform/    auth, subscription, ai
libs/workspace/   core, events, profile, insights, recommendations
libs/modules/     crm
libs/engines/     discovery, insight, recommendation, rule, learning, pipeline
libs/database/    prisma + repositories
libs/integrations/
libs/shared/      ui, types
```

Imports: `@kodem/workspace/core`, `@kodem/modules/crm`, `@kodem/engines/pipeline`, etc.

## Quick start

```bash
npm install
npm run db:push
CI=true npx nx serve api
CI=true npx nx serve worker
CI=true npx nx dev app
CI=true npx nx dev marketing
```

## shadcn/ui

```bash
npx shadcn@latest add button
```

Export from `libs/shared/ui/src/index.ts` — import via `@kodem/shared/ui`.
