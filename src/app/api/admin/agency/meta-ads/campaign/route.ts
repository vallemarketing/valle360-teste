/**
 * Meta Ads Campaign Generation API
 * API for generating complete Meta Ads campaigns
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { runPaidContentCrew } from '@/lib/agency/crews';

export const dynamic = 'force-dynamic';
export const maxDuration = 180;

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
    campaign_objective = 'leads', // awareness, traffic, leads, sales, app_installs
    product,
    target_audience,
    budget,
    additional_context,
  } = body;

  if (!client_id || !product || !target_audience) {
    return NextResponse.json(
      { success: false, error: 'client_id, product, and target_audience are required' },
      { status: 400 }
    );
  }

  try {
    const result = await runPaidContentCrew({
      clientId: client_id,
      campaignObjective: campaign_objective,
      product,
      targetAudience: target_audience,
      budget,
      platform: 'meta',
      additionalContext: additional_context,
    });

    if (!result.success) {
      throw new Error(result.error || 'Campaign generation failed');
    }

    // Parse outputs
    const outputs = parseMetaAdsOutputs(result.finalOutput);

    return NextResponse.json({
      success: true,
      result: {
        ...outputs,
        executionTime: result.totalTime,
        tokenUsage: result.totalTokens,
      },
    });
  } catch (error: any) {
    console.error('Meta Ads campaign generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Generation failed' },
      { status: 500 }
    );
  }
}

function parseMetaAdsOutputs(rawOutput: string) {
  // Extract campaign strategy
  const strategyMatch = rawOutput.match(/(?:ESTRATÉGIA|STRATEGY)[:\s]*\n?([\s\S]*?)(?=\n\n---|$)/i);
  
  // Extract ad copies
  const copiesMatch = rawOutput.match(/(?:COPIES|ANÚNCIOS|ADS)[:\s]*\n?([\s\S]*?)(?=\n\n---|$)/i);
  
  // Extract audiences
  const audiencesMatch = rawOutput.match(/(?:PÚBLICOS|AUDIENCES)[:\s]*\n?([\s\S]*?)(?=\n\n---|$)/i);
  
  // Extract campaign structure
  const structureMatch = rawOutput.match(/(?:ESTRUTURA|STRUCTURE)[:\s]*\n?([\s\S]*?)(?=\n\n---|$)/i);
  
  // Extract creative prompts
  const creativesMatch = rawOutput.match(/(?:CRIATIVOS|CREATIVES|VISUAL)[:\s]*\n?([\s\S]*?)(?=\n\n---|$)/i);
  
  // Extract hooks for video ads
  const videoHooksMatch = rawOutput.match(/(?:VIDEO.HOOKS?|GANCHOS.VIDEO)[:\s]*\n?([\s\S]*?)(?=\n\n|$)/i);

  return {
    strategy: strategyMatch?.[1]?.trim(),
    adCopies: copiesMatch?.[1]?.trim(),
    audiences: audiencesMatch?.[1]?.trim(),
    campaignStructure: structureMatch?.[1]?.trim(),
    creativePrompts: creativesMatch?.[1]?.trim(),
    videoHooks: videoHooksMatch?.[1]?.trim(),
    fullOutput: rawOutput,
  };
}
