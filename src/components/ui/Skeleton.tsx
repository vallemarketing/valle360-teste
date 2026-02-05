'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse'
}: SkeletonProps) {
  const baseClasses = 'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700';
  
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-xl'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: '',
    none: ''
  };

  const style: React.CSSProperties = {
    width: width || (variant === 'circular' ? height : '100%'),
    height: height || (variant === 'text' ? '1rem' : '100%'),
    backgroundSize: animation === 'wave' ? '200% 100%' : undefined
  };

  if (animation === 'wave') {
    return (
      <motion.div
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        style={style}
        animate={{
          backgroundPosition: ['200% 0', '-200% 0']
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
    );
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
}

// Skeleton para Cards de KPI
export function SkeletonKPICard() {
  return (
    <div 
      className="rounded-2xl p-5 animate-pulse"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      <Skeleton variant="circular" width={48} height={48} className="mb-3" />
      <Skeleton width="60%" height={32} className="mb-2 rounded" />
      <Skeleton width="40%" height={16} className="rounded" />
    </div>
  );
}

// Skeleton para Lista de Items
export function SkeletonListItem() {
  return (
    <div 
      className="flex items-center gap-4 p-4 rounded-xl animate-pulse"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1">
        <Skeleton width="70%" height={20} className="mb-2 rounded" />
        <Skeleton width="50%" height={14} className="rounded" />
      </div>
      <Skeleton width={80} height={32} className="rounded-lg" />
    </div>
  );
}

// Skeleton para Tabela
export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div 
        className="flex gap-4 p-4 rounded-xl"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} width={`${100 / columns}%`} height={20} className="rounded" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={rowIndex}
          className="flex gap-4 p-4 rounded-xl animate-pulse"
          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)' }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              width={`${100 / columns}%`} 
              height={16} 
              className="rounded" 
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Skeleton para Card de Kanban
export function SkeletonKanbanCard() {
  return (
    <div 
      className="p-4 rounded-xl animate-pulse space-y-3"
      style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)' }}
    >
      <div className="flex items-center justify-between">
        <Skeleton width={60} height={20} className="rounded" />
        <Skeleton variant="circular" width={24} height={24} />
      </div>
      <Skeleton width="90%" height={18} className="rounded" />
      <Skeleton width="70%" height={14} className="rounded" />
      <div className="flex items-center gap-2 pt-2">
        <Skeleton variant="circular" width={28} height={28} />
        <Skeleton variant="circular" width={28} height={28} />
        <Skeleton width={60} height={20} className="rounded ml-auto" />
      </div>
    </div>
  );
}

// Skeleton para Dashboard
export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonKPICard key={i} />
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div 
          className="rounded-2xl p-6 animate-pulse"
          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)' }}
        >
          <Skeleton width="40%" height={24} className="mb-4 rounded" />
          <Skeleton width="100%" height={200} className="rounded-xl" />
        </div>
        <div 
          className="rounded-2xl p-6 animate-pulse"
          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)' }}
        >
          <Skeleton width="40%" height={24} className="mb-4 rounded" />
          <Skeleton width="100%" height={200} className="rounded-xl" />
        </div>
      </div>
      
      {/* List */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonListItem key={i} />
        ))}
      </div>
    </div>
  );
}

// Skeleton para Perfil
export function SkeletonProfile() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div 
        className="rounded-2xl p-6 animate-pulse"
        style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)' }}
      >
        <div className="flex items-center gap-4">
          <Skeleton variant="circular" width={80} height={80} />
          <div className="flex-1">
            <Skeleton width="50%" height={28} className="mb-2 rounded" />
            <Skeleton width="30%" height={18} className="rounded" />
          </div>
        </div>
      </div>
      
      {/* Info */}
      <div 
        className="rounded-2xl p-6 animate-pulse space-y-4"
        style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)' }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton width={120} height={16} className="rounded" />
            <Skeleton width="60%" height={16} className="rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton para Chat
export function SkeletonChat() {
  return (
    <div className="space-y-4 p-4">
      {/* Mensagem recebida */}
      <div className="flex gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="space-y-2">
          <Skeleton width={200} height={60} className="rounded-2xl rounded-tl-none" />
          <Skeleton width={60} height={12} className="rounded" />
        </div>
      </div>
      
      {/* Mensagem enviada */}
      <div className="flex gap-3 justify-end">
        <div className="space-y-2 text-right">
          <Skeleton width={180} height={40} className="rounded-2xl rounded-tr-none ml-auto" />
          <Skeleton width={60} height={12} className="rounded ml-auto" />
        </div>
      </div>
      
      {/* Mensagem recebida */}
      <div className="flex gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="space-y-2">
          <Skeleton width={250} height={80} className="rounded-2xl rounded-tl-none" />
          <Skeleton width={60} height={12} className="rounded" />
        </div>
      </div>
    </div>
  );
}

export default Skeleton;
