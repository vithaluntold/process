import { db } from '../storage';
import {
  tickets,
  ticketMessages,
  ticketAttachments,
  ticketWatchers,
  ticketActivityLog,
  ticketCategories,
  users,
} from '@/shared/schema';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';

export class TicketService {
  async createTicket(data: {
    organizationId: number;
    subject: string;
    description: string;
    categoryId?: number;
    priority: string;
    requesterId: number;
    assigneeId?: number;
    tags?: string[];
  }) {
    const ticketNumber = await this.generateTicketNumber(data.organizationId);

    const [ticket] = await db.insert(tickets).values({
      organizationId: data.organizationId,
      ticketNumber,
      subject: data.subject,
      description: data.description,
      categoryId: data.categoryId,
      priority: data.priority,
      status: 'open',
      requesterId: data.requesterId,
      assigneeId: data.assigneeId,
      tags: data.tags ? JSON.stringify(data.tags) : null,
      metadata: {},
    }).returning();

    await this.createActivityLog({
      ticketId: ticket.id,
      organizationId: data.organizationId,
      actorId: data.requesterId,
      actionType: 'created',
      payload: { subject: data.subject, priority: data.priority },
    });

    if (data.assigneeId) {
      await this.addWatcher(ticket.id, data.organizationId, data.assigneeId);
    }

    await this.addWatcher(ticket.id, data.organizationId, data.requesterId);

    return ticket;
  }

  async getTicket(ticketId: number, organizationId: number) {
    const [ticket] = await db
      .select({
        ticket: tickets,
        requester: users,
        category: ticketCategories,
      })
      .from(tickets)
      .leftJoin(users, eq(tickets.requesterId, users.id))
      .leftJoin(ticketCategories, eq(tickets.categoryId, ticketCategories.id))
      .where(
        and(
          eq(tickets.id, ticketId),
          eq(tickets.organizationId, organizationId)
        )
      );

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const messages = await this.getTicketMessages(ticketId, organizationId);
    const watchers = await this.getTicketWatchers(ticketId, organizationId);
    const attachments = await this.getTicketAttachments(ticketId, organizationId);

    return {
      ...ticket.ticket,
      requester: ticket.requester,
      category: ticket.category,
      messages,
      watchers,
      attachments,
    };
  }

  async listTickets(organizationId: number, filters?: {
    status?: string;
    priority?: string;
    categoryId?: number;
    assigneeId?: number;
    requesterId?: number;
    limit?: number;
    offset?: number;
  }) {
    const conditions = [eq(tickets.organizationId, organizationId)];

    if (filters?.status) {
      conditions.push(eq(tickets.status, filters.status));
    }
    if (filters?.priority) {
      conditions.push(eq(tickets.priority, filters.priority));
    }
    if (filters?.categoryId) {
      conditions.push(eq(tickets.categoryId, filters.categoryId));
    }
    if (filters?.assigneeId) {
      conditions.push(eq(tickets.assigneeId, filters.assigneeId));
    }
    if (filters?.requesterId) {
      conditions.push(eq(tickets.requesterId, filters.requesterId));
    }

    const ticketList = await db
      .select({
        id: tickets.id,
        ticketNumber: tickets.ticketNumber,
        subject: tickets.subject,
        status: tickets.status,
        priority: tickets.priority,
        createdAt: tickets.createdAt,
        updatedAt: tickets.updatedAt,
        dueDate: tickets.dueDate,
        requester: {
          id: users.id,
          email: users.email,
        },
        category: {
          id: ticketCategories.id,
          name: ticketCategories.name,
        },
      })
      .from(tickets)
      .leftJoin(users, eq(tickets.requesterId, users.id))
      .leftJoin(ticketCategories, eq(tickets.categoryId, ticketCategories.id))
      .where(and(...conditions))
      .limit(filters?.limit || 50)
      .offset(filters?.offset || 0)
      .orderBy(desc(tickets.createdAt));

    return ticketList;
  }

