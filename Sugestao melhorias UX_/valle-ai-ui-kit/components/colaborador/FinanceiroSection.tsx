"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Filter,
  Download,
  Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Conta {
  id: string;
  descricao: string;
  valor: number;
  vencimento: string;
  status: "pendente" | "pago" | "atrasado" | "agendado";
  categoria: string;
  cliente?: string;
  fornecedor?: string;
}

const contasPagar: Conta[] = [
  { id: "1", descricao: "Google Ads - Dezembro", valor: 5200, vencimento: "15/12/2024", status: "pendente", categoria: "Marketing", fornecedor: "Google" },
  { id: "2", descricao: "Meta Ads - Dezembro", valor: 3800, vencimento: "10/12/2024", status: "atrasado", categoria: "Marketing", fornecedor: "Meta" },
  { id: "3", descricao: "Licença Adobe CC", valor: 890, vencimento: "20/12/2024", status: "agendado", categoria: "Software", fornecedor: "Adobe" },
  { id: "4", descricao: "Freelancer Design", valor: 2500, vencimento: "18/12/2024", status: "pendente", categoria: "Serviços", fornecedor: "João Design" },
];

const contasReceber: Conta[] = [
  { id: "1", descricao: "Gestão Redes Sociais - Dez", valor: 4500, vencimento: "05/12/2024", status: "pago", categoria: "Serviços", cliente: "TechStart Brasil" },
  { id: "2", descricao: "Campanha Black Friday", valor: 8900, vencimento: "10/12/2024", status: "pendente", categoria: "Campanhas", cliente: "Loja XYZ" },
  { id: "3", descricao: "Setup Google Ads", valor: 2000, vencimento: "15/12/2024", status: "pendente", categoria: "Serviços", cliente: "StartupABC" },
  { id: "4", descricao: "Consultoria Marketing", valor: 6500, vencimento: "20/12/2024", status: "agendado", categoria: "Consultoria", cliente: "Empresa 123" },
];

const statusConfig = {
  pendente: { label: "Pendente", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Clock },
  pago: { label: "Pago", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: CheckCircle2 },
  atrasado: { label: "Atrasado", color: "bg-red-500/10 text-red-600 border-red-500/20", icon: AlertTriangle },
  agendado: { label: "Agendado", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Calendar },
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function ContaCard({ conta, tipo }: { conta: Conta; tipo: "pagar" | "receber" }) {
  const status = statusConfig[conta.status];
  const StatusIcon = status.icon;
  const isPagar = tipo === "pagar";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={cn(
        "flex items-center justify-between p-4 rounded-xl border border-border/60",
        "bg-card hover:border-valle-primary/30 hover:shadow-md transition-all cursor-pointer"
      )}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className={cn(
          "p-2 rounded-lg",
          isPagar ? "bg-red-500/10" : "bg-emerald-500/10"
        )}>
          {isPagar ? (
            <ArrowUpRight className="w-5 h-5 text-red-500" />
          ) : (
            <ArrowDownLeft className="w-5 h-5 text-emerald-500" />
          )}
        </div>

        {/* Info */}
        <div>
          <p className="font-medium text-foreground">{conta.descricao}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">
              {isPagar ? conta.fornecedor : conta.cliente}
            </span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
            <span className="text-xs text-muted-foreground">
              Venc: {conta.vencimento}
            </span>
          </div>
        </div>
      </div>

      {/* Value & Status */}
      <div className="flex items-center gap-4">
        <span className={cn(
          "font-semibold",
          isPagar ? "text-red-600" : "text-emerald-600"
        )}>
          {isPagar ? "-" : "+"}{formatCurrency(conta.valor)}
        </span>
        <Badge variant="outline" className={status.color}>
          <StatusIcon className="w-3 h-3 mr-1" />
          {status.label}
        </Badge>
      </div>
    </motion.div>
  );
}

