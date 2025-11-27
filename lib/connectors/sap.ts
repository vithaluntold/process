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

export class SAPODataConnector extends AbstractConnector {
  readonly metadata: ConnectorMetadata = {
    id: 'sap',
    name: 'SAP',
    description: 'Connect to SAP S/4HANA and SAP ECC via OData to extract business process data',
    icon: 'sap',
    authTypes: ['oauth2', 'basic'],
    requiredScopes: [],
    defaultObjects: [
      'A_SalesOrder',
      'A_PurchaseOrder',
      'A_ProductionOrder',
      'A_MaintenanceOrder',
      'A_ServiceOrder',
    ],
    documentationUrl: 'https://api.sap.com/package/SAPS4HANACloud/odata',
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

  private getODataVersion(config: ConnectorConfiguration): 'v2' | 'v4' {
    const metadata = config.metadata as Record<string, unknown> | null;
    const odataVersion = metadata?.odataVersion;
    return odataVersion === 'v4' ? 'v4' : 'v2';
  }

  buildAuthUrl(config: ConnectorConfiguration, redirectUri: string, state: string): string {
    const credentials = this.parseCredentials(config);
    const instanceUrl = this.getInstanceUrl(config);
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: credentials.clientId || '',
      redirect_uri: redirectUri,
      state,
      scope: 'openid',
    });
    
