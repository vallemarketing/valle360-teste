"use client";

// ============================================
// DASHBOARD DO CLIENTE - VALLE AI
// Versão 4.0 - UI Premium com DisplayCards interativos
// Cores: #001533 (navy), #1672d6 (primary), #ffffff (white)
// ============================================

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Eye,
  MousePointerClick,
  Target,
  DollarSign,
  TrendingUp,
  Users,
  BarChart3,
  Sparkles,
  Newspaper,
  ChevronRight,
  Calendar,
  ArrowRight,
  Zap,
  Lightbulb,
  AlertTriangle,
  X
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// Componentes Valle UI
import {
  StatsCard, 
  StatsGrid,
  DisplayCards,
  InsightsPanel,
  QuickAccess,
  WelcomeHeader,
  NextMeeting,
  RecentActivities,
  SupportCard
} from "@/components/valle-ui";

function formatCompact(n: number) {
  if (!Number.isFinite(n)) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${Math.round(n)}`;
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
  billing: { hasOpenInvoice: boolean; invoice?: { amount: number; due_date: string; status: string } };
};

export default function ClienteDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clienteData, setClienteData] = useState({
    nome: "Cliente",
    empresa: "Empresa",
    avatar: "",
    plano: "Premium",
  });
  const [lastVisit, setLastVisit] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [feed, setFeed] = useState<{ nextMeeting: any | null; activities: any[] } | null>(null);

  useEffect(() => {
    loadClienteData();
    // Carregar e atualizar última visita
    const storedLastVisit = localStorage.getItem('valle_last_visit');
    if (storedLastVisit) {
      const diff = Date.now() - parseInt(storedLastVisit);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);
      if (days > 0) {
        setLastVisit(`há ${days} dia${days > 1 ? 's' : ''}`);
      } else if (hours > 0) {
        setLastVisit(`há ${hours} hora${hours > 1 ? 's' : ''}`);
      } else {
        setLastVisit('agora');
      }
    }
    localStorage.setItem('valle_last_visit', Date.now().toString());
  }, []);

  const loadClienteData = async () => {
    try {
    const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      // Buscar dados do cliente
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      // Resumo real do dashboard (via API - evita drift de RLS)
      const [dashRes, feedRes] = await Promise.all([
        fetch("/api/client/dashboard/summary?days=30", { cache: "no-store" }),
        fetch("/api/client/dashboard/feed?maxItems=6", { cache: "no-store" }),
      ]);

      const dashJson = await dashRes.json().catch(() => null);
      const feedJson = await feedRes.json().catch(() => null);

      setSummary(dashRes.ok && dashJson?.success ? (dashJson as DashboardSummary) : null);
      setFeed(feedRes.ok && feedJson?.success ? { nextMeeting: feedJson.nextMeeting || null, activities: feedJson.activities || [] } : null);

      if (profile || dashJson?.client) {
        setClienteData({
          nome: profile?.full_name || "Cliente",
          empresa: dashJson?.client?.company_name || "Sua Empresa",
          avatar: "",
          plano: "Premium",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1672d6] mx-auto" />
          <p className="mt-4 text-[#001533]/60 dark:text-white/60">Carregando...</p>
        </div>
      </div>
    );
  }

  const firstName = clienteData.nome.split(" ")[0];
  const kpis = summary?.kpis;
  const hasAds = !!summary?.ads?.available;
  const openInvoice = summary?.billing?.hasOpenInvoice ? summary?.billing?.invoice : null;
  const insightsNew = summary?.insights?.available ? summary?.insights?.new : 0;
  const nextMeeting = feed?.nextMeeting || null;
  const activities = Array.isArray(feed?.activities) ? feed?.activities : undefined;

  const displayCardsData = useMemo(() => {
    const delta = kpis?.impressions?.change ?? 0;
    const seg = summary?.client?.segment?.trim();
    const competitorsCount = summary?.client?.competitors_count ?? 0;
    const insightBadge = summary?.insights?.available ? `${summary.insights.new} novas` : undefined;
    return [
      {
        icon: <TrendingUp className="size-5 text-white" />,
        title: "Desempenho",
        description: hasAds ? "Ads + Social consolidados (30d)" : "Social consolidado (30d)",
        date: "Atualizado agora",
        iconClassName: "bg-[#1672d6]",
        titleClassName: "text-[#1672d6]",
        href: "/cliente/painel/desempenho",
        badge: `${delta >= 0 ? "+" : ""}${delta}%`,
        badgeColor: delta >= 0 ? "bg-emerald-500" : "bg-red-500",
      },
      {
        icon: <Newspaper className="size-5 text-white" />,
        title: "Seu Setor",
        description: seg ? `Segmento: ${seg}` : "Notícias e tendências do seu mercado",
        date: "Atualizado hoje",
        iconClassName: "bg-[#001533]",
        titleClassName: "text-[#001533] dark:text-white",
        href: "/cliente/painel/setor",
        badge: "Hoje",
        badgeColor: "bg-primary",
      },
      {
        icon: <Target className="size-5 text-white" />,
        title: "Concorrentes",
        description: competitorsCount ? `${competitorsCount} monitorado(s)` : "Defina seus concorrentes para gerar comparativos",
        date: "Atualizado agora",
        iconClassName: "bg-purple-500",
        titleClassName: "text-purple-600",
        href: "/cliente/painel/concorrentes",
        badge: competitorsCount ? `${competitorsCount}` : undefined,
        badgeColor: "bg-purple-500",
      },
      ...(insightBadge
        ? [
            {
              icon: <Lightbulb className="size-5 text-white" />,
              title: "Insights IA",
              description: "Recomendações com fontes (hoje)",
              date: "Atualizado hoje",
              iconClassName: "bg-emerald-500",
              titleClassName: "text-emerald-600",
              href: "/cliente/painel/insights",
              badge: insightBadge,
              badgeColor: "bg-emerald-500",
            },
          ]
        : []),
    ];
  }, [hasAds, kpis?.impressions?.change, summary?.client?.segment, summary?.client?.competitors_count, summary?.insights?.available, summary?.insights?.new]);

  return (
    <div className="p-4 lg:p-6 space-y-6 md:space-y-8 max-w-7xl mx-auto">
        
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <WelcomeHeader
            userName={firstName}
            userCompany={clienteData.empresa}
            planName={clienteData.plano}
            ctaText="Agendar Reunião"
            ctaHref="/cliente/agenda"
            lastVisit={lastVisit}
          />
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <StatsGrid>
            <StatsCard
              title="Impressões"
              value={kpis ? formatCompact(kpis.impressions.value) : "—"}
              change={kpis ? kpis.impressions.change : 0}
              icon={<Eye className="size-5 text-[#1672d6]" />}
            />
            <StatsCard
              title={kpis?.clicks?.label || "Cliques"}
              value={kpis ? formatCompact(kpis.clicks.value) : "—"}
              change={kpis ? kpis.clicks.change : 0}
              icon={<MousePointerClick className="size-5 text-[#1672d6]" />}
            />
            <StatsCard
              title="Conversões"
              value={kpis && hasAds ? formatCompact(kpis.conversions.value) : "—"}
              change={kpis ? kpis.conversions.change : 0}
              icon={<Target className="size-5 text-[#1672d6]" />}
            />
            <StatsCard
              title="Investimento"
              value={kpis && hasAds ? `R$ ${kpis.spend.value.toFixed(0)}` : "—"}
              change={kpis ? kpis.spend.change : 0}
              changeLabel={hasAds ? "ads (30d)" : "ads não conectado"}
              icon={<DollarSign className="size-5 text-[#1672d6]" />}
            />
          </StatsGrid>
        </motion.div>

        {/* ========== PAINEL DE INTELIGÊNCIA - Acesso Rápido ========== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Link href="/cliente/painel">
            <div className="rounded-2xl bg-gradient-to-r from-[#001533] to-[#1672d6] p-6 text-white cursor-pointer hover:shadow-xl hover:shadow-[#1672d6]/20 transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-white/20">
                    <Zap className="size-6" />
              </div>
              <div>
                    <h3 className="text-xl font-bold">Painel de Inteligência</h3>
                    <p className="text-white/70 mt-1">
                      Acesse todas as informações organizadas: desempenho, setor, concorrentes e insights IA
                    </p>
              </div>
            </div>
                <div className="p-3 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
                  <ChevronRight className="size-6 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* ========== ALERTA DE COBRANÇA ========== */}
        {!!openInvoice && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <div className="rounded-2xl bg-[#001533] p-4 text-white shadow-lg border-2 border-[#1672d6]/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-[#1672d6]">
                    <AlertTriangle className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Fatura em aberto</h3>
                    <p className="text-white/80 text-sm">
                      Você tem uma fatura de{" "}
                      <span className="font-bold">
                        {`R$ ${Number(openInvoice.amount || 0).toFixed(2).replace(".", ",")}`}
                      </span>{" "}
                      com vencimento em <span className="font-bold">{openInvoice.due_date}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/cliente/financeiro">
                    <button className="px-4 py-2 bg-[#1672d6] text-white rounded-lg font-medium text-sm hover:bg-[#1260b5] transition-colors">
                      Ver Financeiro
                    </button>
                  </Link>
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Display Cards - Destaques Clicáveis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="rounded-2xl border-2 border-[#001533]/10 dark:border-white/10 bg-white dark:bg-[#001533]/50 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#1672d6]/10">
                    <Sparkles className="size-5 text-[#1672d6]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#001533] dark:text-white">
                      Destaques da Semana
                    </h3>
                    <p className="text-sm text-[#001533]/60 dark:text-white/60">
                      Clique em um card para ver detalhes
                    </p>
                  </div>
                </div>
                <Link 
                  href="/cliente/painel" 
                  className="flex items-center gap-1 text-sm font-medium text-[#1672d6] hover:underline"
                >
                  Ver todos <ArrowRight className="size-4" />
                </Link>
              </div>
              
              <div className="flex justify-center py-4">
                <DisplayCards 
                  cards={displayCardsData.map((card, index) => ({
                    ...card,
                    className: index === 0
                      ? cn(
                          "[grid-area:stack] hover:-translate-y-10",
                          "before:absolute before:w-full before:h-full before:rounded-xl",
                          "before:bg-[#001533]/5 before:content-[''] before:left-0 before:top-0",
                          "before:transition-opacity before:duration-500",
                          "hover:before:opacity-0",
                          "grayscale-[20%] hover:grayscale-0"
                        )
                      : index === 1
                      ? cn(
                          "[grid-area:stack] translate-x-16 translate-y-10 hover:-translate-y-1",
                          "before:absolute before:w-full before:h-full before:rounded-xl",
                          "before:bg-[#001533]/5 before:content-[''] before:left-0 before:top-0",
                          "before:transition-opacity before:duration-500",
                          "hover:before:opacity-0",
                          "grayscale-[20%] hover:grayscale-0"
                        )
                      : "[grid-area:stack] translate-x-32 translate-y-20 hover:translate-y-10"
                  }))}
                />
                  </div>
            </motion.div>

            {/* Insights Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              <InsightsPanel 
                defaultExpanded={false}
                stats={{
                  impressions: { value: kpis ? formatCompact(kpis.impressions.value) : "—", change: kpis ? kpis.impressions.change : 0 },
                  clicks: { value: kpis ? formatCompact(kpis.clicks.value) : "—", change: kpis ? kpis.clicks.change : 0 },
                  conversions: { value: kpis && hasAds ? formatCompact(kpis.conversions.value) : "—", change: kpis ? kpis.conversions.change : 0 },
                  roi: { value: kpis && hasAds ? `${kpis.roi.value.toFixed(2)}` : "—", change: kpis ? kpis.roi.change : 0 },
                }}
              />
            </motion.div>

            {/* Quick Access */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="rounded-2xl border-2 border-[#001533]/10 dark:border-white/10 bg-white dark:bg-[#001533]/50 p-6"
            >
              <QuickAccess />
            </motion.div>
        </div>

          {/* Right Column - 1/3 Sidebar */}
          <div className="space-y-6">
            
            {/* Card de Insights IA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
            >
              <Link href="/cliente/painel/insights">
                <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 p-6 cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all group">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-emerald-500">
                      <Lightbulb className="size-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#001533] dark:text-white">
                      Insights da Val
                    </h3>
                  </div>
                  <p className="text-sm text-[#001533]/70 dark:text-white/70 mb-4">
                    {summary?.insights?.available
                      ? `${insightsNew} nova(s) recomendação(ões) hoje para melhorar seus resultados`
                      : "Gere insights com fontes para receber recomendações personalizadas"}
                  </p>
                  <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm group-hover:gap-3 transition-all">
                    Ver recomendações <ChevronRight className="size-4" />
                  </div>
        </div>
              </Link>
            </motion.div>

            {/* Próxima Reunião */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <NextMeeting
                date={nextMeeting?.date}
                time={nextMeeting?.time}
                with={nextMeeting?.with}
                withRole={nextMeeting?.withRole}
                href={nextMeeting?.href || "/cliente/agenda"}
              />
            </motion.div>

            {/* Atividades Recentes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <RecentActivities activities={activities} />
            </motion.div>

            {/* Card de Suporte */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <SupportCard />
            </motion.div>
          </div>
        </div>
    </div>
  );
}
