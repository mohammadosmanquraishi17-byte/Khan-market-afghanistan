import { AI_CAPABILITY_CATALOG, type AICapability, type AIRequest, type AIResponse, type AIUsageRecord, type ProviderStatus } from './types.js';
import { type ProviderRegistry, defaultProviderCatalog } from './provider-registry.js';

export class AIRouter {
  constructor(private readonly registry: ProviderRegistry) {}

  pickBestProvider(capability: AICapability): string | null {
    const providers = this.registry.findForCapability(capability);
    if (providers.length === 0) {
      return null;
    }

    const priority = ['local-openai-compatible', 'openrouter', 'gemini', 'mistral', 'anthropic', 'azure-openai'];
    const ordered = [...providers].sort((left, right) => {
      const indexA = priority.indexOf(left.name);
      const indexB = priority.indexOf(right.name);
      return (indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA) - (indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB);
    });

    return ordered[0]?.name ?? null;
  }

  route(request: AIRequest): AIResponse | null {
    const providerName = this.pickBestProvider(request.capability);
    const provider = providerName ? this.registry.get(providerName) : undefined;

    if (!provider || !provider.routeCapability(request.capability)) {
      return null;
    }

    const output = `AI routed: ${request.capability} via ${provider.name} with model ${provider.getMetadata().model ?? 'default'}.`;

    return {
      provider: provider.name,
      model: String(provider.getMetadata().model ?? 'not-configured'),
      capability: request.capability,
      text: output,
      success: true,
      requestId: request.context.requestId,
    };
  }

  getCapabilities(): Record<string, string> {
    return AI_CAPABILITY_CATALOG;
  }
}

export function createAIRouter(registry: ProviderRegistry = defaultProviderCatalog()): AIRouter {
  return new AIRouter(registry);
}
