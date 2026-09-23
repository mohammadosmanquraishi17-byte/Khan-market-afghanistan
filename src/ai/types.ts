export type AICapability =
  | 'text-generation'
  | 'chat'
  | 'summarization'
  | 'translation'
  | 'classification'
  | 'embeddings'
  | 'image-analysis'
  | 'image-generation'
  | 'ocr'
  | 'speech-to-text'
  | 'text-to-speech'
  | 'moderation'
  | 'recommendation'
  | 'data-analysis'
  | 'video-analysis'
  | 'video-generation';

export type ProviderStatus =
  | 'CONFIGURED'
  | 'NOT_CONFIGURED'
  | 'ERROR'
  | 'AVAILABLE'
  | 'UNAVAILABLE';

export interface AIProviderConfig {
  name: string;
  apiKey?: string;
  endpoint?: string;
  model?: string;
  enabled?: boolean;
  freeTier?: boolean;
  paidAllowed?: boolean;
}

export interface AIUsageRecord {
  userId?: string;
  organizationId?: string;
  ownerId?: string;
  adminId?: string;
  provider: string;
  model: string;
  capability: AICapability;
  requestId: string;
  status: 'success' | 'error' | 'not-configured';
  tokensIn?: number;
  tokensOut?: number;
  estimatedCost?: number;
  errorMessage?: string;
  createdAt: string;
}

export interface AIRequestContext {
  userId?: string;
  organizationId?: string;
  role?: string;
  authToken?: string;
  requestId: string;
}

export interface AIProviderAdapter {
  name: string;
  capabilities: AICapability[];
  status: ProviderStatus;
  isConfigured(): boolean;
  supports(capability: AICapability): boolean;
  routeCapability(capability: AICapability): boolean;
  getMetadata(): Record<string, unknown>;
}

export interface AIRequest {
  capability: AICapability;
  input: string;
  context: AIRequestContext;
  modelHint?: string;
}

export interface AIResponse {
  provider: string;
  model: string;
  capability: AICapability;
  text: string;
  success: boolean;
  requestId: string;
}

export const AI_CAPABILITY_CATALOG: Record<AICapability, string> = {
  'text-generation': 'Generate text from a prompt',
  chat: 'Chat with a configured AI model',
  summarization: 'Summarize long text into a concise result',
  translation: 'Translate content between supported languages',
  classification: 'Classify input into categories or labels',
  embeddings: 'Create vector embeddings for search/retrieval',
  'image-analysis': 'Inspect and describe provided images',
  'image-generation': 'Generate images from prompts',
  ocr: 'Extract text from images or scanned documents',
  'speech-to-text': 'Transcribe spoken audio to text',
  'text-to-speech': 'Convert text to spoken audio',
  moderation: 'Flag unsafe or restricted content',
  recommendation: 'Recommend relevant content or products',
  'data-analysis': 'Analyze structured or semi-structured data',
  'video-analysis': 'Inspect video content with AI',
  'video-generation': 'Generate or storyboard video content',
};

export const AI_BASE_CAPABILITIES: AICapability[] = [
  'text-generation',
  'chat',
  'summarization',
  'translation',
  'classification',
  'embeddings',
  'image-analysis',
  'image-generation',
  'ocr',
  'speech-to-text',
  'text-to-speech',
  'moderation',
  'recommendation',
  'data-analysis',
  'video-analysis',
  'video-generation',
];
