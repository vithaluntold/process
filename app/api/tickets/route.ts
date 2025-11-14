import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { ticketService } from '@/server/services/TicketService';
import { z } from 'zod';
import { withApiGuards } from '@/lib/api-guards';
import { API_WRITE_LIMIT } from '@/lib/rate-limiter';

const createTicketSchema = z.object({
  subject: z.string().min(3).max(200),
  description: z.string().min(10),
  categoryId: z.number().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  assigneeId: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: 'User must belong to an organization' }, { status: 403 });
    }

    const guardError = withApiGuards(request, 'ticket-create', API_WRITE_LIMIT, user.id);
    if (guardError) return guardError;

    const body = await request.json();
    const data = createTicketSchema.parse(body);

    const ticket = await ticketService.createTicket({
      organizationId: user.organizationId,
      requesterId: user.id,
      ...data,
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error('Create ticket error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: 'User must belong to an organization' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      categoryId: searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId')!) : undefined,
      assigneeId: searchParams.get('assigneeId') ? parseInt(searchParams.get('assigneeId')!) : undefined,
      requesterId: searchParams.get('requesterId') ? parseInt(searchParams.get('requesterId')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    const tickets = await ticketService.listTickets(user.organizationId, filters);

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('List tickets error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}
