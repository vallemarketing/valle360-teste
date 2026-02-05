/**
 * Trend Search Tool
 * Ferramenta para buscar tendências atuais usando Perplexity
 */

import { perplexityWebSearch } from '@/lib/integrations/perplexity';

export interface TrendSearchParams {
  topic: string;
  platform?: 'instagram' | 'tiktok' | 'linkedin' | 'youtube' | 'all';
  country?: string;
}

export interface TrendResult {
  trend: string;
  relevance: 'high' | 'medium' | 'low';
  description: string;
  suggestedUse: string;
  source?: string;
}

export interface TrendSearchResponse {
  trends: TrendResult[];
  searchedAt: string;
  platform: string;
}

/**
 * Search for current trends related to a topic
 */
export async function searchTrends(
  params: TrendSearchParams
): Promise<TrendSearchResponse> {
  const { topic, platform = 'all', country = 'Brasil' } = params;

  const query = `Quais são as tendências atuais de conteúdo em ${platform === 'all' ? 'redes sociais' : platform} 
sobre o tema "${topic}" no ${country}?

Liste as 5 principais tendências, incluindo:
- Formatos de conteúdo populares
- Hashtags em alta
- Sons/músicas trending (se aplicável)
- Estilos visuais em destaque
- Tipos de narrativa que estão funcionando

Foque em tendências dos últimos 7-14 dias.`;

  try {
    const result = await perplexityWebSearch({ query });
    
    // Parse the result into structured trends
    const trends = parseTrendsFromText(result.answer);

    return {
      trends,
      searchedAt: new Date().toISOString(),
      platform,
    };
  } catch (error) {
    console.error('Error searching trends:', error);
    return {
      trends: [],
      searchedAt: new Date().toISOString(),
      platform,
    };
  }
}

function parseTrendsFromText(text: string): TrendResult[] {
  const trends: TrendResult[] = [];
  
  // Simple parsing - split by numbered items or bullet points
  const lines = text.split(/\n/).filter(l => l.trim());
  let currentTrend: Partial<TrendResult> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Check if it's a new trend item
    if (/^[\d\-\*•]/.test(trimmed)) {
      if (currentTrend.trend) {
        trends.push({
          trend: currentTrend.trend,
          relevance: currentTrend.relevance || 'medium',
          description: currentTrend.description || '',
          suggestedUse: currentTrend.suggestedUse || 'Adaptar ao contexto da marca',
        });
      }
      
      currentTrend = {
        trend: trimmed.replace(/^[\d\-\*•\.\)]+\s*/, ''),
        relevance: 'medium',
        description: '',
        suggestedUse: '',
      };
    } else if (currentTrend.trend) {
      // Add to description
      currentTrend.description = (currentTrend.description || '') + ' ' + trimmed;
    }
  }

  // Add last trend
  if (currentTrend.trend) {
    trends.push({
      trend: currentTrend.trend,
      relevance: currentTrend.relevance || 'medium',
      description: currentTrend.description || '',
      suggestedUse: currentTrend.suggestedUse || 'Adaptar ao contexto da marca',
    });
  }

  // Limit to 5 trends
  return trends.slice(0, 5);
}

/**
 * Tool definition for agent use
 */
export const trendSearchTool = {
  name: 'trend_search',
  description: 'Busca tendências atuais de conteúdo em redes sociais para um determinado tema',
  execute: async (params: TrendSearchParams) => {
    const result = await searchTrends(params);
    return JSON.stringify(result, null, 2);
  },
};
