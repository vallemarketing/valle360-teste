'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import {
  Target,
  TrendingUp,
  TrendingDown,
  DollarSign,
  MousePointerClick,
  Eye,
  Zap,
  Users,
  Calendar,
  RefreshCw,
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

interface Client {
  id: string;
  full_name: string;
}

interface TrafficMetrics {
  roas: number;
  cpc: number;
  cpm: number;
  ctr: number;
  investment: number;
  conversions: number;
  leads: number;
}

interface BeforeValleMetrics {
  traffic_roas: number;
  traffic_cpl: number;
  traffic_conversions: number;
  traffic_ctr: number;
  traffic_investment: number;
  traffic_leads: number;
}

// Dados fictícios para simulação
const mockClients: Client[] = [
  { id: '1', full_name: 'Tech Solutions Ltda' },
  { id: '2', full_name: 'Valle Boutique' },
  { id: '3', full_name: 'Digital Plus' },
  { id: '4', full_name: 'E-commerce Pro' },
  { id: '5', full_name: 'Inova Marketing' }
];

const mockBeforeMetrics: Record<string, BeforeValleMetrics> = {
  '1': { traffic_roas: 1.8, traffic_cpl: 45.00, traffic_conversions: 28, traffic_ctr: 0.9, traffic_investment: 8000, traffic_leads: 178 },
  '2': { traffic_roas: 1.2, traffic_cpl: 62.00, traffic_conversions: 15, traffic_ctr: 0.6, traffic_investment: 5000, traffic_leads: 81 },
  '3': { traffic_roas: 2.1, traffic_cpl: 38.00, traffic_conversions: 42, traffic_ctr: 1.1, traffic_investment: 12000, traffic_leads: 316 },
  '4': { traffic_roas: 1.5, traffic_cpl: 55.00, traffic_conversions: 22, traffic_ctr: 0.8, traffic_investment: 10000, traffic_leads: 182 },
  '5': { traffic_roas: 1.3, traffic_cpl: 68.00, traffic_conversions: 18, traffic_ctr: 0.7, traffic_investment: 6000, traffic_leads: 88 }
};

const mockAfterMetrics: Record<string, TrafficMetrics> = {
  '1': { roas: 4.2, cpc: 1.85, cpm: 18.50, ctr: 2.4, investment: 8000, conversions: 78, leads: 432 },
  '2': { roas: 3.5, cpc: 2.20, cpm: 22.00, ctr: 1.8, investment: 5000, conversions: 42, leads: 227 },
  '3': { roas: 5.1, cpc: 1.45, cpm: 14.50, ctr: 3.2, investment: 12000, conversions: 118, leads: 827 },
  '4': { roas: 3.8, cpc: 2.00, cpm: 20.00, ctr: 2.1, investment: 10000, conversions: 68, leads: 500 },
  '5': { roas: 3.2, cpc: 2.50, cpm: 25.00, ctr: 1.6, investment: 6000, conversions: 38, leads: 240 }
};

