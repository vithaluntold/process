import { NextRequest, NextResponse } from 'next/server';
import { createServiceLogger } from '@/lib/logger';
import { z } from 'zod';

const logger = createServiceLogger('ErrorReport');

const rateLimitMap = new Map<string, { count: number; firstRequest: number }>();
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now - entry.firstRequest > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, firstRequest: now });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  entry.count++;
  return true;
}

const errorReportSchema = z.object({
  type: z.enum(['react_error', 'js_error', 'network_error', 'unhandled_rejection']),
  message: z.string().max(5000),
  stack: z.string().max(10000).optional(),
  componentStack: z.string().max(10000).optional(),
  url: z.string().url().max(2000).optional(),
  userAgent: z.string().max(500).optional(),
  timestamp: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { received: false, error: 'Rate limit exceeded' }, 
        { status: 429 }
      );
    }

    const origin = request.headers.get('origin') || '';
    const host = request.headers.get('host') || '';
    const allowedOrigins = [
      `https://${host}`,
      `http://${host}`,
      ...(process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean),
    ];
    const isValidOrigin = process.env.NODE_ENV === 'development' || 
                          !origin ||
                          allowedOrigins.some(allowed => origin === allowed);
    
    if (!isValidOrigin) {
      logger.warn('Rejected error report from invalid origin', { origin, host });
      return NextResponse.json(
        { received: false, error: 'Invalid origin' }, 
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = errorReportSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { received: false, error: 'Invalid payload' }, 
        { status: 400 }
      );
    }

    const { type, message, stack, componentStack, url, userAgent, timestamp } = parsed.data;

    logger.error('Client error reported', new Error(message), {
      type,
      stack: stack?.slice(0, 2000),
      componentStack: componentStack?.slice(0, 2000),
      clientUrl: url,
      userAgent: userAgent?.slice(0, 200),
      reportedAt: timestamp,
      receivedAt: new Date().toISOString(),
      ip: ip.split(',')[0].trim(),
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Failed to process error report', error);
    return NextResponse.json({ received: false }, { status: 500 });
  }
}
