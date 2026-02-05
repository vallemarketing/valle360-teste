// Trend Analyzer - Valle 360
// Analisador de tendências do setor com IA

export interface IndustryTrend {
  id: string;
  title: string;
  description: string;
  category: TrendCategory;
  relevance: number;        // 0-100
  momentum: 'rising' | 'stable' | 'declining';
  sources: string[];
  relatedKeywords: string[];
  detectedAt: Date;
  expiresAt?: Date;
  actionItems: string[];
}

export type TrendCategory = 
  | 'content'
  | 'technology'
  | 'marketing'
  | 'consumer_behavior'
  | 'platform_update'
  | 'competitor'
  | 'seasonal'
  | 'viral';

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: Date;
  category: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  relevanceScore: number;
  keywords: string[];
  aiAnalysis?: string;
}

export interface TrendReport {
  industry: string;
  generatedAt: Date;
  trends: IndustryTrend[];
  news: NewsItem[];
  insights: string[];
  opportunities: string[];
  threats: string[];
  recommendations: string[];
}

// Mapeamento de indústrias para keywords
const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  'marketing_digital': ['marketing digital', 'social media', 'SEO', 'tráfego pago', 'influencer', 'content marketing', 'branding'],
  'ecommerce': ['e-commerce', 'marketplace', 'vendas online', 'dropshipping', 'D2C', 'fulfillment'],
  'tecnologia': ['tecnologia', 'software', 'SaaS', 'startup', 'inovação', 'transformação digital', 'IA', 'automação'],
  'saude': ['saúde', 'wellness', 'medicina', 'telemedicina', 'healthtech', 'bem-estar'],
  'educacao': ['educação', 'edtech', 'EAD', 'cursos online', 'aprendizado'],
  'financeiro': ['fintech', 'finanças', 'investimentos', 'banking', 'pagamentos', 'cripto'],
  'varejo': ['varejo', 'retail', 'loja', 'consumo', 'omnichannel'],
  'alimentacao': ['food', 'alimentação', 'restaurante', 'delivery', 'foodtech'],
  'imobiliario': ['imobiliário', 'proptech', 'construção', 'real estate'],
  'moda': ['moda', 'fashion', 'vestuário', 'tendências', 'estilo']
};

// Tendências simuladas (em produção, usar APIs de tendências)
const MOCK_TRENDS: IndustryTrend[] = [
  {
    id: 'trend-1',
    title: 'Vídeos Curtos Dominam o Engajamento',
    description: 'Reels, TikTok e Shorts estão gerando 3x mais engajamento que posts estáticos. Marcas que não adaptarem sua estratégia podem perder relevância.',
    category: 'content',
    relevance: 95,
    momentum: 'rising',
    sources: ['Meta Business', 'Social Media Today', 'HubSpot'],
    relatedKeywords: ['reels', 'tiktok', 'shorts', 'vídeo vertical', 'conteúdo curto'],
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    actionItems: [
      'Aumentar produção de Reels para 70% do conteúdo',
      'Testar formatos de 15, 30 e 60 segundos',
      'Usar músicas em alta e trends do momento'
    ]
  },
  {
    id: 'trend-2',
    title: 'IA Generativa na Criação de Conteúdo',
    description: 'Ferramentas como ChatGPT e Midjourney estão revolucionando a criação de conteúdo. Empresas que dominarem essas ferramentas terão vantagem competitiva.',
    category: 'technology',
    relevance: 90,
    momentum: 'rising',
    sources: ['OpenAI', 'Forbes', 'TechCrunch'],
    relatedKeywords: ['ChatGPT', 'IA', 'automação', 'conteúdo gerado por IA'],
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    actionItems: [
      'Treinar equipe em ferramentas de IA',
      'Criar workflows de produção com IA',
      'Manter autenticidade humana no conteúdo final'
    ]
  },
  {
    id: 'trend-3',
    title: 'Autenticidade e UGC em Alta',
    description: 'Conteúdo gerado por usuários e posts autênticos estão performando melhor que produções polidas. Consumidores buscam conexão real com marcas.',
    category: 'consumer_behavior',
    relevance: 85,
    momentum: 'rising',
    sources: ['Nielsen', 'Sprout Social', 'Later'],
    relatedKeywords: ['UGC', 'autenticidade', 'behind the scenes', 'storytelling'],
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    actionItems: [
      'Incentivar clientes a criar conteúdo',
      'Mostrar bastidores da empresa',
      'Reduzir filtros e edições excessivas'
    ]
  },
  {
    id: 'trend-4',
    title: 'Social Commerce Cresce 30%',
    description: 'Vendas diretas via Instagram Shop e Facebook Marketplace crescem exponencialmente. Integração entre descoberta e compra é o novo padrão.',
    category: 'marketing',
    relevance: 80,
    momentum: 'rising',
    sources: ['eMarketer', 'Instagram Business', 'Shopify'],
    relatedKeywords: ['social commerce', 'instagram shop', 'compras sociais', 'live shopping'],
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
    actionItems: [
      'Configurar Instagram/Facebook Shop',
      'Criar posts com tags de produtos',
      'Testar live shopping'
    ]
  },
  {
    id: 'trend-5',
    title: 'LinkedIn Ganha Força para B2B',
    description: 'Engajamento no LinkedIn cresceu 50% no último ano. Ideal para empresas B2B e profissionais que buscam autoridade no mercado.',
    category: 'platform_update',
    relevance: 75,
    momentum: 'rising',
    sources: ['LinkedIn', 'Content Marketing Institute', 'B2B Marketing'],
    relatedKeywords: ['LinkedIn', 'B2B', 'thought leadership', 'networking profissional'],
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
    actionItems: [
      'Aumentar frequência de posts no LinkedIn',
      'Criar artigos longos na plataforma',
      'Engajar em grupos relevantes'
    ]
  }
];

