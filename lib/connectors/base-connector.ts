import type {
  BaseConnector,
  ConnectorMetadata,
  OAuthTokens,
  ConnectionTestResult,
  FetchResult,
  RateLimitInfo,
  ConnectorContext,
  NormalizedEvent,
} from './types';
import type { ConnectorConfiguration, ConnectorMapping } from '@/shared/schema';
import { Logger } from '@/lib/logger';

export abstract class AbstractConnector implements BaseConnector {
  abstract readonly metadata: ConnectorMetadata;

  protected retryConfig = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
  };

  abstract authorize(
    config: ConnectorConfiguration,
    context: ConnectorContext
  ): Promise<OAuthTokens>;

  abstract refreshToken(
    tokens: OAuthTokens,
    config: ConnectorConfiguration,
    context: ConnectorContext
  ): Promise<OAuthTokens>;

  abstract testConnection(
    config: ConnectorConfiguration,
    tokens: OAuthTokens,
    context: ConnectorContext
  ): Promise<ConnectionTestResult>;

  abstract fetchBatch(
    config: ConnectorConfiguration,
    mapping: ConnectorMapping,
    tokens: OAuthTokens,
    cursor: string | undefined,
    context: ConnectorContext
  ): Promise<FetchResult>;

  abstract getAvailableObjects(
    config: ConnectorConfiguration,
    tokens: OAuthTokens,
    context: ConnectorContext
  ): Promise<{ name: string; label: string; fields: { name: string; type: string; label: string }[] }[]>;

  abstract getFieldsForObject(
    config: ConnectorConfiguration,
    tokens: OAuthTokens,
    objectName: string,
    context: ConnectorContext
  ): Promise<{ name: string; type: string; label: string }[]>;

  async getRateLimitInfo?(
    config: ConnectorConfiguration,
    tokens: OAuthTokens
  ): Promise<RateLimitInfo | null> {
    return null;
  }

  buildAuthUrl?(
    config: ConnectorConfiguration,
    redirectUri: string,
    state: string
  ): string;

  exchangeCodeForTokens?(
    config: ConnectorConfiguration,
    code: string,
    redirectUri: string
  ): Promise<OAuthTokens>;

  protected async retryWithBackoff<T>(
    fn: () => Promise<T>,
    context: ConnectorContext,
    operationName: string
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt < this.retryConfig.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        const isRateLimited = this.isRateLimitError(error);
        const isRetryable = this.isRetryableError(error);
        
        if (!isRetryable && !isRateLimited) {
          throw lastError;
        }
        
        const delay = isRateLimited
          ? this.getRateLimitDelay(error)
          : Math.min(
              this.retryConfig.baseDelayMs * Math.pow(2, attempt),
              this.retryConfig.maxDelayMs
            );
        
        context.logger.warn(`${operationName} failed, retrying in ${delay}ms`, {
          attempt: attempt + 1,
          maxRetries: this.retryConfig.maxRetries,
          error: lastError.message,
          isRateLimited,
        });
        
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }

  protected isRateLimitError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('rate limit') ||
        message.includes('too many requests') ||
        message.includes('429') ||
        message.includes('quota exceeded')
      );
    }
    return false;
  }

  protected isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('timeout') ||
        message.includes('network') ||
        message.includes('econnreset') ||
        message.includes('502') ||
        message.includes('503') ||
        message.includes('504')
      );
    }
    return false;
  }

  protected getRateLimitDelay(error: unknown): number {
    return 60000;
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected normalizeTimestamp(value: string | number | Date): Date {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'number') {
      return new Date(value);
    }
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) {
      throw new Error(`Invalid timestamp: ${value}`);
    }
    return parsed;
  }

  protected extractFieldValue(
    record: Record<string, unknown>,
    fieldPath: string
  ): unknown {
    const parts = fieldPath.split('.');
    let current: unknown = record;
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      if (typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }
    
    return current;
  }

  protected transformRecord(
    record: Record<string, unknown>,
    mapping: ConnectorMapping
  ): NormalizedEvent {
    const caseId = String(this.extractFieldValue(record, mapping.caseIdField) ?? '');
    const activity = String(this.extractFieldValue(record, mapping.activityField) ?? '');
    const timestampValue = this.extractFieldValue(record, mapping.timestampField);
    const resource = mapping.resourceField
      ? String(this.extractFieldValue(record, mapping.resourceField) ?? '')
      : undefined;

    const additionalData: Record<string, unknown> = {};
    const additionalFields = mapping.additionalFields as string[] | undefined;
    if (additionalFields) {
      for (const field of additionalFields) {
        additionalData[field] = this.extractFieldValue(record, field);
      }
    }

    return {
      sourceId: String(record.Id ?? record.id ?? record.sys_id ?? ''),
      sourceObject: mapping.sourceObject,
      caseId,
      activity,
      timestamp: this.normalizeTimestamp(timestampValue as string | number | Date),
      resource: resource || undefined,
      additionalData: Object.keys(additionalData).length > 0 ? additionalData : undefined,
    };
  }
}
