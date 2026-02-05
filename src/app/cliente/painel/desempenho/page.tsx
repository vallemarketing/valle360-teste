"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { 
  TrendingUp, 
  TrendingDown,
  ArrowLeft,
  Eye,
  MousePointerClick,
  Target,
  DollarSign,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  ArrowUpRight,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatsCard, StatsGrid } from "@/components/valle-ui";

// ============================================
// PAINEL DE DESEMPENHO - VALLE AI
// Métricas detalhadas de performance
// ============================================

type SocialDaily = {
  date: string;
  impressions: number;
  reach: number;
  engaged: number;
  profile_views: number;
  fans: number;
};

function pct(curr: number, base: number) {
  if (!base) return 0;
  return Math.round(((curr - base) / base) * 100);
}

function formatCompact(n: number) {
  if (!Number.isFinite(n)) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

export default function DesempenhoPage() {
  const [daily, setDaily] = useState<SocialDaily[]>([]);
  const [adsTotals, setAdsTotals] = useState<{ total_spend: number; total_clicks: number; total_conversions: number; avg_roas: number } | null>(null);
  const [adsAvailable, setAdsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/client/social/metrics?days=365", { cache: "no-store" });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "Falha ao carregar métricas");
      setDaily(Array.isArray(j?.daily) ? j.daily : []);

      // Ads (best-effort): consolida spend/clicks/conv/roas se houver integração
      try {
        const r2 = await fetch("/api/client/performance?days=30", { cache: "no-store" });
        const p = await r2.json().catch(() => null);
        if (r2.ok && p?.success && p?.ads) {
          setAdsAvailable(!!p.ads.available);
          setAdsTotals(p.ads.totals || null);
        } else {
          setAdsAvailable(false);
          setAdsTotals(null);
        }
      } catch {
        setAdsAvailable(false);
        setAdsTotals(null);
      }
    } catch (e: any) {
      setDaily([]);
      setError(e?.message || "Erro ao carregar métricas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totals30 = useMemo(() => {
    const last30 = daily.slice(-30);
    return {
      impressions: last30.reduce((s, d) => s + (Number(d.impressions) || 0), 0),
      reach: last30.reduce((s, d) => s + (Number(d.reach) || 0), 0),
      engaged: last30.reduce((s, d) => s + (Number(d.engaged) || 0), 0),
      profile_views: last30.reduce((s, d) => s + (Number(d.profile_views) || 0), 0),
    };
  }, [daily]);

  const deltas7 = useMemo(() => {
    const last14 = daily.slice(-14);
    const prev = last14.slice(0, 7);
    const curr = last14.slice(7);
    const sum = (arr: SocialDaily[], key: keyof SocialDaily) => arr.reduce((s, d) => s + (Number(d[key]) || 0), 0);
    return {
      impressions: pct(sum(curr, "impressions"), sum(prev, "impressions")),
      reach: pct(sum(curr, "reach"), sum(prev, "reach")),
      engaged: pct(sum(curr, "engaged"), sum(prev, "engaged")),
      profile_views: pct(sum(curr, "profile_views"), sum(prev, "profile_views")),
    };
  }, [daily]);

  const monthly = useMemo(() => {
    const map = new Map<string, { label: string; impressions: number; reach: number; engaged: number; profile_views: number }>();
    for (const d of daily) {
      const dt = new Date(String(d.date));
      if (Number.isNaN(dt.getTime())) continue;
      const key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}`;
      const label = dt.toLocaleDateString("pt-BR", { month: "short" });
      const cur = map.get(key) || { label, impressions: 0, reach: 0, engaged: 0, profile_views: 0 };
      cur.impressions += Number(d.impressions || 0) || 0;
      cur.reach += Number(d.reach || 0) || 0;
      cur.engaged += Number(d.engaged || 0) || 0;
      cur.profile_views += Number(d.profile_views || 0) || 0;
      map.set(key, cur);
    }
    const keys = Array.from(map.keys()).sort();
    return keys.slice(-12).map((k) => ({ month: map.get(k)!.label, ...map.get(k)! }));
  }, [daily]);

  const maxImpressions = Math.max(1, ...monthly.map((d) => d.impressions));

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
            <Link 
              href="/cliente/painel"
              className="p-2 rounded-lg bg-[#001533]/5 hover:bg-[#001533]/10 transition-colors"
            >
              <ArrowLeft className="size-5 text-[#001533] dark:text-white" />
            </Link>
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#1672d6] to-[#1260b5]">
              <TrendingUp className="size-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[#001533] dark:text-white">
              Desempenho
            </h1>
          </div>
          <p className="text-[#001533]/60 dark:text-white/60 ml-12">
            Métricas de performance e ROI das suas campanhas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-[#001533]/10 text-[#001533] dark:text-white hover:bg-[#001533]/5 transition-colors">
            <Filter className="size-4" />
            Filtrar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-[#001533]/10 text-[#001533] dark:text-white hover:bg-[#001533]/5 transition-colors">
            <Calendar className="size-4" />
            Últimos 30 dias
          </button>
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1672d6] text-white hover:bg-[#1672d6]/90 transition-colors"
          >
            <RefreshCw className={cn("size-4", loading ? "animate-spin" : "")} />
            Atualizar
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <StatsGrid>
          <StatsCard
            title="Impressões (30d)"
            value={formatCompact(totals30.impressions)}
            change={deltas7.impressions}
            icon={<Eye className="size-5 text-[#1672d6]" />}
          />
          <StatsCard
            title="Alcance (30d)"
            value={formatCompact(totals30.reach)}
            change={deltas7.reach}
            icon={<BarChart3 className="size-5 text-[#1672d6]" />}
          />
          <StatsCard
            title="Engajamento (30d)"
            value={formatCompact(totals30.engaged)}
            change={deltas7.engaged}
            icon={<Target className="size-5 text-[#1672d6]" />}
          />
          <StatsCard
            title="Visitas ao perfil (30d)"
            value={formatCompact(totals30.profile_views)}
            change={deltas7.profile_views}
            icon={<MousePointerClick className="size-5 text-[#1672d6]" />}
            variant="primary"
          />
        </StatsGrid>
      </motion.div>

      {/* Ads (quando disponível) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border-2 border-[#001533]/10 dark:border-white/10 bg-white dark:bg-[#001533]/50 p-6"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#1672d6]/10">
              <DollarSign className="size-5 text-[#1672d6]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#001533] dark:text-white">Ads (30d)</h3>
              <p className="text-sm text-[#001533]/60 dark:text-white/60">
                {adsAvailable ? "Métricas consolidadas de anúncios" : "Integração de Ads não conectada (ou sem dados)"}
              </p>
            </div>
          </div>
          <Link href="/admin/integracoes" className="text-sm text-[#1672d6] font-medium hover:underline flex items-center gap-1">
            Conectar Ads <ArrowUpRight className="size-4" />
          </Link>
        </div>

        <div className="mt-4">
          <StatsGrid>
            <StatsCard
              title="Investimento"
              value={adsAvailable && adsTotals ? `R$ ${adsTotals.total_spend.toFixed(0)}` : "—"}
              change={0}
              icon={<DollarSign className="size-5 text-[#1672d6]" />}
            />
            <StatsCard
              title="Cliques"
              value={adsAvailable && adsTotals ? formatCompact(adsTotals.total_clicks) : "—"}
              change={0}
              icon={<MousePointerClick className="size-5 text-[#1672d6]" />}
            />
            <StatsCard
              title="Conversões"
              value={adsAvailable && adsTotals ? formatCompact(adsTotals.total_conversions) : "—"}
              change={0}
              icon={<Target className="size-5 text-[#1672d6]" />}
            />
            <StatsCard
              title="ROAS"
              value={adsAvailable && adsTotals ? adsTotals.avg_roas.toFixed(2) : "—"}
              change={0}
              icon={<PieChart className="size-5 text-[#1672d6]" />}
              variant="primary"
            />
          </StatsGrid>
        </div>
      </motion.div>

      {/* Gráfico de Evolução */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border-2 border-[#001533]/10 dark:border-white/10 bg-white dark:bg-[#001533]/50 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#1672d6]/10">
              <Activity className="size-5 text-[#1672d6]" />
            </div>
            <h3 className="text-lg font-semibold text-[#001533] dark:text-white">
              Evolução (últimos 12 meses)
            </h3>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#1672d6]" />
              Impressões
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              Alcance
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500" />
              Engajamento
            </span>
          </div>
        </div>

        {/* Mini Chart */}
        <div className="h-64 flex items-end gap-2">
          {monthly.map((data, index) => (
            <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(data.impressions / maxImpressions) * 100}%` }}
                  transition={{ delay: index * 0.05, duration: 0.5 }}
                  className="w-full bg-[#1672d6]/20 rounded-t-md relative group cursor-pointer hover:bg-[#1672d6]/30 transition-colors"
                  style={{ minHeight: 20 }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#001533] text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {formatCompact(data.impressions)}
                  </div>
                </motion.div>
              </div>
              <span className="text-xs text-[#001533]/60 dark:text-white/60">{data.month}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Detalhes / status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border-2 border-[#001533]/10 dark:border-white/10 bg-white dark:bg-[#001533]/50 overflow-hidden"
      >
        <div className="p-6 border-b border-[#001533]/10 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#1672d6]/10">
                <BarChart3 className="size-5 text-[#1672d6]" />
              </div>
              <h3 className="text-lg font-semibold text-[#001533] dark:text-white">
                Status das métricas
              </h3>
            </div>
            <Link href="/cliente/redes" className="text-sm text-[#1672d6] font-medium hover:underline flex items-center gap-1">
              Conectar redes <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>

        <div className="p-6 space-y-2 text-sm text-[#001533]/70 dark:text-white/70">
          {loading ? (
            <p>Carregando métricas...</p>
          ) : error ? (
            <p className="text-red-600 dark:text-red-400">{error}</p>
          ) : daily.length === 0 ? (
            <p>
              Sem dados ainda. Conecte suas redes em <span className="font-medium">Cliente → Redes</span> para começar a
              coletar métricas.
            </p>
          ) : (
            <p>Métricas carregadas com sucesso. Os números acima são agregados de Instagram/Facebook (quando conectados).</p>
          )}
          <p className="text-xs text-[#001533]/50 dark:text-white/50">
            Observação: dados de “campanhas/ROI” exigem integrações de Ads/Analytics. Aqui mostramos métricas orgânicas das redes conectadas.
          </p>
        </div>
      </motion.div>
    </div>
  );
}



