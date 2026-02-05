/**
 * Sistema de Badges e Conquistas - Valle 360
 * Badges que podem ser conquistadas pelos colaboradores com recompensas tangíveis
 */

export interface BadgeReward {
  type: 'points' | 'time_off' | 'bonus' | 'gift' | 'certificate' | 'recognition' | 'promotion_priority'
  value: number | string
  description: string
  requiresHRApproval: boolean
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  criteria: BadgeCriteria
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  category: BadgeCategory
  rewards: BadgeReward[]
  pointsAwarded: number
}

export interface BadgeCriteria {
  type: 'count' | 'streak' | 'achievement' | 'milestone' | 'rating'
  metric: string
  threshold: number
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'alltime'
}

export type BadgeCategory = 
  | 'produtividade' 
  | 'qualidade' 
  | 'colaboracao' 
  | 'consistencia' 
  | 'marcos' 
  | 'inovacao'
  | 'lideranca'
  | 'cliente'

export const BADGE_CATEGORIES: Record<BadgeCategory, { name: string; color: string; icon: string }> = {
  produtividade: { name: 'Produtividade', color: '#3B82F6', icon: '⚡' },
  qualidade: { name: 'Qualidade', color: '#10B981', icon: '💎' },
  colaboracao: { name: 'Colaboração', color: '#EC4899', icon: '🤝' },
  consistencia: { name: 'Consistência', color: '#F59E0B', icon: '🔥' },
  marcos: { name: 'Marcos', color: '#8B5CF6', icon: '🏆' },
  inovacao: { name: 'Inovação', color: '#06B6D4', icon: '💡' },
  lideranca: { name: 'Liderança', color: '#EF4444', icon: '👑' },
  cliente: { name: 'Cliente', color: '#14B8A6', icon: '😊' }
}

