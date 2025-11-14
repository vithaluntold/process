import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { ticketService } from '@/server/services/TicketService';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // SECURITY: Pass organizationId to get org-specific + global categories
    const categories = await ticketService.listCategories(user.organizationId || undefined);

    return NextResponse.json(categories);
  } catch (error) {
    console.error('List categories error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
