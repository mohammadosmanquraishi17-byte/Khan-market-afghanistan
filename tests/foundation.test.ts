import { test } from 'node:test';
import assert from 'node:assert/strict';

import { AuthManager } from '../src/auth/auth.js';
import { requirePermission, userHasPermission } from '../src/rbac/rbac.js';
import { completionEngine } from '../src/project-inventory.js';
import { aiControlCenter } from '../src/ai/index.js';

test('auth manager registers and logs in a user', () => {
  const auth = new AuthManager();
  const registerResult = auth.register('alice@example.com', 'password123');
  assert.equal(registerResult.ok, true);

  const login = auth.login('alice@example.com', 'password123');
  assert.equal(login.ok, true);
  assert.ok(login.session?.token);
});

test('auth manager rejects invalid credentials', () => {
  const auth = new AuthManager();
  auth.register('bob@example.com', 'password123');

  const login = auth.login('bob@example.com', 'wrong-password');
  assert.equal(login.ok, false);
  assert.equal(login.error, 'INVALID_CREDENTIALS');
});

test('rbac blocks unauthorized permission requests', () => {
  const roles = ['USER'];
  assert.equal(requirePermission(roles, 'ai.manage'), false);
  assert.equal(userHasPermission(roles, 'ai.use'), true);
});

test('project completion engine reports a sane status', () => {
  const result = completionEngine.scan();
  assert.ok(['PASS', 'PARTIAL', 'BLOCKED', 'NOT_CONFIGURED'].includes(result.status));
  assert.ok(Array.isArray(result.findings));
});

test('AI control center denies unauthorized requests', () => {
  const result = aiControlCenter.process({
    capability: 'chat',
    input: 'hello',
    context: {
      userId: 'u-1',
      role: 'guest',
      requestId: 'req-1',
    },
  });

  assert.equal(result.response, null);
  assert.ok(result.usage);
});
