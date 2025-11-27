/**
 * ML Algorithm Validation API
 * Tests all TypeScript ML algorithms and reports results
 */

import { NextRequest, NextResponse } from 'next/server';
import getCurrentUser from '@/lib/auth';
import { runAllValidations } from '@/lib/ml-validation';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const validationResults = runAllValidations();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...validationResults,
    });
  } catch (error) {
    console.error('ML validation error:', error);
    return NextResponse.json(
      { error: 'Failed to run ML validations' },
      { status: 500 }
    );
  }
}
