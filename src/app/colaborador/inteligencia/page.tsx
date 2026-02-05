'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Brain,
  Sparkles,
  Users,
  Target,
  Heart,
  Award,
  TrendingUp,
  MessageSquare,
  Lightbulb,
  BookOpen,
  Star,
  CheckCircle,
  ChevronRight,
  Calendar,
  Briefcase,
  Coffee,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientInsight {
  id: string;
  clientName: string;
  company: string;
  engagement: number;
  satisfaction: number;
  tip: string;
}

interface CultureValue {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function ColaboradorInteligenciaPage() {
  const [activeTab, setActiveTab] = useState('cultura');

  // Valores e cultura da empresa
  const cultureValues: CultureValue[] = [
    {
      id: '1',
      title: 'Excelência',
      description: 'Buscamos sempre entregar o melhor resultado para nossos clientes, superando expectativas.',
      icon: <Star className="w-6 h-6 text-amber-500" />
    },
    {
      id: '2',
      title: 'Colaboração',
      description: 'Trabalhamos juntos, compartilhando conhecimento e apoiando uns aos outros.',
      icon: <Users className="w-6 h-6 text-blue-500" />
    },
    {
      id: '3',
      title: 'Inovação',
      description: 'Estamos sempre buscando novas formas de fazer melhor, usando tecnologia e criatividade.',
      icon: <Lightbulb className="w-6 h-6 text-yellow-500" />
    },
    {
      id: '4',
      title: 'Compromisso',
      description: 'Cumprimos o que prometemos, respeitando prazos e mantendo a qualidade.',
      icon: <CheckCircle className="w-6 h-6 text-emerald-500" />
    }
  ];

  // Insights dos clientes que o colaborador atende
  const myClientsInsights: ClientInsight[] = [
    {
      id: '1',
      clientName: 'Tech Solutions',
      company: 'Tech Solutions Ltda',
      engagement: 92,
      satisfaction: 9.2,
      tip: 'Cliente prefere comunicação por WhatsApp. Responde rapidamente às aprovações.'
    },
    {
      id: '2',
      clientName: 'Valle Boutique',
      company: 'Valle Boutique ME',
      engagement: 78,
      satisfaction: 8.5,
      tip: 'Gosta de posts com fotos de produtos. Prefere reuniões às segundas-feiras.'
    },
    {
      id: '3',
      clientName: 'Clínica Saúde',
      company: 'Clínica Saúde SA',
      engagement: 85,
      satisfaction: 8.8,
      tip: 'Precisa de aprovação prévia para qualquer conteúdo. Priorize conteúdo educativo.'
    }
  ];

