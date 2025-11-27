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

type StreamingProvider = 'kafka' | 'eventhub' | 'kinesis' | 'pubsub';

export class StreamingConnector extends AbstractConnector {
  readonly metadata: ConnectorMetadata = {
    id: 'streaming',
    name: 'Real-time Streaming',
    description: 'Connect to streaming platforms (Kafka, Azure Event Hub, AWS Kinesis, Google Pub/Sub)',
    icon: 'activity',
    authTypes: ['api_key', 'oauth2', 'basic'],
    requiredScopes: [],
    defaultObjects: [
      'kafka_topic',
      'eventhub_namespace',
      'kinesis_stream',
      'pubsub_subscription',
    ],
    documentationUrl: 'https://kafka.apache.org/documentation/',
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

  private getProvider(config: ConnectorConfiguration): StreamingProvider {
    const metadata = this.getMetadata(config);
    return (metadata.provider as StreamingProvider) || 'kafka';
  }

  private getKafkaConfig(config: ConnectorConfiguration): {
    bootstrapServers: string;
    securityProtocol: string;
    saslMechanism: string;
  } {
    const metadata = this.getMetadata(config);
    return {
      bootstrapServers: (metadata.bootstrapServers as string) || config.instanceUrl || '',
      securityProtocol: (metadata.securityProtocol as string) || 'SASL_SSL',
      saslMechanism: (metadata.saslMechanism as string) || 'PLAIN',
    };
  }

  private getEventHubConfig(config: ConnectorConfiguration): {
    namespace: string;
    eventHubName: string;
  } {
    const metadata = this.getMetadata(config);
    return {
      namespace: (metadata.namespace as string) || '',
      eventHubName: (metadata.eventHubName as string) || '',
    };
  }

  private getKinesisConfig(config: ConnectorConfiguration): {
    region: string;
    streamName: string;
  } {
    const metadata = this.getMetadata(config);
    return {
      region: (metadata.region as string) || 'us-east-1',
      streamName: (metadata.streamName as string) || '',
    };
  }

  private getPubSubConfig(config: ConnectorConfiguration): {
    projectId: string;
    subscriptionId: string;
  } {
    const metadata = this.getMetadata(config);
    return {
      projectId: (metadata.projectId as string) || '',
      subscriptionId: (metadata.subscriptionId as string) || '',
    };
  }

  async authorize(
    config: ConnectorConfiguration,
    context: ConnectorContext
  ): Promise<OAuthTokens> {
    const credentials = this.parseCredentials(config);
    const provider = this.getProvider(config);
    
    switch (provider) {
      case 'kafka': {
        const kafkaConfig = this.getKafkaConfig(config);
        return {
          accessToken: credentials.apiKey || '',
          tokenType: 'SASL',
          instanceUrl: kafkaConfig.bootstrapServers,
          metadata: {
            provider: 'kafka',
            username: credentials.username,
            securityProtocol: kafkaConfig.securityProtocol,
            saslMechanism: kafkaConfig.saslMechanism,
          },
        };
      }
      
      case 'eventhub': {
        const ehConfig = this.getEventHubConfig(config);
        const connectionString = credentials.apiKey || '';
        return {
          accessToken: connectionString,
          tokenType: 'SharedAccessSignature',
          instanceUrl: `${ehConfig.namespace}.servicebus.windows.net`,
          metadata: {
            provider: 'eventhub',
            namespace: ehConfig.namespace,
            eventHubName: ehConfig.eventHubName,
          },
        };
      }
      
      case 'kinesis': {
        const kinesisConfig = this.getKinesisConfig(config);
        return {
          accessToken: credentials.apiKey || '',
          tokenType: 'AWS4-HMAC-SHA256',
          instanceUrl: `kinesis.${kinesisConfig.region}.amazonaws.com`,
          metadata: {
            provider: 'kinesis',
            region: kinesisConfig.region,
            streamName: kinesisConfig.streamName,
            accessKeyId: credentials.username,
            secretAccessKey: credentials.password,
          },
        };
      }
      
      case 'pubsub': {
        const pubsubConfig = this.getPubSubConfig(config);
        return {
          accessToken: credentials.apiKey || '',
          tokenType: 'Bearer',
          instanceUrl: `https://pubsub.googleapis.com`,
          metadata: {
            provider: 'pubsub',
            projectId: pubsubConfig.projectId,
            subscriptionId: pubsubConfig.subscriptionId,
          },
        };
      }
      
      default:
        throw new Error(`Unsupported streaming provider: ${provider}`);
    }
  }

  async refreshToken(
    tokens: OAuthTokens,
    config: ConnectorConfiguration,
    context: ConnectorContext
  ): Promise<OAuthTokens> {
    return tokens;
  }

  async testConnection(
    config: ConnectorConfiguration,
    tokens: OAuthTokens,
    context: ConnectorContext
  ): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    const provider = (tokens.metadata?.provider as StreamingProvider) || this.getProvider(config);
    
    try {
      switch (provider) {
        case 'kafka':
          return await this.testKafkaConnection(config, tokens, startTime);
        case 'eventhub':
          return await this.testEventHubConnection(config, tokens, startTime);
        case 'kinesis':
          return await this.testKinesisConnection(config, tokens, startTime);
        case 'pubsub':
          return await this.testPubSubConnection(config, tokens, startTime);
        default:
          return {
            success: false,
            message: `Unsupported provider: ${provider}`,
            latencyMs: Date.now() - startTime,
          };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        latencyMs: Date.now() - startTime,
      };
    }
  }

