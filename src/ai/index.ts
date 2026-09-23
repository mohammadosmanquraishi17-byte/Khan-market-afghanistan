import { createAIControlCenter } from './ai-control-center.js';
import { defaultProviderCatalog } from './provider-registry.js';
import { createAIRouter } from './ai-router.js';
import { createAIUsageTracker } from './usage-tracker.js';

const registry = defaultProviderCatalog();
const router = createAIRouter(registry);
const usageTracker = createAIUsageTracker();

export const aiControlCenter = createAIControlCenter({
  registry,
  router,
  usageTracker,
  enforceAuthorization: true,
});

export { aiControlCenter as coreAI };
export * from './types.js';
export * from './provider-registry.js';
export * from './ai-router.js';
export * from './usage-tracker.js';
export * from './ai-control-center.js';
