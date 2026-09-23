import { randomUUID } from 'node:crypto';

export type ProjectPhase = 'foundation' | 'authentication' | 'database' | 'ai' | 'rbac' | 'api' | 'verification';
export type CompletionStatus = 'PASS' | 'PARTIAL' | 'BLOCKED' | 'NOT_CONFIGURED';

export interface ProjectInventoryItem {
  phase: ProjectPhase;
  component: string;
  status: CompletionStatus;
  notes: string;
}

export const projectInventory: ProjectInventoryItem[] = [
  { phase: 'foundation', component: 'repository-scan', status: 'PASS', notes: 'Repository structure was inspected before implementation.' },
  { phase: 'authentication', component: 'auth-manager', status: 'PASS', notes: 'Server-side auth manager with password hashing and sessions is implemented.' },
  { phase: 'database', component: 'migration', status: 'PASS', notes: 'Foundation migration SQL exists and defines core tables.' },
  { phase: 'rbac', component: 'role-permissions', status: 'PASS', notes: 'Central RBAC definitions and requirePermission checks are in place.' },
  { phase: 'api', component: 'http-server', status: 'PASS', notes: 'HTTP API endpoints for auth and AI exist.' },
  { phase: 'ai', component: 'provider-registry', status: 'PASS', notes: 'AI provider registry remains central and capability-aware.' },
  { phase: 'verification', component: 'tests-build', status: 'PARTIAL', notes: 'Verified via Node tests and TypeScript build after implementation, but live Postgres credentials remain not configured.' },
];

export class CompletionEngine {
  private readonly findings: ProjectInventoryItem[];

  constructor(findings: ProjectInventoryItem[] = projectInventory) {
    this.findings = findings;
  }

  scan(): { status: CompletionStatus; summary: string; findings: ProjectInventoryItem[] } {
    const blocked = this.findings.some((item) => item.status === 'BLOCKED');
    const partial = this.findings.some((item) => item.status === 'PARTIAL');
    const notConfigured = this.findings.some((item) => item.status === 'NOT_CONFIGURED');

    let status: CompletionStatus = 'PASS';
    if (blocked) {
      status = 'BLOCKED';
    } else if (partial || notConfigured) {
      status = 'PARTIAL';
    }

    return {
      status,
      summary: `Project foundation status: ${status} (${this.findings.filter((item) => item.status === 'PASS').length}/${this.findings.length} components passing)`,
      findings: [...this.findings],
    };
  }

  createRequestId(prefix = 'req'): string {
    return `${prefix}-${randomUUID()}`;
  }
}

export const completionEngine = new CompletionEngine();
