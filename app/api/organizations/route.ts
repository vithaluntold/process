import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { organizationService } from '@/server/services/OrganizationService';
import { z } from 'zod';

const createOrganizationSchema = z.object({
  name: z.string().min(2).max(100),
  industry: z.string().optional(),
  size: z.string().optional(),
  billingEmail: z.string().email().optional(),
  website: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createOrganizationSchema.parse(body);

    const organization = await organizationService.createOrganization({
      ...data,
      createdByUserId: user.id,
    });

    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    console.error('Create organization error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only super admins can list all organizations' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const organizations = await organizationService.listAllOrganizations({
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    });

    return NextResponse.json(organizations);
  } catch (error) {
    console.error('List organizations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}
