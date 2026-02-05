'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Briefcase,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Loader2,
  RefreshCw,
  FileText,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn, formatCurrency } from '@/lib/utils';

interface ExecutiveMetrics {
  revenue: {
    current: number;
    previous: number;
    change: number;
    target: number;
    progress: number;
  };
  clients: {
    total: number;
    active: number;
    new_this_month: number;
    churn_rate: number;
    health_avg: number;
  };
  operations: {
    tasks_completed: number;
    tasks_pending: number;
    sla_compliance: number;
    avg_delivery_time: number;
  };
  finance: {
    mrr: number;
    arr: number;
    overdue_invoices: number;
    overdue_amount: number;
    collection_rate: number;
  };
  team: {
    total_members: number;
    productivity_score: number;
    utilization_rate: number;
  };
}

interface TopClient {
  id: string;
  name: string;
  revenue: number;
  health: number;
  change: number;
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  action?: string;
}

export default function DashboardExecutivoPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/dashboard-executive?period=${period}`, { cache: 'no-store' });
      const json = await res.json();
      
      if (json.success) {
        setMetrics(json.metrics);
        setTopClients(json.top_clients || []);
        setAlerts(json.alerts || []);
      }
    } catch (e) {
      console.error('Error fetching executive metrics:', e);
      // Use mock data
      setMetrics({
        revenue: {
          current: 485000,
          previous: 420000,
          change: 15.5,
          target: 500000,
          progress: 97,
        },
        clients: {
          total: 127,
          active: 118,
          new_this_month: 8,
          churn_rate: 2.3,
          health_avg: 8.2,
        },
        operations: {
          tasks_completed: 342,
          tasks_pending: 45,
          sla_compliance: 94.5,
          avg_delivery_time: 2.3,
        },
        finance: {
          mrr: 485000,
          arr: 5820000,
          overdue_invoices: 5,
          overdue_amount: 23500,
          collection_rate: 96.8,
        },
        team: {
          total_members: 24,
          productivity_score: 87,
          utilization_rate: 78,
        },
      });
      setTopClients([
        { id: '1', name: 'TechCorp SA', revenue: 25000, health: 9.2, change: 5 },
        { id: '2', name: 'Clínica Vida', revenue: 18000, health: 8.8, change: -2 },
        { id: '3', name: 'Restaurante Sabor', revenue: 15000, health: 9.5, change: 12 },
        { id: '4', name: 'Advocacia Elite', revenue: 12000, health: 7.5, change: 0 },
        { id: '5', name: 'Moda Plus', revenue: 10000, health: 8.0, change: 8 },
      ]);
      setAlerts([
        { id: '1', type: 'critical', title: '5 faturas vencidas', description: 'R$ 23.500 em atraso há mais de 30 dias', action: 'Ver faturas' },
        { id: '2', type: 'warning', title: 'SLA em risco', description: '3 tarefas próximas do prazo limite', action: 'Ver tarefas' },
        { id: '3', type: 'info', title: 'Meta de receita', description: 'Faltam R$ 15.000 para atingir a meta do mês', action: 'Ver detalhes' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1672d6]" />
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#001533] dark:text-white">Dashboard Executivo</h1>
          <p className="text-[#001533]/60 dark:text-white/60">Visão consolidada do negócio</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="quarter">Este Trimestre</SelectItem>
              <SelectItem value="year">Este Ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "flex items-center justify-between p-4 rounded-xl border",
                alert.type === 'critical' && "bg-red-500/10 border-red-500/30",
                alert.type === 'warning' && "bg-primary/10 border-primary/30",
                alert.type === 'info' && "bg-blue-500/10 border-blue-500/30"
              )}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className={cn(
                  "w-5 h-5",
                  alert.type === 'critical' && "text-red-500",
                  alert.type === 'warning' && "text-primary",
                  alert.type === 'info' && "text-blue-500"
                )} />
                <div>
                  <p className="font-medium text-[#001533] dark:text-white">{alert.title}</p>
                  <p className="text-sm text-[#001533]/60 dark:text-white/60">{alert.description}</p>
                </div>
              </div>
              {alert.action && (
                <Button variant="ghost" size="sm">
                  {alert.action}
                </Button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Main KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <Card className="border-[#001533]/10 dark:border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[#001533]/60 dark:text-white/60 mb-1">Receita</p>
                <p className="text-2xl font-bold text-[#001533] dark:text-white">
                  {formatCurrency(metrics.revenue.current)}
                </p>
                <div className={cn(
                  "flex items-center gap-1 mt-1 text-sm",
                  metrics.revenue.change >= 0 ? "text-emerald-600" : "text-red-500"
                )}>
                  {metrics.revenue.change >= 0 ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {Math.abs(metrics.revenue.change)}% vs anterior
                </div>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#001533]/50 dark:text-white/50">Meta: {formatCurrency(metrics.revenue.target)}</span>
                <span className="font-medium">{metrics.revenue.progress}%</span>
              </div>
              <Progress value={metrics.revenue.progress} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

        {/* Clients */}
        <Card className="border-[#001533]/10 dark:border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[#001533]/60 dark:text-white/60 mb-1">Clientes Ativos</p>
                <p className="text-2xl font-bold text-[#001533] dark:text-white">
                  {metrics.clients.active}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs">
                    +{metrics.clients.new_this_month} novos
                  </Badge>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="flex justify-between mt-3 text-xs text-[#001533]/50 dark:text-white/50">
              <span>Churn: {metrics.clients.churn_rate}%</span>
              <span>Saúde: {metrics.clients.health_avg}/10</span>
            </div>
          </CardContent>
        </Card>

        {/* SLA */}
        <Card className="border-[#001533]/10 dark:border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[#001533]/60 dark:text-white/60 mb-1">SLA Compliance</p>
                <p className="text-2xl font-bold text-[#001533] dark:text-white">
                  {metrics.operations.sla_compliance}%
                </p>
                <div className="text-sm text-[#001533]/50 dark:text-white/50 mt-1">
                  {metrics.operations.tasks_completed} tarefas entregues
                </div>
              </div>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs">
              <Clock className="w-3 h-3 text-[#001533]/40 dark:text-white/40" />
              <span className="text-[#001533]/50 dark:text-white/50">
                Tempo médio: {metrics.operations.avg_delivery_time} dias
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Finance */}
        <Card className="border-[#001533]/10 dark:border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[#001533]/60 dark:text-white/60 mb-1">MRR</p>
                <p className="text-2xl font-bold text-[#001533] dark:text-white">
                  {formatCurrency(metrics.finance.mrr)}
                </p>
                <div className="text-sm text-[#001533]/50 dark:text-white/50 mt-1">
                  ARR: {formatCurrency(metrics.finance.arr)}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="flex justify-between mt-3 text-xs text-[#001533]/50 dark:text-white/50">
              <span>Cobrança: {metrics.finance.collection_rate}%</span>
              <span className="text-red-500">{metrics.finance.overdue_invoices} vencidas</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Top Clients */}
        <Card className="lg:col-span-2 border-[#001533]/10 dark:border-white/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#1672d6]" />
              Top Clientes por Receita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topClients.map((client, index) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#001533]/5 dark:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#1672d6]/10 flex items-center justify-center text-sm font-bold text-[#1672d6]">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-[#001533] dark:text-white">{client.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            client.health >= 8 ? "text-emerald-600 border-emerald-500/30" :
                            client.health >= 6 ? "text-yellow-600 border-yellow-500/30" :
                            "text-red-600 border-red-500/30"
                          )}
                        >
                          Saúde: {client.health}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#001533] dark:text-white">
                      {formatCurrency(client.revenue)}
                    </p>
                    <div className={cn(
                      "flex items-center gap-1 text-xs",
                      client.change >= 0 ? "text-emerald-600" : "text-red-500"
                    )}>
                      {client.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(client.change)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team Performance */}
        <Card className="border-[#001533]/10 dark:border-white/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#1672d6]" />
              Equipe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-[#001533]/60 dark:text-white/60">Produtividade</span>
                <span className="font-bold text-[#001533] dark:text-white">{metrics.team.productivity_score}%</span>
              </div>
              <Progress value={metrics.team.productivity_score} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-[#001533]/60 dark:text-white/60">Utilização</span>
                <span className="font-bold text-[#001533] dark:text-white">{metrics.team.utilization_rate}%</span>
              </div>
              <Progress value={metrics.team.utilization_rate} className="h-2" />
            </div>

            <div className="pt-4 border-t border-[#001533]/10 dark:border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#001533]/60 dark:text-white/60">Total de Membros</span>
                <span className="text-xl font-bold text-[#001533] dark:text-white">{metrics.team.total_members}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-emerald-500/10 text-center">
                <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-[#001533] dark:text-white">{metrics.operations.tasks_completed}</p>
                <p className="text-xs text-[#001533]/50 dark:text-white/50">Concluídas</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10 text-center">
                <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold text-[#001533] dark:text-white">{metrics.operations.tasks_pending}</p>
                <p className="text-xs text-[#001533]/50 dark:text-white/50">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" className="gap-2">
          <FileText className="w-4 h-4" />
          Gerar Relatório PDF
        </Button>
        <Button variant="outline" className="gap-2">
          <Calendar className="w-4 h-4" />
          Agendar Reunião
        </Button>
        <Button variant="outline" className="gap-2">
          <Zap className="w-4 h-4" />
          Ações Automáticas
        </Button>
      </div>
    </div>
  );
}
