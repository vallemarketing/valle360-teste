'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  Users,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Award,
  Zap,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Video,
  Image as ImageIcon,
  Globe,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Upload,
} from 'lucide-react';

interface ConsolidatedMetrics {
  socialMedia: {
    posts: number;
    pendingApprovals: number;
    engagement: number;
    reach: number;
    followers: number;
  };
  video: {
    projects: number;
    inProduction: number;
    completed: number;
    recordings: number;
  };
  design: {
    projects: number;
    pendingApprovals: number;
    completed: number;
    avgRevisions: number;
  };
  webDev: {
    projects: number;
    tickets: number;
    performance: number;
    uptime: number;
  };
  commercial: {
    leads: number;
    deals: number;
    revenue: number;
    conversion: number;
  };
}

interface TeamPerformance {
  name: string;
  role: string;
  department: string;
  tasksCompleted: number;
  performance: number;
  status: 'excellent' | 'good' | 'average';
}

export default function HeadMarketingPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [selectedView, setSelectedView] = useState<'overview' | 'team' | 'clients'>('overview');

  const metrics: ConsolidatedMetrics = {
    socialMedia: {
      posts: 128,
      pendingApprovals: 5,
      engagement: 8.5,
      reach: 245000,
      followers: 12450,
    },
    video: {
      projects: 12,
      inProduction: 4,
      completed: 8,
      recordings: 6,
    },
    design: {
      projects: 24,
      pendingApprovals: 3,
      completed: 21,
      avgRevisions: 1.2,
    },
    webDev: {
      projects: 8,
      tickets: 12,
      performance: 92,
      uptime: 99.8,
    },
    commercial: {
      leads: 45,
      deals: 13,
      revenue: 128500,
      conversion: 28.9,
    },
  };

  const teamPerformance: TeamPerformance[] = [
    { name: 'Maria Santos', role: 'Social Media', department: 'Marketing', tasksCompleted: 156, performance: 92, status: 'excellent' },
    { name: 'Pedro Costa', role: 'Videomaker', department: 'Marketing', tasksCompleted: 78, performance: 90, status: 'excellent' },
    { name: 'João Silva', role: 'Designer Gráfico', department: 'Design', tasksCompleted: 148, performance: 88, status: 'good' },
    { name: 'Ana Lima', role: 'Web Designer', department: 'Dev', tasksCompleted: 132, performance: 85, status: 'good' },
    { name: 'Carlos Vendas', role: 'Gerente Comercial', department: 'Comercial', tasksCompleted: 89, performance: 95, status: 'excellent' },
  ];

  const getPerformanceColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-blue-600';
      default:
        return 'text-primary';
    }
  };

  const getPerformanceBadge = (status: string) => {
    const variants = {
      excellent: { label: 'Excelente', color: 'bg-green-100 text-green-700' },
      good: { label: 'Bom', color: 'bg-blue-100 text-blue-700' },
      average: { label: 'Regular', color: 'bg-amber-100 text-amber-700' },
    };
    const variant = variants[status as keyof typeof variants];
    return <Badge className={variant.color}>{variant.label}</Badge>;
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard - Head de Marketing</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Visão consolidada de todas as operações de marketing
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Button asChild variant="outline" className="gap-2">
            <a href="/app/head-marketing/upload">
              <Upload className="w-4 h-4" />
              Agendar Postagem
            </a>
          </Button>
          <Button
            size="sm"
            variant={selectedPeriod === 'week' ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod('week')}
            className={selectedPeriod === 'week' ? 'bg-primary' : ''}
          >
            Semana
          </Button>
          <Button
            size="sm"
            variant={selectedPeriod === 'month' ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod('month')}
            className={selectedPeriod === 'month' ? 'bg-primary' : ''}
          >
            Mês
          </Button>
          <Button
            size="sm"
            variant={selectedPeriod === 'quarter' ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod('quarter')}
            className={selectedPeriod === 'quarter' ? 'bg-primary' : ''}
          >
            Trimestre
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 dark:text-green-300 mb-1">Receita Total</p>
                <p className="text-3xl font-bold text-green-600">
                  R$ {(metrics.commercial.revenue / 1000).toFixed(0)}K
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUp className="w-3 h-3 text-green-600" />
                  <p className="text-xs text-green-600 dark:text-green-400">+23% vs. mês anterior</p>
                </div>
              </div>
              <DollarSign className="w-10 h-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Projetos Ativos</p>
                <p className="text-3xl font-bold text-blue-600">
                  {metrics.socialMedia.posts + metrics.video.projects + metrics.design.projects + metrics.webDev.projects}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Em todas as áreas</p>
              </div>
              <Activity className="w-10 h-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 dark:text-purple-300 mb-1">Performance Geral</p>
                <p className="text-3xl font-bold text-purple-600">
                  {Math.round(teamPerformance.reduce((sum, t) => sum + t.performance, 0) / teamPerformance.length)}%
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Média do time</p>
              </div>
              <Award className="w-10 h-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-1">Conversão de Leads</p>
                <p className="text-3xl font-bold text-primary">{metrics.commercial.conversion}%</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUp className="w-3 h-3 text-primary" />
                  <p className="text-xs text-primary dark:text-amber-400">+5.2% este mês</p>
                </div>
              </div>
              <Target className="w-10 h-10 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <Button
          variant={selectedView === 'overview' ? 'default' : 'ghost'}
          onClick={() => setSelectedView('overview')}
          className={selectedView === 'overview' ? 'bg-primary hover:bg-[#1260b5]' : ''}
        >
          <PieChart className="w-4 h-4 mr-2" />
          Visão Geral
        </Button>
        <Button
          variant={selectedView === 'team' ? 'default' : 'ghost'}
          onClick={() => setSelectedView('team')}
          className={selectedView === 'team' ? 'bg-primary hover:bg-[#1260b5]' : ''}
        >
          <Users className="w-4 h-4 mr-2" />
          Equipe
        </Button>
        <Button
          variant={selectedView === 'clients' ? 'default' : 'ghost'}
          onClick={() => setSelectedView('clients')}
          className={selectedView === 'clients' ? 'bg-primary hover:bg-[#1260b5]' : ''}
        >
          <Target className="w-4 h-4 mr-2" />
          Clientes
        </Button>
      </div>

      {selectedView === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-2 border-pink-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-pink-900 dark:text-pink-200">
                  <ImageIcon className="w-5 h-5" />
                  Social Media
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Posts Publicados</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{metrics.socialMedia.posts}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Aguardando Aprovação</span>
                    <Badge className="bg-amber-100 text-amber-700">{metrics.socialMedia.pendingApprovals}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Engajamento</span>
                    <span className="text-lg font-bold text-green-600">{metrics.socialMedia.engagement}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Alcance</span>
                    <span className="text-lg font-bold text-blue-600">{(metrics.socialMedia.reach / 1000).toFixed(0)}K</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-200">
                  <Video className="w-5 h-5" />
                  Videomaker
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Projetos Ativos</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{metrics.video.projects}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Em Produção</span>
                    <Badge className="bg-blue-100 text-blue-700">{metrics.video.inProduction}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Concluídos</span>
                    <span className="text-lg font-bold text-green-600">{metrics.video.completed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Gravações Agendadas</span>
                    <span className="text-lg font-bold text-primary">{metrics.video.recordings}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-200">
                  <ImageIcon className="w-5 h-5" />
                  Design
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Projetos Ativos</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{metrics.design.projects}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Aguardando Aprovação</span>
                    <Badge className="bg-amber-100 text-amber-700">{metrics.design.pendingApprovals}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Finalizados</span>
                    <span className="text-lg font-bold text-green-600">{metrics.design.completed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Média Revisões</span>
                    <span className="text-lg font-bold text-blue-600">{metrics.design.avgRevisions}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-teal-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-teal-900 dark:text-teal-200">
                  <Globe className="w-5 h-5" />
                  Web Dev
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Projetos Ativos</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{metrics.webDev.projects}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Tickets Abertos</span>
                    <Badge className="bg-amber-100 text-amber-700">{metrics.webDev.tickets}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Performance</span>
                    <span className="text-lg font-bold text-green-600">{metrics.webDev.performance}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Uptime</span>
                    <span className="text-lg font-bold text-green-600">{metrics.webDev.uptime}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pipeline Comercial</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Novembro 2025
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Leads Ativos</p>
                      <p className="text-3xl font-bold text-blue-600">{metrics.commercial.leads}</p>
                    </div>
                    <Users className="w-10 h-10 text-blue-500" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Deals Fechados</p>
                      <p className="text-3xl font-bold text-green-600">{metrics.commercial.deals}</p>
                    </div>
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Receita Gerada</p>
                      <p className="text-3xl font-bold text-purple-600">R$ {metrics.commercial.revenue.toLocaleString()}</p>
                    </div>
                    <DollarSign className="w-10 h-10 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métricas de Engajamento</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Consolidado de redes sociais
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Curtidas', value: '24.8K', icon: <Heart className="w-5 h-5 text-pink-600" />, color: 'bg-pink-50 dark:bg-pink-900/20' },
                    { label: 'Comentários', value: '4.5K', icon: <MessageCircle className="w-5 h-5 text-blue-600" />, color: 'bg-blue-50 dark:bg-blue-900/20' },
                    { label: 'Compartilhamentos', value: '8.9K', icon: <Share2 className="w-5 h-5 text-green-600" />, color: 'bg-green-50 dark:bg-green-900/20' },
                  ].map((metric, i) => (
                    <div key={i} className={`flex items-center justify-between p-4 ${metric.color} rounded-lg`}>
                      <div className="flex items-center gap-3">
                        {metric.icon}
                        <span className="font-medium text-gray-900 dark:text-white">{metric.label}</span>
                      </div>
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">{metric.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {selectedView === 'team' && (
        <Card>
          <CardHeader>
            <CardTitle>Performance da Equipe</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Análise individual de performance - Novembro 2025
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamPerformance.map((member) => (
                <Card key={member.name} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center text-white font-bold text-lg">
                          {member.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{member.name}</h3>
                            {getPerformanceBadge(member.status)}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{member.role} • {member.department}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge variant="outline" className="text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {member.tasksCompleted} tarefas
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-4xl font-bold ${getPerformanceColor(member.status)}`}>
                          {member.performance}%
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Performance</p>
                      </div>
                    </div>
                    <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          member.performance >= 90 ? 'bg-green-600' : member.performance >= 80 ? 'bg-blue-600' : 'bg-primary'
                        }`}
                        style={{ width: `${member.performance}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedView === 'clients' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Clientes Ativos</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Distribuição por serviço
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { service: 'Marketing Digital Completo', clients: 8, percentage: 40 },
                  { service: 'Social Media', clients: 6, percentage: 30 },
                  { service: 'Desenvolvimento Web', clients: 4, percentage: 20 },
                  { service: 'Design Gráfico', clients: 2, percentage: 10 },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.service}</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {item.clients} clientes ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Satisfação dos Clientes</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                NPS e avaliações
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300 mb-2">Net Promoter Score</p>
                  <p className="text-5xl font-bold text-green-600">85</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">Excelente</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">92%</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Promotores</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">5%</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Neutros</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">3%</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Detratores</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
