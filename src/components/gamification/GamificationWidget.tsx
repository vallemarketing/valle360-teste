'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, TrendingUp, Star, Award, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getLevelInfo } from '@/lib/gamification/levels'

interface GamificationWidgetProps {
  className?: string
}

export function GamificationWidget({ className }: GamificationWidgetProps) {
  const [points, setPoints] = useState(0)
  const [quality, setQuality] = useState(0)
  const [productivity, setProductivity] = useState(0)
  const [badgesCount, setBadgesCount] = useState(0)
  const [rank, setRank] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGamificationData()
  }, [])

  const loadGamificationData = async () => {
    try {
      const response = await fetch('/api/gamification/me', { cache: 'no-store' })
      const data = await response.json()

      if (response.ok) {
        setPoints(Number(data?.points || 0))
        setQuality(Number(data?.quality_score || 0))
        setProductivity(Number(data?.productivity_score || 0))
        setBadgesCount(Array.isArray(data?.badges) ? data.badges.length : 0)
        setRank(typeof data?.rank === 'number' ? data.rank : null)
      } else {
        setPoints(0)
        setQuality(0)
        setProductivity(0)
        setBadgesCount(0)
        setRank(null)
      }
    } catch (error) {
      console.error('Error loading gamification:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={cn("rounded-2xl p-6 border animate-pulse", className)}
        style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
        <div className="h-32" />
      </div>
    )
  }

  const levelInfo = getLevelInfo(points)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("rounded-2xl p-6 border relative overflow-hidden", className)}
      style={{ 
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-light)'
      }}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-40 h-40 opacity-5">
        <Trophy className="w-full h-full" style={{ color: levelInfo.color }} />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 relative z-10">
        <div>
          <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Seu Progresso
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Continue evoluindo!
          </p>
        </div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: levelInfo.color + '20' }}
        >
          <Trophy className="w-6 h-6" style={{ color: levelInfo.color }} />
        </motion.div>
      </div>

      {/* Level info */}
      <div className="mb-6 relative z-10">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold" style={{ color: levelInfo.color }}>
            Nível {levelInfo.level}
          </span>
          <span className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>
            {levelInfo.tier}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          <Zap className="w-4 h-4" />
          <span>{points.toLocaleString()} pontos</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6 relative z-10">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span style={{ color: 'var(--text-secondary)' }}>Próximo nível</span>
          <span style={{ color: 'var(--text-tertiary)' }}>
            {Math.round(levelInfo.progress)}%
          </span>
        </div>
        <div 
          className="h-3 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--neutral-200)' }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${levelInfo.progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ backgroundColor: levelInfo.color }}
          />
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
          {levelInfo.pointsNeeded} pontos restantes
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-3 relative z-10">
        <StatCard
          icon={<Star className="w-4 h-4" />}
          value={String(Math.round(quality))}
          label="Qualidade"
          color="var(--warning-500)"
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4" />}
          value={String(Math.round(productivity))}
          label="Produtividade"
          color="var(--success-500)"
        />
        <StatCard
          icon={<Award className="w-4 h-4" />}
          value={String(badgesCount)}
          label="Badges"
          color="var(--info-500)"
        />
        <StatCard
          icon={<Trophy className="w-4 h-4" />}
          value={rank ? `#${rank}` : '—'}
          label="Ranking"
          color="var(--primary-500)"
        />
      </div>
    </motion.div>
  )
}

function StatCard({ icon, value, label, color }: { 
  icon: React.ReactNode
  value: string
  label: string
  color: string
}) {
  return (
    <div 
      className="p-3 rounded-xl text-center"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      <div className="flex justify-center mb-1" style={{ color }}>
        {icon}
      </div>
      <div className="font-bold text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>
        {value}
      </div>
      <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
        {label}
      </div>
    </div>
  )
}


