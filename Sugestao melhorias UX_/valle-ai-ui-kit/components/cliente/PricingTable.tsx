"use client";

import { Check, Minus, MoveRight, PhoneCall, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";

interface PlanFeature {
  name: string;
  starter: boolean | string;
  growth: boolean | string;
  enterprise: boolean | string;
}

interface PricingTableProps {
  plans?: {
    starter: { name: string; price: string; description: string };
    growth: { name: string; price: string; description: string };
    enterprise: { name: string; price: string; description: string };
  };
  features?: PlanFeature[];
}

const defaultPlans = {
  starter: {
    name: "Starter",
    price: "R$ 997",
    description: "Ideal para pequenas empresas começando no marketing digital.",
  },
  growth: {
    name: "Growth",
    price: "R$ 2.497",
    description: "Para empresas em crescimento que precisam escalar resultados.",
  },
  enterprise: {
    name: "Enterprise",
    price: "Sob consulta",
    description: "Solução completa para grandes operações e necessidades específicas.",
  },
};

const defaultFeatures: PlanFeature[] = [
  { name: "Gestão de Redes Sociais", starter: true, growth: true, enterprise: true },
  { name: "Relatórios Mensais", starter: true, growth: true, enterprise: true },
  { name: "Campanhas de Tráfego Pago", starter: "1 canal", growth: "3 canais", enterprise: "Ilimitado" },
  { name: "Análise de Concorrentes", starter: false, growth: true, enterprise: true },
  { name: "Automações de Marketing", starter: false, growth: true, enterprise: true },
  { name: "Inteligência Artificial", starter: false, growth: "Básico", enterprise: "Avançado" },
  { name: "Gestor de Conta Dedicado", starter: false, growth: false, enterprise: true },
  { name: "Reuniões Estratégicas", starter: "Mensal", growth: "Quinzenal", enterprise: "Semanal" },
  { name: "Suporte Prioritário", starter: false, growth: true, enterprise: true },
  { name: "Dashboard Personalizado", starter: false, growth: false, enterprise: true },
];

const FeatureValue = ({ value }: { value: boolean | string }) => {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="w-5 h-5 text-emerald-500" />
    ) : (
      <Minus className="w-5 h-5 text-muted-foreground/50" />
    );
  }
  return <span className="text-sm text-muted-foreground font-medium">{value}</span>;
};

export default function PricingTable({
  plans = defaultPlans,
  features = defaultFeatures,
}: PricingTableProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  return (
    <section className="w-full py-12 lg:py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-4 mb-12">
          <Badge 
            variant="outline" 
            className="border-valle-primary/30 text-valle-primary bg-valle-primary/5"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Planos
          </Badge>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight max-w-xl">
            Escolha o plano ideal para seu negócio
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl">
            Soluções flexíveis que crescem junto com sua empresa.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center gap-3 mt-4 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                billingCycle === "monthly"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                billingCycle === "annual"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Anual
              <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-xs">
                -20%
              </Badge>
            </button>
          </div>
        </div>

        {/* Pricing Table */}
        <div className="grid text-left w-full grid-cols-4 divide-x divide-border/60 border border-border/60 rounded-2xl overflow-hidden bg-card">
          {/* Header Row */}
          <div className="col-span-1 p-6 bg-muted/30" />
          
          {/* Starter Plan Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="px-6 py-8 flex flex-col gap-3"
          >
            <p className="text-2xl font-semibold">{plans.starter.name}</p>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {plans.starter.description}
            </p>
            <p className="flex flex-col lg:flex-row lg:items-baseline gap-1 mt-4">
              <span className="text-4xl font-bold text-foreground">
                {billingCycle === "annual" ? "R$ 797" : plans.starter.price}
              </span>
              <span className="text-sm text-muted-foreground">/ mês</span>
            </p>
            <Button variant="outline" className="mt-4 gap-2 group">
              Começar agora
              <MoveRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>

          {/* Growth Plan Header - Highlighted */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="px-6 py-8 flex flex-col gap-3 bg-valle-primary/5 relative"
          >
            <Badge className="absolute -top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-valle-primary text-white border-0">
              Mais Popular
            </Badge>
            <p className="text-2xl font-semibold">{plans.growth.name}</p>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {plans.growth.description}
            </p>
            <p className="flex flex-col lg:flex-row lg:items-baseline gap-1 mt-4">
              <span className="text-4xl font-bold text-valle-primary">
                {billingCycle === "annual" ? "R$ 1.997" : plans.growth.price}
              </span>
              <span className="text-sm text-muted-foreground">/ mês</span>
            </p>
            <Button className="mt-4 gap-2 group bg-valle-primary hover:bg-valle-primary/90">
              Começar agora
              <MoveRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>

          {/* Enterprise Plan Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="px-6 py-8 flex flex-col gap-3"
          >
            <p className="text-2xl font-semibold">{plans.enterprise.name}</p>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {plans.enterprise.description}
            </p>
            <p className="flex flex-col lg:flex-row lg:items-baseline gap-1 mt-4">
              <span className="text-4xl font-bold text-foreground">
                {plans.enterprise.price}
              </span>
            </p>
            <Button variant="outline" className="mt-4 gap-2 group">
              Falar com consultor
              <PhoneCall className="w-4 h-4" />
            </Button>
          </motion.div>

          {/* Features Section Header */}
          <div className="px-6 py-4 bg-muted/30 border-t border-border/60">
            <span className="font-semibold text-foreground">Recursos</span>
          </div>
          <div className="border-t border-border/60" />
          <div className="border-t border-border/60 bg-valle-primary/5" />
          <div className="border-t border-border/60" />

          {/* Feature Rows */}
          {features.map((feature, index) => (
            <motion.div
              key={feature.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 * index }}
              className="contents"
            >
              <div className="px-6 py-4 text-sm text-foreground border-t border-border/60">
                {feature.name}
              </div>
              <div className="px-6 py-4 flex justify-center border-t border-border/60">
                <FeatureValue value={feature.starter} />
              </div>
              <div className="px-6 py-4 flex justify-center border-t border-border/60 bg-valle-primary/5">
                <FeatureValue value={feature.growth} />
              </div>
              <div className="px-6 py-4 flex justify-center border-t border-border/60">
                <FeatureValue value={feature.enterprise} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Todos os planos incluem suporte por email e acesso ao portal do cliente.{" "}
          <a href="#" className="text-valle-primary hover:underline">
            Veja termos completos
          </a>
        </p>
      </div>
    </section>
  );
}
