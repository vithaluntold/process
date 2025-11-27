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

export class ServiceNowConnector extends AbstractConnector {
  readonly metadata: ConnectorMetadata = {
    id: 'servicenow',
    name: 'ServiceNow',
    description: 'Connect to ServiceNow ITSM to extract incident, change, and request data',
    icon: 'servicenow',
    authTypes: ['oauth2', 'basic'],
    requiredScopes: ['openid'],
    defaultObjects: ['incident', 'change_request', 'sc_request', 'problem', 'task'],
    documentationUrl: 'https://developer.servicenow.com/dev.do#!/reference/api/tokyo/rest/c_TableAPI',
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

  private getInstanceUrl(config: ConnectorConfiguration): string {
    const url = config.instanceUrl || '';
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }

  buildAuthUrl(config: ConnectorConfiguration, redirectUri: string, state: string): string {
    const credentials = this.parseCredentials(config);
    const instanceUrl = this.getInstanceUrl(config);
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: credentials.clientId || '',
      redirect_uri: redirectUri,
      state,
    });
    
    return `${instanceUrl}/oauth_auth.do?${params.toString()}`;
  }

  async exchangeCodeForTokens(
    config: ConnectorConfiguration,
    code: string,
    redirectUri: string
  ): Promise<OAuthTokens> {
    const credentials = this.parseCredentials(config);
    const instanceUrl = this.getInstanceUrl(config);
    
    const response = await fetch(`${instanceUrl}/oauth_token.do`, {
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
      instanceUrl,
      scope: data.scope,
    };
  }

  async authorize(
    config: ConnectorConfiguration,
    context: ConnectorContext
  ): Promise<OAuthTokens> {
    const credentials = this.parseCredentials(config);
    
    if (config.authType === 'basic') {
      return {
        accessToken: Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64'),
        tokenType: 'Basic',
        instanceUrl: this.getInstanceUrl(config),
      };
    }
    
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
    const instanceUrl = this.getInstanceUrl(config);

    const response = await this.retryWithBackoff(
      async () => {
        const res = await fetch(`${instanceUrl}/oauth_token.do`, {
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
      refreshToken: data.refresh_token || tokens.refreshToken,
      tokenType: data.token_type || 'Bearer',
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
      instanceUrl: tokens.instanceUrl,
      scope: data.scope || tokens.scope,
    };
  }

  async testConnection(
    config: ConnectorConfiguration,
    tokens: OAuthTokens,
    context: ConnectorContext
  ): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    const instanceUrl = tokens.instanceUrl || this.getInstanceUrl(config);
    
    try {
      const authHeader = tokens.tokenType === 'Basic'
        ? `Basic ${tokens.accessToken}`
        : `Bearer ${tokens.accessToken}`;
      
      const response = await fetch(
        `${instanceUrl}/api/now/table/sys_user?sysparm_limit=1`,
        {
          headers: {
            Authorization: authHeader,
            Accept: 'application/json',
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

      return {
        success: true,
        message: 'Connected to ServiceNow successfully',
        details: {
          instance: instanceUrl,
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
    const instanceUrl = tokens.instanceUrl || this.getInstanceUrl(config);
    const batchSize = mapping.batchSize || 200;
    const offset = cursor ? parseInt(cursor, 10) : 0;
    
    const fields = [
      'sys_id',
      mapping.caseIdField,
      mapping.activityField,
      mapping.timestampField,
      mapping.resourceField,
      ...(mapping.additionalFields as string[] || []),
    ].filter((f, i, arr) => f && arr.indexOf(f) === i);

    const params = new URLSearchParams({
      sysparm_limit: String(batchSize),
      sysparm_offset: String(offset),
      sysparm_fields: fields.join(','),
      sysparm_display_value: 'true',
    });

    if (mapping.filterQuery) {
      params.set('sysparm_query', mapping.filterQuery);
    } else {
      params.set('sysparm_query', `ORDERBYsys_created_on`);
    }

    const authHeader = tokens.tokenType === 'Basic'
      ? `Basic ${tokens.accessToken}`
      : `Bearer ${tokens.accessToken}`;

    const response = await this.retryWithBackoff(
      async () => {
        const res = await fetch(
          `${instanceUrl}/api/now/table/${mapping.sourceObject}?${params.toString()}`,
          {
            headers: {
              Authorization: authHeader,
              Accept: 'application/json',
            },
          }
        );
        
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
    const totalHeader = response.headers.get('X-Total-Count');
    const totalRecords = totalHeader ? parseInt(totalHeader, 10) : undefined;
    
    const records = data.result || [];
    const events = records.map((record: Record<string, unknown>) =>
      this.transformServiceNowRecord(record, mapping)
    );

    const nextOffset = offset + records.length;
    const hasMore = totalRecords ? nextOffset < totalRecords : records.length === batchSize;

    return {
      events,
      hasMore,
      nextCursor: hasMore ? String(nextOffset) : undefined,
      totalRecords,
    };
  }

  private transformServiceNowRecord(
    record: Record<string, unknown>,
    mapping: ConnectorMapping
  ): ReturnType<typeof this.transformRecord> {
    const normalizedRecord: Record<string, unknown> = {
      ...record,
      Id: record.sys_id,
    };
    
    for (const [key, value] of Object.entries(record)) {
      if (value && typeof value === 'object' && 'display_value' in value) {
        normalizedRecord[key] = (value as { display_value: unknown }).display_value;
      }
    }
    
    return this.transformRecord(normalizedRecord, mapping);
  }

  async getAvailableObjects(
    config: ConnectorConfiguration,
    tokens: OAuthTokens,
    context: ConnectorContext
  ): Promise<{ name: string; label: string; fields: { name: string; type: string; label: string }[] }[]> {
    const instanceUrl = tokens.instanceUrl || this.getInstanceUrl(config);
    
    const authHeader = tokens.tokenType === 'Basic'
      ? `Basic ${tokens.accessToken}`
      : `Bearer ${tokens.accessToken}`;

    const response = await this.retryWithBackoff(
      async () => {
        const res = await fetch(
          `${instanceUrl}/api/now/table/sys_db_object?sysparm_limit=100&sysparm_query=super_class=task^ORsuper_class=cmdb_ci^ORname=incident^ORname=change_request^ORname=sc_request^ORname=problem`,
          {
            headers: {
              Authorization: authHeader,
              Accept: 'application/json',
            },
          }
        );
        
        if (!res.ok) {
          return {
            ok: true,
            json: async () => ({
              result: this.metadata.defaultObjects?.map((name) => ({
                name,
                label: name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
              })) || [],
            }),
          };
        }
        
        return res;
      },
      context,
      'getAvailableObjects'
    );

    const data = await response.json();
    
    return (data.result || []).map((obj: { name: string; label?: string }) => ({
      name: obj.name,
      label: obj.label || obj.name.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
      fields: [],
    }));
  }

  async getFieldsForObject(
    config: ConnectorConfiguration,
    tokens: OAuthTokens,
    objectName: string,
    context: ConnectorContext
  ): Promise<{ name: string; type: string; label: string }[]> {
    const instanceUrl = tokens.instanceUrl || this.getInstanceUrl(config);
    
    const authHeader = tokens.tokenType === 'Basic'
      ? `Basic ${tokens.accessToken}`
      : `Bearer ${tokens.accessToken}`;

    const response = await this.retryWithBackoff(
      async () => {
        const res = await fetch(
          `${instanceUrl}/api/now/table/sys_dictionary?sysparm_query=name=${objectName}&sysparm_fields=element,column_label,internal_type`,
          {
            headers: {
              Authorization: authHeader,
              Accept: 'application/json',
            },
          }
        );
        
        if (!res.ok) {
          const error = await res.text();
          throw new Error(`Failed to get fields: ${error}`);
        }
        
        return res;
      },
      context,
      'getFieldsForObject'
    );

    const data = await response.json();
    
    return (data.result || [])
      .filter((field: { element: string }) => field.element)
      .map((field: { element: string; internal_type?: string; column_label?: string }) => ({
        name: field.element,
        type: field.internal_type || 'string',
        label: field.column_label || field.element,
      }));
  }

  async getRateLimitInfo(
    config: ConnectorConfiguration,
    tokens: OAuthTokens
  ): Promise<RateLimitInfo | null> {
    return null;
  }
}
