import { AI_BASE_CAPABILITIES, AI_CAPABILITY_CATALOG, type AICapability, type AIProviderAdapter, type AIProviderConfig, type AIRequest, type AIResponse, type AIUsageRecord, type ProviderStatus } from './types.js';

export type ProviderImplementation = AIProviderAdapter & {
  readonly config: AIProviderConfig;
};

export class ProviderRegistry {
  private readonly providers = new Map<string, ProviderImplementation>();

  register(provider: ProviderImplementation): void {
    this.providers.set(provider.name, provider);
  }

  get(name: string): ProviderImplementation | undefined {
    return this.providers.get(name);
  }

  list(): ProviderImplementation[] {
    return Array.from(this.providers.values());
  }

  findForCapability(capability: AICapability): ProviderImplementation[] {
    return this.list().filter((provider) => provider.supports(capability) && provider.isConfigured());
  }

  getStatusSummary(): Record<string, ProviderStatus> {
    return Object.fromEntries(this.list().map((provider) => [provider.name, provider.status]));
  }
}

export class BaseProviderAdapter implements AIProviderAdapter {
  public readonly name: string;
  public readonly capabilities: AICapability[];
  public readonly config: AIProviderConfig;
  public status: ProviderStatus;

  constructor(config: AIProviderConfig, capabilities: AICapability[] = AI_BASE_CAPABILITIES) {
    this.name = config.name;
    this.config = config;
    this.capabilities = capabilities;
    this.status = this.resolveStatus();
  }

  private resolveStatus(): ProviderStatus {
    if (!this.config.enabled) {
      return 'NOT_CONFIGURED';
    }

    if (!this.config.apiKey && !this.config.endpoint && !this.config.model) {
      return 'NOT_CONFIGURED';
    }

    if (this.config.apiKey || this.config.endpoint || this.config.model) {
      return 'CONFIGURED';
    }

    return 'UNAVAILABLE';
  }

  isConfigured(): boolean {
    return this.status === 'CONFIGURED' || this.status === 'AVAILABLE';
  }

  supports(capability: AICapability): boolean {
    return this.capabilities.includes(capability);
  }

  routeCapability(capability: AICapability): boolean {
    return this.supports(capability) && this.isConfigured();
  }

  getMetadata(): Record<string, unknown> {
    return {
      name: this.name,
      capabilities: this.capabilities,
      configured: this.isConfigured(),
      status: this.status,
      model: this.config.model ?? 'not-configured',
      freeTier: this.config.freeTier ?? false,
      paidAllowed: this.config.paidAllowed ?? false,
      details: this.capabilities.map((capability) => ({
        capability,
        description: AI_CAPABILITY_CATALOG[capability],
      })),
    };
  }
}

export function createProviderAdapter(config: AIProviderConfig, capabilities: AICapability[] = AI_BASE_CAPABILITIES): BaseProviderAdapter {
  return new BaseProviderAdapter(config, capabilities);
}

export function defaultProviderCatalog(): ProviderRegistry {
  const registry = new ProviderRegistry();

  const providerConfigs: AIProviderConfig[] = [
    { name: 'local-openai-compatible', enabled: Boolean(process.env.LOCAL_OPENAI_API_KEY || process.env.LOCAL_OPENAI_BASE_URL), apiKey: process.env.LOCAL_OPENAI_API_KEY, endpoint: process.env.LOCAL_OPENAI_BASE_URL, model: process.env.LOCAL_OPENAI_MODEL, freeTier: true, paidAllowed: false },
    { name: 'openrouter', enabled: Boolean(process.env.OPENROUTER_API_KEY), apiKey: process.env.OPENROUTER_API_KEY, model: process.env.OPENROUTER_MODEL, freeTier: true, paidAllowed: false },
    { name: 'gemini', enabled: Boolean(process.env.GEMINI_API_KEY), apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL, freeTier: true, paidAllowed: false },
    { name: 'azure-openai', enabled: Boolean(process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT), apiKey: process.env.AZURE_OPENAI_API_KEY, endpoint: process.env.AZURE_OPENAI_ENDPOINT, model: process.env.AZURE_OPENAI_MODEL, freeTier: false, paidAllowed: false },
    { name: 'mistral', enabled: Boolean(process.env.MISTRAL_API_KEY), apiKey: process.env.MISTRAL_API_KEY, model: process.env.MISTRAL_MODEL, freeTier: true, paidAllowed: false },
    { name: 'anthropic', enabled: Boolean(process.env.ANTHROPIC_API_KEY), apiKey: process.env.ANTHROPIC_API_KEY, model: process.env.ANTHROPIC_MODEL, freeTier: true, paidAllowed: false },
  ];

  for (const config of providerConfigs) {
    registry.register(createProviderAdapter(config));
  }

  return registry;
}

export function resolveCapabilityProviders(capability: AICapability, registry: ProviderRegistry): ProviderImplementation[] {
  return registry.findForCapability(capability);
}

export function normalizeProviderStatus(status: ProviderStatus): ProviderStatus {
  if (status === 'AVAILABLE' || status === 'CONFIGURED') {
    return 'CONFIGURED';
  }

  return status;
}

export function createUsageRecord(record: Omit<AIUsageRecord, 'createdAt'>): AIUsageRecord {
  return {
    ...record,
    createdAt: new Date().toISOString(),
  };
}
