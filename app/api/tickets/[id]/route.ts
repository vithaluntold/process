import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { ticketService } from '@/server/services/TicketService';
import { z } from 'zod';
import { withApiGuards } from '@/lib/api-guards';
import { API_WRITE_LIMIT } from '@/lib/rate-limiter';

const updateTicketSchema = z.object({
  subject: z.string().min(3).max(200).optional(),
  description: z.string().min(10).optional(),
  status: z.enum(['open', 'in_progress', 'waiting', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  assigneeId: z.number().optional(),
  categoryId: z.number().optional(),
  resolution: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: 'User must belong to an organization' }, { status: 403 });
    }

    const ticketId = parseInt(params.id);
    if (isNaN(ticketId)) {
      return NextResponse.json({ error: 'Invalid ticket ID' }, { status: 400 });
    }

    const ticket = await ticketService.getTicket(ticketId, user.organizationId);

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Get ticket error:', error);
    if (error instanceof Error && error.message === 'Ticket not found') {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: 'User must belong to an organization' }, { status: 403 });
    }

    const guardError = withApiGuards(request, 'ticket-update', API_WRITE_LIMIT, user.id);
    if (guardError) return guardError;

    const ticketId = parseInt(params.id);
    if (isNaN(ticketId)) {
      return NextResponse.json({ error: 'Invalid ticket ID' }, { status: 400 });
    }

    const body = await request.json();
    const updates = updateTicketSchema.parse(body);

    const ticket = await ticketService.updateTicket(
      ticketId,
      user.organizationId,
      user.id,
      updates
    );

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Update ticket error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === 'Ticket not found') {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to update ticket' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: 'User must belong to an organization' }, { status: 403 });
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only admins can delete tickets' }, { status: 403 });
    }

    const guardError = withApiGuards(request, 'ticket-delete', API_WRITE_LIMIT, user.id);
    if (guardError) return guardError;

    const ticketId = parseInt(params.id);
    if (isNaN(ticketId)) {
      return NextResponse.json({ error: 'Invalid ticket ID' }, { status: 400 });
    }

    await ticketService.deleteTicket(ticketId, user.organizationId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Delete ticket error:', error);
    return NextResponse.json(
      { error: 'Failed to delete ticket' },
      { status: 500 }
    );
  }
}