function ResumoCard({ 
  titulo, 
  valor, 
  quantidade, 
  icon: Icon, 
  trend,
  color 
}: { 
  titulo: string; 
  valor: number; 
  quantidade: number;
  icon: React.ElementType;
  trend?: string;
  color: "blue" | "red" | "green" | "amber";
}) {
  const colorClasses = {
    blue: "bg-valle-primary/10 text-valle-primary",
    red: "bg-red-500/10 text-red-500",
    green: "bg-emerald-500/10 text-emerald-500",
    amber: "bg-amber-500/10 text-amber-500",
  };

  return (
    <Card className="border-border/60">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-2 rounded-lg", colorClasses[color])}>
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-0">
              <TrendingUp className="w-3 h-3 mr-1" />
              {trend}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{titulo}</p>
        <p className="text-2xl font-bold text-foreground mt-1">
          {formatCurrency(valor)}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {quantidade} {quantidade === 1 ? "conta" : "contas"}
        </p>
      </CardContent>
    </Card>
  );
}

export default function FinanceiroSection() {
  const [activeTab, setActiveTab] = useState("pagar");

  // Cálculos
  const totalPagar = contasPagar.reduce((acc, c) => acc + c.valor, 0);
  const totalReceber = contasReceber.reduce((acc, c) => acc + c.valor, 0);
  const atrasadas = contasPagar.filter(c => c.status === "atrasado").reduce((acc, c) => acc + c.valor, 0);
  const recebido = contasReceber.filter(c => c.status === "pago").reduce((acc, c) => acc + c.valor, 0);

  return (
    <section className="w-full py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Financeiro</h2>
            <p className="text-muted-foreground">
              Gerencie contas a pagar e receber
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtrar
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button size="sm" className="bg-valle-primary hover:bg-valle-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Nova Conta
            </Button>
          </div>
        </div>

        {/* Resumo Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <ResumoCard
            titulo="Total a Pagar"
            valor={totalPagar}
            quantidade={contasPagar.length}
            icon={ArrowUpRight}
            color="red"
          />
          <ResumoCard
            titulo="Total a Receber"
            valor={totalReceber}
            quantidade={contasReceber.length}
            icon={ArrowDownLeft}
            color="green"
            trend="+12%"
          />
          <ResumoCard
            titulo="Contas Atrasadas"
            valor={atrasadas}
            quantidade={contasPagar.filter(c => c.status === "atrasado").length}
            icon={AlertTriangle}
            color="amber"
          />
          <ResumoCard
            titulo="Recebido este Mês"
            valor={recebido}
            quantidade={contasReceber.filter(c => c.status === "pago").length}
            icon={CheckCircle2}
            color="blue"
          />
        </div>

        {/* Fluxo de Caixa Visual */}
        <Card className="border-border/60 mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Fluxo de Caixa Projetado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Entradas</span>
                  <span className="text-sm font-medium text-emerald-600">
                    {formatCurrency(totalReceber)}
                  </span>
                </div>
                <Progress value={70} className="h-2 bg-emerald-100 [&>div]:bg-emerald-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Saídas</span>
                  <span className="text-sm font-medium text-red-600">
                    {formatCurrency(totalPagar)}
                  </span>
                </div>
                <Progress value={55} className="h-2 bg-red-100 [&>div]:bg-red-500" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border/60">
              <span className="font-medium text-foreground">Saldo Projetado</span>
              <span className={cn(
                "text-xl font-bold",
                totalReceber - totalPagar >= 0 ? "text-emerald-600" : "text-red-600"
              )}>
                {formatCurrency(totalReceber - totalPagar)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Contas */}
        <Tabs defaultValue="pagar" onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="pagar" className="gap-2">
              <ArrowUpRight className="w-4 h-4" />
              Contas a Pagar
            </TabsTrigger>
            <TabsTrigger value="receber" className="gap-2">
              <ArrowDownLeft className="w-4 h-4" />
              Contas a Receber
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="pagar" className="space-y-3">
              {contasPagar.map((conta) => (
                <ContaCard key={conta.id} conta={conta} tipo="pagar" />
              ))}
            </TabsContent>

            <TabsContent value="receber" className="space-y-3">
              {contasReceber.map((conta) => (
                <ContaCard key={conta.id} conta={conta} tipo="receber" />
              ))}
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>
    </section>
  );
}
