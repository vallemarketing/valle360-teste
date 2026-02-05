'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { TrendingUp, Instagram, DollarSign, MousePointerClick, Globe, AlertCircle } from 'lucide-react';
import type { ContractService, BeforeAfterMetric } from '@/types';

interface BeforeAfterSectionProps {
  clientId: string;
}

export default function BeforeAfterSection({ clientId }: BeforeAfterSectionProps) {
  const [activeServices, setActiveServices] = useState<ContractService[]>([]);
  const [metrics, setMetrics] = useState<BeforeAfterMetric[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Dados simulados para demonstração
  const getMockData = () => {
    const mockServices: ContractService[] = [
      { id: '1', client_id: clientId, service_type: 'redes_sociais', is_active: true, start_date: '2024-06-01', end_date: undefined, created_at: '', updated_at: '' },
      { id: '2', client_id: clientId, service_type: 'trafego_pago', is_active: true, start_date: '2024-06-01', end_date: undefined, created_at: '', updated_at: '' },
      { id: '3', client_id: clientId, service_type: 'comercial', is_active: true, start_date: '2024-06-01', end_date: undefined, created_at: '', updated_at: '' },
      { id: '4', client_id: clientId, service_type: 'site', is_active: true, start_date: '2024-06-01', end_date: undefined, created_at: '', updated_at: '' }
    ];

    const mockMetrics: BeforeAfterMetric[] = [
      // Redes Sociais
      { id: '1', client_id: clientId, service_type: 'redes_sociais', metric_name: 'seguidores', metric_label: 'Seguidores Instagram', before_value: 5000, after_value: 15000, improvement_percentage: 200, unit: '', measurement_date: '2024-11-01', created_at: '', updated_at: '' },
      { id: '2', client_id: clientId, service_type: 'redes_sociais', metric_name: 'engajamento', metric_label: 'Taxa de Engajamento', before_value: 2.5, after_value: 8.3, improvement_percentage: 232, unit: '%', measurement_date: '2024-11-01', created_at: '', updated_at: '' },
      { id: '3', client_id: clientId, service_type: 'redes_sociais', metric_name: 'alcance', metric_label: 'Alcance Médio por Post', before_value: 8000, after_value: 45000, improvement_percentage: 462.5, unit: '', measurement_date: '2024-11-01', created_at: '', updated_at: '' },
      { id: '4', client_id: clientId, service_type: 'redes_sociais', metric_name: 'stories', metric_label: 'Stories Visualizados', before_value: 1200, after_value: 8500, improvement_percentage: 608.3, unit: '', measurement_date: '2024-11-01', created_at: '', updated_at: '' },

      // Tráfego Pago
      { id: '5', client_id: clientId, service_type: 'trafego_pago', metric_name: 'roas', metric_label: 'ROAS (Retorno sobre Investimento)', before_value: 1.8, after_value: 4.5, improvement_percentage: 150, unit: 'x', measurement_date: '2024-11-01', created_at: '', updated_at: '' },
      { id: '6', client_id: clientId, service_type: 'trafego_pago', metric_name: 'ctr', metric_label: 'CTR (Taxa de Cliques)', before_value: 1.2, after_value: 3.8, improvement_percentage: 216.7, unit: '%', measurement_date: '2024-11-01', created_at: '', updated_at: '' },
      { id: '7', client_id: clientId, service_type: 'trafego_pago', metric_name: 'cpc', metric_label: 'CPC (Custo por Clique)', before_value: 2.50, after_value: 1.20, improvement_percentage: -52, unit: 'R$', measurement_date: '2024-11-01', created_at: '', updated_at: '' },
      { id: '8', client_id: clientId, service_type: 'trafego_pago', metric_name: 'conversoes', metric_label: 'Conversões Mensais', before_value: 45, after_value: 180, improvement_percentage: 300, unit: '', measurement_date: '2024-11-01', created_at: '', updated_at: '' },

      // Comercial
      { id: '9', client_id: clientId, service_type: 'comercial', metric_name: 'faturamento', metric_label: 'Faturamento Mensal', before_value: 85000, after_value: 245000, improvement_percentage: 188.2, unit: 'R$', measurement_date: '2024-11-01', created_at: '', updated_at: '' },
      { id: '10', client_id: clientId, service_type: 'comercial', metric_name: 'ticket', metric_label: 'Ticket Médio', before_value: 850, after_value: 1450, improvement_percentage: 70.6, unit: 'R$', measurement_date: '2024-11-01', created_at: '', updated_at: '' },
      { id: '11', client_id: clientId, service_type: 'comercial', metric_name: 'conversao', metric_label: 'Taxa de Conversão', before_value: 3.2, after_value: 8.5, improvement_percentage: 165.6, unit: '%', measurement_date: '2024-11-01', created_at: '', updated_at: '' },
      { id: '12', client_id: clientId, service_type: 'comercial', metric_name: 'clientes', metric_label: 'Novos Clientes/Mês', before_value: 15, after_value: 48, improvement_percentage: 220, unit: '', measurement_date: '2024-11-01', created_at: '', updated_at: '' },

      // Site
      { id: '13', client_id: clientId, service_type: 'site', metric_name: 'visitantes', metric_label: 'Visitantes Mensais', before_value: 3500, after_value: 18500, improvement_percentage: 428.6, unit: '', measurement_date: '2024-11-01', created_at: '', updated_at: '' },
      { id: '14', client_id: clientId, service_type: 'site', metric_name: 'tempo', metric_label: 'Tempo Médio no Site', before_value: 1.2, after_value: 3.8, improvement_percentage: 216.7, unit: 'min', measurement_date: '2024-11-01', created_at: '', updated_at: '' },
      { id: '15', client_id: clientId, service_type: 'site', metric_name: 'rejeicao', metric_label: 'Taxa de Rejeição', before_value: 65, after_value: 28, improvement_percentage: -56.9, unit: '%', measurement_date: '2024-11-01', created_at: '', updated_at: '' },
      { id: '16', client_id: clientId, service_type: 'site', metric_name: 'paginas', metric_label: 'Páginas por Visita', before_value: 2.1, after_value: 5.7, improvement_percentage: 171.4, unit: '', measurement_date: '2024-11-01', created_at: '', updated_at: '' }
    ];

    return { mockServices, mockMetrics };
  };

  useEffect(() => {
    loadData();
  }, [clientId]);

  const loadData = async () => {
    try {
      const { data: servicesData, error: servicesError } = await supabase
        .from('contract_services')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true);

      const { data: metricsData, error: metricsError } = await supabase
        .from('before_after_metrics')
        .select('*')
        .eq('client_id', clientId)
        .order('measurement_date', { ascending: false });

      // Se não houver dados no banco, usar dados simulados
      if (!servicesData || servicesData.length === 0 || !metricsData || metricsData.length === 0) {
        const { mockServices, mockMetrics } = getMockData();
        setActiveServices(mockServices);
        setMetrics(mockMetrics);
        setActiveTab(mockServices[0].service_type);
      } else {
        setActiveServices(servicesData);
        setMetrics(metricsData);
        if (servicesData.length > 0) {
          setActiveTab(servicesData[0].service_type);
        }
      }
    } catch (error) {
      console.error('Error loading before/after data:', error);
      // Em caso de erro, usar dados simulados
      const { mockServices, mockMetrics } = getMockData();
      setActiveServices(mockServices);
      setMetrics(mockMetrics);
      setActiveTab(mockServices[0].service_type);
    } finally {
      setLoading(false);
    }
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'redes_sociais': return Instagram;
      case 'comercial': return DollarSign;
      case 'trafego_pago': return MousePointerClick;
      case 'site': return Globe;
      default: return TrendingUp;
    }
  };

  const getServiceLabel = (serviceType: string) => {
    switch (serviceType) {
      case 'redes_sociais': return 'Redes Sociais';
      case 'comercial': return 'Comercial';
      case 'trafego_pago': return 'Tráfego Pago';
      case 'site': return 'Site';
      default: return serviceType;
    }
  };

  const getMetricsForService = (serviceType: string) => {
    return metrics.filter(m => m.service_type === serviceType);
  };

  const calculateROI = (serviceType: string) => {
    const serviceMetrics = getMetricsForService(serviceType);
    if (serviceMetrics.length === 0) return 0;
    const totalImprovement = serviceMetrics.reduce((sum, m) => sum + m.improvement_percentage, 0);
    return Math.round(totalImprovement / serviceMetrics.length);
  };

  const renderMetricCard = (metric: BeforeAfterMetric) => {
    const isPositive = metric.improvement_percentage >= 0;
    return (
      <div key={metric.id} className="bg-white rounded-xl border-2 border-valle-silver-200 p-6 hover:border-valle-blue-300 transition-colors">
        <h4 className="text-sm font-semibold text-valle-navy-700 mb-4">{metric.metric_label}</h4>
        <div className="grid grid-cols-2 gap-6 mb-4">
          <div>
            <p className="text-xs text-valle-silver-600 mb-1">Antes</p>
            <p className="text-2xl font-bold text-red-600">
              {metric.before_value.toLocaleString('pt-BR')}
              {metric.unit && <span className="text-sm text-valle-silver-600 ml-1">{metric.unit}</span>}
            </p>
          </div>
          <div>
            <p className="text-xs text-valle-silver-600 mb-1">Depois</p>
            <p className="text-2xl font-bold text-green-600">
              {metric.after_value.toLocaleString('pt-BR')}
              {metric.unit && <span className="text-sm text-valle-silver-600 ml-1">{metric.unit}</span>}
            </p>
          </div>
        </div>
        <div className={`flex items-center justify-center gap-2 p-3 rounded-lg ${isPositive ? 'bg-green-50' : 'bg-red-50'}`}>
          <TrendingUp className={`w-5 h-5 ${isPositive ? 'text-green-600' : 'text-red-600 rotate-180'}`} />
          <span className={`font-bold text-lg ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{metric.improvement_percentage.toFixed(1)}%
          </span>
          <span className="text-sm text-valle-silver-600">de {isPositive ? 'crescimento' : 'redução'}</span>
        </div>
      </div>
    );
  };

  const renderServiceTab = (serviceType: string) => {
    const serviceMetrics = getMetricsForService(serviceType);
    const roi = calculateROI(serviceType);

    if (serviceMetrics.length === 0) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-valle-silver-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-valle-navy-800 mb-2">Métricas em Breve</h3>
          <p className="text-valle-silver-600">As métricas desta área serão adicionadas em breve pela equipe Valle.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Card className="border-2 border-valle-blue-200 bg-gradient-to-br from-white to-valle-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-valle-silver-600 mb-1">ROI Geral da Área</p>
                <p className="text-5xl font-bold text-valle-blue-600 mb-1">{roi > 0 ? '+' : ''}{roi}%</p>
                <p className="text-sm text-valle-silver-600">Crescimento médio desde o início</p>
              </div>
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-valle-blue-600 to-valle-blue-700 flex items-center justify-center shadow-lg">
                <TrendingUp className="w-12 h-12 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {serviceMetrics.map(metric => renderMetricCard(metric))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 border-4 border-valle-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-valle-silver-600">Carregando comparativos...</p>
        </CardContent>
      </Card>
    );
  }

  if (activeServices.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertCircle className="w-16 h-16 text-valle-silver-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-valle-navy-900 mb-2">Nenhum Serviço Ativo</h3>
          <p className="text-valle-silver-600 mb-4">Você ainda não possui serviços ativos para visualizar comparativos.</p>
          <p className="text-sm text-valle-silver-500">Entre em contato com a equipe Valle para ativar serviços no seu contrato.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-valle-blue-600" />
          Antes e Depois Valle 360
        </CardTitle>
        <p className="text-sm text-valle-silver-600 mt-1">Compare os resultados antes e depois de trabalhar com a Valle</p>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {activeServices.map((service) => {
            const Icon = getServiceIcon(service.service_type);
            return (
              <button
                key={service.id}
                onClick={() => setActiveTab(service.service_type)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
                  activeTab === service.service_type
                    ? 'bg-gradient-to-r from-valle-blue-600 to-valle-blue-700 text-white shadow-lg scale-105'
                    : 'bg-valle-silver-100 text-valle-silver-700 hover:bg-valle-silver-200 hover:scale-102'
                }`}
              >
                <Icon className="w-4 h-4" />
                {getServiceLabel(service.service_type)}
              </button>
            );
          })}
        </div>
        {renderServiceTab(activeTab)}
      </CardContent>
    </Card>
  );
}
