/**
 * Perplexity Sonar Tool
 * Ferramenta para pesquisas em tempo real usando Perplexity Sonar
 */

import { perplexityWebSearch } from '@/lib/integrations/perplexity';

export interface PerplexitySonarParams {
  query: string;
  focus?: 'web' | 'academic' | 'news' | 'social';
  language?: string;
  recency?: 'day' | 'week' | 'month' | 'year';
}

export interface PerplexitySonarResult {
  content: string;
  sources: string[];
  searchedAt: string;
  query: string;
}

/**
 * Execute a real-time search using Perplexity Sonar
 */
export async function searchWithSonar(
  params: PerplexitySonarParams
): Promise<PerplexitySonarResult> {
  const { query, focus = 'web', language = 'pt-BR', recency = 'week' } = params;

  // Build enhanced query based on focus
  let enhancedQuery = query;
  
  switch (focus) {
    case 'news':
      enhancedQuery = `Notícias recentes sobre: ${query}. Foque em desenvolvimentos dos últimos dias.`;
      break;
    case 'social':
      enhancedQuery = `O que as pessoas estão dizendo sobre "${query}" nas redes sociais? Quais são as discussões e opiniões mais recentes?`;
      break;
    case 'academic':
      enhancedQuery = `Pesquisas e estudos acadêmicos sobre: ${query}. Inclua dados e estatísticas relevantes.`;
      break;
    default:
      enhancedQuery = query;
  }

  try {
    const result = await perplexityWebSearch({ query: enhancedQuery });
    
    return {
      content: result.answer,
      sources: result.sources || [],
      searchedAt: new Date().toISOString(),
      query,
    };
  } catch (error) {
    console.error('Error with Perplexity Sonar:', error);
    return {
      content: 'Não foi possível completar a pesquisa.',
      sources: [],
      searchedAt: new Date().toISOString(),
      query,
    };
  }
}

/**
 * Search for competitor information
 */
export async function searchCompetitors(
  brand: string,
  industry: string
): Promise<PerplexitySonarResult> {
  const query = `Quais são os principais concorrentes de ${brand} no setor de ${industry}? 
O que eles estão fazendo de diferente em marketing digital e redes sociais? 
Quais são suas estratégias de conteúdo mais recentes?`;

  return searchWithSonar({
    query,
    focus: 'web',
    recency: 'month',
  });
}

/**
 * Search for industry insights
 */
export async function searchIndustryInsights(
  industry: string
): Promise<PerplexitySonarResult> {
  const query = `Quais são as tendências mais importantes no setor de ${industry} para 2024-2025? 
Inclua dados de mercado, comportamento do consumidor e oportunidades de marketing.`;

  return searchWithSonar({
    query,
    focus: 'web',
    recency: 'month',
  });
}

/**
 * Search for audience insights
 */
export async function searchAudienceInsights(
  audience: string,
  platform: string
): Promise<PerplexitySonarResult> {
  const query = `Como o público "${audience}" se comporta em ${platform}? 
Quais tipos de conteúdo eles preferem? 
Quais são seus principais interesses e dores?
Quando e como eles consomem conteúdo?`;

  return searchWithSonar({
    query,
    focus: 'social',
    recency: 'month',
  });
}

/**
 * Tool definition for agent use
 */
export const perplexitySonarTool = {
  name: 'perplexity_sonar',
  description: 'Pesquisa em tempo real na web usando Perplexity Sonar para informações atualizadas',
  execute: async (params: PerplexitySonarParams) => {
    const result = await searchWithSonar(params);
    return JSON.stringify(result, null, 2);
  },
};

export const competitorSearchTool = {
  name: 'competitor_search',
  description: 'Pesquisa informações sobre concorrentes de uma marca',
  execute: async (params: { brand: string; industry: string }) => {
    const result = await searchCompetitors(params.brand, params.industry);
    return JSON.stringify(result, null, 2);
  },
};

export const audienceInsightsTool = {
  name: 'audience_insights',
  description: 'Pesquisa insights sobre comportamento de um público específico',
  execute: async (params: { audience: string; platform: string }) => {
    const result = await searchAudienceInsights(params.audience, params.platform);
    return JSON.stringify(result, null, 2);
  },
};
