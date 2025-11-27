import pino from 'pino';
import type { DestinationStream } from 'pino';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  userId?: number;
  organizationId?: number;
  requestId?: string;
  traceId?: string;
  spanId?: string;
  [key: string]: unknown;
}

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

export const pinoConfig: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  formatters: {
    level: (label) => ({ level: label }),
    bindings: (bindings) => ({
      pid: bindings.pid,
      hostname: bindings.hostname,
      service: 'epi-q',
      environment: process.env.NODE_ENV || 'development',
    }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'password',
      'token',
      'apiKey',
      'secret',
      'authorization',
      'cookie',
      'creditCard',
      '*.password',
      '*.token',
      '*.apiKey',
      '*.secret',
    ],
    censor: '[REDACTED]',
  },
};

const transport = isTest 
  ? undefined 
  : !isProduction 
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined;

const baseLogger = transport 
  ? pino(pinoConfig, pino.transport(transport))
  : pino(pinoConfig);

export class Logger {
  private context: LogContext;
  private logger: pino.Logger;

  constructor(context: LogContext = {}, preConfiguredLogger?: pino.Logger) {
    this.context = context;
    if (preConfiguredLogger) {
      this.logger = preConfiguredLogger;
    } else {
      this.logger = baseLogger.child(context);
    }
  }

  static createWithDestination(destination: DestinationStream, context: LogContext = {}): Logger {
    const customPino = pino(pinoConfig, destination);
    const boundLogger = customPino.child(context);
    return new Logger(context, boundLogger);
  }

  child(additionalContext: LogContext): Logger {
    const newContext = { ...this.context, ...additionalContext };
    const childPinoLogger = this.logger.child(additionalContext);
    return new Logger(newContext, childPinoLogger);
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.logger.debug(data, message);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.logger.info(data, message);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.logger.warn(data, message);
  }

  error(message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
    const errorData = error instanceof Error 
      ? { 
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
          ...data,
        }
      : { error, ...data };
    this.logger.error(errorData, message);
  }

  fatal(message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
    const errorData = error instanceof Error 
      ? { 
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
          ...data,
        }
      : { error, ...data };
    this.logger.fatal(errorData, message);
  }

  httpRequest(req: {
    method: string;
    url: string;
    statusCode: number;
    duration: number;
    userAgent?: string;
    ip?: string;
  }): void {
    this.logger.info({
      http: {
        method: req.method,
        url: req.url,
        statusCode: req.statusCode,
        duration: req.duration,
        userAgent: req.userAgent,
        ip: req.ip,
      },
    }, `${req.method} ${req.url} ${req.statusCode} ${req.duration}ms`);
  }

  dbQuery(query: {
    operation: string;
    table: string;
    duration: number;
    rowCount?: number;
  }): void {
    this.logger.debug({
      db: {
        operation: query.operation,
        table: query.table,
        duration: query.duration,
        rowCount: query.rowCount,
      },
    }, `DB ${query.operation} on ${query.table} took ${query.duration}ms`);
  }

  securityEvent(event: {
    type: 'auth_success' | 'auth_failure' | 'access_denied' | 'suspicious_activity' | 'rate_limit' | 'token_refresh';
    userId?: number;
    ip?: string;
    userAgent?: string;
    details?: Record<string, unknown>;
  }): void {
    const level = ['auth_failure', 'access_denied', 'suspicious_activity'].includes(event.type) 
      ? 'warn' 
      : 'info';
    
    this.logger[level]({
      security: {
        type: event.type,
        userId: event.userId,
        ip: event.ip,
        userAgent: event.userAgent,
        ...event.details,
      },
    }, `Security event: ${event.type}`);
  }

  mlOperation(operation: {
    algorithm: string;
    dataPoints: number;
    duration: number;
    success: boolean;
    error?: string;
  }): void {
    const level = operation.success ? 'info' : 'error';
    this.logger[level]({
      ml: {
        algorithm: operation.algorithm,
        dataPoints: operation.dataPoints,
        duration: operation.duration,
        success: operation.success,
        error: operation.error,
      },
    }, `ML ${operation.algorithm} ${operation.success ? 'completed' : 'failed'} in ${operation.duration}ms`);
  }

  auditLog(audit: {
    action: string;
    resourceType: string;
    resourceId?: string;
    userId?: number;
    organizationId?: number;
    changes?: Record<string, unknown>;
  }): void {
    this.logger.info({
      audit: {
        action: audit.action,
        resourceType: audit.resourceType,
        resourceId: audit.resourceId,
        userId: audit.userId,
        organizationId: audit.organizationId,
        changes: audit.changes,
      },
    }, `Audit: ${audit.action} on ${audit.resourceType}`);
  }
}

export const logger = new Logger();

export function createRequestLogger(requestId: string, userId?: number, organizationId?: number): Logger {
  return new Logger({ requestId, userId, organizationId });
}

export function createServiceLogger(serviceName: string): Logger {
  return new Logger({ service: serviceName });
}

export default logger;
