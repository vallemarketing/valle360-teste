"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Plus,
  Target,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type WebInsights = {
  message: string;
  sources: string[];
  provider?: string;
  generatedAt?: string;
};

function uniqStrings(list: string[]) {
  return Array.from(new Set((list || []).map((s) => String(s).trim()).filter(Boolean)));
}

export default function ConcorrentesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState<string>("Cliente");
  const [segment, setSegment] = useState<string>("");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [newCompetitor, setNewCompetitor] = useState<string>("");

  const [insights, setInsights] = useState<WebInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const r = await fetch("/api/client/profile");
        const data = await r.json().catch(() => null);
        if (!r.ok) throw new Error(data?.error || "Falha ao carregar perfil do cliente");
        if (!alive) return;
        const p = data?.profile || {};
        setCompanyName(String(p.company_name || "Cliente"));
        setSegment(String(p.segment || p.industry || ""));
        setCompetitors(Array.isArray(p.competitors) ? p.competitors.map(String).filter(Boolean) : []);
      } catch (e: any) {
        if (!alive) return;
        setError(String(e?.message || "Erro ao carregar"));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const competitorsText = useMemo(() => competitors.join("\n"), [competitors]);

  const saveCompetitors = async (next: string[]) => {
    const list = uniqStrings(next).slice(0, 25);
    setSaving(true);
    try {
      const r = await fetch("/api/client/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segment: segment || null,
          competitors: list,
          concorrentes: list.join("\n"),
        }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(data?.error || "Falha ao salvar concorrentes");
      setCompetitors(list);
    } finally {
      setSaving(false);
    }
  };

  const addCompetitor = async () => {
    const v = String(newCompetitor || "").trim();
    if (!v) return;
    setNewCompetitor("");
    await saveCompetitors([...competitors, v]);
  };

  const removeCompetitor = async (name: string) => {
    await saveCompetitors(competitors.filter((c) => c !== name));
  };

  const generateWebInsights = async () => {
    setInsightsLoading(true);
    try {
      const r = await fetch("/api/ai/val/web-insights");
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(data?.error || "Falha ao gerar insights");
      if (data?.skip) {
        setInsights(null);
        return;
      }
      setInsights({
        message: String(data?.message || ""),
        sources: Array.isArray(data?.sources) ? data.sources.map(String) : [],
        provider: data?.provider,
        generatedAt: data?.generatedAt,
      });
    } catch (e: any) {
      setInsights({
        message: String(e?.message || "Erro ao gerar insights"),
        sources: [],
      });
    } finally {
      setInsightsLoading(false);
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
            <Link
              href="/cliente/painel"
              className="p-2 rounded-lg bg-[#001533]/5 hover:bg-[#001533]/10 transition-colors"
            >
              <ArrowLeft className="size-5 text-[#001533] dark:text-white" />
            </Link>
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
              <Target className="size-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[#001533] dark:text-white">Concorrentes</h1>
          </div>
          <p className="text-[#001533]/60 dark:text-white/60 ml-12">
            Configure seus concorrentes para <span className="font-medium">{companyName}</span>
            {segment ? (
              <>
                {" "}
                • <span className="font-medium">{segment}</span>
              </>
            ) : null}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={generateWebInsights}
            disabled={insightsLoading || loading}
            className={cn(
              "px-4 py-2 rounded-xl font-medium transition-all border",
              "bg-white dark:bg-[#001533]/50 text-[#001533] dark:text-white",
              "border-[#001533]/10 dark:border-white/10 hover:border-[#1672d6]/30"
            )}
          >
            {insightsLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" /> Gerando…
              </span>
            ) : (
              "Gerar insights com fontes"
            )}
          </button>
        </div>
      </motion.div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-2">
          <AlertTriangle className="size-4 mt-0.5" />
          <div>
            <p className="font-medium">Não foi possível carregar seu perfil</p>
            <p className="mt-1 opacity-80">{error}</p>
          </div>
        </div>
      )}

      {/* Competitors editor */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn(
          "rounded-2xl border-2 border-[#001533]/10 dark:border-white/10 bg-white dark:bg-[#001533]/50 p-6",
          loading && "opacity-70"
        )}
      >
        <div className="flex flex-col md:flex-row gap-3 md:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-[#001533] dark:text-white mb-1.5">
              Adicionar concorrente
            </label>
            <input
              value={newCompetitor}
              onChange={(e) => setNewCompetitor(e.target.value)}
              placeholder="Ex: Empresa X, @perfil, domínio.com.br"
              className="w-full px-4 py-3 rounded-xl border-2 border-[#001533]/10 dark:border-white/10 bg-white dark:bg-[#001533]/50 text-[#001533] dark:text-white placeholder:text-[#001533]/40 dark:placeholder:text-white/40 focus:border-[#1672d6] focus:outline-none transition-colors"
              disabled={loading || saving}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void addCompetitor();
                }
              }}
            />
          </div>
          <button
            onClick={() => void addCompetitor()}
            disabled={loading || saving || !newCompetitor.trim()}
            className={cn(
              "px-4 py-3 rounded-xl font-medium transition-all",
              "bg-[#1672d6] text-white hover:bg-[#1260b5]",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <span className="inline-flex items-center gap-2">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Adicionar
            </span>
          </button>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#001533] dark:text-white">Seus concorrentes</h3>
            <span className="text-sm text-[#001533]/50 dark:text-white/50">{competitors.length} monitorados</span>
          </div>

          {competitors.length === 0 ? (
            <p className="mt-3 text-sm text-[#001533]/60 dark:text-white/60">
              Adicione pelo menos 1 concorrente para a Val conseguir comparar e sugerir ações.
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              {competitors.map((c) => (
                <div
                  key={c}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#001533]/10 dark:border-white/10 bg-white/60 dark:bg-[#001533]/30 p-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[#001533] dark:text-white truncate">{c}</p>
                    <p className="text-xs text-[#001533]/50 dark:text-white/50 truncate">Salvo no seu perfil</p>
                  </div>
                  <button
                    onClick={() => void removeCompetitor(c)}
                    disabled={saving}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-red-600 disabled:opacity-50"
                    title="Remover"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Visible text area (optional) for transparency/debug */}
          <div className="mt-4">
            <label className="block text-xs font-medium text-[#001533]/50 dark:text-white/50 mb-1">
              (Opcional) Lista em texto
            </label>
            <textarea
              value={competitorsText}
              readOnly
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-[#001533]/10 dark:border-white/10 bg-[#001533]/5 dark:bg-white/5 text-[#001533] dark:text-white text-sm"
            />
          </div>
        </div>
      </motion.div>

      {/* Web insights */}
      {insights && insights.message && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border-2 border-[#001533]/10 dark:border-white/10 bg-white dark:bg-[#001533]/50 p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#001533] dark:text-white">Insights com fontes</h3>
              <p className="text-xs text-[#001533]/50 dark:text-white/50 mt-1">
                {insights.provider ? `Fonte: ${insights.provider}` : "Fonte: web"}
                {insights.generatedAt ? ` • ${new Date(insights.generatedAt).toLocaleString("pt-BR")}` : ""}
              </p>
            </div>
          </div>

          <div className="mt-3 whitespace-pre-wrap text-sm text-[#001533] dark:text-white">
            {insights.message}
          </div>

          {insights.sources?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#001533]/10 dark:border-white/10">
              <p className="text-sm font-medium text-[#001533] dark:text-white mb-2">Fontes</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {insights.sources.slice(0, 10).map((u) => (
                  <a
                    key={u}
                    href={u}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-2 rounded-xl border border-[#001533]/10 dark:border-white/10 bg-white/60 dark:bg-[#001533]/30 px-3 py-2 hover:border-[#1672d6]/30 transition-colors"
                  >
                    <span className="text-xs text-[#1672d6] underline break-all">{u}</span>
                    <ExternalLink className="size-4 text-[#001533]/40 dark:text-white/40" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}


