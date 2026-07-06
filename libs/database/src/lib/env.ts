import { config } from 'dotenv';
import { existsSync } from 'fs';
import { dirname, join, resolve } from 'path';

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

function toFileUrl(filePath: string): string {
  return `file:${filePath.replace(/\\/g, '/')}`;
}

export function configureDatabaseEnv(bundleDirname: string): void {
  config();

  const workspaceRoot = findWorkspaceRoot(bundleDirname);
  const defaultDbPath = join(workspaceRoot, 'libs/database/prisma/kodem.db');
  const configured = process.env.DATABASE_URL;

  let resolvedPath = defaultDbPath;

  if (configured?.startsWith('file:')) {
    const filePath = configured.slice('file:'.length);
    const candidate =
      filePath.startsWith('./') || filePath.startsWith('../')
        ? resolve(workspaceRoot, filePath)
        : filePath;

    if (existsSync(candidate)) {
      resolvedPath = candidate;
    }
  }

  process.env.DATABASE_URL = toFileUrl(resolvedPath);
}
