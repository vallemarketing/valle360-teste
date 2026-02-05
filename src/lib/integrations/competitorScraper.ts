/**
 * Valle 360 - Competitor Scraper/Monitor
 * Sistema de monitoramento de concorrentes em tempo real
 * CONECTADO AO TAVILY PARA DADOS REAIS
 */

import { tavilyClient } from '@/lib/integrations/tavily/client';
import { generateWithAI } from '@/lib/ai/aiRouter';

export interface Competitor {
  id: string;
  clientId: string;
  name: string;
  platforms: CompetitorPlatform[];
  createdAt: Date;
  lastChecked?: Date;
  isActive: boolean;
}

export interface CompetitorPlatform {
  platform: 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'website';
  handle: string;
  profileUrl: string;
  followers?: number;
  lastActivity?: Date;
}

export interface CompetitorActivity {
  id: string;
  competitorId: string;
  competitorName: string;
  platform: string;
  activityType: ActivityType;
  content: string;
  mediaUrl?: string;
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
  };
  detectedAt: Date;
  isViral: boolean;
  aiAnalysis?: string;
}

export type ActivityType = 
  | 'new_post'
  | 'new_story'
  | 'new_reel'
  | 'blog_post'
  | 'promotion'
  | 'bio_change'
  | 'follower_spike'
  | 'engagement_spike'
  | 'new_product'
  | 'price_change';

export interface MonitoringConfig {
  checkInterval: number;
  alertThresholds: {
    viralEngagement: number;
    followerSpike: number;
  };
  enabledAlerts: ActivityType[];
}

export interface CompetitorAnalysis {
  competitor: string;
  website?: string;
  socialMedia: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
  };
  recentActivities: CompetitorActivity[];
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  contentStrategy: string;
  pricingInfo?: string;
  uniqueSellingPoints: string[];
  recommendations: string[];
}

// =====================================================
// SERVIÇO DE SCRAPING DE CONCORRENTES
// =====================================================

