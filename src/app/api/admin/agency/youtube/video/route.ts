/**
 * YouTube Video Generation API
 * API for generating YouTube video content (titles, descriptions, scripts)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { runVideoContentCrew } from '@/lib/agency/crews';

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
    topic, 
    video_length = 'medium', // short (1-5min), medium (5-15min), long (15-45min)
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
    const result = await runVideoContentCrew({
      clientId: client_id,
      topic,
      platform: 'youtube',
      videoLength: video_length,
      objective,
      additionalContext: additional_context,
    });

    if (!result.success) {
      throw new Error(result.error || 'Content generation failed');
    }

    // Parse outputs
    const outputs = parseYouTubeOutputs(result.finalOutput);

    return NextResponse.json({
      success: true,
      result: {
        ...outputs,
        executionTime: result.totalTime,
        tokenUsage: result.totalTokens,
      },
    });
  } catch (error: any) {
    console.error('YouTube video generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Generation failed' },
      { status: 500 }
    );
  }
}

function parseYouTubeOutputs(rawOutput: string) {
  // Extract titles
  const titlesMatch = rawOutput.match(/(?:TÍTULOS?|TITLES?)[:\s]*\n?([\s\S]*?)(?=\n\n---|$)/i);
  const titles = titlesMatch?.[1]?.split('\n').filter(t => t.trim()) || [];
  
  // Extract description
  const descMatch = rawOutput.match(/(?:DESCRIÇÃO|DESCRIPTION)[:\s]*\n?([\s\S]*?)(?=\n\n---|$)/i);
  
  // Extract tags
  const tagsMatch = rawOutput.match(/(?:TAGS|PALAVRAS.CHAVE)[:\s]*\n?([\s\S]*?)(?=\n\n|$)/i);
  const tags = tagsMatch?.[1]?.split(/[,\n]/).map(t => t.trim()).filter(t => t) || [];
  
  // Extract script/roteiro
  const scriptMatch = rawOutput.match(/(?:ROTEIRO|SCRIPT)[:\s]*\n?([\s\S]*?)(?=\n\n---|$)/i);
  
  // Extract thumbnail prompt
  const thumbnailMatch = rawOutput.match(/(?:THUMBNAIL|MINIATURA)[:\s]*\n?([\s\S]*?)(?=\n\n---|$)/i);
  
  // Extract hooks
  const hooksMatch = rawOutput.match(/(?:HOOKS?|ABERTURA)[:\s]*\n?([\s\S]*?)(?=\n\n|$)/i);

  return {
    titles: titles.slice(0, 5),
    description: descMatch?.[1]?.trim(),
    tags: tags.slice(0, 20),
    script: scriptMatch?.[1]?.trim(),
    thumbnailPrompt: thumbnailMatch?.[1]?.trim(),
    hooks: hooksMatch?.[1]?.trim(),
    fullOutput: rawOutput,
  };
}