export const PREDEFINED_BADGES: Badge[] = [
  // ==================== PRODUTIVIDADE ====================
  {
    id: 'velocista',
    name: 'Velocista',
    description: 'Complete 10 tarefas em um único dia',
    icon: '⚡',
    criteria: {
      type: 'count',
      metric: 'tasks_completed_daily',
      threshold: 10,
      period: 'day'
    },
    rarity: 'rare',
    category: 'produtividade',
    pointsAwarded: 100,
    rewards: [
      { type: 'points', value: 100, description: '+100 pontos de XP', requiresHRApproval: false },
      { type: 'time_off', value: 1, description: '1 hora de folga acumulada', requiresHRApproval: true }
    ]
  },
  {
    id: 'madrugador',
    name: 'Madrugador',
    description: 'Faça 20 entregas antes das 9h da manhã',
    icon: '🌅',
    criteria: {
      type: 'count',
      metric: 'early_deliveries',
      threshold: 20,
      period: 'alltime'
    },
    rarity: 'rare',
    category: 'produtividade',
    pointsAwarded: 75,
    rewards: [
      { type: 'points', value: 75, description: '+75 pontos de XP', requiresHRApproval: false },
      { type: 'gift', value: 'cafe_especial', description: 'Café especial da empresa', requiresHRApproval: true }
    ]
  },
  {
    id: 'maquina_entregas',
    name: 'Máquina de Entregas',
    description: 'Complete 50 tarefas em uma semana',
    icon: '🚀',
    criteria: {
      type: 'count',
      metric: 'tasks_completed_weekly',
      threshold: 50,
      period: 'week'
    },
    rarity: 'epic',
    category: 'produtividade',
    pointsAwarded: 200,
    rewards: [
      { type: 'points', value: 200, description: '+200 pontos de XP', requiresHRApproval: false },
      { type: 'bonus', value: 50, description: 'Vale presente R$50', requiresHRApproval: true }
    ]
  },
  {
    id: 'turbo_mode',
    name: 'Turbo Mode',
    description: 'Complete 5 tarefas em 2 horas',
    icon: '💨',
    criteria: {
      type: 'count',
      metric: 'tasks_in_2hours',
      threshold: 5,
      period: 'day'
    },
    rarity: 'common',
    category: 'produtividade',
    pointsAwarded: 50,
    rewards: [
      { type: 'points', value: 50, description: '+50 pontos de XP', requiresHRApproval: false }
    ]
  },
  {
    id: 'ninja_prazo',
    name: 'Ninja do Prazo',
    description: '100 entregas antes do deadline',
    icon: '🥷',
    criteria: {
      type: 'count',
      metric: 'on_time_deliveries',
      threshold: 100,
      period: 'alltime'
    },
    rarity: 'epic',
    category: 'produtividade',
    pointsAwarded: 250,
    rewards: [
      { type: 'points', value: 250, description: '+250 pontos de XP', requiresHRApproval: false },
      { type: 'certificate', value: 'pontualidade', description: 'Certificado de Pontualidade', requiresHRApproval: false }
    ]
  },

  // ==================== QUALIDADE ====================
  {
    id: 'perfeccionista',
    name: 'Perfeccionista',
    description: '20 entregas aprovadas sem revisão',
    icon: '💎',
    criteria: {
      type: 'count',
      metric: 'approved_without_revision',
      threshold: 20,
      period: 'alltime'
    },
    rarity: 'epic',
    category: 'qualidade',
    pointsAwarded: 150,
    rewards: [
      { type: 'points', value: 150, description: '+150 pontos de XP', requiresHRApproval: false },
      { type: 'certificate', value: 'excelencia', description: 'Certificado de Excelência', requiresHRApproval: false }
    ]
  },
  {
    id: 'cliente_feliz',
    name: 'Cliente Feliz',
    description: 'Receba NPS 9+ de 10 clientes diferentes',
    icon: '😊',
    criteria: {
      type: 'count',
      metric: 'high_nps_count',
      threshold: 10,
      period: 'alltime'
    },
    rarity: 'rare',
    category: 'qualidade',
    pointsAwarded: 200,
    rewards: [
      { type: 'points', value: 200, description: '+200 pontos de XP', requiresHRApproval: false },
      { type: 'bonus', value: 100, description: 'Bônus R$100', requiresHRApproval: true }
    ]
  },
  {
    id: 'zero_bugs',
    name: 'Zero Bugs',
    description: '30 entregas sem erros reportados',
    icon: '🛡️',
    criteria: {
      type: 'count',
      metric: 'error_free_deliveries',
      threshold: 30,
      period: 'alltime'
    },
    rarity: 'epic',
    category: 'qualidade',
    pointsAwarded: 175,
    rewards: [
      { type: 'points', value: 175, description: '+175 pontos de XP', requiresHRApproval: false },
      { type: 'recognition', value: 'mural', description: 'Destaque no mural da empresa', requiresHRApproval: false }
    ]
  },
  {
    id: 'aprovado_primeira',
    name: 'Aprovado de Primeira',
    description: '50 aprovações imediatas do cliente',
    icon: '✅',
    criteria: {
      type: 'count',
      metric: 'first_try_approvals',
      threshold: 50,
      period: 'alltime'
    },
    rarity: 'legendary',
    category: 'qualidade',
    pointsAwarded: 300,
    rewards: [
      { type: 'points', value: 300, description: '+300 pontos de XP', requiresHRApproval: false },
      { type: 'time_off', value: 8, description: '1 Day-off (8 horas)', requiresHRApproval: true }
    ]
  },
  {
    id: 'midas',
    name: 'Toque de Midas',
    description: 'Mantenha taxa de qualidade acima de 95% por 3 meses',
    icon: '👑',
    criteria: {
      type: 'streak',
      metric: 'quality_rate_95',
      threshold: 90,
      period: 'quarter'
    },
    rarity: 'legendary',
    category: 'qualidade',
    pointsAwarded: 500,
    rewards: [
      { type: 'points', value: 500, description: '+500 pontos de XP', requiresHRApproval: false },
      { type: 'bonus', value: 200, description: 'Bônus R$200', requiresHRApproval: true },
      { type: 'promotion_priority', value: 'high', description: 'Prioridade em promoções', requiresHRApproval: true }
    ]
  },

  // ==================== COLABORAÇÃO ====================
  {
    id: 'colaborador_estrela',
    name: 'Colaborador Estrela',
    description: 'Ajude 50 colegas com suas tarefas',
    icon: '⭐',
    criteria: {
      type: 'count',
      metric: 'help_to_colleagues',
      threshold: 50,
      period: 'alltime'
    },
    rarity: 'epic',
    category: 'colaboracao',
    pointsAwarded: 200,
    rewards: [
      { type: 'points', value: 200, description: '+200 pontos de XP', requiresHRApproval: false },
      { type: 'gift', value: 'almoco_lideranca', description: 'Almoço com a liderança', requiresHRApproval: true }
    ]
  },
  {
    id: 'mentor',
    name: 'Mentor',
    description: 'Realize 5 treinamentos para a equipe',
    icon: '🎓',
    criteria: {
      type: 'count',
      metric: 'trainings_given',
      threshold: 5,
      period: 'alltime'
    },
    rarity: 'epic',
    category: 'colaboracao',
    pointsAwarded: 300,
    rewards: [
      { type: 'points', value: 300, description: '+300 pontos de XP', requiresHRApproval: false },
      { type: 'recognition', value: 'titulo_mentor', description: 'Título de Mentor Oficial', requiresHRApproval: true }
    ]
  },
  {
    id: 'comunicador',
    name: 'Comunicador',
    description: 'Responda 100 mensagens em menos de 2 horas',
    icon: '💬',
    criteria: {
      type: 'count',
      metric: 'quick_responses',
      threshold: 100,
      period: 'alltime'
    },
    rarity: 'common',
    category: 'colaboracao',
    pointsAwarded: 100,
    rewards: [
      { type: 'points', value: 100, description: '+100 pontos de XP', requiresHRApproval: false }
    ]
  },
  {
    id: 'team_player',
    name: 'Team Player',
    description: 'Participe de 20 projetos em equipe',
    icon: '🤝',
    criteria: {
      type: 'count',
      metric: 'team_projects',
      threshold: 20,
      period: 'alltime'
    },
    rarity: 'rare',
    category: 'colaboracao',
    pointsAwarded: 150,
    rewards: [
      { type: 'points', value: 150, description: '+150 pontos de XP', requiresHRApproval: false },
      { type: 'gift', value: 'camiseta_exclusiva', description: 'Camiseta exclusiva da equipe', requiresHRApproval: true }
    ]
  },
  {
    id: 'embaixador',
    name: 'Embaixador',
    description: 'Indique 3 novos colaboradores contratados',
    icon: '🎯',
    criteria: {
      type: 'count',
      metric: 'successful_referrals',
      threshold: 3,
      period: 'alltime'
    },
    rarity: 'rare',
    category: 'colaboracao',
    pointsAwarded: 250,
    rewards: [
      { type: 'points', value: 250, description: '+250 pontos de XP', requiresHRApproval: false },
      { type: 'bonus', value: 300, description: 'Bônus de indicação R$300', requiresHRApproval: true }
    ]
  },

  // ==================== CONSISTÊNCIA ====================
  {
    id: 'maratonista',
    name: 'Maratonista',
    description: '30 dias consecutivos com entregas',
    icon: '🏃',
    criteria: {
      type: 'streak',
      metric: 'daily_deliveries',
      threshold: 30,
      period: 'alltime'
    },
    rarity: 'legendary',
    category: 'consistencia',
    pointsAwarded: 500,
    rewards: [
      { type: 'points', value: 500, description: '+500 pontos de XP', requiresHRApproval: false },
      { type: 'time_off', value: 16, description: '2 dias de folga', requiresHRApproval: true }
    ]
  },
  {
    id: 'dedicado',
    name: 'Dedicado',
    description: '6 meses sem faltas não justificadas',
    icon: '📅',
    criteria: {
      type: 'streak',
      metric: 'attendance',
      threshold: 180,
      period: 'alltime'
    },
    rarity: 'epic',
    category: 'consistencia',
    pointsAwarded: 400,
    rewards: [
      { type: 'points', value: 400, description: '+400 pontos de XP', requiresHRApproval: false },
      { type: 'bonus', value: 150, description: 'Bônus de assiduidade R$150', requiresHRApproval: true }
    ]
  },
  {
    id: 'relogio_suico',
    name: 'Relógio Suíço',
    description: '60 dias de pontualidade perfeita',
    icon: '⏰',
    criteria: {
      type: 'streak',
      metric: 'punctuality',
      threshold: 60,
      period: 'alltime'
    },
    rarity: 'rare',
    category: 'consistencia',
    pointsAwarded: 200,
    rewards: [
      { type: 'points', value: 200, description: '+200 pontos de XP', requiresHRApproval: false }
    ]
  },
  {
    id: 'inabalavel',
    name: 'Inabalável',
    description: '90 dias de streak de entregas',
    icon: '🔥',
    criteria: {
      type: 'streak',
      metric: 'daily_deliveries',
      threshold: 90,
      period: 'alltime'
    },
    rarity: 'legendary',
    category: 'consistencia',
    pointsAwarded: 750,
    rewards: [
      { type: 'points', value: 750, description: '+750 pontos de XP', requiresHRApproval: false },
      { type: 'gift', value: 'viagem', description: 'Viagem patrocinada pela empresa', requiresHRApproval: true }
    ]
  },
  {
    id: 'fenix',
    name: 'Fênix',
    description: 'Recupere um streak perdido e atinja 15 dias novamente',
    icon: '🔄',
    criteria: {
      type: 'achievement',
      metric: 'streak_recovery',
      threshold: 15,
      period: 'alltime'
    },
    rarity: 'rare',
    category: 'consistencia',
    pointsAwarded: 100,
    rewards: [
      { type: 'points', value: 100, description: '+100 pontos de XP', requiresHRApproval: false },
      { type: 'recognition', value: 'resiliencia', description: 'Badge de Resiliência', requiresHRApproval: false }
    ]
  },

  // ==================== MARCOS ====================
  {
    id: 'primeira_entrega',
    name: 'Primeira Entrega',
    description: 'Complete sua primeira tarefa',
    icon: '🎯',
    criteria: {
      type: 'milestone',
      metric: 'tasks_completed',
      threshold: 1,
      period: 'alltime'
    },
    rarity: 'common',
    category: 'marcos',
    pointsAwarded: 50,
    rewards: [
      { type: 'points', value: 50, description: '+50 pontos de XP', requiresHRApproval: false },
      { type: 'gift', value: 'welcome_kit', description: 'Welcome Kit Valle 360', requiresHRApproval: false }
    ]
  },
  {
    id: 'veterano',
    name: 'Veterano',
    description: 'Complete 100 tarefas',
    icon: '🏆',
    criteria: {
      type: 'milestone',
      metric: 'tasks_completed',
      threshold: 100,
      period: 'alltime'
    },
    rarity: 'rare',
    category: 'marcos',
    pointsAwarded: 300,
    rewards: [
      { type: 'points', value: 300, description: '+300 pontos de XP', requiresHRApproval: false },
      { type: 'gift', value: 'placa', description: 'Placa comemorativa', requiresHRApproval: true }
    ]
  },
  {
    id: 'lenda',
    name: 'Lenda',
    description: 'Complete 500 tarefas',
    icon: '👑',
    criteria: {
      type: 'milestone',
      metric: 'tasks_completed',
      threshold: 500,
      period: 'alltime'
    },
    rarity: 'legendary',
    category: 'marcos',
    pointsAwarded: 1000,
    rewards: [
      { type: 'points', value: 1000, description: '+1000 pontos de XP', requiresHRApproval: false },
      { type: 'bonus', value: 500, description: 'Participação nos lucros', requiresHRApproval: true }
    ]
  },
  {
    id: 'superestrela',
    name: 'Superestrela',
    description: 'Atinja o nível 20 de gamificação',
    icon: '🌟',
    criteria: {
      type: 'milestone',
      metric: 'level',
      threshold: 20,
      period: 'alltime'
    },
    rarity: 'legendary',
    category: 'marcos',
    pointsAwarded: 500,
    rewards: [
      { type: 'points', value: 500, description: '+500 pontos de XP', requiresHRApproval: false },
      { type: 'promotion_priority', value: 'high', description: 'Prioridade em promoções', requiresHRApproval: true }
    ]
  },
  {
    id: 'centuriao',
    name: 'Centurião',
    description: 'Complete 1 ano na empresa',
    icon: '🎖️',
    criteria: {
      type: 'milestone',
      metric: 'tenure_days',
      threshold: 365,
      period: 'alltime'
    },
    rarity: 'epic',
    category: 'marcos',
    pointsAwarded: 400,
    rewards: [
      { type: 'points', value: 400, description: '+400 pontos de XP', requiresHRApproval: false },
      { type: 'bonus', value: 200, description: 'Bônus de aniversário R$200', requiresHRApproval: true },
      { type: 'time_off', value: 8, description: '1 Day-off especial', requiresHRApproval: true }
    ]
  },

  // ==================== INOVAÇÃO ====================
  {
    id: 'inovador',
    name: 'Inovador',
    description: 'Tenha 10 sugestões de melhoria implementadas',
    icon: '💡',
    criteria: {
      type: 'count',
      metric: 'improvements_implemented',
      threshold: 10,
      period: 'alltime'
    },
    rarity: 'rare',
    category: 'inovacao',
    pointsAwarded: 250,
    rewards: [
      { type: 'points', value: 250, description: '+250 pontos de XP', requiresHRApproval: false },
      { type: 'gift', value: 'curso', description: 'Curso pago pela empresa', requiresHRApproval: true }
    ]
  },
  {
    id: 'solucionador',
    name: 'Solucionador',
    description: 'Resolva 25 problemas críticos',
    icon: '🔧',
    criteria: {
      type: 'count',
      metric: 'critical_issues_solved',
      threshold: 25,
      period: 'alltime'
    },
    rarity: 'epic',
    category: 'inovacao',
    pointsAwarded: 350,
    rewards: [
      { type: 'points', value: 350, description: '+350 pontos de XP', requiresHRApproval: false },
      { type: 'bonus', value: 200, description: 'Bônus R$200', requiresHRApproval: true }
    ]
  },
  {
    id: 'visionario',
    name: 'Visionário',
    description: 'Tenha 3 ideias que viraram produto/serviço',
    icon: '🔮',
    criteria: {
      type: 'count',
      metric: 'ideas_to_product',
      threshold: 3,
      period: 'alltime'
    },
    rarity: 'legendary',
    category: 'inovacao',
    pointsAwarded: 500,
    rewards: [
      { type: 'points', value: 500, description: '+500 pontos de XP', requiresHRApproval: false },
      { type: 'recognition', value: 'participacao_projeto', description: 'Participação oficial no projeto', requiresHRApproval: true },
      { type: 'bonus', value: 500, description: 'Bônus de inovação R$500', requiresHRApproval: true }
    ]
  }
]

