/**
 * Valle 360 - Social Media Sentiment Analysis
 * Análise de sentimento de comentários e menções em redes sociais
 */

// import { getOpenAIClient } from '@/lib/integrations/openai/client'; // Descomentado quando integrar com OpenAI

// =====================================================
// TIPOS
// =====================================================

export interface SocialMention {
  id: string;
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube';
  type: 'comment' | 'review' | 'mention' | 'dm';
  text: string;
  authorName: string;
  authorUsername?: string;
  authorAvatar?: string;
  postUrl?: string;
  createdAt: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  sentimentScore?: number; // -1 a 1
  topics?: string[];
  isInfluencer?: boolean;
  engagementCount?: number;
}

export interface SentimentAnalysisResult {
  overall: 'positive' | 'neutral' | 'negative';
  score: number; // -1 a 1
  confidence: number; // 0 a 1
  summary: string;
  topics: string[];
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
  };
}

export interface SocialSentimentMetrics {
  totalMentions: number;
  bySentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  byPlatform: Record<string, number>;
  topKeywords: string[];
  sentimentTrend: {
    period: string;
    score: number;
  }[];
  averageSentiment: number;
  alertsCount: number;
}

export interface SentimentAlert {
  id: string;
  type: 'negative_spike' | 'influencer_negative' | 'viral_negative' | 'crisis';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  mentions: SocialMention[];
  createdAt: string;
  isResolved: boolean;
}

// =====================================================
// CLIENTE DE ANÁLISE
// =====================================================

class SocialSentimentAnalyzer {
  /**
   * Analisa sentimento de um texto usando IA
   */
  async analyzeSentiment(text: string): Promise<SentimentAnalysisResult> {
    try {
      // Usar OpenAI para análise de sentimento
      const prompt = `Analise o sentimento do seguinte texto em português brasileiro.
      
Texto: "${text}"

Responda APENAS em JSON válido com a seguinte estrutura:
{
  "overall": "positive" | "neutral" | "negative",
  "score": número de -1 (muito negativo) a 1 (muito positivo),
  "confidence": número de 0 a 1,
  "summary": "resumo curto de uma linha",
  "topics": ["tópico1", "tópico2"],
  "emotions": {
    "joy": 0-1,
    "sadness": 0-1,
    "anger": 0-1,
    "fear": 0-1,
    "surprise": 0-1
  }
}`;

      // Em produção, chamar OpenAI
      // const response = await openaiClient.chat(prompt);
      
      // Mock para desenvolvimento
      const score = this.quickSentimentScore(text);
      
      return {
        overall: score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral',
        score,
        confidence: 0.85,
        summary: score > 0.2 
          ? 'Comentário positivo com tom elogioso'
          : score < -0.2
          ? 'Comentário com tom crítico ou insatisfeito'
          : 'Comentário neutro ou informativo',
        topics: this.extractTopics(text),
        emotions: {
          joy: Math.max(0, score),
          sadness: Math.max(0, -score * 0.5),
          anger: Math.max(0, -score * 0.3),
          fear: 0,
          surprise: 0.1
        }
      };
    } catch (error) {
      console.error('Erro na análise de sentimento:', error);
      return {
        overall: 'neutral',
        score: 0,
        confidence: 0,
        summary: 'Não foi possível analisar',
        topics: [],
        emotions: { joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0 }
      };
    }
  }

  /**
   * Análise rápida de sentimento (sem IA)
   */
  private quickSentimentScore(text: string): number {
    const positiveWords = [
      'excelente', 'ótimo', 'maravilhoso', 'perfeito', 'incrível', 'amei',
      'recomendo', 'parabéns', 'satisfeito', 'melhor', 'fantástico', 'adorei',
      'profissional', 'qualidade', 'rápido', 'eficiente', 'obrigado'
    ];
    
    const negativeWords = [
      'péssimo', 'ruim', 'horrível', 'terrível', 'pior', 'decepcionado',
      'insatisfeito', 'problema', 'demora', 'atraso', 'falta', 'não recomendo',
      'reclamação', 'descaso', 'enganação', 'fraude', 'golpe'
    ];

    const lowerText = text.toLowerCase();
    let score = 0;

    positiveWords.forEach(word => {
      if (lowerText.includes(word)) score += 0.2;
    });

    negativeWords.forEach(word => {
      if (lowerText.includes(word)) score -= 0.3;
    });

    return Math.max(-1, Math.min(1, score));
  }

