// Best Time Analyzer - Valle 360
// Analisa dados de engajamento para sugerir melhores horários de postagem

export interface TimeSlot {
  day: number; // 0-6 (domingo-sábado)
  hour: number; // 0-23
  engagementScore: number;
  postCount: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  avgReach: number;
}

export interface BestTimeRecommendation {
  platform: 'instagram' | 'facebook' | 'linkedin' | 'twitter';
  bestTimes: {
    day: string;
    dayNumber: number;
    times: {
      hour: string;
      score: number;
      reason: string;
    }[];
  }[];
  worstTimes: {
    day: string;
    times: string[];
  }[];
  insights: string[];
  confidence: number;
}

export interface PostPerformance {
  id: string;
  platform: string;
  postedAt: Date;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  impressions: number;
  engagement_rate: number;
}

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

/**
 * Analisa histórico de posts e retorna melhores horários
 */
export function analyzeBestTimes(
  posts: PostPerformance[],
  platform: string
): BestTimeRecommendation {
  // Filtrar posts da plataforma
  const platformPosts = posts.filter(p => p.platform === platform);
  
  // Criar matriz de performance por dia/hora
  const performanceMatrix: TimeSlot[][] = Array(7).fill(null).map(() => 
    Array(24).fill(null).map((_, hour) => ({
      day: 0,
      hour,
      engagementScore: 0,
      postCount: 0,
      avgLikes: 0,
      avgComments: 0,
      avgShares: 0,
      avgReach: 0
    }))
  );

  // Preencher matriz com dados reais
  for (const post of platformPosts) {
    const date = new Date(post.postedAt);
    const day = date.getDay();
    const hour = date.getHours();
    
    const slot = performanceMatrix[day][hour];
    slot.day = day;
    slot.postCount++;
    slot.avgLikes += post.likes;
    slot.avgComments += post.comments;
    slot.avgShares += post.shares;
    slot.avgReach += post.reach;
    
    // Score de engajamento ponderado
    slot.engagementScore += calculateEngagementScore(post);
  }

  // Calcular médias
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const slot = performanceMatrix[day][hour];
      if (slot.postCount > 0) {
        slot.avgLikes /= slot.postCount;
        slot.avgComments /= slot.postCount;
        slot.avgShares /= slot.postCount;
        slot.avgReach /= slot.postCount;
        slot.engagementScore /= slot.postCount;
      }
    }
  }

  // Encontrar melhores horários por dia
  const bestTimes = DAYS.map((dayName, dayIndex) => {
    const daySlots = performanceMatrix[dayIndex]
      .filter(slot => slot.postCount > 0 || slot.engagementScore > 0)
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, 3);

    // Se não houver dados, usar horários padrão do setor
    if (daySlots.length === 0) {
      return {
        day: dayName,
        dayNumber: dayIndex,
        times: getDefaultBestTimes(platform, dayIndex)
      };
    }

    return {
      day: dayName,
      dayNumber: dayIndex,
      times: daySlots.map(slot => ({
        hour: formatHour(slot.hour),
        score: Math.round(slot.engagementScore * 100),
        reason: generateTimeReason(slot, platform)
      }))
    };
  });

  // Encontrar piores horários
  const worstTimes = DAYS.map((dayName, dayIndex) => {
    const daySlots = performanceMatrix[dayIndex]
      .filter(slot => slot.postCount > 0)
      .sort((a, b) => a.engagementScore - b.engagementScore)
      .slice(0, 2);

    return {
      day: dayName,
      times: daySlots.map(slot => formatHour(slot.hour))
    };
  }).filter(d => d.times.length > 0);

  // Gerar insights
  const insights = generateInsights(performanceMatrix, platform, platformPosts.length);

  // Calcular confiança baseada na quantidade de dados
  const confidence = Math.min(100, Math.round((platformPosts.length / 50) * 100));

  return {
    platform: platform as BestTimeRecommendation['platform'],
    bestTimes,
    worstTimes,
    insights,
    confidence
  };
}

/**
 * Calcula score de engajamento ponderado
 */