  private async testKafkaConnection(
    config: ConnectorConfiguration,
    tokens: OAuthTokens,
    startTime: number
  ): Promise<ConnectionTestResult> {
    const kafkaConfig = this.getKafkaConfig(config);
    const credentials = this.parseCredentials(config);
    
    if (!kafkaConfig.bootstrapServers) {
      return {
        success: false,
        message: 'Bootstrap servers not configured',
        latencyMs: Date.now() - startTime,
      };
    }
    
    if (kafkaConfig.securityProtocol.includes('SASL') && !credentials.username) {
      return {
        success: false,
        message: 'SASL authentication requires username',
        latencyMs: Date.now() - startTime,
      };
    }
    
    const servers = kafkaConfig.bootstrapServers.split(',');
    const validationResults: { server: string; reachable: boolean }[] = [];
    
    for (const server of servers.slice(0, 3)) {
      const [host, port] = server.trim().split(':');
      if (host && port) {
        const portNum = parseInt(port, 10);
        if (portNum > 0 && portNum <= 65535) {
          validationResults.push({ server: server.trim(), reachable: true });
        } else {
          validationResults.push({ server: server.trim(), reachable: false });
        }
      }
    }
    
    const reachableServers = validationResults.filter(r => r.reachable);
    
    if (reachableServers.length === 0) {
      return {
        success: false,
        message: 'No valid bootstrap servers configured',
        details: { validationResults },
        latencyMs: Date.now() - startTime,
      };
    }
    
    return {
      success: true,
      message: `Kafka configuration validated (${reachableServers.length} server(s))`,
      details: {
        provider: 'kafka',
        bootstrapServers: kafkaConfig.bootstrapServers,
        securityProtocol: kafkaConfig.securityProtocol,
        saslMechanism: kafkaConfig.saslMechanism,
        validServers: reachableServers.length,
        totalServers: servers.length,
        note: 'TCP connectivity test requires native Kafka client',
      },
      latencyMs: Date.now() - startTime,
    };
  }

