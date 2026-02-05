/**
 * LinkedIn Post Generation API
 * Quick API for generating LinkedIn posts
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
    post_type = 'thought_leadership', // thought_leadership, case_study, tips, announcement
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
      platform: 'linkedin',
      contentType: 'post',
      objective: objective || `Criar post de ${post_type} para LinkedIn`,
      additionalContext: additional_context,
    });

    if (!result.success) {
      throw new Error(result.error || 'Content generation failed');
    }

    // Parse outputs
    const outputs = parseLinkedInOutputs(result.finalOutput);

    return NextResponse.json({
      success: true,
      result: {
        ...outputs,
        executionTime: result.totalTime,
        tokenUsage: result.totalTokens,
      },
    });
  } catch (error: any) {
    console.error('LinkedIn post generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Generation failed' },
      { status: 500 }
    );
  }
}

function parseLinkedInOutputs(rawOutput: string) {
  // Extract main post text
  const postMatch = rawOutput.match(/(?:POST|TEXTO|COPY)[:\s]*\n?([\s\S]*?)(?=\n\n---|$)/i);
  
  // Extract hook
  const hookMatch = rawOutput.match(/(?:HOOK|ABERTURA|PRIMEIRA.LINHA)[:\s]*\n?([\s\S]*?)(?=\n\n|$)/i);
  
  // Extract hashtags (LinkedIn uses fewer)
  const hashtagMatch = rawOutput.match(/#[^\s#]+/g);
  
  // Extract CTA
  const ctaMatch = rawOutput.match(/(?:CTA|CALL.TO.ACTION|ENGAJAMENTO)[:\s]*\n?([\s\S]*?)(?=\n\n|$)/i);

  return {
    post: postMatch?.[1]?.trim() || rawOutput.substring(0, 800),
    hook: hookMatch?.[1]?.trim(),
    hashtags: hashtagMatch?.slice(0, 5) || [],
    cta: ctaMatch?.[1]?.trim(),
    fullOutput: rawOutput,
  };
}
