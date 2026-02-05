"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { 
  ChevronDown, 
  ChevronUp,
  TrendingUp, 
  Users, 
  Target, 
  BarChart3,
  Lightbulb,
  X,
  Sparkles,
  Eye,
  MousePointer,
  DollarSign
} from "lucide-react";
import { StatsCard, StatsGrid } from "./StatsCard";

// ============================================
// INSIGHTS PANEL - VALLE AI
// Painel expandível com métricas, insights e análises
// Cores: #001533 (navy), #1672d6 (primary), #ffffff (white)
// ============================================

interface InsightItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  type: "success" | "warning" | "info";
}

interface InsightsPanelProps {
  className?: string;
  defaultExpanded?: boolean;
  // Dados customizáveis
  stats?: {
    impressions?: { value: string; change: number };
    clicks?: { value: string; change: number };
    conversions?: { value: string; change: number };
    roi?: { value: string; change: number };
  };
  insights?: InsightItem[];
}

export function InsightsPanel({ 
  className, 
  defaultExpanded = false,
  stats,
  insights 
}: InsightsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [activeTab, setActiveTab] = useState<"metricas" | "insights" | "concorrentes">("metricas");

  // Dados padrão
  const defaultStats = {
    impressions: { value: "12.5k", change: 12 },
    clicks: { value: "890", change: 8 },
    conversions: { value: "45", change: 23 },
    roi: { value: "320%", change: 15 },
  };

  const defaultInsights: InsightItem[] = [
    {
      icon: <TrendingUp className="size-4" />,
      title: "Melhor horário identificado",
      description: "Posts às 19h têm 45% mais engajamento. Recomendamos priorizar este horário.",
      type: "success",
    },
    {
      icon: <Target className="size-4" />,
      title: "Oportunidade de conversão",
      description: "Visitantes do Instagram convertem 2x mais. Aumente investimento neste canal.",
      type: "info",
    },
    {
      icon: <Users className="size-4" />,
      title: "Público em crescimento",
      description: "Audiência 25-34 anos cresceu 30% no último mês. Ajuste o conteúdo para este grupo.",
      type: "success",
    },
  ];

  const currentStats = { ...defaultStats, ...stats };
  const currentInsights = insights || defaultInsights;

  const tabs = [
    { id: "metricas", label: "Métricas", icon: BarChart3 },
    { id: "insights", label: "Insights IA", icon: Lightbulb },
    { id: "concorrentes", label: "Concorrentes", icon: Users },
  ] as const;

  return (
    <div className={cn(
      "rounded-2xl border-2 border-[#001533]/10 dark:border-white/10",
      "bg-white dark:bg-[#001533]/50",
      "overflow-hidden transition-all duration-500",
      className
    )}>
      {/* Header - Sempre visível */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center justify-between p-5",
          "hover:bg-[#1672d6]/5 transition-colors duration-200",
          "group"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#1672d6] text-white">
            <Sparkles className="size-5" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-[#001533] dark:text-white">
              Painel de Insights
            </h3>
            <p className="text-sm text-[#001533]/60 dark:text-white/60">
              Visão 360° do seu desempenho
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Mini preview quando fechado */}
          {!isExpanded && (
            <div className="hidden sm:flex items-center gap-2 mr-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-sm font-medium">
                <TrendingUp className="size-3.5" />
                <span>+15% geral</span>
              </div>
            </div>
          )}
          
          <div className={cn(
            "p-2 rounded-lg border border-[#001533]/10 dark:border-white/10",
            "group-hover:border-[#1672d6]/30 group-hover:bg-[#1672d6]/5",
            "transition-all duration-200"
          )}>
            {isExpanded ? (
              <ChevronUp className="size-5 text-[#001533] dark:text-white" />
            ) : (
              <ChevronDown className="size-5 text-[#001533] dark:text-white" />
            )}
          </div>
        </div>
      </button>

      {/* Conteúdo Expandido */}
      <div className={cn(
        "grid transition-all duration-500 ease-in-out",
        isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden">
          {/* Tabs */}
          <div className="flex gap-1 px-5 pb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                  "transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-[#1672d6] text-white"
                    : "bg-[#001533]/5 dark:bg-white/5 text-[#001533]/70 dark:text-white/70 hover:bg-[#001533]/10 dark:hover:bg-white/10"
                )}
              >
                <tab.icon className="size-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="px-5 pb-5">
            {/* Métricas Tab */}
            {activeTab === "metricas" && (
              <div className="space-y-4 animate-in fade-in-0 duration-300">
                <StatsGrid>
                  <StatsCard
                    title="Impressões"
                    value={currentStats.impressions.value}
                    change={currentStats.impressions.change}
                    icon={<Eye className="size-4 text-[#1672d6]" />}
                  />
                  <StatsCard
                    title="Cliques"
                    value={currentStats.clicks.value}
                    change={currentStats.clicks.change}
                    icon={<MousePointer className="size-4 text-[#1672d6]" />}
                  />
                  <StatsCard
                    title="Conversões"
                    value={currentStats.conversions.value}
                    change={currentStats.conversions.change}
                    icon={<Target className="size-4 text-[#1672d6]" />}
                  />
                  <StatsCard
                    title="ROI"
                    value={currentStats.roi.value}
                    change={currentStats.roi.change}
                    icon={<DollarSign className="size-4 text-[#1672d6]" />}
                    variant="primary"
                  />
                </StatsGrid>
              </div>
            )}

            {/* Insights IA Tab */}
            {activeTab === "insights" && (
              <div className="space-y-3 animate-in fade-in-0 duration-300">
                {currentInsights.map((insight, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-4 p-4 rounded-xl border-2",
                      "transition-all duration-200 hover:shadow-md",
                      insight.type === "success" && "border-emerald-500/20 bg-emerald-500/5",
                      insight.type === "warning" && "border-amber-500/20 bg-amber-500/5",
                      insight.type === "info" && "border-[#1672d6]/20 bg-[#1672d6]/5"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg h-fit",
                      insight.type === "success" && "bg-emerald-500/10 text-emerald-600",
                      insight.type === "warning" && "bg-amber-500/10 text-amber-600",
                      insight.type === "info" && "bg-[#1672d6]/10 text-[#1672d6]"
                    )}>
                      {insight.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#001533] dark:text-white mb-1">
                        {insight.title}
                      </h4>
                      <p className="text-sm text-[#001533]/70 dark:text-white/70">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Concorrentes Tab */}
            {activeTab === "concorrentes" && (
              <div className="space-y-4 animate-in fade-in-0 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {["Concorrente A", "Concorrente B", "Concorrente C"].map((name, index) => (
                    <div
                      key={name}
                      className="p-4 rounded-xl border-2 border-[#001533]/10 dark:border-white/10 bg-[#001533]/5 dark:bg-white/5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-[#001533] dark:text-white">{name}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          index === 0 ? "bg-red-500/10 text-red-600" : "bg-emerald-500/10 text-emerald-600"
                        )}>
                          {index === 0 ? "Acima" : "Abaixo"}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#001533]/60 dark:text-white/60">Engajamento</span>
                          <span className="font-medium text-[#001533] dark:text-white">{3.2 - index * 0.5}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#001533]/60 dark:text-white/60">Crescimento</span>
                          <span className="font-medium text-[#001533] dark:text-white">+{12 - index * 3}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-[#001533]/60 dark:text-white/60 text-center">
                  Você está {" "}
                  <span className="font-semibold text-emerald-600">15% acima</span>
                  {" "} da média dos concorrentes
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export type { InsightsPanelProps, InsightItem };



