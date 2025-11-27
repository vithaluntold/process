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

export class OracleEBSConnector extends AbstractConnector {
  readonly metadata: ConnectorMetadata = {
    id: 'oracle',
    name: 'Oracle E-Business Suite',
    description: 'Connect to Oracle EBS for procurement, financials, and supply chain data',
    icon: 'database',
    authTypes: ['basic', 'oauth2'],
    requiredScopes: [],
    defaultObjects: [
      'PO_HEADERS_ALL',
      'PO_LINES_ALL',
      'AP_INVOICES_ALL',
      'AP_INVOICE_LINES_ALL',
      'AR_PAYMENT_SCHEDULES_ALL',
      'OE_ORDER_HEADERS_ALL',
      'OE_ORDER_LINES_ALL',
      'WIP_DISCRETE_JOBS',
      'MTL_SYSTEM_ITEMS_B',
      'HR_ALL_ORGANIZATION_UNITS',
      'FND_USER',
      'GL_JE_HEADERS',
      'GL_JE_LINES',
      'INV_TRANSACTIONS',
      'WSH_DELIVERY_DETAILS',
    ],
    documentationUrl: 'https://docs.oracle.com/en/applications/ebusiness-suite/',
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

  private getMetadata(config: ConnectorConfiguration): Record<string, unknown> {
    if (!config.metadata) {
      return {};
    }
    return config.metadata as Record<string, unknown>;
  }

  private getRestEndpoint(config: ConnectorConfiguration): string {
    return config.instanceUrl || '';
  }

  private getApiVersion(config: ConnectorConfiguration): string {
    const metadata = this.getMetadata(config);
    return (metadata.apiVersion as string) || 'v1';
  }

  private getModuleMap(): Record<string, { module: string; restService: string }> {
    return {
      PO_HEADERS_ALL: { module: 'po', restService: 'purchaseOrders' },
      PO_LINES_ALL: { module: 'po', restService: 'purchaseOrderLines' },
      AP_INVOICES_ALL: { module: 'ap', restService: 'invoices' },
      AP_INVOICE_LINES_ALL: { module: 'ap', restService: 'invoiceLines' },
      AR_PAYMENT_SCHEDULES_ALL: { module: 'ar', restService: 'paymentSchedules' },
      OE_ORDER_HEADERS_ALL: { module: 'oe', restService: 'salesOrders' },
      OE_ORDER_LINES_ALL: { module: 'oe', restService: 'salesOrderLines' },
      WIP_DISCRETE_JOBS: { module: 'wip', restService: 'discreteJobs' },
      MTL_SYSTEM_ITEMS_B: { module: 'inv', restService: 'items' },
      HR_ALL_ORGANIZATION_UNITS: { module: 'hr', restService: 'organizations' },
      FND_USER: { module: 'fnd', restService: 'users' },
      GL_JE_HEADERS: { module: 'gl', restService: 'journalHeaders' },
      GL_JE_LINES: { module: 'gl', restService: 'journalLines' },
      INV_TRANSACTIONS: { module: 'inv', restService: 'transactions' },
      WSH_DELIVERY_DETAILS: { module: 'wsh', restService: 'deliveries' },
    };
  }

  private buildRestUrl(instanceUrl: string, objectName: string, apiVersion: string): string {
    const moduleMap = this.getModuleMap();
    const mapping = moduleMap[objectName];
    
    if (mapping) {
      return `${instanceUrl}/webservices/rest/${mapping.module}/${apiVersion}/${mapping.restService}`;
    }
    
    const tableName = objectName.toLowerCase().replace(/_/g, '');
    return `${instanceUrl}/webservices/rest/custom/${apiVersion}/${tableName}`;
  }

  async authorize(
    config: ConnectorConfiguration,
    context: ConnectorContext
  ): Promise<OAuthTokens> {
    const credentials = this.parseCredentials(config);
    
    if (config.authType === 'basic') {
      const username = credentials.username;
      const password = credentials.password;
      
      if (!username || !password) {
        throw new Error('Username and password are required for basic authentication');
      }
      
      const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');
      
      return {
        accessToken: basicAuth,
        tokenType: 'Basic',
        instanceUrl: this.getRestEndpoint(config),
      };
    }
    
    const tokenUrl = `${this.getRestEndpoint(config)}/oauth2/v1/token`;
    const clientId = credentials.clientId;
    const clientSecret = credentials.clientSecret;
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'oracle.apps.all',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OAuth token request failed: ${response.status} ${error}`);
    }

    const data = await response.json();
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: data.token_type || 'Bearer',
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
      instanceUrl: this.getRestEndpoint(config),
      scope: data.scope,
    };
  }

  buildAuthUrl(
    config: ConnectorConfiguration,
    redirectUri: string,
    state: string
  ): string {
    const credentials = this.parseCredentials(config);
    const instanceUrl = this.getRestEndpoint(config);
    const clientId = credentials.clientId || '';
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
      scope: 'oracle.apps.all',
    });

    return `${instanceUrl}/oauth2/v1/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(
    config: ConnectorConfiguration,
    code: string,
    redirectUri: string
  ): Promise<OAuthTokens> {
    const credentials = this.parseCredentials(config);
    const instanceUrl = this.getRestEndpoint(config);
    const clientId = credentials.clientId || '';
    const clientSecret = credentials.clientSecret || '';

    const response = await fetch(`${instanceUrl}/oauth2/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${response.status} ${error}`);
    }

    const data = await response.json();
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: data.token_type || 'Bearer',
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
      instanceUrl,
      scope: data.scope,
    };
  }

