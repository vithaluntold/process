import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { ticketService } from '@/server/services/TicketService';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: 'User must belong to an organization' }, { status: 403 });
    }

    const stats = await ticketService.getTicketStats(user.organizationId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Get ticket stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticket stats' },
      { status: 500 }
    );
  }
}
