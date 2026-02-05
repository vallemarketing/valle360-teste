/**
 * Instagram Post Generation API
 * Quick API for generating Instagram posts
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { runOrganicContentCrew } from '@/lib/agency/crews';

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
    topic, 
    content_type = 'post',
    objective,
    additional_context,
  } = body;

  if (!client_id || !topic) {
    return NextResponse.json(
      { success: false, error: 'client_id and topic are required' },
      { status: 400 }
    );
  }

  try {
    const result = await runOrganicContentCrew({
      clientId: client_id,
      topic,
      platform: 'instagram',
      contentType: content_type,
      objective,
      additionalContext: additional_context,
    });

    if (!result.success) {
      throw new Error(result.error || 'Content generation failed');
    }

    // Parse outputs
    const outputs = parseInstagramOutputs(result.finalOutput);

    return NextResponse.json({
      success: true,
      result: {
        ...outputs,
        executionTime: result.totalTime,
        tokenUsage: result.totalTokens,
      },
    });
  } catch (error: any) {
    console.error('Instagram post generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Generation failed' },
      { status: 500 }
    );
  }
}

function parseInstagramOutputs(rawOutput: string) {
  // Extract copy/legenda
  const copyMatch = rawOutput.match(/(?:COPY|LEGENDA|TEXTO)[:\s]*\n?([\s\S]*?)(?=\n\n---|$)/i);
  
  // Extract hashtags
  const hashtagMatch = rawOutput.match(/#[^\s#]+/g);
  
  // Extract hook
  const hookMatch = rawOutput.match(/(?:HOOK|ABERTURA)[:\s]*\n?([\s\S]*?)(?=\n\n|$)/i);
  
  // Extract CTA
  const ctaMatch = rawOutput.match(/(?:CTA|CALL.TO.ACTION)[:\s]*\n?([\s\S]*?)(?=\n\n|$)/i);
  
  // Extract visual prompt
  const visualMatch = rawOutput.match(/(?:PROMPT|VISUAL|ARTE)[:\s]*\n?([\s\S]*?)(?=\n\n---|$)/i);

  return {
    copy: copyMatch?.[1]?.trim() || rawOutput.substring(0, 500),
    hashtags: hashtagMatch?.slice(0, 15) || [],
    hook: hookMatch?.[1]?.trim(),
    cta: ctaMatch?.[1]?.trim(),
    visualPrompt: visualMatch?.[1]?.trim(),
    fullOutput: rawOutput,
  };
}
