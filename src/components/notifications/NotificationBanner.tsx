'use client'

import { motion } from 'framer-motion'
import { 
  AlertTriangle, Calendar, RefreshCw, Zap, CheckCircle2, 
  Bell, TrendingUp, DollarSign, Clock, X 
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type NotificationType = 
  | 'meeting' 
  | 'overdue' 
  | 'refill' 
  | 'low_budget' 
  | 'approval' 
  | 'upsell' 
  | 'success'
  | 'info'

interface NotificationBannerProps {
  type: NotificationType
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  onDismiss?: () => void
  delay?: number
}

export function NotificationBanner({
  type,
  title,
  description,
  actionLabel,
  onAction,
  onDismiss,
  delay = 0
}: NotificationBannerProps) {
  
  const getConfig = () => {
    switch (type) {
      case 'meeting':
        return {
          icon: Calendar,
          bg: 'var(--primary-50)',
          border: 'var(--primary-200)',
          iconColor: 'var(--primary-600)',
          textColor: 'var(--primary-700)',
          descColor: 'var(--primary-600)'
        }
      case 'overdue':
        return {
          icon: AlertTriangle,
          bg: 'var(--error-50)',
          border: 'var(--error-200)',
          iconColor: 'var(--error-600)',
          textColor: 'var(--error-700)',
          descColor: 'var(--error-600)'
        }
      case 'refill':
        return {
          icon: RefreshCw,
          bg: 'var(--warning-50)',
          border: 'var(--warning-200)',
          iconColor: 'var(--warning-600)',
          textColor: 'var(--warning-700)',
          descColor: 'var(--warning-600)'
        }
      case 'low_budget':
        return {
          icon: Zap,
          bg: 'var(--amber-50)',
          border: 'var(--amber-200)',
          iconColor: 'var(--amber-600)',
          textColor: 'var(--amber-700)',
          descColor: 'var(--amber-600)'
        }
      case 'approval':
        return {
          icon: CheckCircle2,
          bg: 'var(--info-50)',
          border: 'var(--info-200)',
          iconColor: 'var(--info-600)',
          textColor: 'var(--info-700)',
          descColor: 'var(--info-600)'
        }
      case 'upsell':
        return {
          icon: TrendingUp,
          bg: 'var(--success-50)',
          border: 'var(--success-200)',
          iconColor: 'var(--success-600)',
          textColor: 'var(--success-700)',
          descColor: 'var(--success-600)'
        }
      case 'success':
        return {
          icon: CheckCircle2,
          bg: 'var(--success-50)',
          border: 'var(--success-200)',
          iconColor: 'var(--success-600)',
          textColor: 'var(--success-700)',
          descColor: 'var(--success-600)'
        }
      default:
        return {
          icon: Bell,
          bg: 'var(--info-50)',
          border: 'var(--info-200)',
          iconColor: 'var(--info-600)',
          textColor: 'var(--info-700)',
          descColor: 'var(--info-600)'
        }
    }
  }

  const config = getConfig()
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="rounded-xl p-4 flex items-center gap-3 relative"
      style={{ 
        backgroundColor: config.bg,
        borderWidth: '1px',
        borderColor: config.border
      }}
    >
      <Icon className="w-5 h-5 flex-shrink-0" style={{ color: config.iconColor }} />
      
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm" style={{ color: config.textColor }}>
          {title}
        </p>
        <p className="text-xs mt-0.5 truncate" style={{ color: config.descColor }}>
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:scale-105 flex-shrink-0"
          style={{ backgroundColor: config.iconColor }}
        >
          {actionLabel}
        </button>
      )}

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 rounded-lg transition-all hover:bg-black/5 flex-shrink-0"
          style={{ color: config.descColor }}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  )
}









