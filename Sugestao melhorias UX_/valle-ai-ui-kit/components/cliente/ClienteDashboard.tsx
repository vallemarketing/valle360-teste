"use client";

import { motion } from "framer-motion";
import { 
  Calendar, 
  Bell, 
  Settings,
  ChevronRight,
  FileText,
  MessageSquare,
  HelpCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Import dos componentes criados
import StatsCards from "./StatsCards";
import DisplayCards from "./DisplayCards";

// Dados do cliente (viriam de uma API)
const clienteData = {
  nome: "João Silva",
  empresa: "TechStart Brasil",
  avatar: "",
  plano: "Growth",
  proximaReuniao: "15 Dez, 14:00",
};

const atividadesRecentes = [
  {
    id: 1,
    tipo: "campanha",
    titulo: "Campanha Black Friday atualizada",
    tempo: "Há 2 horas",
  },
  {
    id: 2,
    tipo: "relatorio",
    titulo: "Relatório semanal disponível",
    tempo: "Há 5 horas",
  },
  {
    id: 3,
    tipo: "mensagem",
    titulo: "Nova mensagem do gestor",
    tempo: "Ontem",
  },
  {
    id: 4,
    tipo: "campanha",
    titulo: "Meta Ads: orçamento otimizado",
    tempo: "2 dias atrás",
  },
];

const quickLinks = [
  { icon: FileText, label: "Relatórios", href: "/cliente/relatorios" },
  { icon: MessageSquare, label: "Mensagens", href: "/cliente/mensagens" },
  { icon: Calendar, label: "Agendar Reunião", href: "/cliente/reunioes" },
  { icon: HelpCircle, label: "Suporte", href: "/cliente/suporte" },
];

export default function ClienteDashboard() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-valle-navy to-valle-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="font-semibold text-foreground">Valle AI</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-valle-primary text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
            <Avatar className="h-9 w-9 border-2 border-valle-primary/20">
              <AvatarImage src={clienteData.avatar} />
              <AvatarFallback className="bg-valle-primary/10 text-valle-primary font-semibold">
                {clienteData.nome.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Olá, {clienteData.nome.split(" ")[0]}! 👋
              </h1>
              <p className="text-muted-foreground mt-1">
                Aqui está o resumo da sua conta {clienteData.empresa}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-valle-primary/30 text-valle-primary">
                Plano {clienteData.plano}
              </Badge>
              <Button className="bg-valle-primary hover:bg-valle-primary/90">
                <Calendar className="w-4 h-4 mr-2" />
                Agendar Reunião
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <StatsCards />
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Destaques */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-border/60">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold flex items-center justify-between">
                    Destaques
                    <Button variant="ghost" size="sm" className="text-valle-primary">
                      Ver todos
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center py-8">
                  <DisplayCards />
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-border/60">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold">
                    Acesso Rápido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {quickLinks.map((link, index) => {
                      const Icon = link.icon;
                      return (
                        <motion.a
                          key={index}
                          href={link.href}
                          whileHover={{ y: -4 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex flex-col items-center gap-3 p-4 rounded-xl border border-border/60 bg-card hover:border-valle-primary/40 hover:shadow-lg hover:shadow-valle-primary/5 transition-all cursor-pointer"
                        >
                          <div className="p-3 rounded-lg bg-valle-primary/10">
                            <Icon className="w-6 h-6 text-valle-primary" />
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {link.label}
                          </span>
                        </motion.a>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Próxima Reunião */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-border/60 bg-gradient-to-br from-valle-navy to-valle-primary text-white">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-white/20">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-white/70">Próxima Reunião</p>
                      <p className="font-semibold">{clienteData.proximaReuniao}</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/80 mb-4">
                    Reunião de alinhamento estratégico com seu gestor de conta.
                  </p>
                  <Button variant="secondary" className="w-full bg-white text-valle-navy hover:bg-white/90">
                    Confirmar Presença
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Atividades Recentes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="border-border/60">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold flex items-center justify-between">
                    Atividades Recentes
                    <Button variant="ghost" size="sm" className="text-valle-primary text-xs">
                      Ver todas
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[280px] pr-4">
                    <div className="space-y-1">
                      {atividadesRecentes.map((atividade, index) => (
                        <div key={atividade.id}>
                          <div className="flex items-start gap-3 py-3 hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors cursor-pointer">
                            <div className="w-2 h-2 rounded-full bg-valle-primary mt-2 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground line-clamp-1">
                                {atividade.titulo}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {atividade.tempo}
                              </p>
                            </div>
                          </div>
                          {index < atividadesRecentes.length - 1 && (
                            <Separator className="ml-5" />
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>

            {/* Precisa de Ajuda? */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="border-border/60 border-dashed">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-valle-primary/10 flex items-center justify-center mx-auto mb-4">
                    <HelpCircle className="w-6 h-6 text-valle-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Precisa de ajuda?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Nossa equipe está pronta para te ajudar.
                  </p>
                  <Button variant="outline" className="w-full">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Falar com Suporte
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
