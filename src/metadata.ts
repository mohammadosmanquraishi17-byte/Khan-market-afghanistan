import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const repoMetadata = {
  repository: 'mohammadosmanquraishi17-byte/Khan-market-afghanistan',
  architecture: 'Node.js + TypeScript + PostgreSQL foundation + server-side auth + RBAC + AI control center',
  stack: 'Node.js 20+, TypeScript, PostgreSQL, pg, Node crypto',
};

export function readMigrationSql(): string {
  const path = join(process.cwd(), 'migrations', '001_foundation.sql');
  return readFileSync(path, 'utf8');
}
