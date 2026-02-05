/**
 * Sistema de Recompensas - Valle 360
 * Gerencia recompensas tangíveis conquistadas pelos colaboradores
 */

import { Badge, BadgeReward } from './badges'

export interface EmployeeReward {
  id: string
  employeeId: string
  employeeName: string
  badgeId: string
  badgeName: string
  rewardType: BadgeReward['type']
  rewardValue: number | string
  rewardDescription: string
  status: 'pending' | 'approved' | 'rejected' | 'redeemed' | 'expired'
  requestedAt: Date
  approvedBy?: string
  approvedAt?: Date
  rejectedReason?: string
  redeemedAt?: Date
  expiresAt?: Date
}

export interface RewardSummary {
  totalPoints: number
  availableTimeOff: number // em horas
  pendingBonuses: number // em R$
  pendingGifts: string[]
  certificates: string[]
  recognitions: string[]
}

export interface RewardRequest {
  employeeId: string
  badgeId: string
  rewardType: BadgeReward['type']
  rewardValue: number | string
  rewardDescription: string
}

/**
 * Calcula resumo de recompensas do colaborador
 */
export function calculateRewardSummary(rewards: EmployeeReward[]): RewardSummary {
  const approved = rewards.filter(r => r.status === 'approved' || r.status === 'redeemed')
  
  return {
    totalPoints: approved
      .filter(r => r.rewardType === 'points')
      .reduce((sum, r) => sum + (typeof r.rewardValue === 'number' ? r.rewardValue : 0), 0),
    
    availableTimeOff: approved
      .filter(r => r.rewardType === 'time_off' && r.status === 'approved')
      .reduce((sum, r) => sum + (typeof r.rewardValue === 'number' ? r.rewardValue : 0), 0),
    
    pendingBonuses: rewards
      .filter(r => r.rewardType === 'bonus' && r.status === 'pending')
      .reduce((sum, r) => sum + (typeof r.rewardValue === 'number' ? r.rewardValue : 0), 0),
    
    pendingGifts: rewards
      .filter(r => r.rewardType === 'gift' && r.status === 'pending')
      .map(r => r.rewardDescription),
    
    certificates: approved
      .filter(r => r.rewardType === 'certificate')
      .map(r => r.rewardDescription),
    
    recognitions: approved
      .filter(r => r.rewardType === 'recognition')
      .map(r => r.rewardDescription)
  }
}

/**
 * Valida se uma recompensa pode ser resgatada
 */
export function canRedeemReward(reward: EmployeeReward): { canRedeem: boolean; reason?: string } {
  if (reward.status === 'redeemed') {
    return { canRedeem: false, reason: 'Recompensa já foi resgatada' }
  }
  
  if (reward.status === 'rejected') {
    return { canRedeem: false, reason: 'Recompensa foi rejeitada' }
  }
  
  if (reward.status === 'expired') {
    return { canRedeem: false, reason: 'Recompensa expirou' }
  }
  
  if (reward.status === 'pending') {
    return { canRedeem: false, reason: 'Aguardando aprovação do RH' }
  }
  
  if (reward.expiresAt && new Date(reward.expiresAt) < new Date()) {
    return { canRedeem: false, reason: 'Recompensa expirou' }
  }
  
  return { canRedeem: true }
}

/**
 * Formata valor da recompensa para exibição
 */
export function formatRewardValue(reward: EmployeeReward): string {
  switch (reward.rewardType) {
    case 'points':
      return `+${reward.rewardValue} pontos`
    case 'time_off':
      const hours = typeof reward.rewardValue === 'number' ? reward.rewardValue : 0
      if (hours >= 8) {
        return `${Math.floor(hours / 8)} dia(s) de folga`
      }
      return `${hours} hora(s) de folga`
    case 'bonus':
      return `R$ ${reward.rewardValue}`
    case 'gift':
      return reward.rewardDescription
    case 'certificate':
      return reward.rewardDescription
    case 'recognition':
      return reward.rewardDescription
    case 'promotion_priority':
      return 'Prioridade em promoções'
    default:
      return String(reward.rewardValue)
  }
}