    return `${instanceUrl}/oauth2/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(
    config: ConnectorConfiguration,
    code: string,
    redirectUri: string
  ): Promise<OAuthTokens> {
    const credentials = this.parseCredentials(config);
    const instanceUrl = this.getInstanceUrl(config);
    
    const response = await fetch(`${instanceUrl}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
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
        const res = await fetch(`${instanceUrl}/oauth2/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString('base64')}`,
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: tokens.refreshToken!,
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

  private getServicePath(objectName: string, odataVersion: 'v2' | 'v4'): string {
    const serviceMap: Record<string, { v2: string; v4: string }> = {
      A_SalesOrder: {
        v2: 'API_SALES_ORDER_SRV',
        v4: 'api_sales_order_srv/srvd_a2x/sap/salesorder/0001',
      },
      A_SalesOrderItem: {
        v2: 'API_SALES_ORDER_SRV',
        v4: 'api_sales_order_srv/srvd_a2x/sap/salesorder/0001',
      },
      A_PurchaseOrder: {
        v2: 'API_PURCHASEORDER_PROCESS_SRV',
        v4: 'api_purchaseorder_2/srvd_a2x/sap/purchaseorder/0001',
      },
      A_PurchaseOrderItem: {
        v2: 'API_PURCHASEORDER_PROCESS_SRV',
        v4: 'api_purchaseorder_2/srvd_a2x/sap/purchaseorder/0001',
      },
      A_ProductionOrder: {
        v2: 'API_PRODUCTION_ORDER_2_SRV',
        v4: 'api_production_order_2/srvd_a2x/sap/productionorder/0001',
      },
      A_MaintenanceOrder: {
        v2: 'API_MAINTENANCEORDER',
        v4: 'api_maintenanceorder/srvd_a2x/sap/maintenanceorder/0001',
      },
      A_ServiceOrder: {
        v2: 'API_SERVICE_ORDER_SRV',
        v4: 'api_service_order/srvd_a2x/sap/serviceorder/0001',
      },
      A_Supplier: {
        v2: 'API_BUSINESS_PARTNER',
        v4: 'api_business_partner/srvd_a2x/sap/businesspartner/0001',
      },
      A_Customer: {
        v2: 'API_BUSINESS_PARTNER',
        v4: 'api_business_partner/srvd_a2x/sap/businesspartner/0001',
      },
      A_Material: {
        v2: 'API_PRODUCT_SRV',
        v4: 'api_product_2/srvd_a2x/sap/product/0002',
      },
      A_WorkCenter: {
        v2: 'API_WORK_CENTERS',
        v4: 'api_work_centers/srvd_a2x/sap/workcenter/0001',
      },
      I_CostCenter: {
        v2: 'API_COSTCENTER_SRV',
        v4: 'api_costcenter/srvd_a2x/sap/costcenter/0001',
      },
      A_InboundDelivery: {
        v2: 'API_INBOUND_DELIVERY_SRV;v=0002',
        v4: 'api_inbound_delivery_srv_2/srvd_a2x/sap/inbounddelivery/0001',
      },
      A_OutboundDelivery: {
        v2: 'API_OUTBOUND_DELIVERY_SRV;v=0002',
        v4: 'api_outbound_delivery_srv_2/srvd_a2x/sap/outbounddelivery/0001',
      },
      A_BillingDocument: {
        v2: 'API_BILLING_DOCUMENT_SRV',
        v4: 'api_billing_document_srv/srvd_a2x/sap/billingdocument/0001',
      },
    };

    const mapping = serviceMap[objectName];
    if (mapping) {
      return odataVersion === 'v4' ? mapping.v4 : mapping.v2;
    }
    
    const baseName = objectName.replace(/^[AI]_/, '').toUpperCase();
    return odataVersion === 'v4'
      ? `api_${baseName.toLowerCase()}/srvd_a2x/sap/${baseName.toLowerCase()}/0001`
      : `API_${baseName}_SRV`;
  }

  private buildODataUrl(
    instanceUrl: string,
    objectName: string,
    odataVersion: 'v2' | 'v4',
    suffix: string = ''
  ): string {
    const servicePath = this.getServicePath(objectName, odataVersion);
    const basePrefix = odataVersion === 'v4' ? '/sap/opu/odata4/sap/' : '/sap/opu/odata/sap/';
    return `${instanceUrl}${basePrefix}${servicePath}${suffix}`;
  }

  async testConnection(
    config: ConnectorConfiguration,
    tokens: OAuthTokens,
    context: ConnectorContext
  ): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    const instanceUrl = tokens.instanceUrl || this.getInstanceUrl(config);
    const odataVersion = this.getODataVersion(config);
    
    try {
      const authHeader = tokens.tokenType === 'Basic'
        ? `Basic ${tokens.accessToken}`
        : `Bearer ${tokens.accessToken}`;
      
      const testObject = this.metadata.defaultObjects?.[0] || 'A_SalesOrder';
      const metadataUrl = this.buildODataUrl(instanceUrl, testObject, odataVersion, '/$metadata');
      
      const response = await fetch(metadataUrl, {
        headers: {
          Authorization: authHeader,
          Accept: 'application/xml',
          'x-csrf-token': 'fetch',
        },
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          message: `Connection failed: ${response.status} ${response.statusText}`,
          details: { error, testedService: testObject },
          latencyMs,
        };
      }

      const csrfToken = response.headers.get('x-csrf-token');
      
      return {
        success: true,
        message: 'Connected to SAP successfully',
        details: {
          instance: instanceUrl,
          odataVersion,
          csrfTokenReceived: !!csrfToken,
          testedService: testObject,
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
    const odataVersion = this.getODataVersion(config);
    const batchSize = mapping.batchSize || 100;
    
    const fields = [
      mapping.caseIdField,
      mapping.activityField,
      mapping.timestampField,
      mapping.resourceField,
      ...(mapping.additionalFields as string[] || []),
    ].filter((f, i, arr) => f && arr.indexOf(f) === i);

    const authHeader = tokens.tokenType === 'Basic'
      ? `Basic ${tokens.accessToken}`
      : `Bearer ${tokens.accessToken}`;

    let url: string;
    if (cursor) {
      url = cursor.startsWith('http') ? cursor : `${instanceUrl}${cursor}`;
    } else {
      const params = new URLSearchParams();
      params.set('$select', fields.join(','));
      params.set('$top', String(batchSize));
      
      if (mapping.filterQuery) {
        params.set('$filter', mapping.filterQuery);
      }
      
      params.set('$orderby', `${mapping.timestampField} asc`);
      params.set('$count', 'true');
      
      const baseUrl = this.buildODataUrl(instanceUrl, mapping.sourceObject, odataVersion, `/${mapping.sourceObject}`);
      url = `${baseUrl}?${params.toString()}`;
    }

    const response = await this.retryWithBackoff(
      async () => {
        const res = await fetch(url, {
          headers: {
            Authorization: authHeader,
            Accept: 'application/json',
            'x-csrf-token': 'fetch',
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
    
    const records = odataVersion === 'v4' 
      ? (data.value || [])
      : (data.d?.results || data.value || []);
    
    const totalRecords = odataVersion === 'v4'
      ? data['@odata.count']
      : data.d?.__count;
    
    const nextLink = odataVersion === 'v4'
      ? data['@odata.nextLink']
      : data.d?.__next;
    
    const events = records.map((record: Record<string, unknown>) =>
      this.transformSAPRecord(record, mapping)
    );

    return {
      events,
      hasMore: !!nextLink,
      nextCursor: nextLink,
      totalRecords: totalRecords ? parseInt(String(totalRecords), 10) : undefined,
    };
  }

  private transformSAPRecord(
    record: Record<string, unknown>,
    mapping: ConnectorMapping
  ): ReturnType<typeof this.transformRecord> {
    const extractKey = (rec: Record<string, unknown>): string => {
      if (rec.SalesOrder) return String(rec.SalesOrder);
      if (rec.PurchaseOrder) return String(rec.PurchaseOrder);
      if (rec.ProductionOrder) return String(rec.ProductionOrder);
      if (rec.MaintenanceOrder) return String(rec.MaintenanceOrder);
      if (rec.ServiceOrder) return String(rec.ServiceOrder);
      
      for (const key of Object.keys(rec)) {
        if (key.endsWith('Key') || key.endsWith('ID') || key.endsWith('Number')) {
          return String(rec[key]);
        }
      }
      return '';
    };
    
    const normalizedRecord: Record<string, unknown> = {
      ...record,
      Id: extractKey(record),
    };
    
    for (const [key, value] of Object.entries(record)) {
      if (typeof value === 'string' && value.startsWith('/Date(')) {
        const timestamp = parseInt(value.replace(/\/Date\((\d+)\)\//, '$1'), 10);
        normalizedRecord[key] = new Date(timestamp).toISOString();
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
      { name: 'A_SalesOrder', label: 'Sales Orders', fields: [] },
      { name: 'A_SalesOrderItem', label: 'Sales Order Items', fields: [] },
      { name: 'A_PurchaseOrder', label: 'Purchase Orders', fields: [] },
      { name: 'A_PurchaseOrderItem', label: 'Purchase Order Items', fields: [] },
      { name: 'A_ProductionOrder', label: 'Production Orders', fields: [] },
      { name: 'A_MaintenanceOrder', label: 'Maintenance Orders', fields: [] },
      { name: 'A_ServiceOrder', label: 'Service Orders', fields: [] },
      { name: 'A_Supplier', label: 'Suppliers', fields: [] },
      { name: 'A_Customer', label: 'Customers', fields: [] },
      { name: 'A_Material', label: 'Materials', fields: [] },
      { name: 'A_WorkCenter', label: 'Work Centers', fields: [] },
      { name: 'I_CostCenter', label: 'Cost Centers', fields: [] },
      { name: 'A_InboundDelivery', label: 'Inbound Deliveries', fields: [] },
      { name: 'A_OutboundDelivery', label: 'Outbound Deliveries', fields: [] },
      { name: 'A_BillingDocument', label: 'Billing Documents', fields: [] },
    ];
  }

  async getFieldsForObject(
    config: ConnectorConfiguration,
    tokens: OAuthTokens,
    objectName: string,
    context: ConnectorContext
  ): Promise<{ name: string; type: string; label: string }[]> {
    const instanceUrl = tokens.instanceUrl || this.getInstanceUrl(config);
    const odataVersion = this.getODataVersion(config);
    
    const authHeader = tokens.tokenType === 'Basic'
      ? `Basic ${tokens.accessToken}`
      : `Bearer ${tokens.accessToken}`;

    try {
      const metadataUrl = this.buildODataUrl(instanceUrl, objectName, odataVersion, '/$metadata');
      
      const response = await this.retryWithBackoff(
        async () => {
          const res = await fetch(metadataUrl, {
            headers: {
              Authorization: authHeader,
              Accept: 'application/xml',
            },
          });
          
          if (!res.ok) {
            throw new Error(`Failed to get metadata: ${res.status}`);
          }
          
          return res;
        },
        context,
        'getFieldsForObject'
      );

      const xml = await response.text();
      const fields = this.parseODataMetadata(xml, objectName);
      
      if (fields.length > 0) {
        return fields;
      }
    } catch {
    }
    
    return this.getDefaultFieldsForObject(objectName);
  }

  private parseODataMetadata(
    xml: string,
    objectName: string
  ): { name: string; type: string; label: string }[] {
    const fields: { name: string; type: string; label: string }[] = [];
    
    const entityTypeMatch = xml.match(new RegExp(`<EntityType[^>]*Name="${objectName.replace('A_', '')}"[^>]*>([\\s\\S]*?)<\\/EntityType>`));
    if (!entityTypeMatch) {
      return fields;
    }
    
    const propertyMatches = entityTypeMatch[1].matchAll(/<Property[^>]*Name="([^"]+)"[^>]*Type="([^"]+)"[^>]*(?:sap:label="([^"]+)")?[^>]*\/>/g);
    
    for (const match of propertyMatches) {
      const name = match[1];
      const edmType = match[2];
      const label = match[3] || this.formatFieldName(name);
      
      fields.push({
        name,
        type: this.mapEdmType(edmType),
        label,
      });
    }
    
    return fields;
  }

  private mapEdmType(edmType: string): string {
    const typeMap: Record<string, string> = {
      'Edm.String': 'string',
      'Edm.Int32': 'integer',
      'Edm.Int64': 'integer',
      'Edm.Decimal': 'decimal',
      'Edm.Double': 'double',
      'Edm.Boolean': 'boolean',
      'Edm.DateTime': 'datetime',
      'Edm.DateTimeOffset': 'datetime',
      'Edm.Date': 'date',
      'Edm.Time': 'time',
      'Edm.Guid': 'guid',
      'Edm.Binary': 'binary',
    };
    return typeMap[edmType] || 'string';
  }

  private formatFieldName(name: string): string {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  private getDefaultFieldsForObject(
    objectName: string
  ): { name: string; type: string; label: string }[] {
    const commonFields = [
      { name: 'CreatedByUser', type: 'string', label: 'Created By' },
      { name: 'CreationDate', type: 'date', label: 'Creation Date' },
      { name: 'LastChangedByUser', type: 'string', label: 'Last Changed By' },
      { name: 'LastChangeDate', type: 'date', label: 'Last Change Date' },
    ];

    const objectFields: Record<string, { name: string; type: string; label: string }[]> = {
      A_SalesOrder: [
        { name: 'SalesOrder', type: 'string', label: 'Sales Order' },
        { name: 'SalesOrderType', type: 'string', label: 'Order Type' },
        { name: 'SalesOrganization', type: 'string', label: 'Sales Organization' },
        { name: 'SoldToParty', type: 'string', label: 'Sold-To Party' },
        { name: 'TotalNetAmount', type: 'decimal', label: 'Net Amount' },
        { name: 'TransactionCurrency', type: 'string', label: 'Currency' },
        { name: 'OverallSDProcessStatus', type: 'string', label: 'Status' },
        ...commonFields,
      ],
      A_PurchaseOrder: [
        { name: 'PurchaseOrder', type: 'string', label: 'Purchase Order' },
        { name: 'PurchaseOrderType', type: 'string', label: 'Order Type' },
        { name: 'PurchasingOrganization', type: 'string', label: 'Purchasing Org' },
        { name: 'Supplier', type: 'string', label: 'Supplier' },
        { name: 'PurchaseOrderStatus', type: 'string', label: 'Status' },
        ...commonFields,
      ],
      A_ProductionOrder: [
        { name: 'ManufacturingOrder', type: 'string', label: 'Production Order' },
        { name: 'ManufacturingOrderType', type: 'string', label: 'Order Type' },
        { name: 'Material', type: 'string', label: 'Material' },
        { name: 'ProductionPlant', type: 'string', label: 'Plant' },
        { name: 'MfgOrderPlannedStartDate', type: 'date', label: 'Planned Start' },
        { name: 'MfgOrderPlannedEndDate', type: 'date', label: 'Planned End' },
        { name: 'MfgOrderConfirmedYieldQty', type: 'decimal', label: 'Confirmed Qty' },
        ...commonFields,
      ],
      A_MaintenanceOrder: [
        { name: 'MaintenanceOrder', type: 'string', label: 'Maintenance Order' },
        { name: 'MaintenanceOrderType', type: 'string', label: 'Order Type' },
        { name: 'FunctionalLocation', type: 'string', label: 'Functional Location' },
        { name: 'Equipment', type: 'string', label: 'Equipment' },
        { name: 'MaintenanceActivityType', type: 'string', label: 'Activity Type' },
        { name: 'MaintOrdBasicStartDate', type: 'date', label: 'Start Date' },
        { name: 'MaintOrdBasicEndDate', type: 'date', label: 'End Date' },
        ...commonFields,
      ],
      A_ServiceOrder: [
        { name: 'ServiceOrder', type: 'string', label: 'Service Order' },
        { name: 'ServiceOrderType', type: 'string', label: 'Order Type' },
        { name: 'ServiceOrderDescription', type: 'string', label: 'Description' },
        { name: 'SoldToParty', type: 'string', label: 'Customer' },
        { name: 'ServiceOrderPriority', type: 'string', label: 'Priority' },
        { name: 'RequestedServiceStartDateTime', type: 'datetime', label: 'Requested Start' },
        { name: 'RequestedServiceEndDateTime', type: 'datetime', label: 'Requested End' },
        ...commonFields,
      ],
    };

    return objectFields[objectName] || commonFields;
  }

  async getRateLimitInfo(
    config: ConnectorConfiguration,
    tokens: OAuthTokens
  ): Promise<RateLimitInfo | null> {
    return null;
  }
}
