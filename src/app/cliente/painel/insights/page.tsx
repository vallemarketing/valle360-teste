"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  ArrowLeft,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  ChevronRight,
  ThumbsDown,
  Zap,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type InsightType = "oportunidade" | "melhoria" | "alerta" | "tendencia";
type InsightPriority = "alta" | "media" | "baixa";
type InsightStatus = "novo" | "em_analise" | "implementado" | "ignorado";

type InsightRow = {
  id: string;
  type: InsightType;
  priority: InsightPriority;
  status: InsightStatus;
  title: string;
  description: string;
  impact?: string | null;
  action?: string | null;
  sources?: string[] | null;
  provider?: string | null;
  created_at?: string | null;
};

const typeConfig: Record<
  InsightType,
  { icon: React.ElementType; color: string; bgColor: string; label: string }
> = {
  oportunidade: { icon: Lightbulb, color: "text-emerald-600", bgColor: "bg-emerald-500", label: "Oportunidade" },
  melhoria: { icon: TrendingUp, color: "text-[#1672d6]", bgColor: "bg-[#1672d6]", label: "Melhoria" },
  alerta: { icon: AlertTriangle, color: "text-primary", bgColor: "bg-primary", label: "Alerta" },
  tendencia: { icon: Zap, color: "text-purple-600", bgColor: "bg-purple-500", label: "Tendência" },
};

const priorityConfig: Record<InsightPriority, { color: string; label: string }> = {
  alta: { color: "bg-red-500/10 text-red-600", label: "Alta" },
  media: { color: "bg-yellow-500/10 text-yellow-600", label: "Média" },
  baixa: { color: "bg-gray-500/10 text-gray-600", label: "Baixa" },
};

const statusConfig: Record<InsightStatus, { color: string; label: string }> = {
  novo: { color: "bg-[#1672d6]/10 text-[#1672d6]", label: "Novo" },
  em_analise: { color: "bg-yellow-500/10 text-yellow-600", label: "Em Análise" },
  implementado: { color: "bg-emerald-500/10 text-emerald-600", label: "Implementado" },
  ignorado: { color: "bg-gray-500/10 text-gray-600", label: "Ignorado" },
};

