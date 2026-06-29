# AGENTS.md

## Cursor Cloud specific instructions

This is an Nx (v22) monorepo using npm. Two runnable apps plus shared libs:

- `next-app` — Next.js 16 frontend (Turbopack). Dev: `npx nx dev next-app` → http://localhost:3000. Has a built-in route handler at `/api/hello`.
- `api` — Express backend. Dev: `npx nx serve api` → http://localhost:3333/api (builds via webpack first, then runs the node bundle).
- `libs/shadcn-ui`, `libs/shared/interfaces` — shared libraries.

Standard task commands (see `nx.json` plugins and each `project.json`):

- Lint: `npx nx run-many -t lint` (or `npx nx lint <project>`).
- Test (Jest): `npx nx run-many -t test` (or `npx nx test <project>`).
- Build: `npm run build` (Next.js prod build) / `npx nx build api`.

### Non-obvious caveats

- Nx is interactive on a fresh VM: the first Nx command prompts `Share usage data with the Nx team?` and blocks. Prefix Nx commands with `CI=true` (e.g. `CI=true npx nx dev next-app`) to run non-interactively. This is why dev servers should be started with `CI=true`.
- `next-app` and `api` both expose a path that contains `/api`, but they are different servers: Express serves `http://localhost:3333/api`; the Next.js route handler is `http://localhost:3000/api/hello`.
- Within `libs/shadcn-ui`, the `@nx/enforce-module-boundaries` rule requires **relative** imports between files in the same project (e.g. `../../lib/utils`), not the `@libs/shadcn-ui/...` path alias. New shadcn components added via the CLI use the alias and must be converted (e.g. `npx nx lint shadcn-ui --fix`).
- `next-app:lint` crashes with `Converting circular structure to JSON` from the legacy `eslint-config-next` / `@eslint/eslintrc` compat layer under ESLint 9. This is pre-existing and unrelated to app code; the other projects lint cleanly.
- `libs/shadcn-ui/src/components/ui/calendar.tsx` does not typecheck against the installed `react-day-picker` v9 (uses the removed v8 `IconLeft` custom component). It's vendored component source that needs a re-pull/migration; unrelated to the rest of the lib, which compiles fine.
- Jest must stay on the v30 line across the board. `jest@^30` is incompatible with `jest-environment-jsdom`/`jest-environment-node` v29 (tests fail with `this._moduleMocker.clearMocksOnScope is not a function`); the environment packages are pinned to `^30` to match.
