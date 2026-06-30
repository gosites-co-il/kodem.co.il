# Kodem Platform

Engine-driven PLG business intelligence — Nx integrated monorepo.

## Architecture

```
User Action → API (NestJS) → Event → Worker → Engines → Database → App UI
```

| App | Purpose | Dev |
|-----|---------|-----|
| `apps/app` | Next.js SaaS UI | `CI=true npx nx dev app` |
| `apps/web` | Astro marketing site | `CI=true npx nx dev web` |
| `apps/api` | NestJS backend | `CI=true npx nx serve api` |
| `apps/worker` | Engine runner | `CI=true npx nx serve worker` |

## Quick start

```bash
npm install
npm run db:push
CI=true npx nx serve api      # :3333/api
CI=true npx nx serve worker   # :3334/worker
CI=true npx nx dev app        # :3000
CI=true npx nx dev web        # :4321
```

Create a workspace:

```bash
curl -X POST http://localhost:3333/api/workspaces \
  -H "Content-Type: application/json" \
  -d '{"name":"Acme","slug":"acme","ownerEmail":"a@acme.co.il","ownerName":"Jane"}'
```

The worker polls for events and runs Discovery → Insight → Recommendation engines.

## Libraries

Shared code lives in `libs/` with `@kodem/*` path aliases. See [AGENTS.md](./AGENTS.md) for dependency rules and tags.

## shadcn/ui

```bash
npx shadcn@latest add button
```

Export from `libs/ui/src/index.ts` and import via `@kodem/ui`.
