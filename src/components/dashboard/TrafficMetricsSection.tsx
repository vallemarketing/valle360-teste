'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  MousePointerClick,
  Eye,
  Target,
  Zap,
  Calendar,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface TrafficMetricsProps {
  clientId: string;
}

export function TrafficMetricsSection({ clientId }: TrafficMetricsProps) {
  const [loading, setLoading] = useState(true);
  const [currentMetrics, setCurrentMetrics] = useState({
    roas: 5.2,
    cpc: 2.10,
    cpm: 18.50,
    ctr: 3.8,
    investment: 15000,
    conversions: 187,
    leads: 425,
  });

  const [historicalData, setHistoricalData] = useState([
    { month: 'Jan', roas: 3.2, conversions: 120, investment: 15000 },
    { month: 'Fev', roas: 3.8, conversions: 145, investment: 15000 },
    { month: 'Mar', roas: 4.2, conversions: 160, investment: 15000 },
    { month: 'Abr', roas: 4.6, conversions: 170, investment: 15000 },
    { month: 'Mai', roas: 5.0, conversions: 180, investment: 15000 },
    { month: 'Jun', roas: 5.2, conversions: 187, investment: 15000 },
  ]);

  useEffect(() => {
    loadMetrics();
  }, [clientId]);

  const loadMetrics = async () => {
    try {
      setLoading(false);
    } catch (error) {
      console.error('Error loading traffic metrics:', error);
      setLoading(false);
    }
  };

  const metricCards = [
    {
      label: 'ROAS Atual',
      value: `${currentMetrics.roas.toFixed(1)}x`,
      description: 'Retorno sobre investimento em anúncios',
      icon: Target,
      trend: '+15%',
      trendUp: true,
      color: 'blue',
    },
    {
      label: 'CPC Médio',
      value: `R$ ${currentMetrics.cpc.toFixed(2)}`,
      description: 'Custo por clique nas campanhas',
      icon: MousePointerClick,
      trend: '-23%',
      trendUp: true,
      color: 'green',
    },
    {
      label: 'CPM',
      value: `R$ ${currentMetrics.cpm.toFixed(2)}`,
      description: 'Custo por mil impressões',
      icon: Eye,
      trend: '-18%',
      trendUp: true,
      color: 'purple',
    },
    {
      label: 'CTR',
      value: `${currentMetrics.ctr.toFixed(1)}%`,
      description: 'Taxa de cliques',
      icon: TrendingUp,
      trend: '+42%',
      trendUp: true,
      color: 'yellow',
    },
    {
      label: 'Conversões',
      value: currentMetrics.conversions.toString(),
      description: 'Total de conversões este mês',
      icon: Zap,
      trend: '+68%',
      trendUp: true,
      color: 'red',
    },
    {
      label: 'Investimento',
      value: `R$ ${(currentMetrics.investment / 1000).toFixed(0)}K`,
      description: 'Investimento mensal em tráfego',
      icon: DollarSign,
      trend: '0%',
      trendUp: null,
      color: 'gray',
    },
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 border-4 border-valle-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-valle-silver-600">Carregando métricas...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-valle-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-valle-navy-900 flex items-center gap-2">
              <Zap className="w-6 h-6 text-valle-blue-600" />
              Métricas de Tráfego Pago
            </CardTitle>
            <p className="text-sm text-valle-silver-600 mt-1">
              Acompanhe o desempenho das suas campanhas em tempo real
            </p>
          </div>
          <Badge className="bg-gradient-to-r from-valle-blue-600 to-valle-blue-700 text-white flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Últimos 30 dias
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metricCards.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card key={index} className={`border-2 border-${metric.color}-200 hover:border-${metric.color}-300 transition-colors`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg bg-${metric.color}-100 flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 text-${metric.color}-600`} />
                    </div>
                    {metric.trendUp !== null && (
                      <Badge
                        className={`${metric.trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} border-0`}
                      >
                        {metric.trendUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {metric.trend}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-valle-silver-600 mb-1">{metric.label}</p>
                  <p className="text-3xl font-bold text-valle-navy-900 mb-2">{metric.value}</p>
                  <p className="text-xs text-valle-silver-500">{metric.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border-2 border-valle-silver-200 bg-gradient-to-br from-white to-valle-silver-50">
          <CardContent className="p-6">
            <h4 className="text-lg font-semibold text-valle-navy-900 mb-4">Evolução do ROAS (Últimos 6 Meses)</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="roas"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ fill: '#2563eb', r: 6 }}
                  name="ROAS"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-valle-silver-600 mb-1">Leads Gerados</p>
              <p className="text-4xl font-bold text-green-700">{currentMetrics.leads}</p>
              <p className="text-xs text-valle-silver-600 mt-2">Últimos 30 dias</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-valle-blue-200 bg-gradient-to-br from-valle-blue-50 to-white">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-valle-silver-600 mb-1">Taxa de Conversão</p>
              <p className="text-4xl font-bold text-valle-blue-700">
                {((currentMetrics.conversions / currentMetrics.leads) * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-valle-silver-600 mt-2">Conversões / Leads</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-valle-silver-600 mb-1">Custo por Lead</p>
              <p className="text-4xl font-bold text-purple-700">
                R$ {(currentMetrics.investment / currentMetrics.leads).toFixed(0)}
              </p>
              <p className="text-xs text-valle-silver-600 mt-2">CPL médio</p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-valle-blue-50 border-2 border-valle-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-valle-blue-600 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-valle-navy-900 mb-1">Desempenho Consistente</h4>
              <p className="text-sm text-valle-silver-700">
                Suas campanhas estão otimizadas e gerando resultados consistentes. Continue investindo para escalar ainda mais!
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
