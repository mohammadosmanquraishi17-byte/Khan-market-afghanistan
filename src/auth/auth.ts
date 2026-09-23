import { createHash, randomBytes, pbkdf2Sync } from 'node:crypto';

export interface AuthUser {
  id: string;
  email: string;
  roleNames: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SessionPayload {
  token: string;
  userId: string;
  email: string;
  roleNames: string[];
  expiresAt: number;
}

export interface AuthResults {
  ok: boolean;
  error?: string;
  user?: AuthUser;
  session?: SessionPayload;
}

const DEFAULT_SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS ?? '86400000');

export class AuthManager {
  private readonly users = new Map<string, { id: string; email: string; passwordHash: string; passwordSalt: string; roleNames: string[]; createdAt: string; updatedAt: string }>();
  private readonly sessions = new Map<string, SessionPayload>();

  register(email: string, password: string): AuthResults {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !this.isEmailValid(normalizedEmail)) {
      return { ok: false, error: 'INVALID_EMAIL' };
    }

    if (password.length < 8) {
      return { ok: false, error: 'WEAK_PASSWORD' };
    }

    if (this.users.has(normalizedEmail)) {
      return { ok: false, error: 'USER_EXISTS' };
    }

    const salt = randomBytes(16).toString('hex');
    const passwordHash = this.hashPassword(password, salt);
    const userId = randomBytes(12).toString('hex');
    const user: AuthUser = {
      id: userId,
      email: normalizedEmail,
      roleNames: ['USER'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.users.set(normalizedEmail, {
      ...user,
      passwordHash,
      passwordSalt: salt,
    });

    return { ok: true, user };
  }

  login(email: string, password: string): AuthResults {
    const normalizedEmail = email.trim().toLowerCase();
    const stored = this.users.get(normalizedEmail);
    if (!stored) {
      return { ok: false, error: 'INVALID_CREDENTIALS' };
    }

    const candidateHash = this.hashPassword(password, stored.passwordSalt);
    if (candidateHash !== stored.passwordHash) {
      return { ok: false, error: 'INVALID_CREDENTIALS' };
    }

    const token = randomBytes(32).toString('hex');
    const session: SessionPayload = {
      token,
      userId: stored.id,
      email: stored.email,
      roleNames: stored.roleNames,
      expiresAt: Date.now() + DEFAULT_SESSION_TTL_MS,
    };

    this.sessions.set(token, session);
    return {
      ok: true,
      user: {
        id: stored.id,
        email: stored.email,
        roleNames: stored.roleNames,
        createdAt: stored.createdAt,
        updatedAt: stored.updatedAt,
      },
      session,
    };
  }

  logout(token: string): boolean {
    return this.sessions.delete(token);
  }

  requireUser(token: string): AuthUser | null {
    const session = this.sessions.get(token);
    if (!session) {
      return null;
    }

    if (session.expiresAt <= Date.now()) {
      this.sessions.delete(token);
      return null;
    }

    const stored = this.users.get(session.email);
    if (!stored) {
      this.sessions.delete(token);
      return null;
    }

    return {
      id: stored.id,
      email: stored.email,
      roleNames: stored.roleNames,
      createdAt: stored.createdAt,
      updatedAt: stored.updatedAt,
    };
  }

  getUserByEmail(email: string): AuthUser | null {
    const stored = this.users.get(email.trim().toLowerCase());
    if (!stored) {
      return null;
    }

    return {
      id: stored.id,
      email: stored.email,
      roleNames: stored.roleNames,
      createdAt: stored.createdAt,
      updatedAt: stored.updatedAt,
    };
  }

  private hashPassword(password: string, salt: string): string {
    return pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  }

  private isEmailValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

export const authManager = new AuthManager();
