import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { authManager, type AuthUser } from '../auth/auth.js';
import { requirePermission, userHasPermission } from '../rbac/rbac.js';
import { completionEngine } from '../project-inventory.js';
import { defaultProviderCatalog } from '../ai/provider-registry.js';
import { aiControlCenter } from '../ai/index.js';
import { rateLimiter } from '../rate-limiter.js';

export interface ApiSession {
  token: string;
  user: AuthUser;
}

export function parseJsonBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    request.on('data', (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    request.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw) as Record<string, unknown>);
      } catch (error) {
        reject(new Error('INVALID_JSON'));
      }
    });

    request.on('error', reject);
  });
}

export function jsonResponse(response: ServerResponse, statusCode: number, payload: Record<string, unknown>): void {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(payload));
}

export function getBearerToken(request: IncomingMessage): string | null {
  const header = request.headers.authorization ?? request.headers['x-session-token'];
  if (typeof header !== 'string') {
    return null;
  }

  if (header.startsWith('Bearer ')) {
    return header.slice('Bearer '.length).trim();
  }

  return header.trim();
}

export function createApiServer(): Server {
  const registry = defaultProviderCatalog();
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const route = `${request.method ?? 'GET'} ${url.pathname}`;

    const rateLimitKey = `${request.socket.remoteAddress ?? 'unknown'}:${route}`;
    const limiter = rateLimiter.check(rateLimitKey);
    if (!limiter.allowed) {
      jsonResponse(response, 429, {
        ok: false,
        error: 'RATE_LIMITED',
        retryAfterMs: limiter.retryAfterMs,
      });
      return;
    }

    if (route === 'GET /health') {
      jsonResponse(response, 200, {
        ok: true,
        service: 'Khan Market Afghanistan',
        status: 'ok',
        ai: aiControlCenter.healthCheck(),
      });
      return;
    }

    if (route === 'POST /api/auth/register') {
      try {
        const body = await parseJsonBody(request);
        const email = typeof body.email === 'string' ? body.email : '';
        const password = typeof body.password === 'string' ? body.password : '';
        const result = authManager.register(email, password);

        if (!result.ok) {
          jsonResponse(response, 400, { ok: false, error: result.error ?? 'REGISTRATION_FAILED' });
          return;
        }

        jsonResponse(response, 201, {
          ok: true,
          user: result.user,
        });
      } catch (error) {
        jsonResponse(response, 400, { ok: false, error: 'INVALID_JSON' });
      }
      return;
    }

    if (route === 'POST /api/auth/login') {
      try {
        const body = await parseJsonBody(request);
        const email = typeof body.email === 'string' ? body.email : '';
        const password = typeof body.password === 'string' ? body.password : '';
        const result = authManager.login(email, password);

        if (!result.ok) {
          jsonResponse(response, 401, { ok: false, error: result.error ?? 'AUTH_FAILED' });
          return;
        }

        jsonResponse(response, 200, {
          ok: true,
          user: result.user,
          session: result.session,
        });
      } catch (error) {
        jsonResponse(response, 400, { ok: false, error: 'INVALID_JSON' });
      }
      return;
    }

    if (route === 'POST /api/auth/logout') {
      const token = getBearerToken(request);
      if (!token) {
        jsonResponse(response, 401, { ok: false, error: 'UNAUTHORIZED' });
        return;
      }

      const loggedOut = authManager.logout(token);
      jsonResponse(response, 200, {
        ok: loggedOut,
        message: loggedOut ? 'LOGGED_OUT' : 'NO_SESSION',
      });
      return;
    }

    if (route === 'GET /api/auth/me') {
      const token = getBearerToken(request);
      if (!token) {
        jsonResponse(response, 401, { ok: false, error: 'UNAUTHORIZED' });
        return;
      }

      const user = authManager.requireUser(token);
      if (!user) {
        jsonResponse(response, 401, { ok: false, error: 'SESSION_EXPIRED' });
        return;
      }

      jsonResponse(response, 200, { ok: true, user });
      return;
    }

    if (route.startsWith('POST /api/ai')) {
      const token = getBearerToken(request);
      const user = token ? authManager.requireUser(token) : null;
      if (!user) {
        jsonResponse(response, 401, { ok: false, error: 'UNAUTHORIZED' });
        return;
      }

      if (!requirePermission(user.roleNames, 'ai.use')) {
        jsonResponse(response, 403, { ok: false, error: 'FORBIDDEN' });
        return;
      }

      try {
        const body = await parseJsonBody(request);
        const capability = typeof body.capability === 'string' ? body.capability : 'chat';
        const input = typeof body.input === 'string' ? body.input : '';
        const result = aiControlCenter.process({
          capability: capability as never,
          input,
          context: {
            userId: user.id,
            role: user.roleNames[0] ?? 'USER',
            authToken: token,
            requestId: randomUUID(),
          },
        });

        jsonResponse(response, result.response ? 200 : 202, {
          ok: result.response !== null,
          response: result.response,
          usage: result.usage,
        });
      } catch (error) {
        jsonResponse(response, 400, { ok: false, error: 'INVALID_INPUT' });
      }
      return;
    }

    if (route === 'GET /api/project/inventory') {
      jsonResponse(response, 200, {
        ok: true,
        inventory: completionEngine.scan(),
      });
      return;
    }

    jsonResponse(response, 404, { ok: false, error: 'NOT_FOUND' });
  });

  return server;
}

export const apiServer = createApiServer();
