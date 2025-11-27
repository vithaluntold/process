import { AbstractConnector } from './base-connector';
import type {
  ConnectorMetadata,
  OAuthTokens,
  ConnectionTestResult,
  FetchResult,
  ConnectorContext,
  NormalizedEvent,
  Credentials,
} from './types';
import type { ConnectorConfiguration, ConnectorMapping } from '@/shared/schema';

export class DynamicsConnector extends AbstractConnector {
  readonly metadata: ConnectorMetadata = {
    id: 'dynamics',
    name: 'Microsoft Dynamics 365',
    description: 'Connect to Dynamics 365 CRM and ERP for sales, customer service, and operations data',
    icon: 'microsoft',
    authTypes: ['oauth2'],
    requiredScopes: ['user_impersonation', 'offline_access'],
    defaultObjects: [
      'accounts',
      'contacts',
      'leads',
      'opportunities',
      'incidents',
      'salesorders',
      'invoices',
      'quotes',
      'products',
      'tasks',
      'appointments',
      'emails',
      'phonecalls',
    ],
    documentationUrl: 'https://docs.microsoft.com/en-us/dynamics365/',
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

  private getDataverseUrl(config: ConnectorConfiguration): string {
    return config.instanceUrl || '';
  }

  private getApiVersion(config: ConnectorConfiguration): string {
    const metadata = config.metadata as Record<string, unknown> | null;
    return (metadata?.apiVersion as string) || 'v9.2';
  }

  private getTenantId(config: ConnectorConfiguration): string {
    const metadata = config.metadata as Record<string, unknown> | null;
    return (metadata?.tenantId as string) || 'common';
  }

  buildAuthUrl(
    config: ConnectorConfiguration,
    redirectUri: string,
    state: string
  ): string {
    const credentials = this.parseCredentials(config);
    const tenantId = this.getTenantId(config);
    const dataverseUrl = this.getDataverseUrl(config);
    
    const scopes = encodeURIComponent(`${dataverseUrl}/.default offline_access`);
    
    const params = new URLSearchParams({
      client_id: credentials.clientId || '',
      response_type: 'code',
      redirect_uri: redirectUri,
      response_mode: 'query',
      scope: scopes,
      state,
    });

    return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(
    config: ConnectorConfiguration,
    code: string,
    redirectUri: string
  ): Promise<OAuthTokens> {
    const credentials = this.parseCredentials(config);
    const tenantId = this.getTenantId(config);
    const dataverseUrl = this.getDataverseUrl(config);

    const response = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: credentials.clientId || '',
          client_secret: credentials.clientSecret || '',
          code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          scope: `${dataverseUrl}/.default offline_access`,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code for tokens: ${error}`);
    }

    const data = await response.json();
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: data.token_type || 'Bearer',
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
      instanceUrl: dataverseUrl,
      scope: data.scope,
    };
  }

  async authorize(
    config: ConnectorConfiguration,
    context: ConnectorContext
  ): Promise<OAuthTokens> {
    const credentials = this.parseCredentials(config);
    const tenantId = this.getTenantId(config);
    const dataverseUrl = this.getDataverseUrl(config);
    
    if (credentials.clientId && credentials.clientSecret) {
      context.logger.info('Attempting client credentials flow for Dynamics 365', {
        tenantId,
        dataverseUrl,
      });
      
      const response = await this.retryWithBackoff(
        async () => {
          const res = await fetch(
            `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                client_id: credentials.clientId || '',
                client_secret: credentials.clientSecret || '',
                scope: `${dataverseUrl}/.default`,
                grant_type: 'client_credentials',
              }),
            }
          );
          
          if (!res.ok) {
            const error = await res.text();
            throw new Error(`Client credentials auth failed: ${error}`);
          }
          
          return res;
        },
        context,
        'authorize'
      );
      
      const data = await response.json();
      
      return {
        accessToken: data.access_token,
        tokenType: data.token_type || 'Bearer',
        expiresAt: data.expires_in
          ? new Date(Date.now() + data.expires_in * 1000)
          : undefined,
        instanceUrl: dataverseUrl,
        scope: data.scope,
      };
    }
    
    throw new Error('OAuth2 authorization requires user interaction. Use buildAuthUrl and exchangeCodeForTokens for the authorization code flow, or provide client credentials for machine-to-machine authentication.');
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
    const tenantId = this.getTenantId(config);
    const dataverseUrl = tokens.instanceUrl || this.getDataverseUrl(config);

    const response = await this.retryWithBackoff(
      async () => {
        const res = await fetch(
          `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: credentials.clientId || '',
              client_secret: credentials.clientSecret || '',
              refresh_token: tokens.refreshToken!,
              grant_type: 'refresh_token',
              scope: `${dataverseUrl}/.default offline_access`,
            }),
          }
        );

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
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
      instanceUrl: dataverseUrl,
      scope: data.scope || tokens.scope,
    };
  }

  async testConnection(
    config: ConnectorConfiguration,
    tokens: OAuthTokens,
    context: ConnectorContext
  ): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    const dataverseUrl = tokens.instanceUrl || this.getDataverseUrl(config);
    const apiVersion = this.getApiVersion(config);
    
    try {
      const testUrl = `${dataverseUrl}/api/data/${apiVersion}/WhoAmI`;
      
      const response = await fetch(testUrl, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          Accept: 'application/json',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0',
        },
      });

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

      const data = await response.json();

      return {
        success: true,
        message: 'Connected to Dynamics 365 successfully',
        details: {
          instance: dataverseUrl,
          apiVersion,
          userId: data.UserId,
          organizationId: data.OrganizationId,
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
    const dataverseUrl = tokens.instanceUrl || this.getDataverseUrl(config);
    const apiVersion = this.getApiVersion(config);
    const batchSize = mapping.batchSize || 100;
    
    const fields = [
      mapping.caseIdField,
      mapping.activityField,
      mapping.timestampField,
      mapping.resourceField,
      ...(mapping.additionalFields as string[] || []),
    ].filter((f, i, arr) => f && arr.indexOf(f) === i);

    let url: string;
    if (cursor) {
      url = cursor.startsWith('http') ? cursor : `${dataverseUrl}${cursor}`;
    } else {
      const params = new URLSearchParams();
      params.set('$select', fields.join(','));
      params.set('$top', String(batchSize));
      params.set('$count', 'true');
      
      if (mapping.filterQuery) {
        params.set('$filter', mapping.filterQuery);
      }
      
      params.set('$orderby', `${mapping.timestampField} asc`);
      
      url = `${dataverseUrl}/api/data/${apiVersion}/${mapping.sourceObject}?${params.toString()}`;
    }

    const response = await this.retryWithBackoff(
      async () => {
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            Accept: 'application/json',
            'OData-MaxVersion': '4.0',
            'OData-Version': '4.0',
            Prefer: `odata.maxpagesize=${batchSize}`,
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
    
    const records = data.value || [];
    const totalRecords = data['@odata.count'];
    const nextLink = data['@odata.nextLink'];
    
    const events = records.map((record: Record<string, unknown>) =>
      this.transformDynamicsRecord(record, mapping)
    );

    return {
      events,
      hasMore: !!nextLink,
      nextCursor: nextLink,
      totalRecords: totalRecords ? parseInt(String(totalRecords), 10) : undefined,
    };
  }

  private transformDynamicsRecord(
    record: Record<string, unknown>,
    mapping: ConnectorMapping
  ): NormalizedEvent {
    const extractId = (rec: Record<string, unknown>): string => {
      const idFields = [
        'accountid', 'contactid', 'leadid', 'opportunityid', 'incidentid',
        'salesorderid', 'invoiceid', 'quoteid', 'productid', 'activityid',
      ];
      
      for (const field of idFields) {
        if (rec[field]) {
          return String(rec[field]);
        }
      }
      
      for (const key of Object.keys(rec)) {
        if (key.endsWith('id') && rec[key]) {
          return String(rec[key]);
        }
      }
      
      return '';
    };
    
    const normalizedRecord: Record<string, unknown> = {
      ...record,
      Id: extractId(record),
    };
    
    return this.transformRecord(normalizedRecord, mapping);
  }

  async getAvailableObjects(
    config: ConnectorConfiguration,
    tokens: OAuthTokens,
    context: ConnectorContext
  ): Promise<{ name: string; label: string; fields: { name: string; type: string; label: string }[] }[]> {
    return [
      { name: 'accounts', label: 'Accounts', fields: [] },
      { name: 'contacts', label: 'Contacts', fields: [] },
      { name: 'leads', label: 'Leads', fields: [] },
      { name: 'opportunities', label: 'Opportunities', fields: [] },
      { name: 'incidents', label: 'Cases', fields: [] },
      { name: 'salesorders', label: 'Sales Orders', fields: [] },
      { name: 'invoices', label: 'Invoices', fields: [] },
      { name: 'quotes', label: 'Quotes', fields: [] },
      { name: 'products', label: 'Products', fields: [] },
      { name: 'tasks', label: 'Tasks', fields: [] },
      { name: 'appointments', label: 'Appointments', fields: [] },
      { name: 'emails', label: 'Emails', fields: [] },
      { name: 'phonecalls', label: 'Phone Calls', fields: [] },
    ];
  }

  async getFieldsForObject(
    config: ConnectorConfiguration,
    tokens: OAuthTokens,
    objectName: string,
    context: ConnectorContext
  ): Promise<{ name: string; type: string; label: string }[]> {
    const dataverseUrl = tokens.instanceUrl || this.getDataverseUrl(config);
    const apiVersion = this.getApiVersion(config);
    
    try {
      const response = await this.retryWithBackoff(
        async () => {
          const res = await fetch(
            `${dataverseUrl}/api/data/${apiVersion}/EntityDefinitions(LogicalName='${objectName.slice(0, -1)}')?$select=LogicalName&$expand=Attributes($select=LogicalName,AttributeType,DisplayName)`,
            {
              headers: {
                Authorization: `Bearer ${tokens.accessToken}`,
                Accept: 'application/json',
                'OData-MaxVersion': '4.0',
                'OData-Version': '4.0',
              },
            }
          );
          
          if (!res.ok) {
            throw new Error(`Failed to get entity definition: ${res.status}`);
          }
          
          return res;
        },
        context,
        'getFieldsForObject'
      );

      const data = await response.json();
      
      return (data.Attributes || []).map((attr: Record<string, unknown>) => ({
        name: attr.LogicalName as string,
        type: this.mapDynamicsType(attr.AttributeType as string),
        label: (attr.DisplayName as { UserLocalizedLabel?: { Label: string } })?.UserLocalizedLabel?.Label || (attr.LogicalName as string),
      }));
    } catch {
      return this.getDefaultFieldsForObject(objectName);
    }
  }

  private mapDynamicsType(dynamicsType: string): string {
    const typeMap: Record<string, string> = {
      String: 'string',
      Memo: 'string',
      Integer: 'number',
      BigInt: 'number',
      Decimal: 'number',
      Double: 'number',
      Money: 'number',
      Boolean: 'boolean',
      DateTime: 'datetime',
      Lookup: 'reference',
      Customer: 'reference',
      Owner: 'reference',
      Picklist: 'picklist',
      State: 'picklist',
      Status: 'picklist',
      Uniqueidentifier: 'id',
    };
    
    return typeMap[dynamicsType] || 'string';
  }

  private getDefaultFieldsForObject(objectName: string): { name: string; type: string; label: string }[] {
    const commonFields = [
      { name: 'createdon', type: 'datetime', label: 'Created On' },
      { name: 'modifiedon', type: 'datetime', label: 'Modified On' },
      { name: 'statecode', type: 'picklist', label: 'Status' },
      { name: 'statuscode', type: 'picklist', label: 'Status Reason' },
      { name: 'ownerid', type: 'reference', label: 'Owner' },
    ];

    const objectFields: Record<string, { name: string; type: string; label: string }[]> = {
      accounts: [
        { name: 'accountid', type: 'id', label: 'Account ID' },
        { name: 'name', type: 'string', label: 'Account Name' },
        { name: 'accountnumber', type: 'string', label: 'Account Number' },
        ...commonFields,
      ],
      contacts: [
        { name: 'contactid', type: 'id', label: 'Contact ID' },
        { name: 'fullname', type: 'string', label: 'Full Name' },
        { name: 'emailaddress1', type: 'string', label: 'Email' },
        ...commonFields,
      ],
      opportunities: [
        { name: 'opportunityid', type: 'id', label: 'Opportunity ID' },
        { name: 'name', type: 'string', label: 'Topic' },
        { name: 'estimatedvalue', type: 'number', label: 'Est. Revenue' },
        { name: 'estimatedclosedate', type: 'datetime', label: 'Est. Close Date' },
        ...commonFields,
      ],
      incidents: [
        { name: 'incidentid', type: 'id', label: 'Case ID' },
        { name: 'title', type: 'string', label: 'Case Title' },
        { name: 'ticketnumber', type: 'string', label: 'Ticket Number' },
        { name: 'prioritycode', type: 'picklist', label: 'Priority' },
        ...commonFields,
      ],
    };

    return objectFields[objectName] || [
      { name: `${objectName.slice(0, -1)}id`, type: 'id', label: 'ID' },
      ...commonFields,
    ];
  }
}

export const dynamicsConnector = new DynamicsConnector();
