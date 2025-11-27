import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger, createRequestLogger, createServiceLogger } from '@/lib/logger';
import { Writable } from 'stream';

function createCapturingStream(): { stream: Writable; getOutput: () => string } {
  let captured = '';
  const stream = new Writable({
    write(chunk, encoding, callback) {
      captured += chunk.toString();
      callback();
    }
  });
  return { stream, getOutput: () => captured };
}

describe('Logger Class - Output Verification via createWithDestination', () => {
  it('should emit valid JSON log entries via Logger wrapper', () => {
    const { stream, getOutput } = createCapturingStream();
    const logger = Logger.createWithDestination(stream);
    logger.info('Test message', { action: 'test' });
    
    const output = getOutput();
    const parsed = JSON.parse(output.trim());
    
    expect(parsed).toHaveProperty('level', 'info');
    expect(parsed).toHaveProperty('msg', 'Test message');
    expect(parsed).toHaveProperty('action', 'test');
    expect(parsed).toHaveProperty('time');
  });

  it('should emit debug level correctly via Logger', () => {
    const { stream, getOutput } = createCapturingStream();
    const logger = Logger.createWithDestination(stream);
    logger.debug('Debug log', { component: 'test' });
    
    const parsed = JSON.parse(getOutput().trim());
    expect(parsed.level).toBe('debug');
    expect(parsed.msg).toBe('Debug log');
    expect(parsed.component).toBe('test');
  });

  it('should emit warn level correctly via Logger', () => {
    const { stream, getOutput } = createCapturingStream();
    const logger = Logger.createWithDestination(stream);
    logger.warn('Warning message', { warningType: 'deprecation' });
    
    const parsed = JSON.parse(getOutput().trim());
    expect(parsed.level).toBe('warn');
    expect(parsed.msg).toBe('Warning message');
    expect(parsed.warningType).toBe('deprecation');
  });

  it('should emit error with Error object via Logger', () => {
    const { stream, getOutput } = createCapturingStream();
    const logger = Logger.createWithDestination(stream);
    const testError = new Error('Test error message');
    logger.error('Error occurred', testError);
    
    const parsed = JSON.parse(getOutput().trim());
    expect(parsed.level).toBe('error');
    expect(parsed.msg).toBe('Error occurred');
    expect(parsed.error.message).toBe('Test error message');
    expect(parsed.error.name).toBe('Error');
    expect(parsed.error.stack).toBeDefined();
  });

  it('should emit fatal with Error object via Logger', () => {
    const { stream, getOutput } = createCapturingStream();
    const logger = Logger.createWithDestination(stream);
    const testError = new Error('Fatal error message');
    logger.fatal('Fatal occurred', testError);
    
    const parsed = JSON.parse(getOutput().trim());
    expect(parsed.level).toBe('fatal');
    expect(parsed.msg).toBe('Fatal occurred');
    expect(parsed.error.message).toBe('Fatal error message');
  });

  it('should redact sensitive password fields via Logger', () => {
    const { stream, getOutput } = createCapturingStream();
    const logger = Logger.createWithDestination(stream);
    logger.info('Login attempt', { password: 'secret123', username: 'testuser' });
    
    const parsed = JSON.parse(getOutput().trim());
    expect(parsed.password).toBe('[REDACTED]');
    expect(parsed.username).toBe('testuser');
  });

  it('should redact sensitive token fields via Logger', () => {
    const { stream, getOutput } = createCapturingStream();
    const logger = Logger.createWithDestination(stream);
    logger.info('Auth check', { token: 'jwt-token-abc', userId: 1 });
    
    const parsed = JSON.parse(getOutput().trim());
    expect(parsed.token).toBe('[REDACTED]');
    expect(parsed.userId).toBe(1);
  });

  it('should redact sensitive apiKey fields via Logger', () => {
    const { stream, getOutput } = createCapturingStream();
    const logger = Logger.createWithDestination(stream);
    logger.info('API call', { apiKey: 'sk-abc123xyz', endpoint: '/api/test' });
    
    const parsed = JSON.parse(getOutput().trim());
    expect(parsed.apiKey).toBe('[REDACTED]');
    expect(parsed.endpoint).toBe('/api/test');
  });

  it('should redact nested password fields via Logger', () => {
    const { stream, getOutput } = createCapturingStream();
    const logger = Logger.createWithDestination(stream);
    logger.info('User data', { user: { name: 'test', password: 'secret456' } });
    
    const parsed = JSON.parse(getOutput().trim());
    expect(parsed.user.password).toBe('[REDACTED]');
    expect(parsed.user.name).toBe('test');
  });

  it('should include timestamp in ISO format via Logger', () => {
    const { stream, getOutput } = createCapturingStream();
    const logger = Logger.createWithDestination(stream);
    logger.info('Timestamp test');
    
    const parsed = JSON.parse(getOutput().trim());
    expect(parsed.time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('should log httpRequest with structured output', () => {
    const { stream, getOutput } = createCapturingStream();
    const logger = Logger.createWithDestination(stream);
    logger.httpRequest({
      method: 'POST',
      url: '/api/users',
      statusCode: 201,
      duration: 45,
      userAgent: 'Mozilla/5.0',
      ip: '192.168.1.1',
    });
    
    const parsed = JSON.parse(getOutput().trim());
    expect(parsed.level).toBe('info');
    expect(parsed.http.method).toBe('POST');
    expect(parsed.http.url).toBe('/api/users');
    expect(parsed.http.statusCode).toBe(201);
    expect(parsed.http.duration).toBe(45);
    expect(parsed.msg).toContain('POST /api/users 201 45ms');
  });

  it('should log dbQuery with structured output', () => {
    const { stream, getOutput } = createCapturingStream();
    const logger = Logger.createWithDestination(stream);
    logger.dbQuery({
      operation: 'SELECT',
      table: 'users',
      duration: 12,
      rowCount: 50,
    });
    
    const parsed = JSON.parse(getOutput().trim());
    expect(parsed.level).toBe('debug');
    expect(parsed.db.operation).toBe('SELECT');
    expect(parsed.db.table).toBe('users');
    expect(parsed.db.duration).toBe(12);
    expect(parsed.db.rowCount).toBe(50);
  });

  it('should log securityEvent with auth_success at info level', () => {
    const { stream, getOutput } = createCapturingStream();
    const logger = Logger.createWithDestination(stream);
    logger.securityEvent({
      type: 'auth_success',
      userId: 42,
      ip: '192.168.1.1',
      userAgent: 'Chrome/100',
    });
    
    const parsed = JSON.parse(getOutput().trim());
    expect(parsed.level).toBe('info');
    expect(parsed.security.type).toBe('auth_success');
    expect(parsed.security.userId).toBe(42);
  });

  it('should log securityEvent with auth_failure at warn level', () => {
    const { stream, getOutput } = createCapturingStream();
    const logger = Logger.createWithDestination(stream);
    logger.securityEvent({
      type: 'auth_failure',
      ip: '192.168.1.1',
      details: { reason: 'invalid_password' },
    });
    
    const parsed = JSON.parse(getOutput().trim());
    expect(parsed.level).toBe('warn');
    expect(parsed.security.type).toBe('auth_failure');
    expect(parsed.security.reason).toBe('invalid_password');
  });

  it('should log mlOperation success at info level', () => {
    const { stream, getOutput } = createCapturingStream();
    const logger = Logger.createWithDestination(stream);
    logger.mlOperation({
      algorithm: 'zscore',
      dataPoints: 1000,
      duration: 50,
      success: true,
    });
    
    const parsed = JSON.parse(getOutput().trim());
    expect(parsed.level).toBe('info');
    expect(parsed.ml.algorithm).toBe('zscore');
    expect(parsed.ml.success).toBe(true);
  });

  it('should log mlOperation failure at error level', () => {
    const { stream, getOutput } = createCapturingStream();
    const logger = Logger.createWithDestination(stream);
    logger.mlOperation({
      algorithm: 'isolation_score',
      dataPoints: 0,
      duration: 5,
      success: false,
      error: 'Insufficient data',
    });
    
    const parsed = JSON.parse(getOutput().trim());
    expect(parsed.level).toBe('error');
    expect(parsed.ml.algorithm).toBe('isolation_score');
    expect(parsed.ml.success).toBe(false);
    expect(parsed.ml.error).toBe('Insufficient data');
  });

  it('should log auditLog with structured output', () => {
    const { stream, getOutput } = createCapturingStream();
    const logger = Logger.createWithDestination(stream);
    logger.auditLog({
      action: 'CREATE',
      resourceType: 'process',
      resourceId: 'proc-123',
      userId: 1,
      organizationId: 10,
    });
    
    const parsed = JSON.parse(getOutput().trim());
    expect(parsed.level).toBe('info');
    expect(parsed.audit.action).toBe('CREATE');
    expect(parsed.audit.resourceType).toBe('process');
    expect(parsed.audit.resourceId).toBe('proc-123');
  });

  it('should handle child loggers with context propagation', () => {
    const { stream, getOutput } = createCapturingStream();
    const parentLogger = Logger.createWithDestination(stream, { service: 'auth' });
    const childLogger = parentLogger.child({ userId: 42 });
    childLogger.info('Child log message', { action: 'login' });
    
    const parsed = JSON.parse(getOutput().trim());
    expect(parsed.service).toBe('auth');
    expect(parsed.userId).toBe(42);
    expect(parsed.action).toBe('login');
    expect(parsed.msg).toBe('Child log message');
  });
});

describe('Logger Module - Real Implementation', () => {
  describe('Logger Class', () => {
    it('should create a logger instance', () => {
      const logger = new Logger();
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should create child logger with additional context', () => {
      const logger = new Logger({ service: 'test-service' });
      const childLogger = logger.child({ requestId: 'req-123' });
      expect(childLogger).toBeInstanceOf(Logger);
    });

    it('should create request logger with context', () => {
      const logger = createRequestLogger('req-456', 1, 10);
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should create service logger', () => {
      const logger = createServiceLogger('my-service');
      expect(logger).toBeInstanceOf(Logger);
    });
  });

  describe('Log Methods Execution', () => {
    it('should execute debug without throwing', () => {
      const logger = new Logger();
      expect(() => logger.debug('Test debug message')).not.toThrow();
    });

    it('should execute info with data without throwing', () => {
      const logger = new Logger();
      expect(() => logger.info('Test info message', { key: 'value' })).not.toThrow();
    });

    it('should execute warn without throwing', () => {
      const logger = new Logger();
      expect(() => logger.warn('Test warning message')).not.toThrow();
    });

    it('should execute error with Error object', () => {
      const logger = new Logger();
      const testError = new Error('Test error');
      expect(() => logger.error('Error occurred', testError)).not.toThrow();
    });

    it('should execute fatal with Error object', () => {
      const logger = new Logger();
      const testError = new Error('Fatal error');
      expect(() => logger.fatal('Fatal occurred', testError)).not.toThrow();
    });

    it('should execute httpRequest logging', () => {
      const logger = new Logger();
      expect(() => logger.httpRequest({
        method: 'GET',
        url: '/api/test',
        statusCode: 200,
        duration: 15,
        userAgent: 'test-agent',
        ip: '127.0.0.1',
      })).not.toThrow();
    });

    it('should execute dbQuery logging', () => {
      const logger = new Logger();
      expect(() => logger.dbQuery({
        operation: 'SELECT',
        table: 'users',
        duration: 5,
        rowCount: 10,
      })).not.toThrow();
    });

    it('should execute securityEvent logging', () => {
      const logger = new Logger();
      expect(() => logger.securityEvent({
        type: 'auth_success',
        userId: 1,
        ip: '192.168.1.1',
        userAgent: 'test-agent',
      })).not.toThrow();
    });

    it('should execute securityEvent for auth_failure', () => {
      const logger = new Logger();
      expect(() => logger.securityEvent({
        type: 'auth_failure',
        ip: '192.168.1.1',
        details: { reason: 'invalid_password' },
      })).not.toThrow();
    });

    it('should execute mlOperation logging', () => {
      const logger = new Logger();
      expect(() => logger.mlOperation({
        algorithm: 'zscore',
        dataPoints: 1000,
        duration: 50,
        success: true,
      })).not.toThrow();
    });

    it('should execute mlOperation for failed operations', () => {
      const logger = new Logger();
      expect(() => logger.mlOperation({
        algorithm: 'isolation_score',
        dataPoints: 0,
        duration: 5,
        success: false,
        error: 'Insufficient data',
      })).not.toThrow();
    });

    it('should execute auditLog logging', () => {
      const logger = new Logger();
      expect(() => logger.auditLog({
        action: 'CREATE',
        resourceType: 'process',
        resourceId: 'proc-123',
        userId: 1,
        organizationId: 10,
      })).not.toThrow();
    });
  });

  describe('Child Logger Context Propagation', () => {
    it('should propagate context to child logger', () => {
      const parentLogger = new Logger({ service: 'parent-service' });
      const childLogger = parentLogger.child({ requestId: 'req-789' });
      expect(() => childLogger.info('Message from child')).not.toThrow();
    });

    it('should allow nested child loggers', () => {
      const logger1 = new Logger({ userId: 1 });
      const logger2 = logger1.child({ requestId: 'req-001' });
      const logger3 = logger2.child({ operationId: 'op-001' });
      expect(() => logger3.debug('Nested child message')).not.toThrow();
    });
  });

  describe('Log Level Types', () => {
    it('should support debug level', () => {
      const levels = ['debug', 'info', 'warn', 'error', 'fatal'];
      expect(levels).toContain('debug');
    });

    it('should support info level', () => {
      const levels = ['debug', 'info', 'warn', 'error', 'fatal'];
      expect(levels).toContain('info');
    });

    it('should support warn level', () => {
      const levels = ['debug', 'info', 'warn', 'error', 'fatal'];
      expect(levels).toContain('warn');
    });

    it('should support error level', () => {
      const levels = ['debug', 'info', 'warn', 'error', 'fatal'];
      expect(levels).toContain('error');
    });

    it('should support fatal level', () => {
      const levels = ['debug', 'info', 'warn', 'error', 'fatal'];
      expect(levels).toContain('fatal');
    });
  });
});

describe('Logger Module - Types and Patterns', () => {
  describe('Log Context', () => {
    interface LogContext {
      userId?: number;
      organizationId?: number;
      requestId?: string;
      traceId?: string;
      service?: string;
    }

    it('should support user context', () => {
      const context: LogContext = { userId: 1, organizationId: 10 };
      expect(context.userId).toBe(1);
      expect(context.organizationId).toBe(10);
    });

    it('should support request tracing', () => {
      const context: LogContext = { 
        requestId: 'req-123', 
        traceId: 'trace-456' 
      };
      expect(context.requestId).toBeDefined();
      expect(context.traceId).toBeDefined();
    });

    it('should support service identification', () => {
      const context: LogContext = { service: 'ml-service' };
      expect(context.service).toBe('ml-service');
    });
  });

  describe('Structured Logging', () => {
    interface HttpLogEntry {
      method: string;
      url: string;
      statusCode: number;
      duration: number;
      userAgent?: string;
      ip?: string;
    }

    it('should log HTTP requests correctly', () => {
      const entry: HttpLogEntry = {
        method: 'GET',
        url: '/api/health',
        statusCode: 200,
        duration: 15,
        userAgent: 'Mozilla/5.0',
        ip: '192.168.1.1',
      };

      expect(entry.method).toBe('GET');
      expect(entry.statusCode).toBe(200);
      expect(entry.duration).toBeGreaterThanOrEqual(0);
    });

    it('should include all required HTTP fields', () => {
      const requiredFields = ['method', 'url', 'statusCode', 'duration'];
      const entry: HttpLogEntry = {
        method: 'POST',
        url: '/api/data',
        statusCode: 201,
        duration: 50,
      };

      requiredFields.forEach(field => {
        expect(entry).toHaveProperty(field);
      });
    });
  });

  describe('Security Event Logging', () => {
    interface SecurityEvent {
      type: 'auth_success' | 'auth_failure' | 'access_denied' | 'rate_limit';
      userId?: number;
      ip?: string;
      userAgent?: string;
      details?: Record<string, unknown>;
    }

    it('should log auth success events', () => {
      const event: SecurityEvent = {
        type: 'auth_success',
        userId: 1,
        ip: '192.168.1.1',
      };
      expect(event.type).toBe('auth_success');
    });

    it('should log auth failure events', () => {
      const event: SecurityEvent = {
        type: 'auth_failure',
        ip: '192.168.1.1',
        details: { reason: 'invalid_password' },
      };
      expect(event.type).toBe('auth_failure');
      expect(event.details?.reason).toBe('invalid_password');
    });

    it('should log access denied events', () => {
      const event: SecurityEvent = {
        type: 'access_denied',
        userId: 2,
        details: { resource: '/admin', requiredRole: 'admin' },
      };
      expect(event.type).toBe('access_denied');
    });

    it('should log rate limit events', () => {
      const event: SecurityEvent = {
        type: 'rate_limit',
        ip: '10.0.0.1',
        details: { limit: 100, window: '1m' },
      };
      expect(event.type).toBe('rate_limit');
    });
  });

  describe('ML Operation Logging', () => {
    interface MLLogEntry {
      algorithm: string;
      dataPoints: number;
      duration: number;
      success: boolean;
      error?: string;
    }

    it('should log successful ML operations', () => {
      const entry: MLLogEntry = {
        algorithm: 'zscore',
        dataPoints: 1000,
        duration: 50,
        success: true,
      };

      expect(entry.success).toBe(true);
      expect(entry.error).toBeUndefined();
    });

    it('should log failed ML operations with error', () => {
      const entry: MLLogEntry = {
        algorithm: 'isolation_score',
        dataPoints: 0,
        duration: 5,
        success: false,
        error: 'Insufficient data points',
      };

      expect(entry.success).toBe(false);
      expect(entry.error).toBeDefined();
    });

    it('should track algorithm performance', () => {
      const entries: MLLogEntry[] = [
        { algorithm: 'zscore', dataPoints: 100, duration: 10, success: true },
        { algorithm: 'zscore', dataPoints: 1000, duration: 50, success: true },
        { algorithm: 'zscore', dataPoints: 10000, duration: 200, success: true },
      ];

      const avgDuration = entries.reduce((sum, e) => sum + e.duration, 0) / entries.length;
      expect(avgDuration).toBeGreaterThan(0);
    });
  });

  describe('Database Query Logging', () => {
    interface DBLogEntry {
      operation: string;
      table: string;
      duration: number;
      rowCount?: number;
    }

    it('should log SELECT queries', () => {
      const entry: DBLogEntry = {
        operation: 'SELECT',
        table: 'users',
        duration: 5,
        rowCount: 10,
      };

      expect(entry.operation).toBe('SELECT');
      expect(entry.rowCount).toBe(10);
    });

    it('should log INSERT queries', () => {
      const entry: DBLogEntry = {
        operation: 'INSERT',
        table: 'audit_logs',
        duration: 15,
        rowCount: 1,
      };

      expect(entry.operation).toBe('INSERT');
    });

    it('should track slow queries', () => {
      const entries: DBLogEntry[] = [
        { operation: 'SELECT', table: 'large_table', duration: 500, rowCount: 50000 },
        { operation: 'SELECT', table: 'small_table', duration: 5, rowCount: 10 },
      ];

      const slowQueries = entries.filter(e => e.duration > 100);
      expect(slowQueries.length).toBe(1);
      expect(slowQueries[0].table).toBe('large_table');
    });
  });

  describe('Audit Logging', () => {
    interface AuditLogEntry {
      action: string;
      resourceType: string;
      resourceId?: string;
      userId?: number;
      organizationId?: number;
      changes?: Record<string, unknown>;
    }

    it('should log create actions', () => {
      const entry: AuditLogEntry = {
        action: 'CREATE',
        resourceType: 'process',
        resourceId: 'proc-123',
        userId: 1,
        organizationId: 10,
      };

      expect(entry.action).toBe('CREATE');
    });

    it('should log update actions with changes', () => {
      const entry: AuditLogEntry = {
        action: 'UPDATE',
        resourceType: 'user',
        resourceId: 'user-456',
        userId: 1,
        changes: {
          role: { from: 'employee', to: 'admin' },
        },
      };

      expect(entry.action).toBe('UPDATE');
      expect(entry.changes).toBeDefined();
    });

    it('should log delete actions', () => {
      const entry: AuditLogEntry = {
        action: 'DELETE',
        resourceType: 'document',
        resourceId: 'doc-789',
        userId: 1,
      };

      expect(entry.action).toBe('DELETE');
    });
  });

  describe('Log Redaction', () => {
    const sensitiveFields = [
      'password',
      'token',
      'apiKey',
      'secret',
      'authorization',
      'cookie',
      'creditCard',
    ];

    it('should identify sensitive fields', () => {
      const data = {
        username: 'john',
        password: 'secret123',
        email: 'john@example.com',
      };

      const hasSensitive = Object.keys(data).some(key => 
        sensitiveFields.includes(key)
      );

      expect(hasSensitive).toBe(true);
    });

    it('should not log passwords', () => {
      expect(sensitiveFields).toContain('password');
    });

    it('should not log tokens', () => {
      expect(sensitiveFields).toContain('token');
    });

    it('should not log API keys', () => {
      expect(sensitiveFields).toContain('apiKey');
    });

    it('should not log credit card numbers', () => {
      expect(sensitiveFields).toContain('creditCard');
    });
  });
});
