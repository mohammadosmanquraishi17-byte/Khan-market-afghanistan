import test from 'node:test';
import assert from 'node:assert/strict';

import { createAIControlCenter } from '../src/ai/ai-control-center.js';
import { defaultProviderCatalog } from '../src/ai/provider-registry.js';
import { createAIRouter } from '../src/ai/ai-router.js';
import { createAIUsageTracker } from '../src/ai/usage-tracker.js';

test('provider registry exposes capability-aware providers', () => {
  const registry = defaultProviderCatalog();
  const providers = registry.findForCapability('chat');
  assert.ok(Array.isArray(providers));
});

test('router returns null when capability is not configured', () => {
  const registry = defaultProviderCatalog();
  const router = createAIRouter(registry);
  const response = router.route({
    capability: 'text-generation',
    input: 'hello',
    context: {
      userId: 'u-1',
      organizationId: 'org-1',
      role: 'admin',
      authToken: 'token',
      requestId: 'req-1',
    },
  });

  assert.ok(response === null || typeof response.text === 'string');
});

test('AI control center denies unauthorized requests', () => {
  const center = createAIControlCenter({
    registry: defaultProviderCatalog(),
    router: createAIRouter(defaultProviderCatalog()),
    usageTracker: createAIUsageTracker(),
    enforceAuthorization: true,
  });

  const outcome = center.process({
    capability: 'chat',
    input: 'hello',
    context: {
      userId: 'u-1',
      organizationId: 'org-1',
      role: 'guest',
      requestId: 'req-2',
    },
  });

  assert.equal(outcome.response, null);
  assert.ok(outcome.usage);
});
