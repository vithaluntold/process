import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogger } from '@/lib/security/tamper-proof-audit';
import { getCurrentUser } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admins can verify audit chain' }, { status: 403 });
    }

    const body = await request.json();
    const { startFrom, limit } = body;

    const auditLogger = getAuditLogger();
    const result = await auditLogger.verifyChain(startFrom, limit || 1000);

    return NextResponse.json({
      ...result,
      verifiedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Audit chain verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify audit chain', details: error.message },
      { status: 500 }
    );
  }
}
