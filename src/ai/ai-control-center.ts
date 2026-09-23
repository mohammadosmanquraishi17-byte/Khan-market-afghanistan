import type { AIRequest, AICapability, AIResponse, AIUsageRecord } from './types.js';
import { type ProviderRegistry, defaultProviderCatalog } from './provider-registry.js';
import { AIRouter, createAIRouter } from './ai-router.js';
import { AIUsageTracker, createAIUsageTracker } from './usage-tracker.js';

export interface AIControlCenterConfig {
  registry?: ProviderRegistry;
  router?: AIRouter;
  usageTracker?: AIUsageTracker;
  enforceAuthorization?: boolean;
}

export class AIControlCenter {
  public readonly registry: ProviderRegistry;
  public readonly router: AIRouter;
  public readonly usageTracker: AIUsageTracker;
  private readonly enforceAuthorization: boolean;

  constructor(config: AIControlCenterConfig = {}) {
    this.registry = config.registry ?? defaultProviderCatalog();
    this.router = config.router ?? createAIRouter(this.registry);
    this.usageTracker = config.usageTracker ?? createAIUsageTracker();
    this.enforceAuthorization = config.enforceAuthorization ?? true;
  }

  healthCheck(): Record<string, unknown> {
    const providers = this.registry.list().map((provider) => ({
      name: provider.name,
      status: provider.status,
      configured: provider.isConfigured(),
      capabilities: provider.capabilities,
    }));

    return {
      status: 'ok',
      providers,
      routes: Object.keys(this.router.getCapabilities()),
      authorizationEnforced: this.enforceAuthorization,
      paidSpendingDisabled: true,
    };
  }

  authorizeRequest(context: AIRequest['context']): boolean {
    if (!this.enforceAuthorization) {
      return true;
    }

    if (!context.authToken) {
      return false;
    }

    return context.role !== 'guest';
  }

  process(request: AIRequest): { response: AIResponse | null; usage: AIUsageRecord | null } {
    if (!this.authorizeRequest(request.context)) {
      const usage = this.usageTracker.record({
        userId: request.context.userId,
        provider: 'security-guard',
        model: 'guard-rail',
        capability: request.capability,
        requestId: request.context.requestId,
        status: 'error',
        errorMessage: 'AI authorization denied',
        createdAt: new Date().toISOString(),
      });

      return { response: null, usage };
    }

    const response = this.router.route(request);
    const usage = response
      ? this.usageTracker.record({
          userId: request.context.userId,
          organizationId: request.context.organizationId,
          provider: response.provider,
          model: response.model,
          capability: response.capability,
          requestId: response.requestId,
          status: 'success',
          estimatedCost: 0,
          createdAt: new Date().toISOString(),
        })
      : this.usageTracker.record({
          userId: request.context.userId,
          organizationId: request.context.organizationId,
          provider: 'not-configured',
          model: 'not-configured',
          capability: request.capability,
          requestId: request.context.requestId,
          status: 'not-configured',
          errorMessage: 'No configured provider available for capability',
          createdAt: new Date().toISOString(),
        });

    return { response, usage };
  }
}

export function createAIControlCenter(config?: AIControlCenterConfig): AIControlCenter {
  return new AIControlCenter(config);
}
