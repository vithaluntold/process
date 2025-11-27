import type { BaseConnector, ConnectorType, ConnectorMetadata } from './types';
import { SalesforceConnector } from './salesforce';
import { ServiceNowConnector } from './servicenow';
import { SAPODataConnector } from './sap';

class ConnectorRegistry {
  private connectors: Map<ConnectorType, BaseConnector> = new Map();

  constructor() {
    this.register(new SalesforceConnector());
    this.register(new ServiceNowConnector());
    this.register(new SAPODataConnector());
  }

  register(connector: BaseConnector): void {
    this.connectors.set(connector.metadata.id, connector);
  }

  get(type: ConnectorType): BaseConnector | undefined {
    return this.connectors.get(type);
  }

  getAll(): BaseConnector[] {
    return Array.from(this.connectors.values());
  }

  getAllMetadata(): ConnectorMetadata[] {
    return this.getAll().map((c) => c.metadata);
  }

  has(type: ConnectorType): boolean {
    return this.connectors.has(type);
  }

  getAvailableTypes(): ConnectorType[] {
    return Array.from(this.connectors.keys());
  }
}

export const connectorRegistry = new ConnectorRegistry();

export function getConnector(type: ConnectorType): BaseConnector {
  const connector = connectorRegistry.get(type);
  if (!connector) {
    throw new Error(`Connector type "${type}" is not registered`);
  }
  return connector;
}

export function getAvailableConnectors(): ConnectorMetadata[] {
  return connectorRegistry.getAllMetadata();
}