function hostLabel(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export default function InsightsIAPage() {
  const [filter, setFilter] = useState<InsightStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [insights, setInsights] = useState<InsightRow[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/client/insights");
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(data?.error || "Falha ao carregar insights");
      if (data?.warning === "missing_table_client_ai_insights") {
        setBanner(String(data?.instruction || "Banco ainda não preparado para Insights IA."));
        setInsights([]);
        return;
      }
      setInsights(Array.isArray(data?.insights) ? data.insights : []);
    } catch (e: any) {
      setError(String(e?.message || "Erro ao carregar"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInsights();
  }, []);

  const filteredInsights = useMemo(() => {
    return insights.filter((i) => filter === "all" || i.status === filter);
  }, [insights, filter]);

  const stats = useMemo(() => {
    const total = insights.length;
    const implementados = insights.filter((i) => i.status === "implementado").length;
    const alta = insights.filter((i) => i.priority === "alta" && i.status === "novo").length;
    return { total, implementados, alta };
  }, [insights]);

  const summary = useMemo(() => {
    const urgent = insights.find((i) => i.status === "novo" && i.priority === "alta") || insights[0];
    if (!urgent) return null;
    const countNew = insights.filter((i) => i.status === "novo").length;
    return {
      count: insights.length,
      countNew,
      urgentTitle: urgent.title,
    };
  }, [insights]);

  const generateToday = async () => {
    setGenerating(true);
    setBanner(null);
    setError(null);
    try {
      const r = await fetch("/api/client/insights", { method: "POST" });
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(data?.error || "Falha ao gerar insights");
      if (data?.skipped) {
        setBanner(`Já existem insights gerados hoje (${data.existingCount}).`);
      } else {
        setBanner(`Insights gerados com sucesso: ${Number(data?.created || 0)}.`);
      }
      await loadInsights();
    } catch (e: any) {
      setError(String(e?.message || "Erro ao gerar"));
    } finally {
      setGenerating(false);
    }
  };

  const updateStatus = async (id: string, status: InsightStatus) => {
    setUpdatingId(id);
    setError(null);
    try {
      const r = await fetch("/api/client/insights", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(data?.error || "Falha ao atualizar status");
      setInsights((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
    } catch (e: any) {
      setError(String(e?.message || "Erro ao atualizar"));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/cliente/painel" className="p-2 rounded-lg bg-[#001533]/5 hover:bg-[#001533]/10 transition-colors">
              <ArrowLeft className="size-5 text-[#001533] dark:text-white" />
            </Link>
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
              <Sparkles className="size-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[#001533] dark:text-white">Insights IA</h1>
          </div>
          <p className="text-[#001533]/60 dark:text-white/60 ml-12">
            Recomendações personalizadas da Val para seu negócio (com fontes)
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => void loadInsights()}
            disabled={loading || generating}
            className={cn(
              "px-4 py-3 rounded-xl font-semibold transition-colors",
              "border-2 border-[#001533]/10 dark:border-white/10",
              "text-[#001533] dark:text-white hover:bg-[#001533]/5 dark:hover:bg-white/5",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            Atualizar
          </button>
          <button
            onClick={() => void generateToday()}
            disabled={loading || generating}
            className={cn(
              "px-4 py-3 rounded-xl font-semibold transition-colors",
              "bg-[#1672d6] text-white hover:bg-[#1260b5]",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {generating ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" /> Gerando…
              </span>
            ) : (
              "Gerar insights (hoje)"
            )}
          </button>
        </div>
      </motion.div>

      {(banner || error) && (
        <div
          className={cn(
            "rounded-xl border p-4 text-sm flex items-start gap-2",
            error ? "border-red-200 bg-red-50 text-red-700" : "border-[#001533]/10 bg-[#001533]/5 text-[#001533]"
          )}
        >
          <AlertTriangle className="size-4 mt-0.5" />
          <div>
            <p className="font-medium">{error ? "Atenção" : "Info"}</p>
            <p className="mt-1 opacity-80">{error || banner}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn("grid grid-cols-3 gap-4", loading && "opacity-70")}
      >
        <div className="rounded-xl border-2 border-[#001533]/10 dark:border-white/10 bg-white dark:bg-[#001533]/50 p-4 text-center">
          <p className="text-3xl font-bold text-[#001533] dark:text-white">{stats.total}</p>
          <p className="text-sm text-[#001533]/60 dark:text-white/60">Total de Insights</p>
        </div>
        <div className="rounded-xl border-2 border-[#001533]/10 dark:border-white/10 bg-white dark:bg-[#001533]/50 p-4 text-center">
          <p className="text-3xl font-bold text-emerald-600">{stats.implementados}</p>
          <p className="text-sm text-[#001533]/60 dark:text-white/60">Implementados</p>
        </div>
        <div className="rounded-xl border-2 border-[#001533]/10 dark:border-white/10 bg-white dark:bg-[#001533]/50 p-4 text-center">
          <p className="text-3xl font-bold text-[#1672d6]">{stats.alta}</p>
          <p className="text-sm text-[#001533]/60 dark:text-white/60">Alta prioridade (novos)</p>
        </div>
      </motion.div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex gap-2 overflow-x-auto pb-2"
      >
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors",
            filter === "all"
              ? "bg-[#1672d6] text-white"
              : "bg-[#001533]/5 dark:bg-white/5 text-[#001533] dark:text-white hover:bg-[#001533]/10 dark:hover:bg-white/10"
          )}
        >
          Todos ({insights.length})
        </button>
        {Object.entries(statusConfig).map(([key, config]) => {
          const count = insights.filter((i) => i.status === key).length;
          return (
            <button
              key={key}
              onClick={() => setFilter(key as InsightStatus)}
              className={cn(
                "px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors",
                filter === key
                  ? "bg-[#1672d6] text-white"
                  : "bg-[#001533]/5 dark:bg-white/5 text-[#001533] dark:text-white hover:bg-[#001533]/10 dark:hover:bg-white/10"
              )}
            >
              {config.label} ({count})
            </button>
          );
        })}
      </motion.div>

      {/* Lista */}
      <div className="space-y-4">
        {filteredInsights.map((insight, index) => {
          const typeConf = typeConfig[insight.type];
          const priorityConf = priorityConfig[insight.priority];
          const statusConf = statusConfig[insight.status];
          const Icon = typeConf.icon;
          const isUpdating = updatingId === insight.id;
          const sources = Array.isArray(insight.sources) ? insight.sources.filter(Boolean) : [];

          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.03 }}
              className={cn(
                "rounded-2xl border-2 bg-white dark:bg-[#001533]/50 overflow-hidden",
                insight.priority === "alta" ? "border-red-500/30" : "border-[#001533]/10 dark:border-white/10"
              )}
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={cn("p-3 rounded-xl", typeConf.bgColor)}>
                      <Icon className="size-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold", statusConf.color)}>
                          {statusConf.label}
                        </span>
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold", priorityConf.color)}>
                          Prioridade {priorityConf.label}
                        </span>
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold", typeConf.color, "bg-current/10")}>
                          {typeConf.label}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-[#001533] dark:text-white mb-2">{insight.title}</h3>
                      <p className="text-[#001533]/70 dark:text-white/70">{insight.description}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[#001533]/10 dark:border-white/10 grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-[#001533]/60 dark:text-white/60 uppercase mb-1">Impacto Estimado</p>
                    <p className="font-bold text-[#1672d6]">{insight.impact || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#001533]/60 dark:text-white/60 uppercase mb-1">Ação Recomendada</p>
                    <p className="text-[#001533] dark:text-white">{insight.action || "—"}</p>
                  </div>
                </div>

                {sources.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#001533]/10 dark:border-white/10">
                    <p className="text-xs font-semibold text-[#001533]/60 dark:text-white/60 uppercase mb-2">
                      Fontes {insight.provider ? `(${insight.provider})` : ""}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {sources.slice(0, 8).map((u) => (
                        <a
                          key={u}
                          href={u}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between gap-2 rounded-xl border border-[#001533]/10 dark:border-white/10 bg-white/60 dark:bg-[#001533]/30 px-3 py-2 hover:border-[#1672d6]/30 transition-colors"
                        >
                          <span className="text-xs text-[#1672d6] underline break-all">{hostLabel(u)}</span>
                          <ExternalLink className="size-4 text-[#001533]/40 dark:text-white/40" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {insight.status === "novo" && (
                  <div className="mt-4 flex flex-col md:flex-row gap-3">
                    <button
                      onClick={() => void updateStatus(insight.id, "implementado")}
                      disabled={isUpdating}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#1672d6] text-white font-semibold hover:bg-[#1672d6]/90 transition-colors disabled:opacity-50"
                    >
                      {isUpdating ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle className="size-5" />}
                      Implementar
                    </button>
                    <button
                      onClick={() => void updateStatus(insight.id, "em_analise")}
                      disabled={isUpdating}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-[#001533]/10 text-[#001533] dark:text-white hover:bg-[#001533]/5 transition-colors disabled:opacity-50"
                    >
                      <ChevronRight className="size-5" />
                      Em análise
                    </button>
                    <button
                      onClick={() => void updateStatus(insight.id, "ignorado")}
                      disabled={isUpdating}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-[#001533]/10 text-[#001533] dark:text-white hover:bg-[#001533]/5 transition-colors disabled:opacity-50"
                    >
                      <ThumbsDown className="size-5" />
                      Ignorar
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {!loading && filteredInsights.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="size-12 text-[#001533]/20 dark:text-white/20 mx-auto mb-4" />
            <p className="text-[#001533]/60 dark:text-white/60">Nenhum insight encontrado.</p>
            <button
              onClick={() => void generateToday()}
              className="mt-4 px-4 py-3 rounded-xl bg-[#1672d6] text-white font-semibold hover:bg-[#1260b5] transition-colors"
            >
              Gerar insights (hoje)
            </button>
          </div>
        )}
      </div>

      {/* Resumo da Val */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl bg-gradient-to-r from-[#001533] to-[#1672d6] p-6"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-white/20">
            <Sparkles className="size-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">💜 Resumo da Val</h3>
            <p className="text-white/80 mt-1">
              {summary
                ? `Hoje eu tenho ${summary.count} insights para você (${summary.countNew} novos). O mais importante agora: "${summary.urgentTitle}". Quer que eu detalhe e transforme isso em um plano de ação?`
                : "Gere seus insights do dia e eu te ajudo a transformar em um plano de ação."
              }
            </p>
          </div>
          <Link
            href="/cliente/ia"
            className="px-6 py-3 rounded-xl bg-white text-[#001533] font-semibold hover:bg-white/90 transition-colors whitespace-nowrap"
          >
            Conversar
          </Link>
        </div>
      </motion.div>
    </div>
  );
}