/**
 * Verifica se um colaborador conquistou uma badge
 */
export function checkBadgeEligibility(
  badge: Badge,
  userMetrics: Record<string, number>
): boolean {
  const { criteria } = badge
  const metricValue = userMetrics[criteria.metric] || 0

  return metricValue >= criteria.threshold
}

/**
 * Retorna badges conquistadas
 */
export function getEarnedBadges(
  userMetrics: Record<string, number>
): Badge[] {
  return PREDEFINED_BADGES.filter(badge => 
    checkBadgeEligibility(badge, userMetrics)
  )
}

/**
 * Retorna próximas badges a conquistar
 */
export function getUpcomingBadges(
  userMetrics: Record<string, number>,
  limit: number = 5
): Array<Badge & { progress: number }> {
  return PREDEFINED_BADGES
    .filter(badge => !checkBadgeEligibility(badge, userMetrics))
    .map(badge => {
      const metricValue = userMetrics[badge.criteria.metric] || 0
      const progress = Math.min(100, (metricValue / badge.criteria.threshold) * 100)
      return { ...badge, progress }
    })
    .sort((a, b) => b.progress - a.progress)
    .slice(0, limit)
}

/**
 * Retorna cor baseada na raridade
 */
export function getBadgeColor(rarity: Badge['rarity']): string {
  const colors = {
    common: '#94A3B8',
    rare: '#3B82F6',
    epic: '#A855F7',
    legendary: '#F59E0B'
  }
  return colors[rarity]
}

/**
 * Retorna badges por categoria
 */
export function getBadgesByCategory(category: BadgeCategory): Badge[] {
  return PREDEFINED_BADGES.filter(badge => badge.category === category)
}

/**
 * Calcula total de pontos possíveis
 */
export function getTotalPossiblePoints(): number {
  return PREDEFINED_BADGES.reduce((total, badge) => total + badge.pointsAwarded, 0)
}

/**
 * Calcula recompensas pendentes de aprovação
 */
export function getPendingRewards(earnedBadges: Badge[]): BadgeReward[] {
  return earnedBadges
    .flatMap(badge => badge.rewards)
    .filter(reward => reward.requiresHRApproval)
}
