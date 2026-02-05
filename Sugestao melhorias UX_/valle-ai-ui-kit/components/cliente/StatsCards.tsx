"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  MousePointerClick,
  DollarSign,
  Target,
  BarChart3,
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change?: {
    value: string;
    type: "increase" | "decrease" | "neutral";
  };
  icon: React.ReactNode;
  description?: string;
  className?: string;
}

const changeStyles = {
  increase: "text-emerald-600 bg-emerald-500/10",
  decrease: "text-red-600 bg-red-500/10",
  neutral: "text-muted-foreground bg-muted",
};

function StatCard({
  title,
  value,
  change,
  icon,
  description,
  className,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        "relative flex flex-col gap-3 p-6 rounded-xl",
        "bg-card border border-border/60",
        "transition-all duration-300",
        "hover:border-valle-primary/30 hover:shadow-lg hover:shadow-valle-primary/5",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className="p-2 rounded-lg bg-valle-primary/10 text-valle-primary">
          {icon}
        </div>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-foreground tracking-tight">
          {value}
        </span>
        {change && (
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
              changeStyles[change.type]
            )}
          >
            {change.type === "increase" && <TrendingUp className="w-3 h-3" />}
            {change.type === "decrease" && <TrendingDown className="w-3 h-3" />}
            {change.value}
          </span>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </motion.div>
  );
}

interface StatsCardsProps {
  stats?: StatCardProps[];
  columns?: 2 | 3 | 4;
}

const defaultStats: StatCardProps[] = [
  {
    title: "Impressões",
    value: "125.4K",
    change: { value: "+12.5%", type: "increase" },
    icon: <Eye className="w-5 h-5" />,
    description: "vs. mês anterior",
  },
  {
    title: "Cliques",
    value: "8.2K",
    change: { value: "+8.1%", type: "increase" },
    icon: <MousePointerClick className="w-5 h-5" />,
    description: "vs. mês anterior",
  },
  {
    title: "Conversões",
    value: "432",
    change: { value: "+23.4%", type: "increase" },
    icon: <Target className="w-5 h-5" />,
    description: "vs. mês anterior",
  },
  {
    title: "Investimento",
    value: "R$ 4.5K",
    change: { value: "-5.2%", type: "decrease" },
    icon: <DollarSign className="w-5 h-5" />,
    description: "vs. mês anterior",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function StatsCards({
  stats = defaultStats,
  columns = 4,
}: StatsCardsProps) {
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={cn("grid grid-cols-1 gap-4", gridCols[columns])}
    >
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </motion.div>
  );
}

// Componente de Stats em linha (para headers)
export function StatsRow() {
  const quickStats = [
    { label: "Campanhas Ativas", value: "12" },
    { label: "CTR Médio", value: "3.2%" },
    { label: "ROI", value: "340%" },
  ];

  return (
    <div className="flex items-center gap-8">
      {quickStats.map((stat, index) => (
        <div key={index} className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-valle-primary" />
          <span className="text-sm text-muted-foreground">{stat.label}:</span>
          <span className="text-sm font-semibold text-foreground">{stat.value}</span>
        </div>
      ))}
    </div>
  );
}

export { StatCard };
