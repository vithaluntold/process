import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogger, logSecurityEvent } from '@/lib/security/tamper-proof-audit';
import { getCurrentUser } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'super_admin' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const resourceType = searchParams.get('resourceType');
    const resourceId = searchParams.get('resourceId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const auditLogger = getAuditLogger();

    const params: any = {
      limit,
      offset,
    };

    if (user.role !== 'super_admin') {
      params.organizationId = user.organizationId;
    }

    if (action) params.action = action;
    if (resourceType) params.resourceType = resourceType;
    if (resourceId) params.resourceId = resourceId;
    if (startDate) params.startDate = new Date(startDate);
    if (endDate) params.endDate = new Date(endDate);

    const { entries, total } = await auditLogger.getAuditTrail(params);

    return NextResponse.json({
      entries,
      total,
      limit,
      offset,
      hasMore: offset + entries.length < total,
    });
  } catch (error: any) {
    console.error('Audit log retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve audit logs', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, resourceType, resourceId, metadata } = body;

    if (!action || !resourceType) {
      return NextResponse.json(
        { error: 'Missing required fields: action, resourceType' },
        { status: 400 }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const entry = await logSecurityEvent({
      action,
      userId: user.id,
      organizationId: user.organizationId,
      resourceType,
      resourceId,
      metadata,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, entry });
  } catch (error: any) {
    console.error('Audit log creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create audit log entry', details: error.message },
      { status: 500 }
    );
  }
}