  /**
   * Extrai tópicos principais do texto
   */
  private extractTopics(text: string): string[] {
    const topics: string[] = [];
    const lowerText = text.toLowerCase();

    const topicKeywords: Record<string, string[]> = {
      'Atendimento': ['atendimento', 'suporte', 'resposta', 'comunicação'],
      'Qualidade': ['qualidade', 'resultado', 'trabalho', 'entrega'],
      'Prazo': ['prazo', 'atraso', 'demora', 'tempo'],
      'Preço': ['preço', 'valor', 'caro', 'barato', 'custo'],
      'Profissionalismo': ['profissional', 'competente', 'experiente']
    };

    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(kw => lowerText.includes(kw))) {
        topics.push(topic);
      }
    });

    return topics;
  }

  /**
   * Analisa múltiplas menções
   */
  async analyzeMentions(mentions: SocialMention[]): Promise<SocialMention[]> {
    const analyzed = await Promise.all(
      mentions.map(async (mention) => {
        const analysis = await this.analyzeSentiment(mention.text);
        return {
          ...mention,
          sentiment: analysis.overall,
          sentimentScore: analysis.score,
          topics: analysis.topics
        };
      })
    );
    return analyzed;
  }

  /**
   * Busca menções recentes (mock)
   */
  async getRecentMentions(clientId: string): Promise<SocialMention[]> {
    // Em produção, buscar de APIs de redes sociais
    
    return [
      {
        id: 'mention_1',
        platform: 'instagram',
        type: 'comment',
        text: 'Vocês são incríveis! O trabalho ficou perfeito, superou minhas expectativas!',
        authorName: 'Maria Silva',
        authorUsername: '@mariasilva',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        engagementCount: 15
      },
      {
        id: 'mention_2',
        platform: 'facebook',
        type: 'review',
        text: 'Contratei para gerenciar minhas redes sociais e estou muito satisfeito com os resultados.',
        authorName: 'João Santos',
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        engagementCount: 8
      },
      {
        id: 'mention_3',
        platform: 'instagram',
        type: 'comment',
        text: 'Poderiam melhorar o tempo de resposta nas mensagens...',
        authorName: 'Pedro Costa',
        authorUsername: '@pedrocosta',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        engagementCount: 3
      },
      {
        id: 'mention_4',
        platform: 'linkedin',
        type: 'mention',
        text: 'Excelente parceria com a Valle 360! Profissionais de alto nível.',
        authorName: 'Ana Oliveira',
        authorUsername: 'anaoliveira',
        isInfluencer: true,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        engagementCount: 150
      },
      {
        id: 'mention_5',
        platform: 'twitter',
        type: 'mention',
        text: 'Alguém já trabalhou com a Valle 360? Estou pensando em contratar.',
        authorName: 'Carlos Ferreira',
        authorUsername: '@carlosf',
        createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        engagementCount: 25
      }
    ];
  }

  /**
   * Calcula métricas consolidadas
   */
  async getMetrics(clientId: string): Promise<SocialSentimentMetrics> {
    const mentions = await this.getRecentMentions(clientId);
    const analyzedMentions = await this.analyzeMentions(mentions);

    const bySentiment = {
      positive: analyzedMentions.filter(m => m.sentiment === 'positive').length,
      neutral: analyzedMentions.filter(m => m.sentiment === 'neutral').length,
      negative: analyzedMentions.filter(m => m.sentiment === 'negative').length
    };

    const byPlatform: Record<string, number> = {};
    analyzedMentions.forEach(m => {
      byPlatform[m.platform] = (byPlatform[m.platform] || 0) + 1;
    });

    const allTopics = analyzedMentions.flatMap(m => m.topics || []);
    const topicCounts = allTopics.reduce((acc, topic) => {
      acc[topic] = (acc[topic] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topKeywords = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);

    const avgScore = analyzedMentions.reduce((sum, m) => sum + (m.sentimentScore || 0), 0) / analyzedMentions.length;

    return {
      totalMentions: mentions.length,
      bySentiment,
      byPlatform,
      topKeywords,
      sentimentTrend: [
        { period: 'Semana 1', score: 0.6 },
        { period: 'Semana 2', score: 0.5 },
        { period: 'Semana 3', score: 0.7 },
        { period: 'Semana 4', score: 0.65 }
      ],
      averageSentiment: Number(avgScore.toFixed(2)),
      alertsCount: bySentiment.negative
    };
  }

  /**
   * Gera alertas baseado em menções
   */
  async generateAlerts(clientId: string): Promise<SentimentAlert[]> {
    const mentions = await this.getRecentMentions(clientId);
    const analyzedMentions = await this.analyzeMentions(mentions);
    const alerts: SentimentAlert[] = [];

    // Alerta para menções negativas de influenciadores
    const influencerNegative = analyzedMentions.filter(
      m => m.isInfluencer && m.sentiment === 'negative'
    );
    if (influencerNegative.length > 0) {
      alerts.push({
        id: `alert_influencer_${Date.now()}`,
        type: 'influencer_negative',
        severity: 'high',
        title: 'Menção negativa de influenciador',
        description: 'Um influenciador fez uma menção negativa sobre sua marca',
        mentions: influencerNegative,
        createdAt: new Date().toISOString(),
        isResolved: false
      });
    }

    // Alerta para spike de menções negativas
    const negativeCount = analyzedMentions.filter(m => m.sentiment === 'negative').length;
    if (negativeCount >= 3) {
      alerts.push({
        id: `alert_spike_${Date.now()}`,
        type: 'negative_spike',
        severity: 'medium',
        title: 'Aumento de menções negativas',
        description: `${negativeCount} menções negativas detectadas recentemente`,
        mentions: analyzedMentions.filter(m => m.sentiment === 'negative'),
        createdAt: new Date().toISOString(),
        isResolved: false
      });
    }

    return alerts;
  }
}

// Exportar instância singleton
export const socialSentimentAnalyzer = new SocialSentimentAnalyzer();
export default socialSentimentAnalyzer;

