import { AbstractConnector } from './base-connector';
import type {
  ConnectorMetadata,
  OAuthTokens,
  ConnectionTestResult,
  FetchResult,
  RateLimitInfo,
  ConnectorContext,
  Credentials,
} from './types';
import type { ConnectorConfiguration, ConnectorMapping } from '@/shared/schema';

export class SalesforceConnector extends AbstractConnector {
  readonly metadata: ConnectorMetadata = {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Connect to Salesforce CRM to extract sales, service, and custom process data',
    icon: 'salesforce',
    authTypes: ['oauth2'],
    requiredScopes: ['api', 'refresh_token', 'offline_access'],
    defaultObjects: ['Case', 'Opportunity', 'Lead', 'Task', 'Event'],
    documentationUrl: 'https://developer.salesforce.com/docs/apis',
  };

  private parseCredentials(config: ConnectorConfiguration): Credentials {
    if (!config.credentialsEnvelope) {
      return {};
    }
    try {
      return JSON.parse(config.credentialsEnvelope) as Credentials;
    } catch {
      return {};
    }
  }

  buildAuthUrl(config: ConnectorConfiguration, redirectUri: string, state: string): string {
    const credentials = this.parseCredentials(config);
    const baseUrl = config.instanceUrl || 'https://login.salesforce.com';
    const scopes = (config.scopes || 'api refresh_token offline_access').split(',').join(' ');
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: credentials.clientId || '',
      redirect_uri: redirectUri,
      scope: scopes,
      state,
    });
    
    return `${baseUrl}/services/oauth2/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(
    config: ConnectorConfiguration,
    code: string,
    redirectUri: string
  ): Promise<OAuthTokens> {
    const credentials = this.parseCredentials(config);
    const baseUrl = config.instanceUrl || 'https://login.salesforce.com';
    
    const response = await fetch(`${baseUrl}/services/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: credentials.clientId || '',
        client_secret: credentials.clientSecret || '',
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code for tokens: ${error}`);
    }

    const data = await response.json();
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: data.token_type || 'Bearer',
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
      instanceUrl: data.instance_url,
      scope: data.scope,
      metadata: {
        id: data.id,
        issuedAt: data.issued_at,
      },
    };
  }

  async authorize(
    config: ConnectorConfiguration,
    context: ConnectorContext
  ): Promise<OAuthTokens> {
    throw new Error('Use buildAuthUrl and exchangeCodeForTokens for OAuth flow');
  }

  async refreshToken(
    tokens: OAuthTokens,
    config: ConnectorConfiguration,
    context: ConnectorContext
  ): Promise<OAuthTokens> {
    if (!tokens.refreshToken) {
      throw new Error('No refresh token available');
    }

    const credentials = this.parseCredentials(config);
    const baseUrl = 'https://login.salesforce.com';

    const response = await this.retryWithBackoff(
      async () => {
        const res = await fetch(`${baseUrl}/services/oauth2/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: tokens.refreshToken!,
            client_id: credentials.clientId || '',
            client_secret: credentials.clientSecret || '',
          }),
        });
        
        if (!res.ok) {
          const error = await res.text();
          throw new Error(`Token refresh failed: ${error}`);
        }
        
        return res;
      },
      context,
      'refreshToken'
    );

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: tokens.refreshToken,
      tokenType: data.token_type || 'Bearer',
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
      instanceUrl: data.instance_url || tokens.instanceUrl,
      scope: data.scope || tokens.scope,
      metadata: tokens.metadata,
    };
  }

  async testConnection(
    config: ConnectorConfiguration,
    tokens: OAuthTokens,
    context: ConnectorContext
  ): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(
        `${tokens.instanceUrl}/services/data/v59.0/limits`,
        {
          headers: {
            Authorization: `${tokens.tokenType} ${tokens.accessToken}`,
          },
        }
      );

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          message: `Connection failed: ${response.status} ${response.statusText}`,
          details: { error },
          latencyMs,
        };
      }

      const limits = await response.json();
      
      return {
        success: true,
        message: 'Connected to Salesforce successfully',
        details: {
          apiVersion: 'v59.0',
          dailyApiRequests: limits.DailyApiRequests,
        },
        latencyMs,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        latencyMs: Date.now() - startTime,
      };
    }
  }

  async fetchBatch(
    config: ConnectorConfiguration,
    mapping: ConnectorMapping,
    tokens: OAuthTokens,
    cursor: string | undefined,
    context: ConnectorContext
  ): Promise<FetchResult> {
    const batchSize = mapping.batchSize || 200;
    
    let query: string;
    if (cursor) {
      query = cursor;
    } else {
      const fields = [
        'Id',
        mapping.caseIdField,
        mapping.activityField,
        mapping.timestampField,
        mapping.resourceField,
        ...(mapping.additionalFields as string[] || []),
      ].filter((f, i, arr) => f && arr.indexOf(f) === i);
      
      query = `SELECT ${fields.join(', ')} FROM ${mapping.sourceObject}`;
      
      if (mapping.filterQuery) {
        query += ` WHERE ${mapping.filterQuery}`;
      }
      
      query += ` ORDER BY ${mapping.timestampField} ASC LIMIT ${batchSize}`;
    }

    const response = await this.retryWithBackoff(
      async () => {
        const url = cursor
          ? `${tokens.instanceUrl}${cursor}`
          : `${tokens.instanceUrl}/services/data/v59.0/query?q=${encodeURIComponent(query)}`;
        
        const res = await fetch(url, {
          headers: {
            Authorization: `${tokens.tokenType} ${tokens.accessToken}`,
          },
        });
        
        if (!res.ok) {
          const error = await res.text();
          throw new Error(`Query failed: ${res.status} ${error}`);
        }
        
        return res;
      },
      context,
      'fetchBatch'
    );

    const data = await response.json();
    
    const events = (data.records || []).map((record: Record<string, unknown>) =>
      this.transformRecord(record, mapping)
    );

    return {
      events,
      hasMore: !data.done,
      nextCursor: data.nextRecordsUrl,
      totalRecords: data.totalSize,
    };
  }

  async getAvailableObjects(
    config: ConnectorConfiguration,
    tokens: OAuthTokens,
    context: ConnectorContext
  ): Promise<{ name: string; label: string; fields: { name: string; type: string; label: string }[] }[]> {
    const response = await this.retryWithBackoff(
      async () => {
        const res = await fetch(
          `${tokens.instanceUrl}/services/data/v59.0/sobjects`,
          {
            headers: {
              Authorization: `${tokens.tokenType} ${tokens.accessToken}`,
            },
          }
        );
        
        if (!res.ok) {
          const error = await res.text();
          throw new Error(`Failed to get objects: ${error}`);
        }
        
        return res;
      },
      context,
      'getAvailableObjects'
    );

    const data = await response.json();
    
    const relevantObjects = (data.sobjects || [])
      .filter((obj: { queryable: boolean; name: string }) => 
        obj.queryable && !obj.name.endsWith('__History') && !obj.name.endsWith('__Share')
      )
      .slice(0, 100);

    return relevantObjects.map((obj: { name: string; label: string }) => ({
      name: obj.name,
      label: obj.label,
      fields: [],
    }));
  }

  async getFieldsForObject(
    config: ConnectorConfiguration,
    tokens: OAuthTokens,
    objectName: string,
    context: ConnectorContext
  ): Promise<{ name: string; type: string; label: string }[]> {
    const response = await this.retryWithBackoff(
      async () => {
        const res = await fetch(
          `${tokens.instanceUrl}/services/data/v59.0/sobjects/${objectName}/describe`,
          {
            headers: {
              Authorization: `${tokens.tokenType} ${tokens.accessToken}`,
            },
          }
        );
        
        if (!res.ok) {
          const error = await res.text();
          throw new Error(`Failed to describe object: ${error}`);
        }
        
        return res;
      },
      context,
      'getFieldsForObject'
    );

    const data = await response.json();
    
    return (data.fields || []).map((field: { name: string; type: string; label: string }) => ({
      name: field.name,
      type: field.type,
      label: field.label,
    }));
  }

  async getRateLimitInfo(
    config: ConnectorConfiguration,
    tokens: OAuthTokens
  ): Promise<RateLimitInfo | null> {
    try {
      const response = await fetch(
        `${tokens.instanceUrl}/services/data/v59.0/limits`,
        {
          headers: {
            Authorization: `${tokens.tokenType} ${tokens.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const limits = await response.json();
      const dailyLimit = limits.DailyApiRequests;
      
      if (dailyLimit) {
        return {
          remaining: dailyLimit.Remaining,
          total: dailyLimit.Max,
          resetAt: new Date(new Date().setUTCHours(24, 0, 0, 0)),
        };
      }
      
      return null;
    } catch {
      return null;
    }
  }
}
