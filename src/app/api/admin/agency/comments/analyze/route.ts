/**
 * Comments Analysis API
 * AI-powered comment sentiment analysis and response suggestions
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { Agent } from '@/lib/agency/core/agent';
import { getBrandContext } from '@/lib/agency/brandMemory';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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
    comments,
    post_context,
    generate_responses = true,
  } = body;

  if (!client_id || !comments || !Array.isArray(comments)) {
    return NextResponse.json(
      { success: false, error: 'client_id and comments array are required' },
      { status: 400 }
    );
  }

  try {
    const brandContext = await getBrandContext(client_id);

    const agent = new Agent({
      id: 'comment_analyzer',
      name: 'Comment Analyzer',
      role: 'Analista de Comentários',
      goal: 'Analisar sentimento e sugerir respostas apropriadas',
      backstory: `Você analisa comentários de redes sociais.
${brandContext ? `\n\nCONTEXTO DA MARCA:\n${brandContext}` : ''}

Você identifica:
- Sentimento (positivo, negativo, neutro)
- Intenção (elogio, dúvida, reclamação, sugestão, spam)
- Prioridade de resposta
- Tom adequado para resposta`,
      model: 'gpt-4o',
      temperature: 0.6,
      maxTokens: 3000,
    });

    const prompt = `Analise os seguintes comentários:

${post_context ? `CONTEXTO DO POST: ${post_context}` : ''}

COMENTÁRIOS:
${comments.map((c: any, i: number) => `${i + 1}. @${c.author || 'user'}: "${c.text}"`).join('\n')}

Para cada comentário, retorne em JSON:
{
  "analyses": [
    {
      "index": 1,
      "sentiment": "positive|negative|neutral",
      "sentiment_score": -1 a 1,
      "intent": "elogio|duvida|reclamacao|sugestao|spam|outro",
      "priority": "high|medium|low|none",
      "needs_response": true/false,
      ${generate_responses ? '"suggested_response": "...",' : ''}
      "response_tone": "agradecido|empático|informativo|casual"
    }
  ],
  "summary": {
    "total": X,
    "positive": X,
    "negative": X,
    "neutral": X,
    "needs_attention": X
  }
}`;

    const result = await agent.execute(prompt);

    let analysis;
    try {
      const jsonMatch = result.output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      }
    } catch {
      analysis = { analyses: [], summary: {} };
    }

    // Merge with original comments
    const enrichedAnalyses = (analysis.analyses || []).map((a: any, i: number) => ({
      ...a,
      original: comments[i],
    }));

    return NextResponse.json({
      success: true,
      result: {
        analyses: enrichedAnalyses,
        summary: analysis.summary || {},
        executionTime: result.executionTime,
      },
    });
  } catch (error: any) {
    console.error('Comment analysis error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}
