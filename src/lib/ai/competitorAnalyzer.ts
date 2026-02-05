// Competitor Analyzer - Valle 360
// Análise inteligente de concorrentes com IA

import { CompetitorActivity, ActivityType } from '@/lib/integrations/competitorScraper';

export interface CompetitorInsight {
  id: string;
  type: 'threat' | 'opportunity' | 'trend' | 'recommendation';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  competitorName?: string;
  actionable: boolean;
  suggestedAction?: string;
  createdAt: Date;
}

export interface CompetitorComparison {
  competitorId: string;
  competitorName: string;
  metrics: {
    followers: number;
    engagement: number;
    postFrequency: number;
    growthRate: number;
  };
  strengths: string[];
  weaknesses: string[];
  contentStrategy: string;
  audienceOverlap: number;
}

export interface TrendAnalysis {
  trend: string;
  description: string;
  competitors: string[];
  relevance: number;
  recommendation: string;
}

/**
 * Analisar atividades e gerar insights
 */
export function analyzeCompetitorActivities(
  activities: CompetitorActivity[],
  clientData: {
    industry: string;
    followers: number;
    avgEngagement: number;
    recentPosts: number;
  }
): CompetitorInsight[] {
  const insights: CompetitorInsight[] = [];

  // Agrupar atividades por concorrente
  const byCompetitor = groupBy(activities, 'competitorName');

  // Analisar cada concorrente
  for (const [competitorName, competitorActivities] of Object.entries(byCompetitor)) {
    // Detectar posts virais
    const viralPosts = competitorActivities.filter(a => a.isViral);
    if (viralPosts.length > 0) {
      insights.push({
        id: `viral-${competitorName}-${Date.now()}`,
        type: 'threat',
        priority: 'high',
        title: `${competitorName} teve ${viralPosts.length} post(s) viral`,
        description: `O concorrente está ganhando visibilidade significativa. Analise o conteúdo para entender o que funcionou.`,
        competitorName,
        actionable: true,
        suggestedAction: 'Criar conteúdo similar ou resposta ao tema viral',
        createdAt: new Date()
      });
    }

    // Detectar promoções
    const promotions = competitorActivities.filter(a => a.activityType === 'promotion');
    if (promotions.length > 0) {
      insights.push({
        id: `promo-${competitorName}-${Date.now()}`,
        type: 'threat',
        priority: 'high',
        title: `${competitorName} lançou promoção`,
        description: promotions[0].content,
        competitorName,
        actionable: true,
        suggestedAction: 'Avaliar necessidade de contra-oferta ou destacar diferenciais',
        createdAt: new Date()
      });
    }

    // Detectar aumento de frequência de posts
    const recentPosts = competitorActivities.filter(
      a => ['new_post', 'new_reel', 'new_story'].includes(a.activityType)
    );
    if (recentPosts.length > 5) {
      insights.push({
        id: `frequency-${competitorName}-${Date.now()}`,
        type: 'trend',
        priority: 'medium',
        title: `${competitorName} aumentou frequência de posts`,
        description: `${recentPosts.length} posts recentes detectados. Possível campanha ou nova estratégia.`,
        competitorName,
        actionable: true,
        suggestedAction: 'Monitorar resultados e considerar ajustar sua frequência',
        createdAt: new Date()
      });
    }

    // Detectar novos conteúdos de blog
    const blogPosts = competitorActivities.filter(a => a.activityType === 'blog_post');
    if (blogPosts.length > 0) {
      insights.push({
        id: `blog-${competitorName}-${Date.now()}`,
        type: 'opportunity',
        priority: 'medium',
        title: `${competitorName} publicou novo conteúdo`,
        description: `Novo artigo: "${blogPosts[0].content}"`,
        competitorName,
        actionable: true,
        suggestedAction: 'Criar conteúdo complementar ou com perspectiva diferente',
        createdAt: new Date()
      });
    }
  }

  // Análise de tendências gerais
  const trends = detectTrends(activities);
  for (const trend of trends) {
    insights.push({
      id: `trend-${Date.now()}-${Math.random()}`,
      type: 'trend',
      priority: trend.relevance > 0.7 ? 'high' : 'medium',
      title: trend.trend,
      description: trend.description,
      actionable: true,
      suggestedAction: trend.recommendation,
      createdAt: new Date()
    });
  }

  // Oportunidades baseadas em gaps
  const opportunities = findOpportunities(activities, clientData);
  insights.push(...opportunities);

  return insights.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Detectar tendências nos conteúdos dos concorrentes
 */
function detectTrends(activities: CompetitorActivity[]): TrendAnalysis[] {
  const trends: TrendAnalysis[] = [];
  
  // Analisar tipos de conteúdo mais frequentes
  const contentTypes = activities.reduce((acc, a) => {
    acc[a.activityType] = (acc[a.activityType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Reels em alta
  if (contentTypes['new_reel'] > contentTypes['new_post']) {
    trends.push({
      trend: 'Vídeos curtos em alta',
      description: 'Concorrentes estão priorizando Reels/vídeos curtos sobre posts estáticos',
      competitors: [...new Set(activities.filter(a => a.activityType === 'new_reel').map(a => a.competitorName))],
      relevance: 0.9,
      recommendation: 'Aumentar produção de Reels e vídeos curtos'
    });
  }

  // Análise de palavras-chave nos conteúdos
  const keywords = extractKeywords(activities.map(a => a.content).join(' '));
  const topKeywords = Object.entries(keywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (topKeywords.length > 0) {
    trends.push({
      trend: `Temas em destaque: ${topKeywords.map(k => k[0]).join(', ')}`,
      description: 'Estes são os temas mais abordados pelos concorrentes recentemente',
      competitors: [],
      relevance: 0.7,
      recommendation: 'Considere criar conteúdo sobre estes temas com sua perspectiva única'
    });
  }

  return trends;
}

/**
 * Encontrar oportunidades baseadas em gaps
 */
function findOpportunities(
  activities: CompetitorActivity[],
  clientData: { industry: string; followers: number; avgEngagement: number; recentPosts: number }
): CompetitorInsight[] {
  const opportunities: CompetitorInsight[] = [];

  // Verificar se concorrentes não estão usando certas plataformas
  const platforms = new Set(activities.map(a => a.platform));
  const missingPlatforms = ['instagram', 'linkedin', 'facebook'].filter(p => !platforms.has(p));
  
  if (missingPlatforms.length > 0) {
    opportunities.push({
      id: `opp-platform-${Date.now()}`,
      type: 'opportunity',
      priority: 'medium',
      title: `Oportunidade em ${missingPlatforms.join(', ')}`,
      description: `Concorrentes têm pouca presença nestas plataformas. Pode ser um diferencial.`,
      actionable: true,
      suggestedAction: `Fortalecer presença em ${missingPlatforms[0]}`,
      createdAt: new Date()
    });
  }

  // Verificar horários com pouca atividade
  const postHours = activities
    .filter(a => a.activityType === 'new_post')
    .map(a => new Date(a.detectedAt).getHours());
  
  const lowActivityHours = [6, 7, 8, 20, 21, 22].filter(h => !postHours.includes(h));
  if (lowActivityHours.length > 0) {
    opportunities.push({
      id: `opp-timing-${Date.now()}`,
      type: 'opportunity',
      priority: 'low',
      title: 'Horários com menos competição',
      description: `Concorrentes postam pouco entre ${lowActivityHours.slice(0, 2).join('h e ')}h`,
      actionable: true,
      suggestedAction: 'Testar posts nestes horários para maior visibilidade',
      createdAt: new Date()
    });
  }

  return opportunities;
}

/**
 * Gerar comparação detalhada com concorrente
 */
export function compareWithCompetitor(
  clientMetrics: {
    followers: number;
    engagement: number;
    postFrequency: number;
    growthRate: number;
  },
  competitorMetrics: {
    followers: number;
    engagement: number;
    postFrequency: number;
    growthRate: number;
  },
  competitorName: string
): {
  winner: 'client' | 'competitor' | 'tie';
  summary: string;
  details: {
    metric: string;
    client: number;
    competitor: number;
    winner: 'client' | 'competitor' | 'tie';
    difference: string;
  }[];
  recommendations: string[];
} {
  const details = [
    {
      metric: 'Seguidores',
      client: clientMetrics.followers,
      competitor: competitorMetrics.followers,
      winner: clientMetrics.followers > competitorMetrics.followers ? 'client' : 
              clientMetrics.followers < competitorMetrics.followers ? 'competitor' : 'tie',
      difference: `${Math.abs(((clientMetrics.followers - competitorMetrics.followers) / competitorMetrics.followers) * 100).toFixed(1)}%`
    },
    {
      metric: 'Engajamento',
      client: clientMetrics.engagement,
      competitor: competitorMetrics.engagement,
      winner: clientMetrics.engagement > competitorMetrics.engagement ? 'client' : 
              clientMetrics.engagement < competitorMetrics.engagement ? 'competitor' : 'tie',
      difference: `${Math.abs(clientMetrics.engagement - competitorMetrics.engagement).toFixed(1)}%`
    },
    {
      metric: 'Frequência de Posts',
      client: clientMetrics.postFrequency,
      competitor: competitorMetrics.postFrequency,
      winner: clientMetrics.postFrequency > competitorMetrics.postFrequency ? 'client' : 
              clientMetrics.postFrequency < competitorMetrics.postFrequency ? 'competitor' : 'tie',
      difference: `${Math.abs(clientMetrics.postFrequency - competitorMetrics.postFrequency)} posts/semana`
    },
    {
      metric: 'Taxa de Crescimento',
      client: clientMetrics.growthRate,
      competitor: competitorMetrics.growthRate,
      winner: clientMetrics.growthRate > competitorMetrics.growthRate ? 'client' : 
              clientMetrics.growthRate < competitorMetrics.growthRate ? 'competitor' : 'tie',
      difference: `${Math.abs(clientMetrics.growthRate - competitorMetrics.growthRate).toFixed(1)}%`
    }
  ] as const;

  const clientWins = details.filter(d => d.winner === 'client').length;
  const competitorWins = details.filter(d => d.winner === 'competitor').length;

  const winner = clientWins > competitorWins ? 'client' : 
                 clientWins < competitorWins ? 'competitor' : 'tie';

  const recommendations: string[] = [];
  
  if (clientMetrics.followers < competitorMetrics.followers) {
    recommendations.push('Investir em campanhas de crescimento de audiência');
  }
  if (clientMetrics.engagement < competitorMetrics.engagement) {
    recommendations.push('Melhorar qualidade do conteúdo e interação com seguidores');
  }
  if (clientMetrics.postFrequency < competitorMetrics.postFrequency) {
    recommendations.push('Aumentar frequência de publicações');
  }
  if (clientMetrics.growthRate < competitorMetrics.growthRate) {
    recommendations.push('Analisar estratégias de crescimento do concorrente');
  }

  const summary = winner === 'client' 
    ? `Você está à frente de ${competitorName} na maioria das métricas!`
    : winner === 'competitor'
    ? `${competitorName} está à frente em algumas métricas. Veja as recomendações.`
    : `Você e ${competitorName} estão equilibrados. Foque nos diferenciais.`;

  return {
    winner,
    summary,
    details: details as unknown as {
      metric: string;
      client: number;
      competitor: number;
      winner: 'client' | 'competitor' | 'tie';
      difference: string;
    }[],
    recommendations
  };
}

/**
 * Gerar mensagem da Val sobre concorrentes
 */
export function generateValMessage(insights: CompetitorInsight[]): string {
  if (insights.length === 0) {
    return 'Tudo tranquilo com seus concorrentes! Nenhuma atividade significativa detectada.';
  }

  const highPriority = insights.filter(i => i.priority === 'high');
  const threats = insights.filter(i => i.type === 'threat');
  const opportunities = insights.filter(i => i.type === 'opportunity');

  let message = '📊 **Resumo de Concorrentes**\n\n';

  if (highPriority.length > 0) {
    message += `⚠️ **${highPriority.length} alerta(s) importante(s):**\n`;
    highPriority.slice(0, 3).forEach(i => {
      message += `• ${i.title}\n`;
    });
    message += '\n';
  }

  if (threats.length > 0) {
    message += `🔴 ${threats.length} ameaça(s) detectada(s)\n`;
  }

  if (opportunities.length > 0) {
    message += `🟢 ${opportunities.length} oportunidade(s) identificada(s)\n`;
  }

  message += '\n💡 **Sugestão:** ';
  if (highPriority.length > 0 && highPriority[0].suggestedAction) {
    message += highPriority[0].suggestedAction;
  } else if (insights[0].suggestedAction) {
    message += insights[0].suggestedAction;
  } else {
    message += 'Continue monitorando e mantenha sua estratégia consistente.';
  }

  return message;
}

// Helpers

function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const keyValue = String(item[key]);
    (result[keyValue] = result[keyValue] || []).push(item);
    return result;
  }, {} as Record<string, T[]>);
}

function extractKeywords(text: string): Record<string, number> {
  const stopWords = new Set(['de', 'a', 'o', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'é', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'foi', 'ao', 'ele', 'das', 'tem', 'à', 'seu', 'sua', 'ou', 'ser', 'quando', 'muito', 'há', 'nos', 'já', 'está', 'eu', 'também', 'só', 'pelo', 'pela', 'até', 'isso', 'ela', 'entre', 'era', 'depois', 'sem', 'mesmo', 'aos', 'ter', 'seus', 'quem', 'nas', 'me', 'esse', 'eles', 'estão', 'você', 'tinha', 'foram', 'essa', 'num', 'nem', 'suas', 'meu', 'às', 'minha', 'têm', 'numa', 'pelos', 'elas', 'havia', 'seja', 'qual', 'será', 'nós', 'tenho', 'lhe', 'deles', 'essas', 'esses', 'pelas', 'este', 'fosse', 'dele']);
  
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));

  return words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

export default {
  analyzeCompetitorActivities,
  compareWithCompetitor,
  generateValMessage
};









