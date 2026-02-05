'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  DollarSign,
  Target,
  Award,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  ArrowRight,
  Brain,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';
import { cn } from '@/lib/utils';

export default function PerformancePage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Dados de métricas globais
  const globalMetrics = [
    { label: 'Total de Clientes', value: '45', change: '+8%', trend: 'up', icon: Briefcase, color: '#1672d6' },
    { label: 'Colaboradores', value: '23', change: '+12%', trend: 'up', icon: Users, color: '#10b981' },
    { label: 'ROI Geral', value: '324%', change: '+18%', trend: 'up', icon: TrendingUp, color: '#8b5cf6' },
    { label: 'Receita Mensal', value: 'R$ 287k', change: '+15%', trend: 'up', icon: DollarSign, color: '#f59e0b' },
  ];

  // Performance por departamento
  const departmentData = [
    { name: 'Social Media', performance: 94, meta: 90, clients: 18, revenue: 68000 },
    { name: 'Tráfego Pago', performance: 102, meta: 85, clients: 15, revenue: 95000 },
    { name: 'Design', performance: 88, meta: 90, clients: 25, revenue: 45000 },
    { name: 'Vídeo', performance: 96, meta: 80, clients: 12, revenue: 54000 },
    { name: 'Web', performance: 78, meta: 85, clients: 8, revenue: 25000 },
  ];

  // Evolução mensal
  const monthlyEvolution = [
    { month: 'Jul', receita: 245000, clientes: 38, nps: 8.2 },
    { month: 'Ago', receita: 258000, clientes: 40, nps: 8.4 },
    { month: 'Set', receita: 267000, clientes: 42, nps: 8.5 },
    { month: 'Out', receita: 275000, clientes: 43, nps: 8.6 },
    { month: 'Nov', receita: 287000, clientes: 45, nps: 8.7 },
  ];

  // Top colaboradores
  const topCollaborators = [
    { name: 'Maria Santos', role: 'Social Media', performance: 110, clients: 8 },
    { name: 'Pedro Costa', role: 'Tráfego Pago', performance: 108, clients: 6 },
    { name: 'Ana Lima', role: 'Designer', performance: 105, clients: 10 },
    { name: 'Carlos Souza', role: 'Videomaker', performance: 98, clients: 5 },
    { name: 'Julia Alves', role: 'Web Designer', performance: 95, clients: 4 },
  ];

  // Distribuição de receita
  const revenueDistribution = [
    { name: 'Social Media', value: 24, color: '#1672d6' },
    { name: 'Tráfego Pago', value: 33, color: '#10b981' },
    { name: 'Design', value: 16, color: '#f59e0b' },
    { name: 'Vídeo', value: 19, color: '#8b5cf6' },
    { name: 'Web', value: 8, color: '#ef4444' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0f1a] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-[#001533] dark:text-white">
              Performance Geral
            </h1>
            <p className="text-[#001533]/60 dark:text-white/60">
              Métricas globais de todos os clientes e colaboradores
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 rounded-xl border border-[#001533]/10 bg-white dark:bg-[#001533] text-[#001533] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1672d6]"
            >
              <option value="week">Esta Semana</option>
              <option value="month">Este Mês</option>
              <option value="quarter">Este Trimestre</option>
              <option value="year">Este Ano</option>
            </select>
            <Button className="bg-[#1672d6] hover:bg-[#1260b5]">
              <BarChart3 className="w-4 h-4 mr-2" />
              Exportar Relatório
            </Button>
          </div>
        </motion.div>

        {/* Métricas Globais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {globalMetrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="border-[#001533]/10 dark:border-white/10 hover:border-[#1672d6]/30 transition-all">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div 
                        className="p-3 rounded-xl" 
                        style={{ backgroundColor: `${metric.color}15` }}
                      >
                        <Icon className="w-6 h-6" style={{ color: metric.color }} />
                      </div>
                      <Badge 
                        className={cn(
                          "border",
                          metric.trend === 'up' 
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" 
                            : "bg-red-500/10 text-red-600 border-red-500/30"
                        )}
                      >
                        {metric.trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {metric.change}
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-[#001533] dark:text-white">{metric.value}</p>
                    <p className="text-sm text-[#001533]/60 dark:text-white/60">{metric.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Evolução Mensal */}
          <Card className="border-[#001533]/10 dark:border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#1672d6]" />
                Evolução Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyEvolution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="receita" stroke="#1672d6" strokeWidth={2} name="Receita (R$)" />
                  <Line yAxisId="right" type="monotone" dataKey="clientes" stroke="#10b981" strokeWidth={2} name="Clientes" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribuição de Receita */}
          <Card className="border-[#001533]/10 dark:border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-[#1672d6]" />
                Distribuição de Receita por Departamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <ResponsiveContainer width="60%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={revenueDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={(entry) => `${entry.value}%`}
                    >
                      {revenueDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="w-40% space-y-2">
                  {revenueDistribution.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-[#001533]/70 dark:text-white/70">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance por Departamento */}
        <Card className="border-[#001533]/10 dark:border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-[#1672d6]" />
              Performance por Departamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {departmentData.map((dept, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-[#001533]/10 dark:border-white/10 bg-[#001533]/5 dark:bg-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-[#001533] dark:text-white">{dept.name}</h3>
                      <Badge variant="outline">{dept.clients} clientes</Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-[#001533]/60 dark:text-white/60">
                        Receita: <strong className="text-[#1672d6]">R$ {(dept.revenue / 1000).toFixed(0)}k</strong>
                      </span>
                      <Badge 
                        className={cn(
                          "border",
                          dept.performance >= dept.meta 
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" 
                            : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                        )}
                      >
                        {dept.performance}% {dept.performance >= dept.meta ? '✓' : '↓'}
                      </Badge>
                    </div>
                  </div>
                  <div className="relative">
                    <Progress value={dept.performance} className="h-2" />
                    <div 
                      className="absolute top-0 h-2 w-0.5 bg-[#001533] dark:bg-white"
                      style={{ left: `${dept.meta}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-[#001533]/40 dark:text-white/40">
                    <span>0%</span>
                    <span>Meta: {dept.meta}%</span>
                    <span>120%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Colaboradores */}
        <Card className="border-[#001533]/10 dark:border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#1672d6]" />
              Top Colaboradores do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {topCollaborators.map((collab, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className={cn(
                    "p-4 rounded-xl border text-center",
                    idx === 0 
                      ? "bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/30" 
                      : "border-[#001533]/10 dark:border-white/10"
                  )}
                >
                  {idx === 0 && <div className="text-2xl mb-2">🏆</div>}
                  {idx === 1 && <div className="text-2xl mb-2">🥈</div>}
                  {idx === 2 && <div className="text-2xl mb-2">🥉</div>}
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-[#1672d6]/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-[#1672d6]">{collab.name.charAt(0)}</span>
                  </div>
                  <p className="font-semibold text-[#001533] dark:text-white">{collab.name}</p>
                  <p className="text-xs text-[#001533]/50 dark:text-white/50 mb-2">{collab.role}</p>
                  <Badge className="bg-[#1672d6]/10 text-[#1672d6] border-[#1672d6]/30">
                    {collab.performance}%
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Insights da IA */}
        <Card className="border-2 border-[#1672d6]/20 bg-gradient-to-br from-[#1672d6]/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#1672d6]" />
              Insights da Val (IA)
              <Badge className="ml-2 bg-[#1672d6]/10 text-[#1672d6] border-[#1672d6]/30">
                <Sparkles className="w-3 h-3 mr-1" />
                Análise em Tempo Real
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white/50 dark:bg-[#001533]/30 border border-[#001533]/10 dark:border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  <span className="font-medium text-[#001533] dark:text-white">Crescimento Projetado</span>
                </div>
                <p className="text-sm text-[#001533]/60 dark:text-white/60">
                  Baseado nos dados atuais, projeta-se um crescimento de <strong className="text-emerald-500">+22%</strong> na receita para o próximo trimestre.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/50 dark:bg-[#001533]/30 border border-[#001533]/10 dark:border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-[#1672d6]" />
                  <span className="font-medium text-[#001533] dark:text-white">Equipe em Destaque</span>
                </div>
                <p className="text-sm text-[#001533]/60 dark:text-white/60">
                  O departamento de <strong className="text-[#1672d6]">Tráfego Pago</strong> superou a meta em 17%. Considere expandir a equipe.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/50 dark:bg-[#001533]/30 border border-[#001533]/10 dark:border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-amber-500" />
                  <span className="font-medium text-[#001533] dark:text-white">Atenção Necessária</span>
                </div>
                <p className="text-sm text-[#001533]/60 dark:text-white/60">
                  O departamento de <strong className="text-amber-500">Web</strong> está 7% abaixo da meta. Recomendo revisão de processos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
