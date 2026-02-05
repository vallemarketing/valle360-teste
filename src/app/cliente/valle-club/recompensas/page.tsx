"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Gift,
  ChevronLeft,
  Sparkles,
  CreditCard,
  Calendar,
  FileText,
  Shirt,
  Star,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ============================================
// LOJA DE RECOMPENSAS - VALLE CLUB
// Trocar pontos por benefícios
// ============================================

const REWARDS = [
  {
    id: 1,
    name: "500 Créditos Extras",
    description: "Adicione créditos para usar em serviços extras",
    points: 1000,
    icon: CreditCard,
    category: "credits",
    available: true,
  },
  {
    id: 2,
    name: "Reunião Estratégica",
    description: "1 hora de consultoria com nosso time",
    points: 2000,
    icon: Calendar,
    category: "service",
    available: true,
  },
  {
    id: 3,
    name: "Relatório Premium",
    description: "Análise completa do seu mercado",
    points: 3000,
    icon: FileText,
    category: "service",
    available: true,
  },
  {
    id: 4,
    name: "Kit Valle Exclusivo",
    description: "Camiseta, caneca e adesivos",
    points: 4000,
    icon: Shirt,
    category: "physical",
    available: true,
  },
  {
    id: 5,
    name: "Desconto 10% Mensalidade",
    description: "Aplicado no próximo mês",
    points: 5000,
    icon: Star,
    category: "discount",
    available: true,
  },
  {
    id: 6,
    name: "Mês Grátis",
    description: "1 mês de serviço sem custo",
    points: 10000,
    icon: Gift,
    category: "discount",
    available: false,
  },
];

const CATEGORIES = [
  { id: "all", name: "Todos" },
  { id: "credits", name: "Créditos" },
  { id: "service", name: "Serviços" },
  { id: "physical", name: "Físicos" },
  { id: "discount", name: "Descontos" },
];

export default function RecompensasPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redeemedId, setRedeemedId] = useState<number | null>(null);

  const filteredRewards = REWARDS.filter(
    (r) => selectedCategory === "all" || r.category === selectedCategory
  );

  const handleRedeem = (rewardId: number) => {
    setRedeemedId(rewardId);
    // Resgate ainda não está implementado no backend.
    setTimeout(() => setRedeemedId(null), 1200);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/client/valle-club", { cache: "no-store" });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success) throw new Error(json?.error || "Falha ao carregar pontos");
        setUserPoints(Number(json?.score?.total_points || 0));
      } catch (e) {
        console.error("Falha ao carregar pontos do Valle Club:", e);
        setUserPoints(0);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link 
          href="/cliente/valle-club"
          className="inline-flex items-center gap-2 text-[#1672d6] hover:underline mb-4"
        >
          <ChevronLeft className="size-4" />
          Voltar para Valle Club
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#1672d6] to-[#001533]">
                <Gift className="size-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-[#001533] dark:text-white">
                Loja de Recompensas
              </h1>
            </div>
            <p className="text-[#001533]/60 dark:text-white/60">
              Troque seus Valle Points por benefícios exclusivos
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1672d6]/10">
            <Sparkles className="size-5 text-[#1672d6]" />
            <span className="font-bold text-[#1672d6]">
              {loading ? "Carregando..." : `${userPoints.toLocaleString()} pontos`}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 overflow-x-auto pb-2"
      >
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? "default" : "outline"}
            className={cn(
              selectedCategory === cat.id 
                ? "bg-[#1672d6] hover:bg-[#1260b5]" 
                : "border-[#001533]/20 hover:bg-[#001533]/5"
            )}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.name}
          </Button>
        ))}
      </motion.div>

      {/* Grid de Recompensas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {filteredRewards.map((reward, index) => {
          const Icon = reward.icon;
          const canAfford = userPoints >= reward.points;
          const isRedeemed = redeemedId === reward.id;

          return (
            <motion.div
              key={reward.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Card className={cn(
                "border-2 transition-all h-full",
                canAfford && reward.available
                  ? "border-[#1672d6]/30 hover:border-[#1672d6]/50 hover:shadow-lg"
                  : "border-[#001533]/10 opacity-60"
              )}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-3 rounded-xl",
                      canAfford && reward.available
                        ? "bg-[#1672d6]/10"
                        : "bg-[#001533]/10"
                    )}>
                      <Icon className={cn(
                        "size-6",
                        canAfford && reward.available
                          ? "text-[#1672d6]"
                          : "text-[#001533]/40"
                      )} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-[#001533] dark:text-white">
                        {reward.name}
                      </h3>
                      <p className="text-sm text-[#001533]/60 dark:text-white/60 mt-1">
                        {reward.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#001533]/10 dark:border-white/10">
                    <Badge variant="outline" className={cn(
                      "font-bold",
                      canAfford ? "bg-[#1672d6]/10 text-[#1672d6]" : ""
                    )}>
                      {reward.points.toLocaleString()} pts
                    </Badge>

                    <Button
                      size="sm"
                      disabled={true}
                      onClick={() => handleRedeem(reward.id)}
                      className={cn(
                        canAfford && reward.available
                          ? "bg-[#1672d6] hover:bg-[#1260b5] text-white"
                          : ""
                      )}
                    >
                      {isRedeemed ? (
                        <>
                          <Check className="size-4 mr-1" />
                          Resgatado!
                        </>
                      ) : (
                        "Resgate em breve"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