  // Dicas para atender melhor
  const tips = [
    {
      id: '1',
      title: 'Responda em até 2 horas',
      description: 'Clientes que recebem resposta rápida têm 40% mais satisfação.',
      priority: 'high'
    },
    {
      id: '2',
      title: 'Use o nome do cliente',
      description: 'Personalização aumenta engajamento em 25%.',
      priority: 'medium'
    },
    {
      id: '3',
      title: 'Antecipe necessidades',
      description: 'Sugira melhorias antes que o cliente peça. Isso gera confiança.',
      priority: 'medium'
    },
    {
      id: '4',
      title: 'Comemore conquistas',
      description: 'Envie mensagem quando metas forem batidas. Cliente se sente valorizado.',
      priority: 'low'
    }
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#001533] dark:text-white mb-2">
          Central de Inteligência
        </h1>
        <p className="text-[#001533]/60 dark:text-white/60">
          Cultura da empresa, dicas e insights dos seus clientes
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="cultura">
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="cultura">
            <Heart className="w-4 h-4 mr-2" />
            Cultura
          </TabsTrigger>
          <TabsTrigger value="dicas">
            <Lightbulb className="w-4 h-4 mr-2" />
            Dicas
          </TabsTrigger>
          <TabsTrigger value="clientes">
            <Users className="w-4 h-4 mr-2" />
            Meus Clientes
          </TabsTrigger>
        </TabsList>

        {/* Cultura da Empresa */}
        <TabsContent value="cultura" className="space-y-6 mt-6">
          {/* Missão e Visão */}
          <Card className="border-2 border-[#1672d6]/20 bg-gradient-to-br from-[#1672d6]/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-[#1672d6]/10">
                  <Brain className="w-6 h-6 text-[#1672d6]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#001533] dark:text-white">Nossa Missão</h2>
                  <Badge className="bg-[#1672d6]/10 text-[#1672d6] border-[#1672d6]/30">Valle 360</Badge>
                </div>
              </div>
              <p className="text-[#001533]/80 dark:text-white/80 text-lg">
                "Transformar o marketing digital em resultados reais para nossos clientes, 
                usando tecnologia, criatividade e dados para impulsionar o crescimento de cada negócio."
              </p>
            </CardContent>
          </Card>

          {/* Valores */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#1672d6]" />
              Nossos Valores
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cultureValues.map((value, idx) => (
                <motion.div
                  key={value.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="h-full hover:border-[#1672d6]/30 transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800">
                          {value.icon}
                        </div>
                        <div>
                          <h4 className="font-bold text-[#001533] dark:text-white mb-1">{value.title}</h4>
                          <p className="text-sm text-[#001533]/60 dark:text-white/60">{value.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Práticas do Dia a Dia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coffee className="w-5 h-5 text-[#1672d6]" />
                Práticas do Dia a Dia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span className="text-sm">Chegue pontualmente nas reuniões (5 min antes)</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200">
                <CheckCircle className="w-5 h-5 text-blue-500" />
                <span className="text-sm">Atualize o Kanban diariamente com suas tarefas</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-200">
                <CheckCircle className="w-5 h-5 text-purple-500" />
                <span className="text-sm">Comunique bloqueios imediatamente ao líder</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200">
                <CheckCircle className="w-5 h-5 text-amber-500" />
                <span className="text-sm">Peça feedback após cada entrega importante</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dicas para Atender Melhor */}
        <TabsContent value="dicas" className="space-y-6 mt-6">
          <Card className="border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-emerald-500/10">
                  <Zap className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Dicas da Val (IA)</h2>
                  <p className="text-sm text-muted-foreground">Para atender melhor seus clientes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {tips.map((tip, idx) => (
              <motion.div
                key={tip.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className={cn(
                  "border-l-4",
                  tip.priority === 'high' ? "border-l-red-500" :
                  tip.priority === 'medium' ? "border-l-amber-500" : "border-l-blue-500"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold mb-1">{tip.title}</h4>
                        <p className="text-sm text-muted-foreground">{tip.description}</p>
                      </div>
                      <Badge className={cn(
                        tip.priority === 'high' ? "bg-red-500/10 text-red-500" :
                        tip.priority === 'medium' ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"
                      )}>
                        {tip.priority === 'high' ? 'Alta' : tip.priority === 'medium' ? 'Média' : 'Baixa'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Recursos de Aprendizado */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#1672d6]" />
                Recursos de Aprendizado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Como lidar com clientes difíceis
                </span>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Técnicas de upsell e cross-sell
                </span>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Análise de métricas para clientes
                </span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights dos Meus Clientes */}
        <TabsContent value="clientes" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#1672d6]" />
              Clientes que Você Atende
            </h3>
            <Badge className="bg-[#1672d6]/10 text-[#1672d6]">{myClientsInsights.length} clientes</Badge>
          </div>

          <div className="space-y-4">
            {myClientsInsights.map((client, idx) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="hover:border-[#1672d6]/30 transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-lg">{client.clientName}</h4>
                        <p className="text-sm text-muted-foreground">{client.company}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className="bg-[#1672d6]/10 text-[#1672d6]">
                          {client.engagement}% engajamento
                        </Badge>
                        <Badge className="bg-emerald-500/10 text-emerald-500">
                          NPS {client.satisfaction}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-amber-600 mb-1">Dica da Val</p>
                          <p className="text-sm text-[#001533]/80 dark:text-white/80">{client.tip}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm">
                        <Calendar className="w-3 h-3 mr-1" />
                        Agendar Reunião
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Ver Histórico
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