  async updateTicket(
    ticketId: number,
    organizationId: number,
    actorId: number,
    updates: Partial<{
      subject: string;
      description: string;
      status: string;
      priority: string;
      assigneeId: number;
      categoryId: number;
      resolution: string;
      tags: string[];
    }>
  ) {
    const [existing] = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.id, ticketId),
          eq(tickets.organizationId, organizationId)
        )
      );

    if (!existing) {
      throw new Error('Ticket not found');
    }

    const updateData: any = {
      ...updates,
      updatedAt: new Date(),
    };

    if (updates.status === 'resolved' || updates.status === 'closed') {
      updateData.resolvedAt = new Date();
    }

    if (updates.tags) {
      updateData.tags = JSON.stringify(updates.tags);
    }

    const [updated] = await db
      .update(tickets)
      .set(updateData)
      .where(eq(tickets.id, ticketId))
      .returning();

    if (updates.assigneeId && updates.assigneeId !== existing.assigneeId) {
      await this.addWatcher(ticketId, organizationId, updates.assigneeId);
      await this.createActivityLog({
        ticketId,
        organizationId,
        actorId,
        actionType: 'assigned',
        payload: { assigneeId: updates.assigneeId },
      });
    }

    if (updates.status && updates.status !== existing.status) {
      await this.createActivityLog({
        ticketId,
        organizationId,
        actorId,
        actionType: 'status_changed',
        payload: { oldStatus: existing.status, newStatus: updates.status },
      });
    }

    return updated;
  }

  async deleteTicket(ticketId: number, organizationId: number) {
    await db.transaction(async (tx) => {
      await tx.delete(ticketActivityLog).where(
        and(
          eq(ticketActivityLog.ticketId, ticketId),
          eq(ticketActivityLog.organizationId, organizationId)
        )
      );

      await tx.delete(ticketWatchers).where(
        and(
          eq(ticketWatchers.ticketId, ticketId),
          eq(ticketWatchers.organizationId, organizationId)
        )
      );

      await tx.delete(ticketMessages).where(
        and(
          eq(ticketMessages.ticketId, ticketId),
          eq(ticketMessages.organizationId, organizationId)
        )
      );

      await tx.delete(ticketAttachments).where(
        and(
          eq(ticketAttachments.ticketId, ticketId),
          eq(ticketAttachments.organizationId, organizationId)
        )
      );

      await tx.delete(tickets).where(
        and(
          eq(tickets.id, ticketId),
          eq(tickets.organizationId, organizationId)
        )
      );
    });
  }

  async addMessage(data: {
    ticketId: number;
    organizationId: number;
    authorId: number;
    body: string;
    visibility?: string;
  }) {
    const [message] = await db.insert(ticketMessages).values({
      ticketId: data.ticketId,
      organizationId: data.organizationId,
      authorId: data.authorId,
      body: data.body,
      visibility: data.visibility || 'public',
      metadata: {},
    }).returning();

    await this.createActivityLog({
      ticketId: data.ticketId,
      organizationId: data.organizationId,
      actorId: data.authorId,
      actionType: 'commented',
      payload: { messageId: message.id },
    });

    await db
      .update(tickets)
      .set({ updatedAt: new Date() })
      .where(eq(tickets.id, data.ticketId));

    return message;
  }

  async getTicketMessages(ticketId: number, organizationId: number) {
    return await db
      .select({
        id: ticketMessages.id,
        body: ticketMessages.body,
        visibility: ticketMessages.visibility,
        createdAt: ticketMessages.createdAt,
        author: {
          id: users.id,
          email: users.email,
        },
      })
      .from(ticketMessages)
      .leftJoin(users, eq(ticketMessages.authorId, users.id))
      .where(
        and(
          eq(ticketMessages.ticketId, ticketId),
          eq(ticketMessages.organizationId, organizationId)
        )
      )
      .orderBy(ticketMessages.createdAt);
  }

  async addWatcher(ticketId: number, organizationId: number, userId: number) {
    await db.insert(ticketWatchers)
      .values({
        ticketId,
        organizationId,
        userId,
      })
      .onConflictDoNothing();
  }

  async removeWatcher(ticketId: number, organizationId: number, userId: number) {
    await db.delete(ticketWatchers).where(
      and(
        eq(ticketWatchers.ticketId, ticketId),
        eq(ticketWatchers.organizationId, organizationId),
        eq(ticketWatchers.userId, userId)
      )
    );
  }

  async getTicketWatchers(ticketId: number, organizationId: number) {
    return await db
      .select({
        userId: ticketWatchers.userId,
        email: users.email,
      })
      .from(ticketWatchers)
      .leftJoin(users, eq(ticketWatchers.userId, users.id))
      .where(
        and(
          eq(ticketWatchers.ticketId, ticketId),
          eq(ticketWatchers.organizationId, organizationId)
        )
      );
  }

  async getTicketAttachments(ticketId: number, organizationId: number) {
    return await db
      .select()
      .from(ticketAttachments)
      .where(
        and(
          eq(ticketAttachments.ticketId, ticketId),
          eq(ticketAttachments.organizationId, organizationId)
        )
      );
  }

  async getTicketActivity(ticketId: number, organizationId: number) {
    return await db
      .select({
        id: ticketActivityLog.id,
        actionType: ticketActivityLog.actionType,
        payload: ticketActivityLog.payload,
        createdAt: ticketActivityLog.createdAt,
        actor: {
          id: users.id,
          email: users.email,
        },
      })
      .from(ticketActivityLog)
      .leftJoin(users, eq(ticketActivityLog.actorId, users.id))
      .where(
        and(
          eq(ticketActivityLog.ticketId, ticketId),
          eq(ticketActivityLog.organizationId, organizationId)
        )
      )
      .orderBy(desc(ticketActivityLog.createdAt));
  }

  private async createActivityLog(data: {
    ticketId: number;
    organizationId: number;
    actorId: number;
    actionType: string;
    payload: any;
  }) {
    await db.insert(ticketActivityLog).values({
      ticketId: data.ticketId,
      organizationId: data.organizationId,
      actorId: data.actorId,
      actionType: data.actionType,
      payload: data.payload,
    });
  }

  private async generateTicketNumber(organizationId: number): Promise<string> {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tickets)
      .where(eq(tickets.organizationId, organizationId));

    const count = (result?.count || 0) + 1;
    return `TKT-${organizationId}-${count.toString().padStart(5, '0')}`;
  }

  async getTicketStats(organizationId: number) {
    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        open: sql<number>`count(*) FILTER (WHERE ${tickets.status} = 'open')::int`,
        inProgress: sql<number>`count(*) FILTER (WHERE ${tickets.status} = 'in_progress')::int`,
        resolved: sql<number>`count(*) FILTER (WHERE ${tickets.status} = 'resolved')::int`,
        closed: sql<number>`count(*) FILTER (WHERE ${tickets.status} = 'closed')::int`,
      })
      .from(tickets)
      .where(eq(tickets.organizationId, organizationId));

    return stats;
  }

  async listCategories() {
    return await db
      .select()
      .from(ticketCategories)
      .where(eq(ticketCategories.isActive, true))
      .orderBy(ticketCategories.name);
  }
}

export const ticketService = new TicketService();