  async refreshToken(
    tokens: OAuthTokens,
    config: ConnectorConfiguration,
    context: ConnectorContext
  ): Promise<OAuthTokens> {
    if (tokens.tokenType === 'Basic') {
      return tokens;
    }

    if (!tokens.refreshToken) {
      throw new Error('No refresh token available');
    }

    const credentials = this.parseCredentials(config);
    const instanceUrl = tokens.instanceUrl || this.getRestEndpoint(config);
    const clientId = credentials.clientId || '';
    const clientSecret = credentials.clientSecret || '';

    const response = await fetch(`${instanceUrl}/oauth2/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokens.refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed: ${response.status} ${error}`);
    }

    const data = await response.json();
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || tokens.refreshToken,
      tokenType: data.token_type || 'Bearer',
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
      instanceUrl,
      scope: data.scope || tokens.scope,
    };
  }

  async testConnection(
    config: ConnectorConfiguration,
    tokens: OAuthTokens,
    context: ConnectorContext
  ): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    const instanceUrl = tokens.instanceUrl || this.getRestEndpoint(config);
    const apiVersion = this.getApiVersion(config);
    
    try {
      const authHeader = tokens.tokenType === 'Basic'
        ? `Basic ${tokens.accessToken}`
        : `Bearer ${tokens.accessToken}`;
      
      const testUrl = `${instanceUrl}/webservices/rest/fnd/${apiVersion}/users?limit=1`;
      
      const response = await fetch(testUrl, {
        headers: {
          Authorization: authHeader,
          Accept: 'application/json',
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

      return {
        success: true,
        message: 'Connected to Oracle EBS successfully',
        details: {
          instance: instanceUrl,
          apiVersion,
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
    const instanceUrl = tokens.instanceUrl || this.getRestEndpoint(config);
    const apiVersion = this.getApiVersion(config);
    const batchSize = mapping.batchSize || 100;
    
    const authHeader = tokens.tokenType === 'Basic'
      ? `Basic ${tokens.accessToken}`
      : `Bearer ${tokens.accessToken}`;

    let url: string;
    if (cursor) {
      url = cursor.startsWith('http') ? cursor : `${instanceUrl}${cursor}`;
    } else {
      const baseUrl = this.buildRestUrl(instanceUrl, mapping.sourceObject, apiVersion);
      const params = new URLSearchParams();
      params.set('limit', String(batchSize));
      params.set('offset', '0');
      
      if (mapping.filterQuery) {
        params.set('q', mapping.filterQuery);
      }
      
      url = `${baseUrl}?${params.toString()}`;
    }

    const response = await this.retryWithBackoff(
      async () => {
        const res = await fetch(url, {
          headers: {
            Authorization: authHeader,
            Accept: 'application/json',
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
    
    const records = data.items || data.rows || [];
    const totalRecords = data.totalResults || data.count;
    const hasMore = data.hasMore || (data.links?.find((l: { rel: string }) => l.rel === 'next') !== undefined);
    const nextLink = data.links?.find((l: { rel: string }) => l.rel === 'next')?.href;
    
    const events = records.map((record: Record<string, unknown>) =>
      this.transformOracleRecord(record, mapping)
    );

    return {
      events,
      hasMore: !!hasMore,
      nextCursor: nextLink,
      totalRecords: totalRecords ? parseInt(String(totalRecords), 10) : undefined,
    };
  }

  private transformOracleRecord(
    record: Record<string, unknown>,
    mapping: ConnectorMapping
  ): NormalizedEvent {
    const extractKey = (rec: Record<string, unknown>): string => {
      const keyFields = [
        'HeaderId', 'LineId', 'InvoiceId', 'OrderHeaderId', 'OrderLineId',
        'TransactionId', 'DeliveryDetailId', 'UserId', 'OrganizationId',
        'header_id', 'line_id', 'invoice_id', 'transaction_id',
      ];
      
      for (const field of keyFields) {
        if (rec[field]) {
          return String(rec[field]);
        }
      }
      
      if (rec.Id) return String(rec.Id);
      if (rec.id) return String(rec.id);
      
      return '';
    };
    
    const normalizedRecord: Record<string, unknown> = {
      ...record,
      Id: extractKey(record),
    };
    
    for (const [key, value] of Object.entries(record)) {
      if (typeof value === 'string') {
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
          normalizedRecord[key] = new Date(value).toISOString();
        } else if (/^\d{2}-[A-Z]{3}-\d{4}$/.test(value)) {
          const parsed = new Date(value);
          if (!isNaN(parsed.getTime())) {
            normalizedRecord[key] = parsed.toISOString();
          }
        }
      }
    }
    
    return this.transformRecord(normalizedRecord, mapping);
  }

  async getAvailableObjects(
    config: ConnectorConfiguration,
    tokens: OAuthTokens,
    context: ConnectorContext
  ): Promise<{ name: string; label: string; fields: { name: string; type: string; label: string }[] }[]> {
    return [
      { name: 'PO_HEADERS_ALL', label: 'Purchase Order Headers', fields: [] },
      { name: 'PO_LINES_ALL', label: 'Purchase Order Lines', fields: [] },
      { name: 'AP_INVOICES_ALL', label: 'AP Invoices', fields: [] },
      { name: 'AP_INVOICE_LINES_ALL', label: 'AP Invoice Lines', fields: [] },
      { name: 'AR_PAYMENT_SCHEDULES_ALL', label: 'AR Payment Schedules', fields: [] },
      { name: 'OE_ORDER_HEADERS_ALL', label: 'Sales Order Headers', fields: [] },
      { name: 'OE_ORDER_LINES_ALL', label: 'Sales Order Lines', fields: [] },
      { name: 'WIP_DISCRETE_JOBS', label: 'WIP Discrete Jobs', fields: [] },
      { name: 'MTL_SYSTEM_ITEMS_B', label: 'Inventory Items', fields: [] },
      { name: 'HR_ALL_ORGANIZATION_UNITS', label: 'Organizations', fields: [] },
      { name: 'FND_USER', label: 'Users', fields: [] },
      { name: 'GL_JE_HEADERS', label: 'Journal Headers', fields: [] },
      { name: 'GL_JE_LINES', label: 'Journal Lines', fields: [] },
      { name: 'INV_TRANSACTIONS', label: 'Inventory Transactions', fields: [] },
      { name: 'WSH_DELIVERY_DETAILS', label: 'Delivery Details', fields: [] },
    ];
  }

  async getFieldsForObject(
    config: ConnectorConfiguration,
    tokens: OAuthTokens,
    objectName: string,
    context: ConnectorContext
  ): Promise<{ name: string; type: string; label: string }[]> {
    const fieldMap: Record<string, { name: string; type: string; label: string }[]> = {
      PO_HEADERS_ALL: [
        { name: 'PO_HEADER_ID', type: 'number', label: 'PO Header ID' },
        { name: 'SEGMENT1', type: 'string', label: 'PO Number' },
        { name: 'TYPE_LOOKUP_CODE', type: 'string', label: 'PO Type' },
        { name: 'VENDOR_ID', type: 'number', label: 'Vendor ID' },
        { name: 'CREATION_DATE', type: 'datetime', label: 'Creation Date' },
        { name: 'APPROVED_DATE', type: 'datetime', label: 'Approved Date' },
        { name: 'AUTHORIZATION_STATUS', type: 'string', label: 'Status' },
        { name: 'AGENT_ID', type: 'number', label: 'Buyer ID' },
        { name: 'COMMENTS', type: 'string', label: 'Comments' },
        { name: 'CURRENCY_CODE', type: 'string', label: 'Currency' },
      ],
      PO_LINES_ALL: [
        { name: 'PO_LINE_ID', type: 'number', label: 'PO Line ID' },
        { name: 'PO_HEADER_ID', type: 'number', label: 'PO Header ID' },
        { name: 'LINE_NUM', type: 'number', label: 'Line Number' },
        { name: 'ITEM_ID', type: 'number', label: 'Item ID' },
        { name: 'ITEM_DESCRIPTION', type: 'string', label: 'Description' },
        { name: 'QUANTITY', type: 'number', label: 'Quantity' },
        { name: 'UNIT_PRICE', type: 'number', label: 'Unit Price' },
        { name: 'CREATION_DATE', type: 'datetime', label: 'Creation Date' },
      ],
      AP_INVOICES_ALL: [
        { name: 'INVOICE_ID', type: 'number', label: 'Invoice ID' },
        { name: 'INVOICE_NUM', type: 'string', label: 'Invoice Number' },
        { name: 'INVOICE_DATE', type: 'datetime', label: 'Invoice Date' },
        { name: 'VENDOR_ID', type: 'number', label: 'Vendor ID' },
        { name: 'INVOICE_AMOUNT', type: 'number', label: 'Invoice Amount' },
        { name: 'INVOICE_CURRENCY_CODE', type: 'string', label: 'Currency' },
        { name: 'PAYMENT_STATUS_FLAG', type: 'string', label: 'Payment Status' },
        { name: 'CREATION_DATE', type: 'datetime', label: 'Creation Date' },
      ],
      OE_ORDER_HEADERS_ALL: [
        { name: 'HEADER_ID', type: 'number', label: 'Order Header ID' },
        { name: 'ORDER_NUMBER', type: 'string', label: 'Order Number' },
        { name: 'ORDERED_DATE', type: 'datetime', label: 'Order Date' },
        { name: 'SOLD_TO_ORG_ID', type: 'number', label: 'Customer ID' },
        { name: 'FLOW_STATUS_CODE', type: 'string', label: 'Status' },
        { name: 'SALESREP_ID', type: 'number', label: 'Sales Rep ID' },
        { name: 'CREATION_DATE', type: 'datetime', label: 'Creation Date' },
      ],
    };

    return fieldMap[objectName] || [
      { name: 'ID', type: 'number', label: 'ID' },
      { name: 'CREATION_DATE', type: 'datetime', label: 'Creation Date' },
      { name: 'LAST_UPDATE_DATE', type: 'datetime', label: 'Last Update Date' },
      { name: 'CREATED_BY', type: 'number', label: 'Created By' },
      { name: 'LAST_UPDATED_BY', type: 'number', label: 'Last Updated By' },
    ];
  }
}

export const oracleConnector = new OracleEBSConnector();
