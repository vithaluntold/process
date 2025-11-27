import type {
  ConnectorConfiguration,
  ConnectorMapping,
  ConnectorRun,
  ConnectorHealth,
  ConnectorEvent,
  InsertConnectorEvent,
} from '@/shared/schema';

export type ConnectorType = 'salesforce' | 'servicenow' | 'sap' | 'dynamics' | 'oracle' | 'streaming' | 'custom';

export type AuthType = 'oauth2' | 'basic' | 'api_key' | 'jwt';

export type ConnectorStatus = 'active' | 'inactive' | 'error' | 'pending_auth';

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  expiresAt?: Date;
  scope?: string;
  instanceUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface Credentials {
  clientId?: string;
  clientSecret?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  instanceUrl?: string;
  securityToken?: string;
  [key: string]: string | undefined;
}

export interface NormalizedEvent {
  sourceId: string;
  sourceObject: string;
  caseId: string;
  activity: string;
  timestamp: Date;
  resource?: string;
  additionalData?: Record<string, unknown>;
}

export interface FetchResult {
  events: NormalizedEvent[];
  hasMore: boolean;
  nextCursor?: string;
  totalRecords?: number;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
  latencyMs?: number;
}

export interface RateLimitInfo {
  remaining: number;
  total: number;
  resetAt: Date;
}

export interface ConnectorMetadata {
  id: ConnectorType;
  name: string;
  description: string;
  icon: string;
  authTypes: AuthType[];
  requiredScopes?: string[];
  defaultObjects?: string[];
  documentationUrl?: string;
}

export interface TransformRule {
  sourceField: string;
  targetField: 'caseId' | 'activity' | 'timestamp' | 'resource' | 'additional';
  transform?: 'direct' | 'concat' | 'prefix' | 'suffix' | 'dateFormat' | 'custom';
  format?: string;
  customFunction?: string;
}

export interface ConnectorContext {
  organizationId: number;
  userId?: number;
  connectorConfigId: number;
  runId?: number;
  logger: {
    debug: (msg: string, data?: Record<string, unknown>) => void;
    info: (msg: string, data?: Record<string, unknown>) => void;
    warn: (msg: string, data?: Record<string, unknown>) => void;
    error: (msg: string, data?: Record<string, unknown>) => void;
  };
}

export interface BaseConnector {
  readonly metadata: ConnectorMetadata;
  
  authorize(config: ConnectorConfiguration, context: ConnectorContext): Promise<OAuthTokens>;
  
  refreshToken(tokens: OAuthTokens, config: ConnectorConfiguration, context: ConnectorContext): Promise<OAuthTokens>;
  
  testConnection(config: ConnectorConfiguration, tokens: OAuthTokens, context: ConnectorContext): Promise<ConnectionTestResult>;
  
  fetchBatch(
    config: ConnectorConfiguration,
    mapping: ConnectorMapping,
    tokens: OAuthTokens,
    cursor: string | undefined,
    context: ConnectorContext
  ): Promise<FetchResult>;
  
  getAvailableObjects(config: ConnectorConfiguration, tokens: OAuthTokens, context: ConnectorContext): Promise<{ name: string; label: string; fields: { name: string; type: string; label: string }[] }[]>;
  
  getFieldsForObject(config: ConnectorConfiguration, tokens: OAuthTokens, objectName: string, context: ConnectorContext): Promise<{ name: string; type: string; label: string }[]>;
  
  getRateLimitInfo?(config: ConnectorConfiguration, tokens: OAuthTokens): Promise<RateLimitInfo | null>;
  
  buildAuthUrl?(config: ConnectorConfiguration, redirectUri: string, state: string): string;
  
  exchangeCodeForTokens?(config: ConnectorConfiguration, code: string, redirectUri: string): Promise<OAuthTokens>;
}
