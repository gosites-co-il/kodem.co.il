import { config } from 'dotenv';
import { existsSync } from 'fs';
import { dirname, join } from 'path';

function findWorkspaceRoot(startDir: string): string {
  let current = startDir;

  while (true) {
    if (existsSync(join(current, 'nx.json'))) {
      return current;
    }

    const parent = dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  return startDir;
}

function loadRootEnv(startDir: string): string | undefined {
  const workspaceRoot = findWorkspaceRoot(startDir);
  const rootEnvPath = join(workspaceRoot, '.env');

  if (existsSync(rootEnvPath)) {
    // Root .env must win over libs/database/prisma/.env (file: SQLite leftovers).
    config({ path: rootEnvPath, override: true });
    return rootEnvPath;
  }

  return undefined;
}

export function configureDatabaseEnv(bundleDirname: string): void {
  const loadedFrom =
    loadRootEnv(bundleDirname) ?? loadRootEnv(process.cwd());

  if (!loadedFrom) {
    config();
  }

  const configured = process.env['DATABASE_URL'] ?? '';

  if (
    configured.startsWith('postgresql://') ||
    configured.startsWith('postgres://')
  ) {
    return;
  }

  const hint = loadedFrom ?? 'the monorepo root .env';
  throw new Error(
    `DATABASE_URL must be a Postgres URL (postgresql://...). Check ${hint}. ` +
      `Current value starts with: ${configured ? configured.slice(0, 12) : '(empty)'}`,
  );
}