export default function TrafegoComparativoPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [beforeMetrics, setBeforeMetrics] = useState<BeforeValleMetrics | null>(null);
  const [afterMetrics, setAfterMetrics] = useState<TrafficMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      loadMetrics();
    }
  }, [selectedClient]);

  const loadClients = async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, full_name')
      .eq('user_type', 'cliente')
      .order('full_name');

    // Se não houver dados do banco, usar dados fictícios para demonstração
    if (data && data.length > 0) {
      setClients(data);
    } else {
      setClients(mockClients);
    }
  };

  const loadMetrics = async () => {
    setLoading(true);

    // Tentar buscar do banco primeiro
    const { data: beforeData } = await supabase
      .from('before_valle_metrics')
      .select('*')
      .eq('client_id', selectedClient)
      .maybeSingle();

    // Se houver dados do banco, usar; senão, usar mock
    if (beforeData) {
      setBeforeMetrics(beforeData);
    } else if (mockBeforeMetrics[selectedClient]) {
      setBeforeMetrics(mockBeforeMetrics[selectedClient]);
    }

    const { data: afterData } = await supabase
      .from('traffic_metrics')
      .select('*')
      .eq('client_id', selectedClient)
      .order('period_end', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Se houver dados do banco, usar; senão, usar mock
    if (afterData) {
      setAfterMetrics(afterData);
    } else if (mockAfterMetrics[selectedClient]) {
      setAfterMetrics(mockAfterMetrics[selectedClient]);
    }

    setLoading(false);
  };

  const calculateImprovement = (before: number, after: number, inverse: boolean = false) => {
    if (before === 0) return 0;
    if (inverse) {
      return (((before - after) / before) * 100).toFixed(0);
    }
    return (((after - before) / before) * 100).toFixed(0);
  };

  const beforeCpc = beforeMetrics ? (beforeMetrics.traffic_investment / (beforeMetrics.traffic_leads || 1)) : 0;
  const afterCpc = afterMetrics ? afterMetrics.cpc : 0;
  const beforeCpm = beforeMetrics ? (beforeMetrics.traffic_investment / 1000) : 0;
  const afterCpm = afterMetrics ? afterMetrics.cpm : 0;

  const hasData = beforeMetrics && afterMetrics;

  const comparisonData = hasData ? [
    {
      metric: 'ROAS',
      antes: beforeMetrics.traffic_roas,
      depois: afterMetrics.roas,
    },
    {
      metric: 'CTR',
      antes: beforeMetrics.traffic_ctr,
      depois: afterMetrics.ctr,
    },
    {
      metric: 'Conversões',
      antes: beforeMetrics.traffic_conversions,
      depois: afterMetrics.conversions,
    },
    {
      metric: 'Leads',
      antes: beforeMetrics.traffic_leads,
      depois: afterMetrics.leads,
    },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-valle-navy-900">Tráfego Comparativo</h1>
        <p className="text-valle-silver-600 mt-2">
          Compare o desempenho das campanhas antes e depois da Valle 360
        </p>
      </div>

      <Card className="border-2 border-valle-blue-200 bg-gradient-to-r from-valle-blue-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-valle-navy-900">
            <Users className="w-6 h-6 text-valle-blue-600" />
            Selecionar Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="w-full h-12 px-4 rounded-lg border-2 border-valle-silver-300 bg-white focus:border-valle-blue-500 focus:ring-2 focus:ring-valle-blue-200 transition-all"
          >
            <option value="">Selecione um cliente...</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.full_name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {loading && (
        <Card className="border-2 border-valle-silver-200">
          <CardContent className="py-16 text-center">
            <RefreshCw className="w-12 h-12 mx-auto text-valle-blue-600 animate-spin mb-4" />
            <p className="text-lg font-semibold text-valle-navy-700">Carregando dados...</p>
          </CardContent>
        </Card>
      )}

      {!loading && selectedClient && !hasData && (
        <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-white">
          <CardContent className="py-16 text-center">
            <Target className="w-16 h-16 mx-auto text-primary mb-4" />
            <p className="text-lg font-semibold text-valle-navy-700">
              Dados insuficientes para comparação
            </p>
            <p className="text-sm text-valle-silver-600 mt-2">
              É necessário ter dados "antes da Valle 360" e pelo menos uma métrica de tráfego registrada
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && selectedClient && hasData && (
        <>
          <Card className="border-2 border-valle-blue-200 bg-gradient-to-br from-white to-valle-blue-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-valle-navy-900 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-valle-blue-600" />
                  Comparativo de Tráfego Pago
                </CardTitle>
                <Badge className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                  ROI +{calculateImprovement(beforeMetrics.traffic_roas, afterMetrics.roas)}%
                </Badge>
              </div>
              <p className="text-sm text-valle-silver-600 mt-2">
                Resultados antes e depois da gestão profissional Valle 360
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <Badge variant="outline" className="text-base px-4 py-2 border-2 border-valle-silver-400">
                      Antes da Valle 360
                    </Badge>
                  </div>

                  <Card className="border-2 border-valle-silver-300 bg-gradient-to-br from-valle-silver-100 to-valle-silver-50">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-valle-silver-200">
                        <div className="flex items-center gap-2">
                          <Target className="w-5 h-5 text-valle-silver-500" />
                          <span className="text-sm text-valle-silver-700">ROAS</span>
                        </div>
                        <span className="text-2xl font-bold text-valle-silver-700">
                          {beforeMetrics.traffic_roas.toFixed(1)}x
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-valle-silver-200">
                        <div className="flex items-center gap-2">
                          <MousePointerClick className="w-5 h-5 text-valle-silver-500" />
                          <span className="text-sm text-valle-silver-700">CPL</span>
                        </div>
                        <span className="text-2xl font-bold text-valle-silver-700">
                          R$ {beforeMetrics.traffic_cpl.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-valle-silver-200">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-valle-silver-500" />
                          <span className="text-sm text-valle-silver-700">CTR</span>
                        </div>
                        <span className="text-2xl font-bold text-valle-silver-700">
                          {beforeMetrics.traffic_ctr.toFixed(1)}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-valle-silver-200">
                        <div className="flex items-center gap-2">
                          <Target className="w-5 h-5 text-valle-silver-500" />
                          <span className="text-sm text-valle-silver-700">Conversões</span>
                        </div>
                        <span className="text-2xl font-bold text-valle-silver-700">
                          {beforeMetrics.traffic_conversions}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-valle-silver-200">
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-valle-silver-500" />
                          <span className="text-sm text-valle-silver-700">Leads</span>
                        </div>
                        <span className="text-2xl font-bold text-valle-silver-700">
                          {beforeMetrics.traffic_leads}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-valle-silver-200">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-valle-silver-500" />
                          <span className="text-sm text-valle-silver-700">Investimento</span>
                        </div>
                        <span className="text-xl font-bold text-valle-silver-700">
                          R$ {beforeMetrics.traffic_investment.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <Badge className="text-base px-4 py-2 bg-gradient-to-r from-valle-blue-600 to-valle-blue-700 text-white">
                      Depois da Valle 360
                    </Badge>
                  </div>

                  <Card className="border-2 border-valle-blue-300 bg-gradient-to-br from-valle-blue-50 to-white shadow-xl">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-valle-blue-200">
                        <div className="flex items-center gap-2">
                          <Target className="w-5 h-5 text-valle-blue-600" />
                          <span className="text-sm text-valle-blue-700 font-medium">ROAS</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-valle-blue-700">
                            {afterMetrics.roas.toFixed(1)}x
                          </span>
                          <Badge className="bg-green-600 text-white text-xs">
                            +{calculateImprovement(beforeMetrics.traffic_roas, afterMetrics.roas)}%
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-valle-blue-200">
                        <div className="flex items-center gap-2">
                          <MousePointerClick className="w-5 h-5 text-valle-blue-600" />
                          <span className="text-sm text-valle-blue-700 font-medium">CPC</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-valle-blue-700">
                            R$ {afterMetrics.cpc.toFixed(2)}
                          </span>
                          <Badge className="bg-green-600 text-white text-xs">
                            -{calculateImprovement(beforeCpc, afterCpc, true)}%
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-valle-blue-200">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-valle-blue-600" />
                          <span className="text-sm text-valle-blue-700 font-medium">CTR</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-valle-blue-700">
                            {afterMetrics.ctr.toFixed(1)}%
                          </span>
                          <Badge className="bg-green-600 text-white text-xs">
                            +{calculateImprovement(beforeMetrics.traffic_ctr, afterMetrics.ctr)}%
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-valle-blue-200">
                        <div className="flex items-center gap-2">
                          <Target className="w-5 h-5 text-valle-blue-600" />
                          <span className="text-sm text-valle-blue-700 font-medium">Conversões</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-valle-blue-700">
                            {afterMetrics.conversions}
                          </span>
                          <Badge className="bg-green-600 text-white text-xs">
                            +{calculateImprovement(beforeMetrics.traffic_conversions, afterMetrics.conversions)}%
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-valle-blue-200">
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-valle-blue-600" />
                          <span className="text-sm text-valle-blue-700 font-medium">Leads</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-valle-blue-700">
                            {afterMetrics.leads}
                          </span>
                          <Badge className="bg-green-600 text-white text-xs">
                            +{calculateImprovement(beforeMetrics.traffic_leads, afterMetrics.leads)}%
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-valle-blue-200">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-valle-blue-600" />
                          <span className="text-sm text-valle-blue-700 font-medium">Investimento</span>
                        </div>
                        <span className="text-xl font-bold text-valle-blue-700">
                          R$ {afterMetrics.investment.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-valle-silver-600 mb-1">Melhoria no ROAS</p>
                    <p className="text-4xl font-bold text-green-700">
                      +{calculateImprovement(beforeMetrics.traffic_roas, afterMetrics.roas)}%
                    </p>
                    <p className="text-xs text-valle-silver-600 mt-2">Retorno sobre investimento</p>
                  </CardContent>
                </Card>

                <Card className="border-2 border-valle-blue-200 bg-gradient-to-br from-valle-blue-50 to-white">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-valle-silver-600 mb-1">Aumento de Conversões</p>
                    <p className="text-4xl font-bold text-valle-blue-700">
                      +{calculateImprovement(beforeMetrics.traffic_conversions, afterMetrics.conversions)}%
                    </p>
                    <p className="text-xs text-valle-silver-600 mt-2">Mais resultados</p>
                  </CardContent>
                </Card>

                <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-valle-silver-600 mb-1">Redução de Custo</p>
                    <p className="text-4xl font-bold text-green-700">
                      -{calculateImprovement(beforeCpc, afterCpc, true)}%
                    </p>
                    <p className="text-xs text-valle-silver-600 mt-2">Economia por clique</p>
                  </CardContent>
                </Card>
              </div>

              {comparisonData.length > 0 && (
                <Card className="border border-valle-silver-200 mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Comparativo Visual</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={comparisonData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis dataKey="metric" stroke="#757575" />
                        <YAxis stroke="#757575" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '2px solid #2563eb',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                        <Bar dataKey="antes" fill="#9ca3af" name="Antes" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="depois" fill="#2563eb" name="Depois" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!selectedClient && (
        <Card className="border-2 border-valle-silver-200">
          <CardContent className="py-16 text-center">
            <Target className="w-16 h-16 mx-auto text-valle-silver-400 mb-4" />
            <p className="text-lg font-semibold text-valle-navy-700">
              Selecione um cliente para visualizar
            </p>
            <p className="text-sm text-valle-silver-600 mt-2">
              Escolha um cliente acima para ver a comparação de tráfego antes e depois
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
