"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  TrendingUp, 
  Newspaper, 
  Target, 
  Sparkles, 
  ChevronRight,
  BarChart3,
  Users,
  Lightbulb,
  ArrowLeft,
  Eye,
  MousePointerClick,
  DollarSign,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// PAINEL DE INTELIGÊNCIA - VALLE AI
// Hub central com todos os insights organizados por tópicos
// ============================================

function formatCompact(n: number) {
  if (!Number.isFinite(n)) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${Math.round(n)}`;
}

interface TopicCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
  stats?: { label: string; value: string; change?: number }[];
  highlights?: string[];
}

type DashboardSummary = {
  success: boolean;
  client: { id: string; company_name: string; segment: string; industry: string; competitors_count: number };
  kpis: {
    impressions: { value: number; change: number };
    clicks: { value: number; change: number; label?: string };
    conversions: { value: number; change: number };
    spend: { value: number; change: number };
    roi: { value: number; change: number };
  };
  ads: { available: boolean };
  insights: { available: boolean; total: number; new: number; latestTitles: string[] };
};

export default function PainelPage() {
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch("/api/client/dashboard/summary?days=30", { cache: "no-store" });
        const j = await r.json().catch(() => null);
        if (r.ok && j?.success) setSummary(j as DashboardSummary);
        else setSummary(null);
      } catch {
        setSummary(null);
      }
    };
    load();
  }, []);

  const topics: TopicCard[] = useMemo(() => {
    const k = summary?.kpis;
    const hasAds = !!summary?.ads?.available;
    const segment = summary?.client?.segment?.trim();
    const industry = summary?.client?.industry?.trim();
    const competitorsCount = summary?.client?.competitors_count ?? 0;
    const insightsNew = summary?.insights?.available ? summary.insights.new : 0;
    const insightTitles = summary?.insights?.available ? summary.insights.latestTitles : [];

    const desempenhoHighlights: string[] = [];
    if (hasAds) desempenhoHighlights.push("Ads conectado: métricas consolidadas (30d)");
    else desempenhoHighlights.push("Ads não conectado: exibindo Social (30d)");
    if (k) desempenhoHighlights.push(`Variação semanal de impressões: ${k.impressions.change >= 0 ? "+" : ""}${k.impressions.change}%`);

    const setorHighlights: string[] = [];
    if (industry) setorHighlights.push(`Indústria: ${industry}`);
    if (segment) setorHighlights.push(`Segmento: ${segment}`);
    if (!industry && !segment) setorHighlights.push("Defina seu setor/segmento para melhorar as recomendações");

    const concorrentesHighlights: string[] = [];
    if (competitorsCount > 0) concorrentesHighlights.push("Concorrentes configurados: pronto para gerar comparativos");
    else concorrentesHighlights.push("Adicione concorrentes para gerar análises e benchmarking");

    const insightsHighlights: string[] =
      insightTitles.length > 0
        ? insightTitles.slice(0, 3)
        : ["Gere insights com fontes (Perplexity/Tavily) para receber recomendações personalizadas"];

    return [
      {
        id: "desempenho",
        title: "Desempenho",
        description: "Métricas reais (Social + Ads quando conectado)",
        icon: TrendingUp,
        href: "/cliente/painel/desempenho",
        color: "from-[#1672d6] to-[#1260b5]",
        stats: [
          { label: "Impressões (30d)", value: k ? formatCompact(k.impressions.value) : "—", change: k ? k.impressions.change : 0 },
          { label: hasAds ? "Cliques (ads)" : "Visitas ao perfil", value: k ? formatCompact(k.clicks.value) : "—", change: k ? k.clicks.change : 0 },
          { label: "Conversões", value: hasAds && k ? formatCompact(k.conversions.value) : "—" },
        ],
        highlights: desempenhoHighlights,
      },
      {
        id: "setor",
        title: "Seu Setor",
        description: "Notícias e tendências baseadas no seu setor/segmento",
        icon: Newspaper,
        href: "/cliente/painel/setor",
        color: "from-amber-500 to-amber-600",
        stats: [
          { label: "Indústria", value: industry || "—" },
          { label: "Segmento", value: segment || "—" },
          { label: "Atualização", value: "Hoje" },
        ],
        highlights: setorHighlights,
      },
      {
        id: "concorrentes",
        title: "Concorrentes",
        description: "Monitoramento e comparação com seus principais concorrentes",
        icon: Target,
        href: "/cliente/painel/concorrentes",
        color: "from-purple-500 to-purple-600",
        stats: [
          { label: "Monitorados", value: competitorsCount ? String(competitorsCount) : "0" },
          { label: "Status", value: competitorsCount ? "Config." : "Pendente" },
          { label: "Comparativos", value: competitorsCount ? "Disponível" : "—" },
        ],
        highlights: concorrentesHighlights,
      },
      {
        id: "insights",
        title: "Insights IA",
        description: "Recomendações da Val com fontes (cache diário)",
        icon: Sparkles,
        href: "/cliente/painel/insights",
        color: "from-emerald-500 to-emerald-600",
        stats: [
          { label: "Novos (hoje)", value: summary?.insights?.available ? String(insightsNew) : "—" },
          { label: "Disponível", value: summary?.insights?.available ? "Sim" : "—" },
          { label: "Ação", value: "Gerar" },
        ],
        highlights: insightsHighlights,
      },
    ];
  }, [summary]);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link 
              href="/cliente/dashboard"
              className="p-2 rounded-lg bg-[#001533]/5 hover:bg-[#001533]/10 transition-colors"
            >
              <ArrowLeft className="size-5 text-[#001533] dark:text-white" />
            </Link>
            <h1 className="text-3xl font-bold text-[#001533] dark:text-white">
              Central de Inteligência do Cliente
            </h1>
          </div>
          <p className="text-[#001533]/60 dark:text-white/60 ml-12">
            Todas as informações inteligentes do seu negócio organizadas em um só lugar
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-[#1672d6]/10 text-[#1672d6]">
          <Zap className="size-4" />
          <span className="text-sm font-medium">Atualizado agora</span>
        </div>
      </motion.div>

      {/* Grid de Tópicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {topics.map((topic, index) => {
          const Icon = topic.icon;
          const isExpanded = expandedTopic === topic.id;

          return (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "rounded-2xl border-2 border-[#001533]/10 dark:border-white/10",
                "bg-white dark:bg-[#001533]/50 overflow-hidden",
                "transition-all duration-300",
                isExpanded && "ring-2 ring-[#1672d6]/30"
              )}
            >
              {/* Header do Card */}
              <div
                onClick={() => setExpandedTopic(isExpanded ? null : topic.id)}
                className="p-6 cursor-pointer hover:bg-[#001533]/5 dark:hover:bg-white/5 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-xl bg-gradient-to-br shadow-lg",
                      topic.color
                    )}>
                      <Icon className="size-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#001533] dark:text-white">
                        {topic.title}
                      </h3>
                      <p className="text-sm text-[#001533]/60 dark:text-white/60 mt-1">
                        {topic.description}
                      </p>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    className="p-2"
                  >
                    <ChevronRight className="size-5 text-[#001533]/40 dark:text-white/40" />
                  </motion.div>
                </div>

                {/* Mini Stats */}
                {topic.stats && (
                  <div className="flex gap-4 mt-4 pt-4 border-t border-[#001533]/10 dark:border-white/10">
                    {topic.stats.map((stat, i) => (
                      <div key={i} className="flex-1">
                        <p className="text-xs text-[#001533]/50 dark:text-white/50">{stat.label}</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-bold text-[#001533] dark:text-white">
                            {stat.value}
                          </span>
                          {stat.change !== undefined && (
                            <span className={cn(
                              "text-xs font-medium",
                              stat.change >= 0 ? "text-emerald-500" : "text-red-500"
                            )}>
                              {stat.change >= 0 ? "+" : ""}{stat.change}%
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Conteúdo Expandido */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 space-y-4">
                      {/* Destaques */}
                      {topic.highlights && (
                        <div className="p-4 rounded-xl bg-[#001533]/5 dark:bg-white/5">
                          <h4 className="text-sm font-semibold text-[#001533] dark:text-white mb-3 flex items-center gap-2">
                            <Lightbulb className="size-4 text-[#1672d6]" />
                            Destaques
                          </h4>
                          <ul className="space-y-2">
                            {topic.highlights.map((highlight, i) => (
                              <li key={i} className="flex items-center gap-2 text-sm text-[#001533]/70 dark:text-white/70">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#1672d6]" />
                                {highlight}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Botão para ver mais */}
                      <Link
                        href={topic.href}
                        className={cn(
                          "flex items-center justify-center gap-2 w-full py-3 rounded-xl",
                          "bg-gradient-to-r font-semibold text-white",
                          "hover:opacity-90 transition-opacity",
                          topic.color
                        )}
                      >
                        Ver Painel Completo
                        <ChevronRight className="size-4" />
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Card de Acesso Rápido */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl bg-gradient-to-r from-[#001533] to-[#1672d6] p-6 text-white"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20">
              <Sparkles className="size-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Precisa de uma análise personalizada?</h3>
              <p className="text-white/70 mt-1">
                Converse com a Val e receba insights exclusivos para seu negócio
              </p>
            </div>
          </div>
          <Link
            href="/cliente/ia"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#001533] font-semibold hover:bg-white/90 transition-colors"
          >
            Falar com Val
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

