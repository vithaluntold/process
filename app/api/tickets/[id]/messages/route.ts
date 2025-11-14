import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { ticketService } from '@/server/services/TicketService';
import { z } from 'zod';
import { withApiGuards } from '@/lib/api-guards';
import { API_WRITE_LIMIT } from '@/lib/rate-limiter';

const addMessageSchema = z.object({
  body: z.string().min(1),
  visibility: z.enum(['public', 'internal']).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guardError = withApiGuards(request, 'ticket-message-create', API_WRITE_LIMIT, user.id);
    if (guardError) return guardError;

    if (!user.organizationId) {
      return NextResponse.json({ error: 'User must belong to an organization' }, { status: 403 });
    }

    const ticketId = parseInt(params.id);
    if (isNaN(ticketId)) {
      return NextResponse.json({ error: 'Invalid ticket ID' }, { status: 400 });
    }

    const body = await request.json();
    const data = addMessageSchema.parse(body);

    const message = await ticketService.addMessage({
      ticketId,
      organizationId: user.organizationId,
      authorId: user.id,
      ...data,
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Add message error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to add message' },
      { status: 500 }
    );
  }
}

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

    const messages = await ticketService.getTicketMessages(ticketId, user.organizationId);

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
