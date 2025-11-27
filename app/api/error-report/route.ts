import { NextRequest, NextResponse } from 'next/server';
import { createServiceLogger } from '@/lib/logger';

const logger = createServiceLogger('ErrorReport');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      type,
      message,
      stack,
      componentStack,
      url,
      userAgent,
      timestamp,
    } = body;

    logger.error('Client error reported', new Error(message), {
      type,
      stack,
      componentStack,
      clientUrl: url,
      userAgent,
      reportedAt: timestamp,
      receivedAt: new Date().toISOString(),
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Failed to process error report', error);
    return NextResponse.json({ received: false }, { status: 500 });
  }
}
