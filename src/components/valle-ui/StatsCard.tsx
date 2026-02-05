"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ReactNode, useState } from "react";

// ============================================
// STATS CARD - VALLE AI
// Hover dinâmico individual - destaque azul aparece só onde o mouse está
// Cores: #001533 (navy), #1672d6 (primary), #ffffff (white)
// ============================================

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number; // percentual de mudança
  changeLabel?: string;
  icon?: ReactNode;
  className?: string;
  variant?: "default" | "primary" | "navy";
}

export function StatsCard({
  title,
  value,
  change,
  changeLabel = "vs mês anterior",
  icon,
  className,
  variant = "default",
}: StatsCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;
  const isNeutral = change === 0;

  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  const variantStyles = {
    default: "bg-white dark:bg-[#001533]/50 border-[#001533]/10",
    primary: "bg-[#1672d6] border-[#1672d6] text-white",
    navy: "bg-[#001533] border-[#001533] text-white",
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        // Base
        "relative overflow-hidden rounded-xl border-2 p-5",
        "transition-all duration-300 cursor-pointer",
        // Hover dinâmico - destaque azul aparece só onde o mouse está
        isHovered && variant === "default" && "border-[#1672d6] shadow-lg shadow-[#1672d6]/20 -translate-y-1 bg-[#1672d6]/5",
        isHovered && variant !== "default" && "shadow-xl -translate-y-1",
        !isHovered && "hover:border-[#1672d6]/30",
        // Variant
        variantStyles[variant],
        className
      )}
    >
      {/* Background decoration - intensifica no hover */}
      <div className={cn(
        "absolute -right-4 -top-4 h-24 w-24 rounded-full transition-all duration-300",
        isHovered ? "bg-[#1672d6]/20 scale-110" : "bg-[#1672d6]/5"
      )} />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className={cn(
          "text-sm font-medium",
          variant === "default" ? "text-[#001533]/60 dark:text-white/60" : "text-white/80"
        )}>
          {title}
        </span>
        {icon && (
          <div className={cn(
            "p-2 rounded-lg",
            variant === "default" ? "bg-[#1672d6]/10" : "bg-white/10"
          )}>
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className={cn(
        "text-3xl font-bold mb-2",
        variant === "default" ? "text-[#001533] dark:text-white" : "text-white"
      )}>
        {value}
      </div>

      {/* Change indicator */}
      {change !== undefined && (
        <div className="flex items-center gap-1.5">
          <div className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
            isPositive && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            isNegative && "bg-red-500/10 text-red-600 dark:text-red-400",
            isNeutral && "bg-[#001533]/10 text-[#001533]/60 dark:bg-white/10 dark:text-white/60"
          )}>
            <TrendIcon className="size-3" />
            <span>{Math.abs(change)}%</span>
          </div>
          <span className={cn(
            "text-xs",
            variant === "default" ? "text-[#001533]/50 dark:text-white/50" : "text-white/60"
          )}>
            {changeLabel}
          </span>
        </div>
      )}
    </div>
  );
}

// Grid de Stats Cards
interface StatsGridProps {
  children: ReactNode;
  className?: string;
}

export function StatsGrid({ children, className }: StatsGridProps) {
  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",
      className
    )}>
      {children}
    </div>
  );
}

export type { StatsCardProps, StatsGridProps };