// Notícias simuladas
const MOCK_NEWS: NewsItem[] = [
  {
    id: 'news-1',
    title: 'Instagram Anuncia Novo Algoritmo que Prioriza Reels',
    summary: 'A Meta confirmou que o algoritmo do Instagram agora prioriza conteúdo em vídeo, especialmente Reels, em detrimento de posts estáticos.',
    source: 'TechCrunch',
    url: 'https://techcrunch.com/instagram-algorithm',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    category: 'platform_update',
    sentiment: 'neutral',
    relevanceScore: 95,
    keywords: ['instagram', 'algoritmo', 'reels', 'vídeo'],
    aiAnalysis: 'Impacto direto na estratégia de conteúdo. Recomendamos aumentar produção de Reels imediatamente.'
  },
  {
    id: 'news-2',
    title: 'Black Friday 2024: Expectativa de Crescimento de 15% nas Vendas Online',
    summary: 'Pesquisa indica que consumidores planejam gastar mais online nesta Black Friday, com foco em redes sociais para descoberta de ofertas.',
    source: 'E-commerce Brasil',
    url: 'https://ecommercebrasil.com.br/black-friday',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    category: 'seasonal',
    sentiment: 'positive',
    relevanceScore: 90,
    keywords: ['black friday', 'e-commerce', 'vendas', 'promoção'],
    aiAnalysis: 'Oportunidade para campanhas de tráfego pago. Prepare conteúdos promocionais com antecedência.'
  },
  {
    id: 'news-3',
    title: 'WhatsApp Business Lança Novos Recursos para Empresas',
    summary: 'Novos recursos incluem catálogo de produtos aprimorado e integração com sistemas de CRM.',
    source: 'Meta for Business',
    url: 'https://business.whatsapp.com/news',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
    category: 'technology',
    sentiment: 'positive',
    relevanceScore: 85,
    keywords: ['whatsapp', 'business', 'crm', 'vendas'],
    aiAnalysis: 'Considere integrar WhatsApp Business na estratégia de atendimento e vendas.'
  }
];

/**
 * Analisar tendências para uma indústria específica
 */
export function analyzeTrends(industry: string): TrendReport {
  const keywords = INDUSTRY_KEYWORDS[industry] || INDUSTRY_KEYWORDS['marketing_digital'];
  
  // Filtrar e ordenar tendências por relevância
  const relevantTrends = MOCK_TRENDS
    .map(trend => ({
      ...trend,
      relevance: calculateRelevance(trend, keywords)
    }))
    .sort((a, b) => b.relevance - a.relevance);

  // Filtrar notícias relevantes
  const relevantNews = MOCK_NEWS
    .map(news => ({
      ...news,
      relevanceScore: calculateNewsRelevance(news, keywords)
    }))
    .filter(news => news.relevanceScore > 50)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Gerar insights
  const insights = generateInsights(relevantTrends, relevantNews);
  
  // Identificar oportunidades e ameaças
  const { opportunities, threats } = identifyOpportunitiesAndThreats(relevantTrends, relevantNews);
  
  // Gerar recomendações
  const recommendations = generateRecommendations(relevantTrends, opportunities, threats);

  return {
    industry,
    generatedAt: new Date(),
    trends: relevantTrends,
    news: relevantNews,
    insights,
    opportunities,
    threats,
    recommendations
  };
}

/**
 * Calcular relevância de uma tendência para keywords
 */
function calculateRelevance(trend: IndustryTrend, keywords: string[]): number {
  let score = trend.relevance;
  
  // Aumentar score se keywords da tendência matcham com a indústria
  const matchingKeywords = trend.relatedKeywords.filter(k => 
    keywords.some(ik => k.toLowerCase().includes(ik.toLowerCase()) || ik.toLowerCase().includes(k.toLowerCase()))
  );
  
  score += matchingKeywords.length * 5;
  
  // Tendências em alta são mais relevantes
  if (trend.momentum === 'rising') score += 10;
  
  return Math.min(100, score);
}