/**
 * Retorna ícone para tipo de recompensa
 */
export function getRewardIcon(type: BadgeReward['type']): string {
  const icons: Record<BadgeReward['type'], string> = {
    points: '⭐',
    time_off: '🏖️',
    bonus: '💰',
    gift: '🎁',
    certificate: '📜',
    recognition: '🏆',
    promotion_priority: '📈'
  }
  return icons[type] || '🎯'
}

/**
 * Retorna cor para status da recompensa
 */
export function getRewardStatusColor(status: EmployeeReward['status']): string {
  const colors: Record<EmployeeReward['status'], string> = {
    pending: '#F59E0B',
    approved: '#10B981',
    rejected: '#EF4444',
    redeemed: '#6B7280',
    expired: '#9CA3AF'
  }
  return colors[status]
}

/**
 * Retorna label para status da recompensa
 */
export function getRewardStatusLabel(status: EmployeeReward['status']): string {
  const labels: Record<EmployeeReward['status'], string> = {
    pending: 'Pendente',
    approved: 'Aprovada',
    rejected: 'Rejeitada',
    redeemed: 'Resgatada',
    expired: 'Expirada'
  }
  return labels[status]
}

/**
 * Agrupa recompensas por tipo
 */
export function groupRewardsByType(rewards: EmployeeReward[]): Record<BadgeReward['type'], EmployeeReward[]> {
  return rewards.reduce((groups, reward) => {
    const type = reward.rewardType
    if (!groups[type]) {
      groups[type] = []
    }
    groups[type].push(reward)
    return groups
  }, {} as Record<BadgeReward['type'], EmployeeReward[]>)
}

/**
 * Calcula valor total de bônus aprovados
 */
export function getTotalApprovedBonuses(rewards: EmployeeReward[]): number {
  return rewards
    .filter(r => r.rewardType === 'bonus' && r.status === 'approved')
    .reduce((sum, r) => sum + (typeof r.rewardValue === 'number' ? r.rewardValue : 0), 0)
}

/**
 * Calcula horas de folga disponíveis
 */
export function getAvailableTimeOff(rewards: EmployeeReward[]): number {
  return rewards
    .filter(r => r.rewardType === 'time_off' && r.status === 'approved')
    .reduce((sum, r) => sum + (typeof r.rewardValue === 'number' ? r.rewardValue : 0), 0)
}

/**
 * Verifica se colaborador tem recompensas pendentes
 */
export function hasPendingRewards(rewards: EmployeeReward[]): boolean {
  return rewards.some(r => r.status === 'pending')
}

/**
 * Filtra recompensas por período
 */
export function filterRewardsByPeriod(
  rewards: EmployeeReward[],
  startDate: Date,
  endDate: Date
): EmployeeReward[] {
  return rewards.filter(r => {
    const requestedAt = new Date(r.requestedAt)
    return requestedAt >= startDate && requestedAt <= endDate
  })
}

/**
 * Gera relatório de recompensas para RH
 */
export function generateRewardsReport(rewards: EmployeeReward[]): {
  totalPending: number
  totalApproved: number
  totalRejected: number
  totalBonusValue: number
  totalTimeOffHours: number
  byEmployee: Record<string, number>
} {
  const pending = rewards.filter(r => r.status === 'pending')
  const approved = rewards.filter(r => r.status === 'approved' || r.status === 'redeemed')
  const rejected = rewards.filter(r => r.status === 'rejected')
  
  const byEmployee: Record<string, number> = {}
  approved.forEach(r => {
    byEmployee[r.employeeId] = (byEmployee[r.employeeId] || 0) + 1
  })
  
  return {
    totalPending: pending.length,
    totalApproved: approved.length,
    totalRejected: rejected.length,
    totalBonusValue: getTotalApprovedBonuses(rewards),
    totalTimeOffHours: getAvailableTimeOff(rewards),
    byEmployee
  }
}








