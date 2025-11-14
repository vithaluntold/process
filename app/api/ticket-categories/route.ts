import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { ticketService } from '@/server/services/TicketService';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await ticketService.listCategories();

    return NextResponse.json(categories);
  } catch (error) {
    console.error('List categories error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
