/**
 * Content Scorer - Multi-dimensional Evaluation
 * Avalia conteúdo em múltiplas dimensões para score de qualidade
 */

import OpenAI from 'openai';
import { analyzeSentiment } from '../tools/advanced-tools';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ContentScore {
  // Individual scores (0-10)
  clarity: number;
  persuasion: number;
  branding: number;
  seo: number;
  engagement: number;
  
  // Overall
  overall: number; // Weighted average
  confidence: number; // 0-100%
  
  // Details
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  
  // Metadata
  scoredAt: string;
  model: string;
}

export interface ScoringContext {
  brandContext?: string;
  targetAudience?: string;
  platform?: 'instagram' | 'linkedin' | 'youtube' | 'facebook' | 'twitter';
  contentType?: 'post' | 'carousel' | 'video' | 'article' | 'ad';
  keywords?: string[];
}

/**
 * Score content across multiple dimensions
 */
export async function scoreContent(
  content: string,
  context?: ScoringContext
): Promise<ContentScore> {
  try {
    // Prepare scoring prompt
    const scoringPrompt = buildScoringPrompt(content, context);
    
    // Get AI evaluation
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.3, // More deterministic for scoring
      messages: [
        {
          role: 'system',
          content: `Você é um avaliador especializado em marketing de conteúdo.
Avalie o conteúdo em múltiplas dimensões com precisão e objetividade.`
        },
        {
          role: 'user',
          content: scoringPrompt,
        },
      ],
      response_format: { type: 'json_object' },
    });
    
    const evaluation = JSON.parse(response.choices[0].message.content || '{}');
    
    // Calculate overall score (weighted average)
    const weights = {
      clarity: 0.2,
      persuasion: 0.25,
      branding: 0.2,
      seo: 0.15,
      engagement: 0.2,
    };
    
    const overall = 
      (evaluation.clarity * weights.clarity) +
      (evaluation.persuasion * weights.persuasion) +
      (evaluation.branding * weights.branding) +
      (evaluation.seo * weights.seo) +
      (evaluation.engagement * weights.engagement);
    
    // Additional analysis: Sentiment
    const sentiment = await analyzeSentiment(content);
    
    return {
      clarity: evaluation.clarity || 7,
      persuasion: evaluation.persuasion || 7,
      branding: evaluation.branding || 7,
      seo: evaluation.seo || 7,
      engagement: evaluation.engagement || 7,
      overall: Math.round(overall * 10) / 10,
      confidence: evaluation.confidence || 75,
      strengths: evaluation.strengths || [],
      weaknesses: evaluation.weaknesses || [],
      suggestions: evaluation.suggestions || [],
      scoredAt: new Date().toISOString(),
      model: 'gpt-4o',
    };
  } catch (error) {
    console.error('[ContentScorer] Error scoring content:', error);
    
    // Return default scores on error
    return {
      clarity: 7,
      persuasion: 7,
      branding: 7,
      seo: 7,
      engagement: 7,
      overall: 7,
      confidence: 50,
      strengths: [],
      weaknesses: ['Erro ao avaliar conteúdo'],
      suggestions: ['Tente novamente'],
      scoredAt: new Date().toISOString(),
      model: 'gpt-4o',
    };
  }
}

/**
 * Build scoring prompt with context
 */
