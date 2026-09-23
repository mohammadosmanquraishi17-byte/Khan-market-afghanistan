import { randomUUID } from 'node:crypto';

export interface DbConfig {
  connectionString?: string;
}

export function resolveDatabaseConfig(): DbConfig {
  return {
    connectionString: process.env.DATABASE_URL,
  };
}

export function createRequestId(prefix = 'req'): string {
  return `${prefix}-${randomUUID()}`;
}

export function getRuntimeEnvironment(): string {
  return process.env.NODE_ENV ?? 'development';
}
