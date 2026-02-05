/**
 * Agency Orchestration API
 * Main entry point for AI-powered content generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createOrchestrator } from '@/lib/agency/orchestrator';
import { OrchestratorRequest } from '@/lib/agency/core/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for complex crews

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
    demand_type, 
    topic, 
    objective, 
    additional_context,
    use_focus_group,
    min_focus_group_score,
  } = body;

  if (!client_id || !demand_type || !topic) {
    return NextResponse.json(
      { success: false, error: 'client_id, demand_type, and topic are required' },
      { status: 400 }
    );
  }

  // Validate demand type
  const validDemandTypes = [
    'instagram_post',
    'linkedin_post',
    'youtube_video',
    'meta_ads_campaign',
    'carousel',
    'reels',
    'full_campaign',
  ];

  if (!validDemandTypes.includes(demand_type)) {
    return NextResponse.json(
      { success: false, error: `Invalid demand_type. Must be one of: ${validDemandTypes.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const orchestrator = createOrchestrator(client_id);

    const request: OrchestratorRequest = {
      clientId: client_id,
      demandType: demand_type,
      topic,
      objective,
      additionalContext: additional_context,
      useFocusGroup: use_focus_group ?? false,
      minFocusGroupScore: min_focus_group_score ?? 7,
    };

    const result = await orchestrator.orchestrate(request);

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Orchestration error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Orchestration failed' },
      { status: 500 }
    );
  }
}