  private async testEventHubConnection(
    config: ConnectorConfiguration,
    tokens: OAuthTokens,
    startTime: number
  ): Promise<ConnectionTestResult> {
    const ehConfig = this.getEventHubConfig(config);
    
    try {
      const response = await fetch(
        `https://${ehConfig.namespace}.servicebus.windows.net/${ehConfig.eventHubName}?api-version=2014-01`,
        {
          method: 'GET',
          headers: {
            Authorization: tokens.accessToken,
          },
        }
      );
      
      const latencyMs = Date.now() - startTime;
      
      if (response.status === 401) {
        return {
          success: false,
          message: 'Authentication failed - check connection string',
          latencyMs,
        };
      }
      
      return {
        success: true,
        message: 'Connected to Azure Event Hub successfully',
        details: {
          provider: 'eventhub',
          namespace: ehConfig.namespace,
          eventHub: ehConfig.eventHubName,
        },
        latencyMs,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
        latencyMs: Date.now() - startTime,
      };
    }
  }

  private async testKinesisConnection(
    config: ConnectorConfiguration,
    tokens: OAuthTokens,
    startTime: number
  ): Promise<ConnectionTestResult> {
    const kinesisConfig = this.getKinesisConfig(config);
    const credentials = this.parseCredentials(config);
    
    if (!kinesisConfig.streamName) {
      return {
        success: false,
        message: 'Stream name is required',
        latencyMs: Date.now() - startTime,
      };
    }
    
    if (!kinesisConfig.region) {
      return {
        success: false,
        message: 'AWS region is required',
        latencyMs: Date.now() - startTime,
      };
    }
    
    const validRegions = [
      'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
      'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1', 'eu-north-1',
      'ap-northeast-1', 'ap-northeast-2', 'ap-northeast-3',
      'ap-southeast-1', 'ap-southeast-2', 'ap-south-1',
      'sa-east-1', 'ca-central-1',
    ];
    
    if (!validRegions.includes(kinesisConfig.region)) {
      return {
        success: false,
        message: `Invalid AWS region: ${kinesisConfig.region}`,
        details: { validRegions: validRegions.slice(0, 5).join(', ') + '...' },
        latencyMs: Date.now() - startTime,
      };
    }
    
    if (!credentials.username || !credentials.password) {
      return {
        success: false,
        message: 'AWS access key ID and secret access key are required',
        latencyMs: Date.now() - startTime,
      };
    }
    
    return {
      success: true,
      message: `Kinesis configuration validated for ${kinesisConfig.region}`,
      details: {
        provider: 'kinesis',
        region: kinesisConfig.region,
        streamName: kinesisConfig.streamName,
        endpoint: `kinesis.${kinesisConfig.region}.amazonaws.com`,
        note: 'Full stream validation requires AWS SDK',
      },
      latencyMs: Date.now() - startTime,
    };
  }

