// Sistema de Níveis Valle Club 2.0

export interface Level {
  id: string;
  name: string;
  minPoints: number;
  maxPoints: number;
  icon: string;
  color: string;
  bgGradient: string;
  benefits: string[];
  badge: string;
}

export const LEVELS: Level[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    minPoints: 0,
    maxPoints: 499,
    icon: '🥉',
    color: '#CD7F32',
    bgGradient: 'from-amber-600 to-amber-800',
    benefits: [
      'Acesso ao painel básico',
      'Suporte por chat',
      'Relatórios mensais'
    ],
    badge: '/badges/bronze.svg'
  },
  {
    id: 'silver',
    name: 'Prata',
    minPoints: 500,
    maxPoints: 1999,
    icon: '🥈',
    color: '#C0C0C0',
    bgGradient: 'from-gray-400 to-gray-600',
    benefits: [
      'Todos os benefícios Bronze',
      'Prioridade média no atendimento',
      'Relatórios semanais',
      'Acesso a templates exclusivos'
    ],
    badge: '/badges/silver.svg'
  },
  {
    id: 'gold',
    name: 'Ouro',
    minPoints: 2000,
    maxPoints: 4999,
    icon: '🥇',
    color: '#FFD700',
    bgGradient: 'from-yellow-400 to-amber-500',
    benefits: [
      'Todos os benefícios Prata',
      'Prioridade alta no atendimento',
      'Brindes exclusivos',
      'Acesso antecipado a novidades',
      'Consultoria mensal de 30min'
    ],
    badge: '/badges/gold.svg'
  },
  {
    id: 'platinum',
    name: 'Platina',
    minPoints: 5000,
    maxPoints: 14999,
    icon: '💎',
    color: '#E5E4E2',
    bgGradient: 'from-slate-300 to-slate-500',
    benefits: [
      'Todos os benefícios Ouro',
      '10% de desconto em serviços extras',
      'Gestor de conta dedicado',
      'Consultoria semanal',
      'Convites para eventos exclusivos'
    ],
    badge: '/badges/platinum.svg'
  },
  {
    id: 'diamond',
    name: 'Diamante',
    minPoints: 15000,
    maxPoints: Infinity,
    icon: '👑',
    color: '#B9F2FF',
    bgGradient: 'from-cyan-300 to-blue-500',
    benefits: [
      'Todos os benefícios Platina',
      '20% de desconto em serviços extras',
      'Acesso VIP total',
      'Linha direta com diretoria',
      'Participação em decisões de produto',
      'Viagem exclusiva anual'
    ],
    badge: '/badges/diamond.svg'
  }
];

export function getLevelByPoints(points: number): Level {
  return LEVELS.find(level => points >= level.minPoints && points <= level.maxPoints) || LEVELS[0];
}

export function getNextLevel(currentLevel: Level): Level | null {
  const currentIndex = LEVELS.findIndex(l => l.id === currentLevel.id);
  return currentIndex < LEVELS.length - 1 ? LEVELS[currentIndex + 1] : null;
}

export function getProgressToNextLevel(points: number): { progress: number; pointsNeeded: number; nextLevel: Level | null } {
  const currentLevel = getLevelByPoints(points);
  const nextLevel = getNextLevel(currentLevel);
  
  if (!nextLevel) {
    return { progress: 100, pointsNeeded: 0, nextLevel: null };
  }
  
  const pointsInCurrentLevel = points - currentLevel.minPoints;
  const pointsToNextLevel = nextLevel.minPoints - currentLevel.minPoints;
  const progress = Math.min(100, (pointsInCurrentLevel / pointsToNextLevel) * 100);
  const pointsNeeded = nextLevel.minPoints - points;
  
  return { progress, pointsNeeded, nextLevel };
}

// Ações que geram pontos
export const POINT_ACTIONS = {
  APPROVE_POST: 10,           // Aprovar post rapidamente
  APPROVE_POST_FAST: 20,      // Aprovar em menos de 24h
  COMPLETE_BRIEFING: 50,      // Preencher briefing completo
  FEEDBACK_DETAILED: 30,      // Dar feedback detalhado
  REFERRAL: 500,              // Indicar novo cliente
  MONTHLY_ACTIVE: 100,        // Estar ativo no mês
  STREAK_7_DAYS: 50,          // Streak de 7 dias
  STREAK_30_DAYS: 200,        // Streak de 30 dias
  FIRST_APPROVAL: 100,        // Primeira aprovação
  CONNECT_INSTAGRAM: 150,     // Conectar Instagram
  COMPLETE_ONBOARDING: 200,   // Completar onboarding
};

export type PointAction = keyof typeof POINT_ACTIONS;

// Função compatível com API antiga
export function getLevelInfo(points: number): { 
  level: number; 
  tier: string; 
  currentLevel: Level; 
  nextLevel: Level | null; 
  progress: number; 
  pointsNeeded: number;
  color: string;
  pointsForNext: number;
  icon: string;
  bgGradient: string;
} {
  const currentLevel = getLevelByPoints(points);
  const nextLevel = getNextLevel(currentLevel);
  const progressData = getProgressToNextLevel(points);
  
  // Mapear nível para número (1-5)
  const levelNumber = LEVELS.findIndex(l => l.id === currentLevel.id) + 1;
  
  return {
    level: levelNumber,
    tier: currentLevel.name,
    currentLevel,
    nextLevel,
    progress: progressData.progress,
    pointsNeeded: progressData.pointsNeeded,
    color: currentLevel.color,
    pointsForNext: nextLevel ? nextLevel.minPoints : currentLevel.maxPoints,
    icon: currentLevel.icon,
    bgGradient: currentLevel.bgGradient
  };
}