function calculateEngagementScore(post: PostPerformance): number {
  // Pesos diferentes para cada métrica
  const weights = {
    likes: 1,
    comments: 3,      // Comentários valem mais
    shares: 5,        // Compartilhamentos valem muito
    reach: 0.01,      // Alcance é normalizado
    engagement_rate: 10
  };

  return (
    (post.likes * weights.likes) +
    (post.comments * weights.comments) +
    (post.shares * weights.shares) +
    (post.reach * weights.reach) +
    (post.engagement_rate * weights.engagement_rate)
  ) / 100;
}

/**
 * Horários padrão quando não há dados suficientes
 */
function getDefaultBestTimes(platform: string, day: number): { hour: string; score: number; reason: string }[] {
  const defaults: Record<string, Record<number, number[]>> = {
    instagram: {
      0: [11, 13, 19], // Domingo
      1: [7, 12, 19],  // Segunda
      2: [7, 12, 19],  // Terça
      3: [7, 11, 19],  // Quarta
      4: [7, 12, 17],  // Quinta
      5: [7, 11, 14],  // Sexta
      6: [10, 13, 19]  // Sábado
    },
    facebook: {
      0: [9, 12, 15],
      1: [9, 13, 16],
      2: [9, 13, 16],
      3: [9, 11, 13],
      4: [9, 12, 15],
      5: [9, 11, 14],
      6: [9, 12, 15]
    },
    linkedin: {
      0: [10, 12, 14],
      1: [7, 10, 12],
      2: [7, 10, 17],
      3: [7, 10, 12],
      4: [7, 10, 17],
      5: [7, 10, 12],
      6: [10, 12, 14]
    },
    twitter: {
      0: [9, 12, 15],
      1: [8, 12, 17],
      2: [8, 12, 17],
      3: [9, 12, 17],
      4: [8, 12, 17],
      5: [8, 12, 14],
      6: [9, 12, 15]
    }
  };

  const platformDefaults = defaults[platform] || defaults.instagram;
  const hours = platformDefaults[day] || [9, 12, 18];

  return hours.map((hour, index) => ({
    hour: formatHour(hour),
    score: 80 - (index * 10), // Score decrescente
    reason: 'Horário recomendado baseado em dados do setor'
  }));
}

/**
 * Formata hora para exibição
 */
function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}

/**
 * Gera explicação para o horário
 */
function generateTimeReason(slot: TimeSlot, platform: string): string {
  const reasons: string[] = [];

  if (slot.avgComments > 50) {
    reasons.push('alto volume de comentários');
  }
  if (slot.avgShares > 20) {
    reasons.push('muitos compartilhamentos');
  }
  if (slot.avgReach > 5000) {
    reasons.push('excelente alcance');
  }
  if (slot.engagementScore > 5) {
    reasons.push('engajamento acima da média');
  }

  if (reasons.length === 0) {
    return 'Bom desempenho histórico';
  }

  return reasons.slice(0, 2).join(' e ').replace(/^./, s => s.toUpperCase());
}

/**
 * Gera insights baseados nos dados
 */