class CompetitorScraperService {
  /**
   * Pesquisa informações de um concorrente
   */
  async analyzeCompetitor(competitorName: string): Promise<CompetitorAnalysis> {
    try {
      // Buscar informações em paralelo
      const [companyInfo, socialInfo, newsInfo, reputationInfo] = await Promise.all([
        tavilyClient.searchCompany(competitorName),
        tavilyClient.searchSocialMedia(competitorName),
        tavilyClient.searchNews(competitorName, 5),
        tavilyClient.searchReputation(competitorName)
      ]);

      // Processar com IA
      const result = await generateWithAI({
        task: 'analysis',
        json: true,
        temperature: 0.3,
        maxTokens: 1800,
        entityType: 'competitor_analysis',
        entityId: null,
        messages: [
          {
            role: 'system',
            content: `Você é um analista de inteligência competitiva.
Analise as informações do concorrente e retorne uma análise SWOT completa.

Retorne JSON:
{
  "website": "url principal",
  "socialMedia": {
    "instagram": "@handle ou url",
    "facebook": "url",
    "linkedin": "url",
    "twitter": "url"
  },
  "recentActivities": [
    {
      "type": "new_post|blog_post|promotion|new_product",
      "content": "descrição da atividade",
      "platform": "plataforma",
      "date": "data aproximada",
      "relevance": "alta|média|baixa"
    }
  ],
  "strengths": ["pontos fortes identificados"],
  "weaknesses": ["pontos fracos identificados"],
  "opportunities": ["oportunidades para o nosso cliente"],
  "threats": ["ameaças que representam"],
  "contentStrategy": "descrição da estratégia de conteúdo",
  "pricingInfo": "informações de preço se disponíveis",
  "uniqueSellingPoints": ["diferenciais únicos"],
  "recommendations": ["recomendações para superar este concorrente"]
}`
          },
          {
            role: 'user',
            content: JSON.stringify({
              competitor: competitorName,
              companyResults: companyInfo.results,
              socialResults: socialInfo.results,
              newsResults: newsInfo.results,
              reputationResults: reputationInfo.results,
              aiSummary: companyInfo.answer
            })
          }
        ]
      });

      const analysis = result.json || {};

    return {
        competitor: competitorName,
        website: analysis.website,
        socialMedia: analysis.socialMedia || {},
        recentActivities: (analysis.recentActivities || []).map((a: any, idx: number) => ({
          id: `activity_${idx}`,
          competitorId: '',
          competitorName,
          platform: a.platform || 'unknown',
          activityType: a.type || 'new_post',
          content: a.content,
          detectedAt: new Date(),
          isViral: a.relevance === 'alta'
        })),
        strengths: analysis.strengths || [],
        weaknesses: analysis.weaknesses || [],
        opportunities: analysis.opportunities || [],
        threats: analysis.threats || [],
        contentStrategy: analysis.contentStrategy || '',
        pricingInfo: analysis.pricingInfo,
        uniqueSellingPoints: analysis.uniqueSellingPoints || [],
        recommendations: analysis.recommendations || []
      };
    } catch (error: any) {
      console.error('Erro ao analisar concorrente:', error);
      throw error;
  }
}

/**
   * Busca concorrentes de um setor
   */
  async findCompetitors(
    industry: string,
    location?: string,
    excludeCompany?: string
  ): Promise<string[]> {
    try {
      const results = await tavilyClient.searchCompetitors(industry, location, excludeCompany);

      // Extrair nomes de empresas
      const result = await generateWithAI({
        task: 'analysis',
        json: true,
        temperature: 0.3,
        maxTokens: 900,
        entityType: 'competitor_find',
        entityId: null,
        messages: [
          {
            role: 'system',
            content: `Extraia os nomes de empresas dos resultados de busca.
Retorne JSON: { "competitors": ["Nome Empresa 1", "Nome Empresa 2", ...] }
Máximo 10 empresas, apenas nomes reais de empresas.`
          },
          {
            role: 'user',
            content: JSON.stringify({
              industry,
              location,
              results: results.results.map(r => ({ title: r.title, content: r.content })),
              answer: results.answer
            })
          }
        ]
      });

      const parsed = result.json || {};
      return parsed.competitors || [];
  } catch (error) {
      console.error('Erro ao buscar concorrentes:', error);
      return [];
  }
}

/**
   * Monitora atividades recentes de um concorrente
   */
  async monitorActivities(competitorName: string): Promise<CompetitorActivity[]> {
    try {
      const newsResults = await tavilyClient.searchNews(`${competitorName} novidade lançamento`, 10);

      const result = await generateWithAI({
        task: 'analysis',
        json: true,
        temperature: 0.3,
        maxTokens: 900,
        entityType: 'competitor_monitor',
        entityId: null,
        messages: [
          {
            role: 'system',
            content: `Identifique atividades recentes do concorrente ${competitorName}.
Retorne JSON: { "activities": [
  {
    "type": "new_post|blog_post|promotion|new_product|price_change",
    "content": "descrição",
    "platform": "instagram|facebook|linkedin|website",
    "isImportant": true/false,
    "url": "link se disponível"
  }
] }`
          },
          {
            role: 'user',
            content: JSON.stringify(newsResults.results)
          }
        ]
      });

      const parsed = result.json || {};

      return (parsed.activities || []).map((a: any, idx: number) => ({
        id: `activity_${Date.now()}_${idx}`,
        competitorId: '',
        competitorName,
        platform: a.platform || 'website',
        activityType: a.type || 'new_post',
        content: a.content,
        detectedAt: new Date(),
        isViral: a.isImportant || false
      }));
    } catch (error) {
      console.error('Erro ao monitorar atividades:', error);
      return [];
    }
  }

  /**
   * Compara múltiplos concorrentes
   */
  async compareCompetitors(competitors: string[]): Promise<{
    comparison: Record<string, any>;
    winner: string;
    insights: string[];
  }> {
    try {
      // Analisar cada concorrente
      const analyses = await Promise.all(
        competitors.map(c => this.analyzeCompetitor(c))
      );

      const result = await generateWithAI({
        task: 'analysis',
        json: true,
        temperature: 0.3,
        maxTokens: 1400,
        entityType: 'competitor_compare',
        entityId: null,
        messages: [
          {
            role: 'system',
            content: `Compare os concorrentes analisados e identifique o líder.
Retorne JSON:
{
  "comparison": {
    "Nome Empresa": {
      "score": 0-100,
      "strengths_count": número,
      "digital_presence": "forte|média|fraca",
      "threat_level": "alto|médio|baixo"
    }
  },
  "winner": "Nome do líder de mercado",
  "insights": ["insight 1", "insight 2", ...]
}`
          },
          {
            role: 'user',
            content: JSON.stringify(analyses)
          }
        ]
      });

      return result.json;
    } catch (error) {
      console.error('Erro ao comparar concorrentes:', error);
      throw error;
    }
  }
}

export const competitorScraper = new CompetitorScraperService();
export default competitorScraper;
