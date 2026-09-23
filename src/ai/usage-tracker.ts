import { type AICapability, type AIRequest, type AIResponse, type AIUsageRecord } from './types.js';

export class AIUsageTracker {
  private readonly records: AIUsageRecord[] = [];

  record(record: AIUsageRecord): AIUsageRecord {
    this.records.push(record);
    return record;
  }

  list(): AIUsageRecord[] {
    return [...this.records];
  }

  getSummary(): { total: number; byProvider: Record<string, number>; byCapability: Record<string, number> } {
    return {
      total: this.records.length,
      byProvider: this.records.reduce<Record<string, number>>((summary, record) => ({
        ...summary,
        [record.provider]: (summary[record.provider] ?? 0) + 1,
      }), {}),
      byCapability: this.records.reduce<Record<string, number>>((summary, record) => ({
        ...summary,
        [record.capability]: (summary[record.capability] ?? 0) + 1,
      }), {}),
    };
  }
}

export function createAIUsageTracker(): AIUsageTracker {
  return new AIUsageTracker();
}