function generateInsights(
  matrix: TimeSlot[][],
  platform: string,
  totalPosts: number
): string[] {
  const insights: string[] = [];

  // Encontrar melhor dia da semana
  const dayScores = matrix.map((day, index) => ({
    day: DAYS[index],
    score: day.reduce((sum, slot) => sum + slot.engagementScore, 0)
  })).sort((a, b) => b.score - a.score);

  if (dayScores[0].score > 0) {
    insights.push(`📅 ${dayScores[0].day} é seu melhor dia para postar no ${platform}`);
  }

  // Encontrar melhor período do dia
  const morningScore = matrix.reduce((sum, day) => 
    sum + day.slice(6, 12).reduce((s, slot) => s + slot.engagementScore, 0), 0);
  const afternoonScore = matrix.reduce((sum, day) => 
    sum + day.slice(12, 18).reduce((s, slot) => s + slot.engagementScore, 0), 0);
  const eveningScore = matrix.reduce((sum, day) => 
    sum + day.slice(18, 23).reduce((s, slot) => s + slot.engagementScore, 0), 0);

  const periods = [
    { name: 'manhã (6h-12h)', score: morningScore },
    { name: 'tarde (12h-18h)', score: afternoonScore },
    { name: 'noite (18h-23h)', score: eveningScore }
  ].sort((a, b) => b.score - a.score);

  if (periods[0].score > 0) {
    insights.push(`⏰ Seu público é mais ativo durante a ${periods[0].name}`);
  }

  // Insight sobre frequência
  if (totalPosts < 20) {
    insights.push('📊 Poste mais para obtermos dados mais precisos sobre seus melhores horários');
  } else if (totalPosts > 100) {
    insights.push('✅ Análise baseada em dados robustos de mais de 100 posts');
  }

  // Insight específico por plataforma
  const platformInsights: Record<string, string> = {
    instagram: '📸 Reels e Stories têm melhor performance nos horários de pico',
    facebook: '👥 Posts com perguntas geram mais engajamento nos horários sugeridos',
    linkedin: '💼 Conteúdo profissional performa melhor no início da manhã',
    twitter: '🐦 Threads têm melhor alcance nos horários de maior atividade'
  };

  if (platformInsights[platform]) {
    insights.push(platformInsights[platform]);
  }

  return insights;
}

/**
 * Sugere próximo melhor horário para postar
 */
export function getNextBestTime(recommendation: BestTimeRecommendation): {
  datetime: Date;
  score: number;
  reason: string;
} {
  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();

  // Procurar próximo horário bom
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const targetDay = (currentDay + dayOffset) % 7;
    const dayRecommendation = recommendation.bestTimes.find(d => d.dayNumber === targetDay);
    
    if (dayRecommendation && dayRecommendation.times.length > 0) {
      for (const time of dayRecommendation.times) {
        const hour = parseInt(time.hour.split(':')[0]);
        
        // Se for hoje, verificar se o horário já passou
        if (dayOffset === 0 && hour <= currentHour) continue;
        
        const datetime = new Date(now);
        datetime.setDate(datetime.getDate() + dayOffset);
        datetime.setHours(hour, 0, 0, 0);
        
        return {
          datetime,
          score: time.score,
          reason: time.reason
        };
      }
    }
  }

  // Fallback: próximo dia às 12h
  const fallback = new Date(now);
  fallback.setDate(fallback.getDate() + 1);
  fallback.setHours(12, 0, 0, 0);
  
  return {
    datetime: fallback,
    score: 70,
    reason: 'Horário padrão recomendado'
  };
}

/**
 * Compara performance em diferentes horários
 */
export function compareTimeSlots(
  posts: PostPerformance[],
  slot1: { day: number; hour: number },
  slot2: { day: number; hour: number }
): {
  winner: 'slot1' | 'slot2' | 'tie';
  difference: number;
  metrics: {
    slot1: { avgEngagement: number; postCount: number };
    slot2: { avgEngagement: number; postCount: number };
  };
} {
  const slot1Posts = posts.filter(p => {
    const d = new Date(p.postedAt);
    return d.getDay() === slot1.day && d.getHours() === slot1.hour;
  });

  const slot2Posts = posts.filter(p => {
    const d = new Date(p.postedAt);
    return d.getDay() === slot2.day && d.getHours() === slot2.hour;
  });

  const avg1 = slot1Posts.length > 0 
    ? slot1Posts.reduce((sum, p) => sum + calculateEngagementScore(p), 0) / slot1Posts.length 
    : 0;
  const avg2 = slot2Posts.length > 0 
    ? slot2Posts.reduce((sum, p) => sum + calculateEngagementScore(p), 0) / slot2Posts.length 
    : 0;

  const difference = Math.abs(avg1 - avg2);
  const winner = difference < 0.1 ? 'tie' : avg1 > avg2 ? 'slot1' : 'slot2';

  return {
    winner,
    difference: Math.round(difference * 100),
    metrics: {
      slot1: { avgEngagement: Math.round(avg1 * 100), postCount: slot1Posts.length },
      slot2: { avgEngagement: Math.round(avg2 * 100), postCount: slot2Posts.length }
    }
  };
}

export default {
  analyzeBestTimes,
  getNextBestTime,
  compareTimeSlots
};









