import { db } from '../storage';
import { organizations, users, roleAssignments, userProfiles, organizationSubscriptions } from '@/shared/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { randomBytes } from 'crypto';

export class OrganizationService {
  async createOrganization(data: {
    name: string;
    industry?: string;
    size?: string;
    billingEmail?: string;
    website?: string;
    createdByUserId: number;
  }) {
    const slug = this.generateSlug(data.name);

    const [organization] = await db.insert(organizations).values({
      name: data.name,
      slug,
      industry: data.industry,
      size: data.size,
      billingEmail: data.billingEmail,
      metadata: {},
    }).returning();

    await db.insert(roleAssignments).values({
      userId: data.createdByUserId,
      role: 'admin',
      resourceType: 'organization',
      resourceId: organization.id,
      grantedBy: data.createdByUserId,
    });

    return organization;
  }

  async getOrganization(organizationId: number) {
    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId));

    if (!organization) {
      throw new Error('Organization not found');
    }

    const subscription = await db
      .select()
      .from(organizationSubscriptions)
      .where(eq(organizationSubscriptions.organizationId, organizationId))
      .limit(1);

    const userCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.organizationId, organizationId));

    return {
      ...organization,
      subscription: subscription[0] || null,
      userCount: userCount[0]?.count || 0,
    };
  }

  async updateOrganization(
    organizationId: number,
    data: Partial<{
      name: string;
      logoUrl: string;
      website: string;
      industry: string;
      size: string;
      billingEmail: string;
      metadata: any;
    }>
  ) {
    const [updated] = await db
      .update(organizations)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, organizationId))
      .returning();

    return updated;
  }

  async deleteOrganization(organizationId: number) {
    await db.transaction(async (tx) => {
      await tx.delete(roleAssignments).where(
        and(
          eq(roleAssignments.resourceType, 'organization'),
          eq(roleAssignments.resourceId, organizationId)
        )
      );

      await tx.delete(organizations).where(eq(organizations.id, organizationId));
    });
  }

  async getOrganizationUsers(organizationId: number) {
    const orgUsers = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        profile: userProfiles,
      })
      .from(users)
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(eq(users.organizationId, organizationId))
      .orderBy(desc(users.createdAt));

    return orgUsers;
  }

  async addUserToOrganization(data: {
    email: string;
    organizationId: number;
    role: 'admin' | 'employee';
    invitedBy: number;
  }) {
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email));

    if (existingUser && existingUser.organizationId) {
      throw new Error('User already belongs to another organization');
    }

    // SECURITY: Atomic seat allocation with race condition protection
    // Use WHERE clause to check availability during UPDATE
    await db.transaction(async (tx) => {
      const [subscription] = await tx
        .select()
        .from(organizationSubscriptions)
        .where(eq(organizationSubscriptions.organizationId, data.organizationId))
        .for('update'); // Lock the row for atomic update

      // SECURITY: Require active subscription for user invitations
      if (!subscription) {
        throw new Error('Organization must have an active subscription to add users. Please create a subscription first.');
      }

      // SECURITY: Verify subscription is active, not cancelled or suspended
      const allowedStatuses = ['active', 'trialing', 'past_due'];
      if (!allowedStatuses.includes(subscription.status)) {
        throw new Error(`Cannot add users: subscription is ${subscription.status}. Please reactivate your subscription.`);
      }

      if (existingUser) {
        // Add existing user to organization
        const [updated] = await tx
          .update(users)
          .set({
            organizationId: data.organizationId,
            role: data.role,
          })
          .where(eq(users.id, existingUser.id))
          .returning();

        // Atomically increment seat if subscription exists and has capacity
        if (subscription) {
          const result = await tx
            .update(organizationSubscriptions)
            .set({
              seatsUsed: sql`${organizationSubscriptions.seatsUsed} + 1`,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(organizationSubscriptions.id, subscription.id),
                sql`${organizationSubscriptions.seatsUsed} < ${organizationSubscriptions.seats}`
              )
            )
            .returning();

          if (result.length === 0) {
            throw new Error('No available seats in subscription. Please upgrade your plan to add more users.');
          }
        }

        return updated;
      } else {
        // Create new user
        const tempPassword = this.generateTemporaryPassword();
        
        const [newUser] = await tx.insert(users).values({
          email: data.email,
          password: tempPassword,
          organizationId: data.organizationId,
          role: data.role,
        }).returning();

        // Atomically increment seat if subscription exists and has capacity
        if (subscription) {
          const result = await tx
            .update(organizationSubscriptions)
            .set({
              seatsUsed: sql`${organizationSubscriptions.seatsUsed} + 1`,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(organizationSubscriptions.id, subscription.id),
                sql`${organizationSubscriptions.seatsUsed} < ${organizationSubscriptions.seats}`
              )
            )
            .returning();

          if (result.length === 0) {
            throw new Error('No available seats in subscription. Please upgrade your plan to add more users.');
          }
        }

        return newUser;
      }
    });

    // Fetch and return the user
    const [finalUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email));

    return finalUser!;
  }

  async removeUserFromOrganization(userId: number, organizationId: number) {
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, userId),
          eq(users.organizationId, organizationId)
        )
      );

    if (!user) {
      throw new Error('User not found in this organization');
    }

    await db
      .update(users)
      .set({
        organizationId: null,
        role: 'employee',
      })
      .where(eq(users.id, userId));
  }

  async listAllOrganizations(options?: {
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const conditions = [];
    if (options?.search) {
      conditions.push(
        sql`${organizations.name} ILIKE ${`%${options.search}%`}`
      );
    }

    const orgs = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        industry: organizations.industry,
        size: organizations.size,
        createdAt: organizations.createdAt,
        userCount: sql<number>`(SELECT COUNT(*)::int FROM ${users} WHERE ${users.organizationId} = ${organizations.id})`,
      })
      .from(organizations)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(options?.limit || 50)
      .offset(options?.offset || 0)
      .orderBy(desc(organizations.createdAt));

    return orgs;
  }

  private generateSlug(name: string): string {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    const randomSuffix = randomBytes(3).toString('hex');
    return `${baseSlug}-${randomSuffix}`;
  }

  private generateTemporaryPassword(): string {
    return randomBytes(16).toString('hex');
  }

  async checkUserOrganizationAccess(userId: number, organizationId: number): Promise<boolean> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) return false;

    if (user.role === 'super_admin') return true;

    return user.organizationId === organizationId;
  }
}

export const organizationService = new OrganizationService();