/**
 * Calcular relevância de notícia
 */
function calculateNewsRelevance(news: NewsItem, keywords: string[]): number {
  let score = news.relevanceScore;
  
  const matchingKeywords = news.keywords.filter(k => 
    keywords.some(ik => k.toLowerCase().includes(ik.toLowerCase()))
  );
  
  score += matchingKeywords.length * 10;
  
  // Notícias recentes são mais relevantes
  const hoursAgo = (Date.now() - news.publishedAt.getTime()) / (1000 * 60 * 60);
  if (hoursAgo < 24) score += 10;
  
  return Math.min(100, score);
}

/**
 * Gerar insights baseados nas tendências e notícias
 */
function generateInsights(trends: IndustryTrend[], news: NewsItem[]): string[] {
  const insights: string[] = [];
  
  // Insight sobre tendências em alta
  const risingTrends = trends.filter(t => t.momentum === 'rising');
  if (risingTrends.length > 0) {
    insights.push(`📈 ${risingTrends.length} tendências em alta no seu setor. Destaque para: ${risingTrends[0].title}`);
  }
  
  // Insight sobre notícias recentes
  const recentNews = news.filter(n => 
    (Date.now() - n.publishedAt.getTime()) < 24 * 60 * 60 * 1000
  );
  if (recentNews.length > 0) {
    insights.push(`📰 ${recentNews.length} notícias relevantes nas últimas 24h`);
  }
  
  // Insight sobre conteúdo
  const contentTrends = trends.filter(t => t.category === 'content');
  if (contentTrends.length > 0) {
    insights.push(`🎬 Tendência de conteúdo: ${contentTrends[0].title}`);
  }
  
  // Insight sobre tecnologia
  const techTrends = trends.filter(t => t.category === 'technology');
  if (techTrends.length > 0) {
    insights.push(`🤖 Inovação tecnológica: ${techTrends[0].title}`);
  }
  
  return insights;
}

/**
 * Identificar oportunidades e ameaças
 */
function identifyOpportunitiesAndThreats(
  trends: IndustryTrend[], 
  news: NewsItem[]
): { opportunities: string[]; threats: string[] } {
  const opportunities: string[] = [];
  const threats: string[] = [];
  
  // Analisar tendências
  for (const trend of trends.slice(0, 5)) {
    if (trend.momentum === 'rising') {
      opportunities.push(`${trend.title}: ${trend.actionItems[0]}`);
    }
    if (trend.momentum === 'declining') {
      threats.push(`Declínio em ${trend.title} - revise sua estratégia`);
    }
  }
  
  // Analisar notícias
  for (const item of news.slice(0, 3)) {
    if (item.sentiment === 'positive') {
      opportunities.push(`${item.title}`);
    }
    if (item.sentiment === 'negative') {
      threats.push(`${item.title}`);
    }
  }
  
  return { opportunities, threats };
}

/**
 * Gerar recomendações baseadas na análise
 */
function generateRecommendations(
  trends: IndustryTrend[],
  opportunities: string[],
  threats: string[]
): string[] {
  const recommendations: string[] = [];
  
  // Recomendações baseadas nas top tendências
  for (const trend of trends.slice(0, 3)) {
    recommendations.push(...trend.actionItems.slice(0, 1));
  }
  
  // Recomendação geral se houver muitas oportunidades
  if (opportunities.length > 3) {
    recommendations.push('Priorize as oportunidades de maior impacto e crie um plano de ação');
  }
  
  // Recomendação se houver ameaças
  if (threats.length > 0) {
    recommendations.push('Monitore as ameaças identificadas e prepare planos de contingência');
  }
  
  return [...new Set(recommendations)].slice(0, 5);
}

/**
 * Gerar mensagem da Val sobre tendências
 */
export function generateValTrendMessage(report: TrendReport): string {
  let message = `📊 **Análise de Tendências - ${report.industry}**\n\n`;
  
  if (report.trends.length > 0) {
    message += `**🔥 Top Tendência:** ${report.trends[0].title}\n`;
    message += `${report.trends[0].description.slice(0, 150)}...\n\n`;
  }
  
  if (report.insights.length > 0) {
    message += `**💡 Insights:**\n`;
    report.insights.slice(0, 3).forEach(insight => {
      message += `• ${insight}\n`;
    });
    message += '\n';
  }
  
  if (report.recommendations.length > 0) {
    message += `**🎯 Recomendação:** ${report.recommendations[0]}`;
  }
  
  return message;
}

/**
 * Buscar notícias do setor (simulado)
 */
export async function fetchIndustryNews(industry: string, limit: number = 10): Promise<NewsItem[]> {
  // Em produção, integrar com APIs de notícias como:
  // - NewsAPI
  // - Google News API
  // - Feedly API
  // - RSS feeds específicos do setor
  
  return MOCK_NEWS.slice(0, limit);
}

export default {
  analyzeTrends,
  generateValTrendMessage,
  fetchIndustryNews
};









