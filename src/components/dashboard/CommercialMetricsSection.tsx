'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Target,
  Percent,
  Briefcase,
} from 'lucide-react';
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
} from 'recharts';

interface CommercialMetrics {
  meetingsScheduled: number;
  meetingsCompleted: number;
  clientsClosed: number;
  revenueGenerated: number;
  conversionRate: number;
  pipelineValue: number;
  newContracts: number;
}

interface CommercialMetricsSectionProps {
  clientName: string;
}

export function CommercialMetricsSection({ clientName }: CommercialMetricsSectionProps) {
  // TODO: Buscar dados reais do Supabase
  const metrics: CommercialMetrics = {
    meetingsScheduled: 24,
    meetingsCompleted: 21,
    clientsClosed: 8,
    revenueGenerated: 127500,
    conversionRate: 38.1,
    pipelineValue: 245000,
    newContracts: 5,
  };

  const revenueEvolution = [
    { month: 'Jun', revenue: 85000 },
    { month: 'Jul', revenue: 92000 },
    { month: 'Ago', revenue: 105000 },
    { month: 'Set', revenue: 115000 },
    { month: 'Out', revenue: 123000 },
    { month: 'Nov', revenue: 127500 },
  ];

  const funnelData = [
    { stage: 'Leads', value: 45, color: '#93c5fd' },
    { stage: 'Qualificados', value: 32, color: '#60a5fa' },
    { stage: 'Propostas', value: 21, color: '#3b82f6' },
    { stage: 'Fechados', value: 8, color: '#2563eb' },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-valle-navy-900 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-green-600" />
              Resultados Comerciais
            </CardTitle>
            <Badge className="bg-green-600 text-white">
              Performance Excelente
            </Badge>
          </div>
          <p className="text-sm text-valle-silver-600 mt-2">
            Acompanhe o desempenho comercial gerado pela parceria com Valle 360
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-2 border-blue-200 hover:shadow-lg transition-all">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <Badge className="bg-blue-600 text-white text-xs">Este mês</Badge>
                </div>
                <p className="text-xs text-valle-silver-600 mb-1">Reuniões Agendadas</p>
                <p className="text-3xl font-bold text-blue-700">{metrics.meetingsScheduled}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +15% vs mês anterior
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 hover:shadow-lg transition-all">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <Badge className="bg-green-600 text-white text-xs">Fechados</Badge>
                </div>
                <p className="text-xs text-valle-silver-600 mb-1">Clientes Fechados</p>
                <p className="text-3xl font-bold text-green-700">{metrics.clientsClosed}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +33% vs mês anterior
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 hover:shadow-lg transition-all">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-800 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <Badge className="bg-green-600 text-white text-xs">Faturamento</Badge>
                </div>
                <p className="text-xs text-valle-silver-600 mb-1">Receita Gerada</p>
                <p className="text-2xl font-bold text-green-700">
                  R$ {(metrics.revenueGenerated / 1000).toFixed(0)}K
                </p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +21% vs mês anterior
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-valle-blue-200 hover:shadow-lg transition-all">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-valle-blue-500 to-valle-blue-700 rounded-lg flex items-center justify-center">
                    <Percent className="w-5 h-5 text-white" />
                  </div>
                  <Badge className="bg-valle-blue-600 text-white text-xs">Taxa</Badge>
                </div>
                <p className="text-xs text-valle-silver-600 mb-1">Conversão de Leads</p>
                <p className="text-3xl font-bold text-valle-blue-700">{metrics.conversionRate}%</p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +12% vs mês anterior
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Evolution */}
            <Card className="border border-valle-silver-200">
              <CardHeader>
                <CardTitle className="text-lg">Evolução do Faturamento</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={revenueEvolution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="month" stroke="#757575" />
                    <YAxis stroke="#757575" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '2px solid #10b981',
                        borderRadius: '8px',
                      }}
                      formatter={(value) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Faturamento']}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: '#10b981', r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Sales Funnel */}
            <Card className="border border-valle-silver-200">
              <CardHeader>
                <CardTitle className="text-lg">Funil de Vendas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={funnelData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis type="number" stroke="#757575" />
                    <YAxis dataKey="stage" type="category" stroke="#757575" width={100} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '2px solid #2563eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                      {funnelData.map((entry, index) => (
                        <Bar key={`cell-${index}`} dataKey="value" fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Pipeline Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-valle-silver-600 mb-1">Valor em Pipeline</p>
                    <p className="text-3xl font-bold text-amber-700">
                      R$ {(metrics.pipelineValue / 1000).toFixed(0)}K
                    </p>
                    <p className="text-xs text-valle-silver-600 mt-2">
                      {metrics.newContracts} contratos em negociação
                    </p>
                  </div>
                  <Target className="w-12 h-12 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-valle-silver-600 mb-1">Taxa de Conclusão</p>
                    <p className="text-3xl font-bold text-green-700">
                      {((metrics.meetingsCompleted / metrics.meetingsScheduled) * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-valle-silver-600 mt-2">
                      {metrics.meetingsCompleted} de {metrics.meetingsScheduled} reuniões realizadas
                    </p>
                  </div>
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
