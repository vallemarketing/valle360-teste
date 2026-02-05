/**
 * Sistema de Cálculo de Scores de Gamificação
 * Baseado em boas práticas de RH Sênior
 */

export interface ScoreWeights {
  productivity: number    // 40%
  quality: number         // 30%
  collaboration: number   // 20%
  wellbeing: number       // 10%
}

export interface TaskMetrics {
  completedOnTime: number
  completedEarly: number
  completedLate: number
  totalDeliveries: number
  targetDeliveries: number
}

export interface QualityMetrics {
  approvedWithoutRevisions: number
  revisionsNeeded: number
  positiveClientFeedback: number
  averageNPS: number
}

export interface CollaborationMetrics {
  quickResponses: number          // < 2h
  helpToColleagues: number
  meetingsAttended: number
  knowledgeShared: number
}

export interface WellbeingMetrics {
  loginsOutsideHours: number
  vacationDaysUsed: number
  excessiveOvertimeWeeks: number
}

export const DEFAULT_WEIGHTS: ScoreWeights = {
  productivity: 0.40,
  quality: 0.30,
  collaboration: 0.20,
  wellbeing: 0.10
}

/**
 * Calcula score de produtividade (40% do total)
 */
export function calculateProductivityScore(metrics: TaskMetrics): number {
  const { 
    completedOnTime, 
    completedEarly, 
    completedLate,
    totalDeliveries,
    targetDeliveries 
  } = metrics

  // Pontuação por tarefas
  const onTimePoints = completedOnTime * 10
  const earlyPoints = completedEarly * 15
  const latePoints = completedLate * -5

  // Volume vs Meta (0-100)
  const volumeScore = targetDeliveries > 0 
    ? Math.min(100, (totalDeliveries / targetDeliveries) * 100)
    : 0

  // Score total de produtividade (0-100)
  const taskScore = onTimePoints + earlyPoints + latePoints
  const productivityScore = (taskScore * 0.7) + (volumeScore * 0.3)

  return Math.max(0, Math.min(100, productivityScore))
}

/**
 * Calcula score de qualidade (30% do total)
 */
export function calculateQualityScore(metrics: QualityMetrics): number {
  const {
    approvedWithoutRevisions,
    revisionsNeeded,
    positiveClientFeedback,
    averageNPS
  } = metrics

  // Pontuação por aprovações e feedbacks
  const approvalPoints = approvedWithoutRevisions * 20
  const revisionPenalty = revisionsNeeded * -10
  const feedbackPoints = positiveClientFeedback * 25

  // NPS multiplier (0.5x a 2x)
  const npsMultiplier = averageNPS >= 9 ? 2.0
    : averageNPS >= 8 ? 1.5
    : averageNPS >= 7 ? 1.2
    : averageNPS >= 6 ? 1.0
    : averageNPS >= 5 ? 0.8
    : 0.5

  // Score total de qualidade (0-100)
  const baseScore = approvalPoints + revisionPenalty + feedbackPoints
  const qualityScore = baseScore * npsMultiplier

  return Math.max(0, Math.min(100, qualityScore))
}

/**
 * Calcula score de colaboração (20% do total)
 */
export function calculateCollaborationScore(metrics: CollaborationMetrics): number {
  const {
    quickResponses,
    helpToColleagues,
    meetingsAttended,
    knowledgeShared
  } = metrics

  const responsePoints = quickResponses * 5
  const helpPoints = helpToColleagues * 15
  const meetingPoints = meetingsAttended * 10
  const knowledgePoints = knowledgeShared * 20

  const collaborationScore = responsePoints + helpPoints + meetingPoints + knowledgePoints

  return Math.max(0, Math.min(100, collaborationScore))
}

/**
 * Calcula score de bem-estar (10% do total)
 */
export function calculateWellbeingScore(metrics: WellbeingMetrics): number {
  const {
    loginsOutsideHours,
    vacationDaysUsed,
    excessiveOvertimeWeeks
  } = metrics

  const outsideHoursPenalty = loginsOutsideHours * -5
  const vacationBonus = vacationDaysUsed * 30
  const overtimePenalty = excessiveOvertimeWeeks * -10

  // Bonus por equilíbrio (se usou férias e não fez horas extras excessivas)
  const balanceBonus = (vacationDaysUsed > 0 && excessiveOvertimeWeeks === 0) ? 20 : 0

  const wellbeingScore = 50 + outsideHoursPenalty + vacationBonus + overtimePenalty + balanceBonus

  return Math.max(0, Math.min(100, wellbeingScore))
}

/**
 * Calcula score total ponderado
 */
export function calculateTotalScore(
  productivity: number,
  quality: number,
  collaboration: number,
  wellbeing: number,
  weights: ScoreWeights = DEFAULT_WEIGHTS
): number {
  return (
    productivity * weights.productivity +
    quality * weights.quality +
    collaboration * weights.collaboration +
    wellbeing * weights.wellbeing
  )
}

/**
 * Calcula todos os scores de uma vez
 */
export function calculateAllScores(
  taskMetrics: TaskMetrics,
  qualityMetrics: QualityMetrics,
  collaborationMetrics: CollaborationMetrics,
  wellbeingMetrics: WellbeingMetrics,
  weights: ScoreWeights = DEFAULT_WEIGHTS
) {
  const productivity = calculateProductivityScore(taskMetrics)
  const quality = calculateQualityScore(qualityMetrics)
  const collaboration = calculateCollaborationScore(collaborationMetrics)
  const wellbeing = calculateWellbeingScore(wellbeingMetrics)
  const total = calculateTotalScore(productivity, quality, collaboration, wellbeing, weights)

  return {
    productivity_score: Math.round(productivity),
    quality_score: Math.round(quality),
    collaboration_score: Math.round(collaboration),
    wellbeing_score: Math.round(wellbeing),
    total_score: Math.round(total),
    level: calculateLevel(total),
    points: Math.round(total * 10) // Multiplicar por 10 para ter pontos maiores
  }
}

/**
 * Calcula nível baseado em pontos totais
 */
export function calculateLevel(totalScore: number): number {
  const points = totalScore * 10

  if (points >= 10000) return 21 + Math.floor((points - 10000) / 1000)
  if (points >= 6000) return 16 + Math.floor((points - 6000) / 1000)
  if (points >= 3000) return 11 + Math.floor((points - 3000) / 600)
  if (points >= 1000) return 6 + Math.floor((points - 1000) / 400)
  return Math.floor(points / 200) + 1
}

/**
 * Retorna nome do tier baseado no nível
 */
export function getLevelTier(level: number): string {
  if (level >= 21) return 'Master'
  if (level >= 16) return 'Expert'
  if (level >= 11) return 'Avançado'
  if (level >= 6) return 'Intermediário'
  return 'Iniciante'
}

/**
 * Retorna pontos necessários para próximo nível
 */
export function getPointsForNextLevel(currentPoints: number): number {
  const level = calculateLevel(currentPoints / 10)
  
  if (level >= 21) return ((level + 1) - 21) * 1000 + 10000
  if (level >= 16) return ((level + 1) - 16) * 1000 + 6000
  if (level >= 11) return ((level + 1) - 11) * 600 + 3000
  if (level >= 6) return ((level + 1) - 6) * 400 + 1000
  return ((level + 1) - 1) * 200
}


