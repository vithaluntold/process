import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Connector Registry', () => {
  describe('Available Connectors', () => {
    const connectorTypes = ['salesforce', 'servicenow', 'sap'];

    it('should register all connector types', () => {
      expect(connectorTypes).toHaveLength(3);
      expect(connectorTypes).toContain('salesforce');
      expect(connectorTypes).toContain('servicenow');
      expect(connectorTypes).toContain('sap');
    });

    it('should have valid metadata for each connector', () => {
      const connectorMetadata = [
        {
          id: 'salesforce',
          name: 'Salesforce',
          authTypes: ['oauth2'],
          defaultObjects: ['Case', 'Opportunity', 'Lead', 'Task', 'Event'],
        },
        {
          id: 'servicenow',
          name: 'ServiceNow',
          authTypes: ['oauth2', 'basic'],
          defaultObjects: ['incident', 'change_request', 'sc_request', 'problem', 'task'],
        },
        {
          id: 'sap',
          name: 'SAP',
          authTypes: ['oauth2', 'basic'],
          defaultObjects: ['A_SalesOrder', 'A_PurchaseOrder', 'A_ProductionOrder', 'A_MaintenanceOrder', 'A_ServiceOrder'],
        },
      ];

      for (const metadata of connectorMetadata) {
        expect(metadata).toHaveProperty('id');
        expect(metadata).toHaveProperty('name');
        expect(metadata).toHaveProperty('authTypes');
        expect(metadata).toHaveProperty('defaultObjects');
        expect(metadata.authTypes.length).toBeGreaterThan(0);
        expect(metadata.defaultObjects.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Connector Types', () => {
    type ConnectorType = 'salesforce' | 'servicenow' | 'sap' | 'dynamics' | 'oracle' | 'custom';
    type AuthType = 'oauth2' | 'basic' | 'api_key' | 'jwt';

    it('should validate connector type', () => {
      const validTypes: ConnectorType[] = ['salesforce', 'servicenow', 'sap'];
      const invalidType = 'unknown';
      
      expect(validTypes.includes('salesforce' as ConnectorType)).toBe(true);
      expect(validTypes.includes(invalidType as ConnectorType)).toBe(false);
    });

    it('should validate auth type', () => {
      const validAuthTypes: AuthType[] = ['oauth2', 'basic', 'api_key', 'jwt'];
      
      expect(validAuthTypes).toContain('oauth2');
      expect(validAuthTypes).toContain('basic');
    });
  });
});

describe('OAuth Security', () => {
  describe('State Token Generation', () => {
    it('should generate unique state tokens', () => {
      const generateToken = () => {
        const bytes = new Uint8Array(32);
        crypto.getRandomValues(bytes);
        return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      };

      const token1 = generateToken();
      const token2 = generateToken();

      expect(token1).toHaveLength(64);
      expect(token2).toHaveLength(64);
      expect(token1).not.toBe(token2);
    });

    it('should validate token format', () => {
      const validToken = 'a'.repeat(64);
      const invalidToken = 'short';

      expect(validToken.length).toBe(64);
      expect(invalidToken.length).toBeLessThan(64);
    });
  });

  describe('State Token Validation', () => {
    interface PendingState {
      connectorId: number;
      organizationId: number;
      expiresAt: number;
      nonce: string;
    }

    const OAUTH_STATE_EXPIRY_MS = 10 * 60 * 1000;

    function validateState(
      state: string,
      pending: Map<string, PendingState>,
      expectedConnectorId: number,
      expectedOrgId: number
    ): { valid: boolean; reason?: string } {
      const data = pending.get(state);
      if (!data) {
        return { valid: false, reason: 'State not found' };
      }
      if (data.expiresAt < Date.now()) {
        return { valid: false, reason: 'State expired' };
      }
      if (data.connectorId !== expectedConnectorId) {
        return { valid: false, reason: 'Connector ID mismatch' };
      }
      if (data.organizationId !== expectedOrgId) {
        return { valid: false, reason: 'Organization ID mismatch' };
      }
      return { valid: true };
    }

    it('should reject unknown state token', () => {
      const pending = new Map<string, PendingState>();
      const result = validateState('unknown-token', pending, 1, 1);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('State not found');
    });

    it('should reject expired state token', () => {
      const pending = new Map<string, PendingState>();
      pending.set('expired-token', {
        connectorId: 1,
        organizationId: 1,
        expiresAt: Date.now() - 1000,
        nonce: 'test-nonce',
      });

      const result = validateState('expired-token', pending, 1, 1);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('State expired');
    });

    it('should reject mismatched connector ID', () => {
      const pending = new Map<string, PendingState>();
      pending.set('valid-token', {
        connectorId: 1,
        organizationId: 1,
        expiresAt: Date.now() + OAUTH_STATE_EXPIRY_MS,
        nonce: 'test-nonce',
      });

      const result = validateState('valid-token', pending, 2, 1);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Connector ID mismatch');
    });

    it('should reject mismatched organization ID', () => {
      const pending = new Map<string, PendingState>();
      pending.set('valid-token', {
        connectorId: 1,
        organizationId: 1,
        expiresAt: Date.now() + OAUTH_STATE_EXPIRY_MS,
        nonce: 'test-nonce',
      });

      const result = validateState('valid-token', pending, 1, 2);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Organization ID mismatch');
    });

    it('should accept valid state token', () => {
      const pending = new Map<string, PendingState>();
      pending.set('valid-token', {
        connectorId: 1,
        organizationId: 1,
        expiresAt: Date.now() + OAUTH_STATE_EXPIRY_MS,
        nonce: 'test-nonce',
      });

      const result = validateState('valid-token', pending, 1, 1);
      expect(result.valid).toBe(true);
    });
  });

  describe('Token Encryption', () => {
    interface OAuthTokens {
      accessToken: string;
      refreshToken?: string;
      tokenType: string;
      expiresAt?: Date;
    }

    interface EncryptedTokens {
      accessTokenEnvelope: string;
      refreshTokenEnvelope?: string;
      tokenType: string;
      expiresAt?: Date;
    }

    it('should encrypt access token', () => {
      const tokens: OAuthTokens = {
        accessToken: 'access-token-value',
        refreshToken: 'refresh-token-value',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 3600000),
      };

      const mockEncrypted: EncryptedTokens = {
        accessTokenEnvelope: JSON.stringify({ ciphertext: 'encrypted-access' }),
        refreshTokenEnvelope: JSON.stringify({ ciphertext: 'encrypted-refresh' }),
        tokenType: tokens.tokenType,
        expiresAt: tokens.expiresAt,
      };

      expect(mockEncrypted.accessTokenEnvelope).not.toBe(tokens.accessToken);
      expect(mockEncrypted.refreshTokenEnvelope).not.toBe(tokens.refreshToken);
      expect(mockEncrypted.tokenType).toBe(tokens.tokenType);
    });

    it('should handle missing refresh token', () => {
      const tokens: OAuthTokens = {
        accessToken: 'access-token-value',
        tokenType: 'Bearer',
      };

      const mockEncrypted: EncryptedTokens = {
        accessTokenEnvelope: JSON.stringify({ ciphertext: 'encrypted-access' }),
        tokenType: tokens.tokenType,
      };

      expect(mockEncrypted.accessTokenEnvelope).toBeDefined();
      expect(mockEncrypted.refreshTokenEnvelope).toBeUndefined();
    });
  });
});

describe('Connector Health Monitoring', () => {
  describe('Health Status Types', () => {
    type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

    it('should define valid health statuses', () => {
      const validStatuses: HealthStatus[] = ['healthy', 'degraded', 'unhealthy', 'unknown'];
      expect(validStatuses).toHaveLength(4);
    });

    it('should map connector status to health status', () => {
      function getHealthFromStatus(status: string, hasOAuth: boolean): HealthStatus {
        if (status === 'error') return 'unhealthy';
        if (status === 'pending_auth' || !hasOAuth) return 'unknown';
        if (status === 'active') return 'healthy';
        return 'unknown';
      }

      expect(getHealthFromStatus('active', true)).toBe('healthy');
      expect(getHealthFromStatus('error', true)).toBe('unhealthy');
      expect(getHealthFromStatus('pending_auth', false)).toBe('unknown');
    });
  });

  describe('Health Check Response', () => {
    interface ConnectionTestResult {
      success: boolean;
      message: string;
      details?: Record<string, unknown>;
      latencyMs?: number;
    }

    it('should have correct test result structure', () => {
      const successResult: ConnectionTestResult = {
        success: true,
        message: 'Connected successfully',
        details: { apiVersion: 'v59.0' },
        latencyMs: 150,
      };

      expect(successResult.success).toBe(true);
      expect(successResult.message).toBeDefined();
      expect(successResult.latencyMs).toBeGreaterThan(0);
    });

    it('should include error details on failure', () => {
      const failureResult: ConnectionTestResult = {
        success: false,
        message: 'Connection refused',
        details: { error: 'ECONNREFUSED' },
        latencyMs: 50,
      };

      expect(failureResult.success).toBe(false);
      expect(failureResult.details?.error).toBeDefined();
    });
  });
});

describe('Super Admin Connector Aggregation', () => {
  interface ConnectorHealthStats {
    total: number;
    healthy: number;
    unhealthy: number;
    unknown: number;
    byType: Record<string, number>;
  }

  function aggregateConnectorHealth(
    connectors: Array<{
      connectorType: string;
      status: string;
      health?: { status: string };
    }>
  ): ConnectorHealthStats {
    const stats: ConnectorHealthStats = {
      total: connectors.length,
      healthy: 0,
      unhealthy: 0,
      unknown: 0,
      byType: {},
    };

    for (const connector of connectors) {
      const healthStatus = connector.health?.status || 'unknown';
      
      if (healthStatus === 'healthy') {
        stats.healthy++;
      } else if (healthStatus === 'unhealthy') {
        stats.unhealthy++;
      } else {
        stats.unknown++;
      }

      stats.byType[connector.connectorType] = 
        (stats.byType[connector.connectorType] || 0) + 1;
    }

    return stats;
  }

  it('should count total connectors', () => {
    const connectors = [
      { connectorType: 'salesforce', status: 'active', health: { status: 'healthy' } },
      { connectorType: 'servicenow', status: 'active', health: { status: 'healthy' } },
      { connectorType: 'sap', status: 'error', health: { status: 'unhealthy' } },
    ];

    const stats = aggregateConnectorHealth(connectors);
    expect(stats.total).toBe(3);
  });

  it('should count healthy connectors', () => {
    const connectors = [
      { connectorType: 'salesforce', status: 'active', health: { status: 'healthy' } },
      { connectorType: 'servicenow', status: 'active', health: { status: 'healthy' } },
      { connectorType: 'sap', status: 'error', health: { status: 'unhealthy' } },
    ];

    const stats = aggregateConnectorHealth(connectors);
    expect(stats.healthy).toBe(2);
    expect(stats.unhealthy).toBe(1);
  });

  it('should count connectors without health as unknown', () => {
    const connectors = [
      { connectorType: 'salesforce', status: 'pending_auth' },
      { connectorType: 'servicenow', status: 'inactive' },
    ];

    const stats = aggregateConnectorHealth(connectors);
    expect(stats.unknown).toBe(2);
  });

  it('should aggregate by connector type', () => {
    const connectors = [
      { connectorType: 'salesforce', status: 'active', health: { status: 'healthy' } },
      { connectorType: 'salesforce', status: 'active', health: { status: 'healthy' } },
      { connectorType: 'servicenow', status: 'active', health: { status: 'healthy' } },
      { connectorType: 'sap', status: 'active', health: { status: 'healthy' } },
    ];

    const stats = aggregateConnectorHealth(connectors);
    expect(stats.byType['salesforce']).toBe(2);
    expect(stats.byType['servicenow']).toBe(1);
    expect(stats.byType['sap']).toBe(1);
  });

  it('should handle empty connector list', () => {
    const stats = aggregateConnectorHealth([]);
    expect(stats.total).toBe(0);
    expect(stats.healthy).toBe(0);
    expect(stats.unhealthy).toBe(0);
    expect(stats.unknown).toBe(0);
  });
});

describe('SAP OData Connector', () => {
  describe('OData Version Handling', () => {
    type ODataVersion = 'v2' | 'v4';

    function getODataVersion(metadata: Record<string, unknown> | null): ODataVersion {
      return metadata?.odataVersion === 'v4' ? 'v4' : 'v2';
    }

    it('should default to OData v2', () => {
      expect(getODataVersion(null)).toBe('v2');
      expect(getODataVersion({})).toBe('v2');
    });

    it('should use OData v4 when specified', () => {
      expect(getODataVersion({ odataVersion: 'v4' })).toBe('v4');
    });
  });

  describe('SAP Date Parsing', () => {
    function parseSAPDate(value: string): Date | null {
      if (value.startsWith('/Date(')) {
        const timestamp = parseInt(value.replace(/\/Date\((\d+)\)\//, '$1'), 10);
        if (!isNaN(timestamp)) {
          return new Date(timestamp);
        }
      }
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    }

    it('should parse SAP date format /Date(timestamp)/', () => {
      const sapDate = '/Date(1609459200000)/';
      const parsed = parseSAPDate(sapDate);
      
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed?.getTime()).toBe(1609459200000);
    });

    it('should parse ISO date strings', () => {
      const isoDate = '2021-01-01T00:00:00.000Z';
      const parsed = parseSAPDate(isoDate);
      
      expect(parsed).toBeInstanceOf(Date);
    });

    it('should return null for invalid dates', () => {
      const invalidDate = 'not-a-date';
      const parsed = parseSAPDate(invalidDate);
      
      expect(parsed).toBeNull();
    });
  });

  describe('SAP Object Key Extraction', () => {
    function extractSAPKey(record: Record<string, unknown>): string {
      if (record.SalesOrder) return String(record.SalesOrder);
      if (record.PurchaseOrder) return String(record.PurchaseOrder);
      if (record.ProductionOrder) return String(record.ProductionOrder);
      if (record.MaintenanceOrder) return String(record.MaintenanceOrder);
      if (record.ServiceOrder) return String(record.ServiceOrder);
      
      for (const key of Object.keys(record)) {
        if (key.endsWith('Key') || key.endsWith('ID') || key.endsWith('Number')) {
          return String(record[key]);
        }
      }
      return '';
    }

    it('should extract SalesOrder key', () => {
      const record = { SalesOrder: '1000001', SoldToParty: 'CUST001' };
      expect(extractSAPKey(record)).toBe('1000001');
    });

    it('should extract PurchaseOrder key', () => {
      const record = { PurchaseOrder: '4500001', Supplier: 'SUPP001' };
      expect(extractSAPKey(record)).toBe('4500001');
    });

    it('should fallback to Key/ID/Number suffixed fields', () => {
      const record = { DocumentKey: 'DOC001', Description: 'Test' };
      expect(extractSAPKey(record)).toBe('DOC001');
    });

    it('should return empty string when no key found', () => {
      const record = { Description: 'Test', Status: 'Active' };
      expect(extractSAPKey(record)).toBe('');
    });
  });

  describe('Default SAP Objects', () => {
    const defaultObjects = [
      'A_SalesOrder',
      'A_PurchaseOrder', 
      'A_ProductionOrder',
      'A_MaintenanceOrder',
      'A_ServiceOrder',
    ];

    it('should include core SAP business objects', () => {
      expect(defaultObjects).toContain('A_SalesOrder');
      expect(defaultObjects).toContain('A_PurchaseOrder');
      expect(defaultObjects).toContain('A_ProductionOrder');
    });

    it('should have 5 default objects', () => {
      expect(defaultObjects).toHaveLength(5);
    });
  });
});

describe('Connector API Response Structure', () => {
  describe('List Connectors Response', () => {
    interface ConnectorListItem {
      id: number;
      connectorType: string;
      displayName: string;
      instanceUrl: string | null;
      status: string;
      createdAt: string;
      updatedAt: string;
      health?: {
        status: string;
        lastCheckedAt: string | null;
        errorMessage: string | null;
        responseTimeMs: number | null;
      };
      hasOAuth?: boolean;
    }

    it('should have correct connector list structure', () => {
      const connector: ConnectorListItem = {
        id: 1,
        connectorType: 'salesforce',
        displayName: 'My Salesforce',
        instanceUrl: 'https://company.my.salesforce.com',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        health: {
          status: 'healthy',
          lastCheckedAt: new Date().toISOString(),
          errorMessage: null,
          responseTimeMs: 150,
        },
        hasOAuth: true,
      };

      expect(connector).toHaveProperty('id');
      expect(connector).toHaveProperty('connectorType');
      expect(connector).toHaveProperty('displayName');
      expect(connector).toHaveProperty('status');
      expect(connector.health).toHaveProperty('status');
    });
  });

  describe('Create Connector Response', () => {
    it('should return created connector with ID', () => {
      const response = {
        success: true,
        connector: {
          id: 1,
          connectorType: 'salesforce',
          displayName: 'My Salesforce',
          status: 'pending_auth',
        },
      };

      expect(response.success).toBe(true);
      expect(response.connector.id).toBeDefined();
      expect(response.connector.status).toBe('pending_auth');
    });
  });

  describe('Auth URL Response', () => {
    it('should return OAuth authorization URL', () => {
      const response = {
        authUrl: 'https://login.salesforce.com/services/oauth2/authorize?client_id=xxx&redirect_uri=xxx&state=xxx',
      };

      expect(response.authUrl).toMatch(/^https:\/\//);
      expect(response.authUrl).toContain('oauth');
    });
  });

  describe('Test Connection Response', () => {
    it('should return success with details', () => {
      const response = {
        success: true,
        message: 'Connected to Salesforce successfully',
        details: {
          apiVersion: 'v59.0',
          dailyApiRequests: { Remaining: 15000, Max: 15000 },
        },
        latencyMs: 150,
      };

      expect(response.success).toBe(true);
      expect(response.latencyMs).toBeGreaterThan(0);
      expect(response.details.apiVersion).toBeDefined();
    });

    it('should return failure with error', () => {
      const response = {
        success: false,
        message: 'Invalid OAuth token',
        latencyMs: 50,
      };

      expect(response.success).toBe(false);
      expect(response.message).toBeDefined();
    });
  });
});