function buildScoringPrompt(content: string, context?: ScoringContext): string {
  let prompt = `Avalie o seguinte conteúdo em 5 dimensões (0-10 para cada):

CONTEÚDO:
${content}

`;
  
  if (context) {
    if (context.brandContext) {
      prompt += `CONTEXTO DE MARCA:\n${context.brandContext}\n\n`;
    }
    
    if (context.targetAudience) {
      prompt += `PÚBLICO-ALVO:\n${context.targetAudience}\n\n`;
    }
    
    if (context.platform) {
      prompt += `PLATAFORMA:\n${context.platform}\n\n`;
    }
    
    if (context.contentType) {
      prompt += `TIPO DE CONTEÚDO:\n${context.contentType}\n\n`;
    }
    
    if (context.keywords && context.keywords.length > 0) {
      prompt += `PALAVRAS-CHAVE ALVO:\n${context.keywords.join(', ')}\n\n`;
    }
  }
  
  prompt += `DIMENSÕES DE AVALIAÇÃO:

1. **CLARITY (Clareza)** (0-10)
   - O conteúdo é fácil de entender?
   - A mensagem é clara e direta?
   - Há ambiguidade ou confusão?

2. **PERSUASION (Persuasão)** (0-10)
   - Usa técnicas persuasivas eficazes?
   - Tem apelo emocional adequado?
   - CTA é claro e motivador?

3. **BRANDING (Alinhamento de Marca)** (0-10)
   - Está alinhado com o tom de voz da marca?
   - Reflete os valores da marca?
   - Mantém consistência visual/textual?

4. **SEO (Otimização SEO)** (0-10)
   - Usa palavras-chave naturalmente?
   - Tem estrutura adequada (títulos, parágrafos)?
   - Facilita indexação e ranqueamento?

5. **ENGAGEMENT (Potencial de Engajamento)** (0-10)
   - Provoca reação/comentário?
   - É compartilhável?
   - Gera curiosidade ou interesse?

Responda APENAS com JSON no formato:
{
  "clarity": number (0-10),
  "persuasion": number (0-10),
  "branding": number (0-10),
  "seo": number (0-10),
  "engagement": number (0-10),
  "confidence": number (0-100),
  "strengths": ["ponto forte 1", "ponto forte 2"],
  "weaknesses": ["ponto fraco 1", "ponto fraco 2"],
  "suggestions": ["sugestão 1", "sugestão 2"]
}`;
  
  return prompt;
}

/**
 * Quick score (faster, less detailed)
 */
export async function quickScore(content: string): Promise<number> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Faster model
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: `Avalie este conteúdo de marketing em uma escala de 0-10:

${content}

Responda APENAS com um número (ex: 7.5)`,
        },
      ],
    });
    
    const score = parseFloat(response.choices[0].message.content || '7');
    return isNaN(score) ? 7 : score;
  } catch (error) {
    console.error('[ContentScorer] Error in quick score:', error);
    return 7;
  }
}

/**
 * Batch scoring
 */
export async function batchScore(
  contents: Array<{ id: string; content: string; context?: ScoringContext }>
): Promise<Array<{ id: string; score: ContentScore }>> {
  const results = await Promise.all(
    contents.map(async (item) => ({
      id: item.id,
      score: await scoreContent(item.content, item.context),
    }))
  );
  
  return results;
}

/**
 * Compare two contents
 */
export async function compareContents(
  contentA: string,
  contentB: string,
  context?: ScoringContext
): Promise<{
  scoreA: ContentScore;
  scoreB: ContentScore;
  winner: 'A' | 'B' | 'tie';
  reasoning: string;
}> {
  const [scoreA, scoreB] = await Promise.all([
    scoreContent(contentA, context),
    scoreContent(contentB, context),
  ]);
  
  let winner: 'A' | 'B' | 'tie';
  if (Math.abs(scoreA.overall - scoreB.overall) < 0.5) {
    winner = 'tie';
  } else {
    winner = scoreA.overall > scoreB.overall ? 'A' : 'B';
  }
  
  const reasoning = winner === 'tie'
    ? 'Ambos os conteúdos têm qualidade similar'
    : `Conteúdo ${winner} tem score superior em ${winner === 'A' ? scoreA.overall : scoreB.overall} vs ${winner === 'A' ? scoreB.overall : scoreA.overall}`;
  
  return {
    scoreA,
    scoreB,
    winner,
    reasoning,
  };
}

export default {
  scoreContent,
  quickScore,
  batchScore,
  compareContents,
};
