/**
 * Focus Group Validation API
 * API for validating content with synthetic focus group
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { runFocusGroupCrew } from '@/lib/agency/crews';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { 
    client_id, 
    content,
    content_type = 'post',
    min_score = 7,
  } = body;

  if (!client_id || !content) {
    return NextResponse.json(
      { success: false, error: 'client_id and content are required' },
      { status: 400 }
    );
  }

  try {
    const result = await runFocusGroupCrew({
      clientId: client_id,
      contentToEvaluate: content,
      contentType: content_type,
      minScore: min_score,
    });

    return NextResponse.json({
      success: true,
      result: {
        passed: result.focusGroupResult.passed,
        averageScore: result.focusGroupResult.averageScore,
        evaluations: result.focusGroupResult.evaluations,
        iterations: result.focusGroupResult.iterations,
        executionTime: result.totalTime,
        tokenUsage: result.totalTokens,
      },
    });
  } catch (error: any) {
    console.error('Focus group validation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Validation failed' },
      { status: 500 }
    );
  }
}