  private async testPubSubConnection(
    config: ConnectorConfiguration,
    tokens: OAuthTokens,
    startTime: number
  ): Promise<ConnectionTestResult> {
    const pubsubConfig = this.getPubSubConfig(config);
    
    try {
      const response = await fetch(
        `https://pubsub.googleapis.com/v1/projects/${pubsubConfig.projectId}/subscriptions/${pubsubConfig.subscriptionId}`,
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        }
      );
      
      const latencyMs = Date.now() - startTime;
      
      if (!response.ok) {
        return {
          success: false,
          message: `Connection failed: ${response.status}`,
          latencyMs,
        };
      }
      
      return {
        success: true,
        message: 'Connected to Google Pub/Sub successfully',
        details: {
          provider: 'pubsub',
          projectId: pubsubConfig.projectId,
          subscriptionId: pubsubConfig.subscriptionId,
        },
        latencyMs,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
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
    const provider = (tokens.metadata?.provider as StreamingProvider) || this.getProvider(config);
    
    switch (provider) {
      case 'eventhub':
        return await this.fetchEventHubBatch(config, mapping, tokens, cursor, context);
      case 'pubsub':
        return await this.fetchPubSubBatch(config, mapping, tokens, cursor, context);
      default:
        context.logger.warn(`Streaming fetch for ${provider} requires native client library`, {
          provider,
        });
        return {
          events: [],
          hasMore: false,
        };
    }
  }

  private async fetchEventHubBatch(
    config: ConnectorConfiguration,
    mapping: ConnectorMapping,
    tokens: OAuthTokens,
    cursor: string | undefined,
    context: ConnectorContext
  ): Promise<FetchResult> {
    context.logger.info('Event Hub batch fetch - requires native SDK for full implementation', {
      namespace: tokens.metadata?.namespace,
      eventHub: tokens.metadata?.eventHubName,
    });
    
    return {
      events: [],
      hasMore: false,
    };
  }

  private async fetchPubSubBatch(
    config: ConnectorConfiguration,
    mapping: ConnectorMapping,
    tokens: OAuthTokens,
    cursor: string | undefined,
    context: ConnectorContext
  ): Promise<FetchResult> {
    const pubsubConfig = this.getPubSubConfig(config);
    const batchSize = mapping.batchSize || 100;
    
    try {
      const response = await fetch(
        `https://pubsub.googleapis.com/v1/projects/${pubsubConfig.projectId}/subscriptions/${pubsubConfig.subscriptionId}:pull`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            maxMessages: batchSize,
            returnImmediately: true,
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`Pull failed: ${response.status}`);
      }
      
      const data = await response.json();
      const messages = data.receivedMessages || [];
      
      const events = messages.map((msg: { message: { data: string; messageId: string; publishTime: string }; ackId: string }) => {
        let payload: Record<string, unknown> = {};
        try {
          payload = JSON.parse(Buffer.from(msg.message.data, 'base64').toString('utf-8'));
        } catch {
          payload = { rawData: msg.message.data };
        }
        
        return this.transformRecord({
          Id: msg.message.messageId,
          ...payload,
          _publishTime: msg.message.publishTime,
          _ackId: msg.ackId,
        }, mapping);
      });
      
      return {
        events,
        hasMore: messages.length === batchSize,
        nextCursor: undefined,
      };
    } catch (error) {
      context.logger.error('Pub/Sub fetch failed', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      return {
        events: [],
        hasMore: false,
      };
    }
  }

  async getAvailableObjects(
    config: ConnectorConfiguration,
    tokens: OAuthTokens,
    context: ConnectorContext
  ): Promise<{ name: string; label: string; fields: { name: string; type: string; label: string }[] }[]> {
    const provider = (tokens.metadata?.provider as StreamingProvider) || this.getProvider(config);
    
    switch (provider) {
      case 'kafka':
        return [
          { name: 'kafka_topic', label: 'Kafka Topic', fields: [] },
          { name: 'kafka_consumer_group', label: 'Consumer Group', fields: [] },
        ];
      case 'eventhub':
        return [
          { name: 'eventhub_events', label: 'Event Hub Events', fields: [] },
          { name: 'eventhub_partitions', label: 'Partitions', fields: [] },
        ];
      case 'kinesis':
        return [
          { name: 'kinesis_stream', label: 'Kinesis Stream', fields: [] },
          { name: 'kinesis_shard', label: 'Shard', fields: [] },
        ];
      case 'pubsub':
        return [
          { name: 'pubsub_messages', label: 'Pub/Sub Messages', fields: [] },
          { name: 'pubsub_topic', label: 'Topic', fields: [] },
        ];
      default:
        return [];
    }
  }

  async getFieldsForObject(
    config: ConnectorConfiguration,
    tokens: OAuthTokens,
    objectName: string,
    context: ConnectorContext
  ): Promise<{ name: string; type: string; label: string }[]> {
    return [
      { name: 'messageId', type: 'string', label: 'Message ID' },
      { name: 'timestamp', type: 'datetime', label: 'Timestamp' },
      { name: 'partition', type: 'number', label: 'Partition' },
      { name: 'offset', type: 'number', label: 'Offset' },
      { name: 'key', type: 'string', label: 'Key' },
      { name: 'value', type: 'string', label: 'Value' },
      { name: 'headers', type: 'object', label: 'Headers' },
    ];
  }
}

export const streamingConnector = new StreamingConnector();
