'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

interface AnimatedMetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  color: string;
  gradient?: string;
  delay?: number;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export default function AnimatedMetricCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  color,
  gradient,
  delay = 0,
  size = 'md',
  onClick
}: AnimatedMetricCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const valueSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay, 
        duration: 0.5, 
        ease: [0.25, 0.46, 0.45, 0.94] 
      }}
      whileHover={{ 
        scale: 1.02, 
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)' 
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`rounded-xl cursor-pointer transition-all ${sizeClasses[size]}`}
      style={{ 
        background: gradient || 'var(--bg-primary)',
        border: gradient ? 'none' : '1px solid var(--border-light)'
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <motion.div 
          className="p-2 rounded-lg"
          style={{ backgroundColor: gradient ? 'rgba(255,255,255,0.2)' : `${color}20` }}
          whileHover={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.5 }}
        >
          <Icon 
            className={iconSizes[size]} 
            style={{ color: gradient ? 'white' : color }} 
          />
        </motion.div>

        {change !== undefined && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.2 }}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium`}
            style={{
              backgroundColor: gradient 
                ? 'rgba(255,255,255,0.2)' 
                : isPositive 
                  ? 'var(--success-100)' 
                  : isNegative 
                    ? 'var(--error-100)' 
                    : 'var(--bg-secondary)',
              color: gradient 
                ? 'white' 
                : isPositive 
                  ? 'var(--success-700)' 
                  : isNegative 
                    ? 'var(--error-700)' 
                    : 'var(--text-tertiary)'
            }}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : isNegative ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            <span>{Math.abs(change)}%</span>
          </motion.div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.1 }}
      >
        <motion.p 
          className={`font-bold ${valueSizes[size]}`}
          style={{ color: gradient ? 'white' : 'var(--text-primary)' }}
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ delay: delay + 0.15, type: 'spring', stiffness: 200 }}
        >
          {value}
        </motion.p>
        
        <p 
          className="text-sm mt-1"
          style={{ color: gradient ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)' }}
        >
          {title}
        </p>

        {changeLabel && (
          <p 
            className="text-xs mt-1"
            style={{ color: gradient ? 'rgba(255,255,255,0.6)' : 'var(--text-tertiary)' }}
          >
            {changeLabel}
          </p>
        )}
      </motion.div>

      {/* Animated Background Effect */}
      {gradient && (
        <motion.div
          className="absolute inset-0 rounded-xl opacity-0"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.3) 0%, transparent 70%)'
          }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.div>
  );
}

// Variante para cards em grid
export function AnimatedMetricGrid({ 
  children,
  columns = 4
}: { 
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
}) {
  const gridClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4'
  };

  return (
    <motion.div 
      className={`grid ${gridClasses[columns]} gap-4`}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
}

// Variante para card de destaque
export function HeroMetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  action
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  gradient: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative overflow-hidden rounded-2xl p-6"
      style={{ background: gradient }}
    >
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <motion.div 
            className="p-3 rounded-xl bg-white/20"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <Icon className="w-8 h-8 text-white" />
          </motion.div>
          <span className="text-white/80 text-sm">{title}</span>
        </div>

        <motion.p 
          className="text-4xl font-bold text-white mb-2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          {value}
        </motion.p>

        {subtitle && (
          <p className="text-white/80 text-sm">{subtitle}</p>
        )}

        {action && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={action.onClick}
            className="mt-4 px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-medium hover:bg-white/30 transition-colors"
          >
            {action.label}
          </motion.button>
        )}
      </div>

      {/* Animated Glow */}
      <motion.div
        className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full bg-white/10"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
    </motion.div>
  );
}









