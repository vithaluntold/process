import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { organizationService } from '@/server/services/OrganizationService';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: 'User does not belong to any organization' },
        { status: 404 }
      );
    }

    const organization = await organizationService.getOrganization(user.organizationId);

    return NextResponse.json(organization);
  } catch (error) {
    console.error('Get my organization error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    );
  }
}
