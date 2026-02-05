"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, AlertTriangle, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";
import IndustryNewsFeed from "@/components/cliente/IndustryNewsFeed";

type IndustryKey =
  | "marketing_digital"
  | "ecommerce"
  | "tecnologia"
  | "saude"
  | "educacao"
  | "financeiro"
  | "varejo"
  | "alimentacao"
  | "imobiliario"
  | "moda";

function mapIndustryKey(input: string): IndustryKey {
  const s = String(input || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (s.includes("ecom") || s.includes("loja") || s.includes("marketplace")) return "ecommerce";
  if (s.includes("tech") || s.includes("saas") || s.includes("software") || s.includes("tecnolog")) return "tecnologia";
  if (s.includes("saude") || s.includes("clin") || s.includes("med") || s.includes("odont")) return "saude";
  if (s.includes("educ") || s.includes("curso") || s.includes("escola")) return "educacao";
  if (s.includes("finan") || s.includes("banco") || s.includes("credito") || s.includes("fintech")) return "financeiro";
  if (s.includes("varejo") || s.includes("retail")) return "varejo";
  if (s.includes("alimenta") || s.includes("restaurante") || s.includes("food")) return "alimentacao";
  if (s.includes("imobili") || s.includes("construc") || s.includes("corret")) return "imobiliario";
  if (s.includes("moda") || s.includes("fashion") || s.includes("vestuar")) return "moda";
  return "marketing_digital";
}

export default function SetorPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

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
        setProfile(data?.profile || null);
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

  const industryKey: IndustryKey = useMemo(() => {
    const base = String(profile?.segment || profile?.industry || "");
    return mapIndustryKey(base);
  }, [profile?.segment, profile?.industry]);

  const clientName = String(profile?.company_name || "Cliente");

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
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600">
              <Newspaper className="size-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[#001533] dark:text-white">Seu Setor</h1>
          </div>
          <p className="text-[#001533]/60 dark:text-white/60 ml-12">
            Notícias e tendências para <span className="font-medium">{clientName}</span>
          </p>
        </div>
      </motion.div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-2">
          <AlertTriangle className="size-4 mt-0.5" />
          <div>
            <p className="font-medium">Não foi possível carregar dados do setor</p>
            <p className="mt-1 opacity-80">{error}</p>
          </div>
        </div>
      )}

      {!error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "rounded-2xl border-2 border-[#001533]/10 dark:border-white/10 bg-white dark:bg-[#001533]/50 p-4",
            loading && "opacity-70"
          )}
        >
          <IndustryNewsFeed industry={industryKey} clientName={clientName} />
        </motion.div>
      )}
    </div>
  );
}


