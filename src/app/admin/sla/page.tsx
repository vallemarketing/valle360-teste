'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Timer,
  BarChart3,
  RefreshCw,
  Filter,
  Download,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SLAMetric {
  area: string;
  avgDeliveryTime: number; // hours
  targetTime: number; // hours
  compliance: number; // percentage
  tasksCompleted: number;
  tasksOverdue: number;
  trend: 'up' | 'down' | 'stable';
}

interface OverdueTask {
  id: string;
  title: string;
  client: string;
  area: string;
  assignee: string;
  dueDate: string;
  daysOverdue: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export default function SLADashboardPage() {
  const [metrics, setMetrics] = useState<SLAMetric[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<OverdueTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedArea, setSelectedArea] = useState('all');

  useEffect(() => {
    fetchData();
  }, [selectedPeriod, selectedArea]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch real data from API
      const [metricsRes, tasksRes] = await Promise.all([
        fetch(`/api/admin/sla/metrics?period=${selectedPeriod}&area=${selectedArea}`),
        fetch(`/api/admin/sla/overdue?area=${selectedArea}`),
      ]);

      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data.metrics || []);
      } else {
        // Mock data fallback
        setMetrics(generateMockMetrics());
      }

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setOverdueTasks(data.tasks || []);
      } else {
        setOverdueTasks(generateMockOverdueTasks());
      }
    } catch (error) {
      console.error('Failed to fetch SLA data:', error);
      setMetrics(generateMockMetrics());
      setOverdueTasks(generateMockOverdueTasks());
    } finally {
      setLoading(false);
    }
  };

  const overallCompliance = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + m.compliance, 0) / metrics.length
    : 0;

  const totalOverdue = overdueTasks.length;
  const urgentOverdue = overdueTasks.filter(t => t.priority === 'urgent' || t.daysOverdue > 7).length;

  const getComplianceColor = (compliance: number) => {
    if (compliance >= 95) return 'text-emerald-600';
    if (compliance >= 80) return 'text-amber-600';
    return 'text-red-600';
  };

  const getComplianceBg = (compliance: number) => {
    if (compliance >= 95) return 'bg-emerald-500';
    if (compliance >= 80) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      low: 'bg-gray-500/10 text-gray-600 border-gray-500/30',
      medium: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
      high: 'bg-primary/10 text-primary border-primary/30',
      urgent: 'bg-red-500/10 text-red-600 border-red-500/30',
    };
    return <Badge variant="outline" className={styles[priority]}>{priority}</Badge>;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0f1a] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#001533] dark:text-white mb-2">
                Dashboard de SLA
              </h1>
              <p className="text-[#001533]/60 dark:text-white/60">
                Monitore o cumprimento de prazos e entregas por área
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[#001533]/20 bg-white dark:bg-[#001533] text-sm"
              >
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="90d">Últimos 90 dias</option>
              </select>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[#001533]/20 bg-white dark:bg-[#001533] text-sm"
              >
                <option value="all">Todas as Áreas</option>
                <option value="social_media">Social Media</option>
                <option value="design">Design</option>
                <option value="trafego">Tráfego</option>
                <option value="video">Vídeo</option>
                <option value="desenvolvimento">Desenvolvimento</option>
              </select>
              <Button variant="outline" size="sm" onClick={fetchData}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Overview Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-6 md:grid-cols-4 mb-8"
        >
          <Card className="border-[#001533]/10 dark:border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-3 rounded-xl",
                  overallCompliance >= 90 ? "bg-emerald-500/10" : "bg-amber-500/10"
                )}>
                  <Target className={cn(
                    "w-6 h-6",
                    overallCompliance >= 90 ? "text-emerald-600" : "text-amber-600"
                  )} />
                </div>
                <div>
                  <p className="text-sm text-[#001533]/60 dark:text-white/60">Compliance Geral</p>
                  <p className={cn("text-3xl font-bold", getComplianceColor(overallCompliance))}>
                    {overallCompliance.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#001533]/10 dark:border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#1672d6]/10">
                  <CheckCircle className="w-6 h-6 text-[#1672d6]" />
                </div>
                <div>
                  <p className="text-sm text-[#001533]/60 dark:text-white/60">Tarefas Entregues</p>
                  <p className="text-3xl font-bold text-[#001533] dark:text-white">
                    {metrics.reduce((sum, m) => sum + m.tasksCompleted, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#001533]/10 dark:border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-3 rounded-xl",
                  totalOverdue > 0 ? "bg-red-500/10" : "bg-emerald-500/10"
                )}>
                  <AlertTriangle className={cn(
                    "w-6 h-6",
                    totalOverdue > 0 ? "text-red-600" : "text-emerald-600"
                  )} />
                </div>
                <div>
                  <p className="text-sm text-[#001533]/60 dark:text-white/60">Atrasadas</p>
                  <p className={cn(
                    "text-3xl font-bold",
                    totalOverdue > 0 ? "text-red-600" : "text-emerald-600"
                  )}>
                    {totalOverdue}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#001533]/10 dark:border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-purple-500/10">
                  <Timer className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-[#001533]/60 dark:text-white/60">Tempo Médio</p>
                  <p className="text-3xl font-bold text-[#001533] dark:text-white">
                    {metrics.length > 0
                      ? Math.round(metrics.reduce((sum, m) => sum + m.avgDeliveryTime, 0) / metrics.length)
                      : 0}h
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Urgent Alert */}
        {urgentOverdue > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3"
          >
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-700 dark:text-red-300">
                Atenção: {urgentOverdue} tarefa(s) com atraso crítico
              </p>
              <p className="text-sm text-red-600/80">
                Tarefas com mais de 7 dias de atraso ou prioridade urgente requerem ação imediata.
              </p>
            </div>
          </motion.div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* SLA by Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-[#001533]/10 dark:border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#1672d6]" />
                  Compliance por Área
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.map((metric, idx) => (
                    <div key={metric.area} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{metric.area}</span>
                        <div className="flex items-center gap-2">
                          <span className={cn("font-bold", getComplianceColor(metric.compliance))}>
                            {metric.compliance.toFixed(1)}%
                          </span>
                          {metric.trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                          {metric.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                        </div>
                      </div>
                      <div className="h-2 bg-[#001533]/10 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-500", getComplianceBg(metric.compliance))}
                          style={{ width: `${metric.compliance}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-[#001533]/50 dark:text-white/50">
                        <span>{metric.tasksCompleted} entregues</span>
                        <span>Média: {metric.avgDeliveryTime}h (meta: {metric.targetTime}h)</span>
                        {metric.tasksOverdue > 0 && (
                          <span className="text-red-500">{metric.tasksOverdue} atrasadas</span>
                        )}
                      </div>
                    </div>
                  ))}

                  {metrics.length === 0 && (
                    <div className="text-center py-8 text-[#001533]/50">
                      Nenhum dado disponível para o período selecionado
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Overdue Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-[#001533]/10 dark:border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Tarefas em Atraso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {overdueTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 rounded-lg bg-[#001533]/5 dark:bg-white/5 hover:bg-[#001533]/10 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{task.title}</p>
                          <p className="text-xs text-[#001533]/50 dark:text-white/50">
                            {task.client} • {task.area}
                          </p>
                        </div>
                        {getPriorityBadge(task.priority)}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#001533]/50 dark:text-white/50">
                          Responsável: {task.assignee}
                        </span>
                        <span className="text-red-600 font-medium">
                          {task.daysOverdue} dia(s) de atraso
                        </span>
                      </div>
                    </div>
                  ))}

                  {overdueTasks.length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
                      <p className="text-emerald-600 font-medium">Nenhuma tarefa em atraso!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Mock data generators
function generateMockMetrics(): SLAMetric[] {
  return [
    { area: 'Social Media', avgDeliveryTime: 18, targetTime: 24, compliance: 94.5, tasksCompleted: 142, tasksOverdue: 3, trend: 'up' },
    { area: 'Design', avgDeliveryTime: 36, targetTime: 48, compliance: 88.2, tasksCompleted: 89, tasksOverdue: 5, trend: 'stable' },
    { area: 'Tráfego', avgDeliveryTime: 12, targetTime: 12, compliance: 97.8, tasksCompleted: 56, tasksOverdue: 1, trend: 'up' },
    { area: 'Vídeo', avgDeliveryTime: 72, targetTime: 72, compliance: 82.3, tasksCompleted: 28, tasksOverdue: 4, trend: 'down' },
    { area: 'Desenvolvimento', avgDeliveryTime: 96, targetTime: 120, compliance: 91.5, tasksCompleted: 15, tasksOverdue: 2, trend: 'stable' },
  ];
}

function generateMockOverdueTasks(): OverdueTask[] {
  return [
    { id: '1', title: 'Criação de campanha Black Friday', client: 'Valle Boutique', area: 'Design', assignee: 'Ana Silva', dueDate: '2024-12-01', daysOverdue: 5, priority: 'high' },
    { id: '2', title: 'Vídeo institucional - versão final', client: 'Tech Solutions', area: 'Vídeo', assignee: 'Carlos Santos', dueDate: '2024-11-28', daysOverdue: 8, priority: 'urgent' },
    { id: '3', title: 'Posts semanais - Semana 49', client: 'Digital Plus', area: 'Social Media', assignee: 'Maria Costa', dueDate: '2024-12-03', daysOverdue: 3, priority: 'medium' },
    { id: '4', title: 'Landing page promocional', client: 'Inova Marketing', area: 'Desenvolvimento', assignee: 'Pedro Lima', dueDate: '2024-11-30', daysOverdue: 6, priority: 'high' },
  ];
}
