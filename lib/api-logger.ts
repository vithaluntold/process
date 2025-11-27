import { NextRequest, NextResponse } from 'next/server';
import { createRequestLogger, Logger } from './logger';
import crypto from 'crypto';

export interface APIContext {
  requestId: string;
  logger: Logger;
  startTime: number;
}

export function createAPIContext(req: NextRequest): APIContext {
  const requestId = crypto.randomUUID();
  const logger = createRequestLogger(requestId);
  
  return {
    requestId,
    logger,
    startTime: Date.now(),
  };
}

export function logRequest(ctx: APIContext, req: NextRequest): void {
  ctx.logger.info('API request received', {
    method: req.method,
    url: req.url,
    userAgent: req.headers.get('user-agent') || undefined,
    ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
  });
}

export function logResponse(
  ctx: APIContext, 
  req: NextRequest, 
  status: number, 
  error?: Error
): void {
  const duration = Date.now() - ctx.startTime;
  
  if (error) {
    ctx.logger.error('API request failed', error, {
      method: req.method,
      url: req.url,
      status,
      duration,
    });
  } else {
    ctx.logger.httpRequest({
      method: req.method,
      url: new URL(req.url).pathname,
      statusCode: status,
      duration,
      userAgent: req.headers.get('user-agent') || undefined,
      ip: req.headers.get('x-forwarded-for') || undefined,
    });
  }
}

export function createErrorResponse(
  ctx: APIContext,
  message: string,
  status: number = 500,
  code: string = 'INTERNAL_ERROR',
  details?: Record<string, unknown>
): NextResponse {
  const body = {
    success: false,
    error: message,
    code,
    requestId: ctx.requestId,
    ...(details && { details }),
  };
  
  return NextResponse.json(body, { 
    status,
    headers: {
      'X-Request-ID': ctx.requestId,
    },
  });
}

export function createSuccessResponse<T>(
  ctx: APIContext,
  data: T,
  status: number = 200
): NextResponse {
  const body = {
    success: true,
    data,
    requestId: ctx.requestId,
  };
  
  return NextResponse.json(body, { 
    status,
    headers: {
      'X-Request-ID': ctx.requestId,
    },
  });
}

export type APIHandler<T = unknown> = (
  req: NextRequest,
  ctx: APIContext
) => Promise<T>;

export function withLogging<T>(handler: APIHandler<T>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const ctx = createAPIContext(req);
    logRequest(ctx, req);

    try {
      const result = await handler(req, ctx);
      const response = result instanceof NextResponse 
        ? result 
        : createSuccessResponse(ctx, result);
      
      logResponse(ctx, req, response.status);
      return response;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      logResponse(ctx, req, 500, err);
      
      return createErrorResponse(
        ctx,
        process.env.NODE_ENV === 'production' 
          ? 'An unexpected error occurred' 
          : err.message,
        500,
        'INTERNAL_ERROR'
      );
    }
  };
}

export function withSecurityLogging<T>(handler: APIHandler<T>) {
  return async (req: NextRequest, ctx: APIContext): Promise<T> => {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    ctx.logger.securityEvent({
      type: 'auth_success',
      ip,
      userAgent,
      details: {
        method: req.method,
        path: new URL(req.url).pathname,
      },
    });
    
    return handler(req, ctx);
  };
}

export function logMLOperation(
  ctx: APIContext,
  algorithm: string,
  dataPoints: number,
  startTime: number,
  success: boolean,
  error?: string
): void {
  ctx.logger.mlOperation({
    algorithm,
    dataPoints,
    duration: Date.now() - startTime,
    success,
    error,
  });
}

export function logDatabaseQuery(
  ctx: APIContext,
  operation: string,
  table: string,
  startTime: number,
  rowCount?: number
): void {
  ctx.logger.dbQuery({
    operation,
    table,
    duration: Date.now() - startTime,
    rowCount,
  });
}
