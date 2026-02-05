'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  Users,
  DollarSign,
  Target,
  PhoneCall,
  Mail,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Filter,
  BarChart3,
  Activity,
  Award,
  RefreshCw,
  UserPlus,
  Building2,
  MapPin,
  Briefcase,
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: 'website' | 'referral' | 'social' | 'cold_call' | 'event' | 'partner';
  stage: 'novo' | 'contato' | 'qualificado' | 'proposta' | 'negociacao' | 'fechado' | 'perdido';
  value: number;
  probability: number;
  lastContact: string;
  nextAction: string;
  nextActionDate: string;
  assignedTo: string;
  createdAt: string;
  priority: 'baixa' | 'media' | 'alta';
  notes?: string;
}

interface Deal {
  id: string;
  client: string;
  service: string;
  value: number;
  stage: 'proposta_enviada' | 'em_negociacao' | 'aguardando_assinatura' | 'fechado' | 'cancelado';
  closeProbability: number;
  expectedCloseDate: string;
  assignedTo: string;
  notes?: string;
}

interface CommercialMetrics {
  newLeads: number;
  qualifiedLeads: number;
  proposalsSent: number;
  closedDeals: number;
  revenue: number;
  conversionRate: number;
  averageTicket: number;
  pipelineValue: number;
}

export default function ComercialPage() {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState<'pipeline' | 'leads' | 'deals'>('pipeline');

  const leads: Lead[] = [
    {
      id: '1',
      name: 'João Silva',
      company: 'Tech Corp',
      email: 'joao@techcorp.com',
      phone: '(11) 98765-4321',
      source: 'website',
      stage: 'qualificado',
      value: 15000,
      probability: 60,
      lastContact: '05/11/2025',
      nextAction: 'Agendar reunião de apresentação',
      nextActionDate: '08/11/2025',
      assignedTo: 'Carlos Vendas',
      createdAt: '01/11/2025',
      priority: 'alta',
      notes: 'Interessado em pacote completo de marketing',
    },
    {
      id: '2',
      name: 'Maria Santos',
      company: 'Loja Fashion',
      email: 'maria@lojafashion.com',
      phone: '(11) 91234-5678',
      source: 'referral',
      stage: 'proposta',
      value: 8000,
      probability: 75,
      lastContact: '06/11/2025',
      nextAction: 'Enviar proposta detalhada',
      nextActionDate: '07/11/2025',
      assignedTo: 'Carlos Vendas',
      createdAt: '28/10/2025',
      priority: 'alta',
    },
    {
      id: '3',
      name: 'Pedro Costa',
      company: 'Restaurante Sabor',
      email: 'pedro@sabor.com',
      phone: '(11) 99876-5432',
      source: 'social',
      stage: 'novo',
      value: 5000,
      probability: 20,
      lastContact: '07/11/2025',
      nextAction: 'Primeira ligação de qualificação',
      nextActionDate: '08/11/2025',
      assignedTo: 'Ana Comercial',
      createdAt: '07/11/2025',
      priority: 'media',
    },
    {
      id: '4',
      name: 'Fernanda Lima',
      company: 'Academia Fit',
      email: 'fernanda@academiafit.com',
      phone: '(11) 97654-3210',
      source: 'event',
      stage: 'negociacao',
      value: 12000,
      probability: 85,
      lastContact: '06/11/2025',
      nextAction: 'Negociar condições de pagamento',
      nextActionDate: '09/11/2025',
      assignedTo: 'Carlos Vendas',
      createdAt: '20/10/2025',
      priority: 'alta',
    },
  ];

  const deals: Deal[] = [
    {
      id: '1',
      client: 'Tech Corp',
      service: 'Gestão de Marketing Digital Completa',
      value: 15000,
      stage: 'proposta_enviada',
      closeProbability: 60,
      expectedCloseDate: '15/11/2025',
      assignedTo: 'Carlos Vendas',
    },
    {
      id: '2',
      client: 'Academia Fit',
      service: 'Social Media + Tráfego Pago',
      value: 12000,
      stage: 'em_negociacao',
      closeProbability: 85,
      expectedCloseDate: '10/11/2025',
      assignedTo: 'Carlos Vendas',
      notes: 'Cliente quer desconto para fechar hoje',
    },
    {
      id: '3',
      client: 'Loja Fashion',
      service: 'E-commerce + Marketing',
      value: 8000,
      stage: 'aguardando_assinatura',
      closeProbability: 90,
      expectedCloseDate: '08/11/2025',
      assignedTo: 'Carlos Vendas',
    },
  ];

  const metrics: CommercialMetrics = {
    newLeads: 12,
    qualifiedLeads: 8,
    proposalsSent: 5,
    closedDeals: 3,
    revenue: 45000,
    conversionRate: 37.5,
    averageTicket: 15000,
    pipelineValue: 92000,
  };

  const filteredLeads = selectedFilter === 'all'
    ? leads
    : leads.filter(l => l.stage === selectedFilter);

  const getStageBadge = (stage: string) => {
    const variants: Record<string, { label: string; color: string }> = {
      novo: { label: 'Novo Lead', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
      contato: { label: 'Em Contato', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' },
      qualificado: { label: 'Qualificado', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200' },
      proposta: { label: 'Proposta', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200' },
      negociacao: { label: 'Negociação', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200' },
      fechado: { label: 'Fechado', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' },
      perdido: { label: 'Perdido', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200' },
    };
    const variant = variants[stage] || variants.novo;
    return <Badge className={variant.color}>{variant.label}</Badge>;
  };

  const getDealStageBadge = (stage: string) => {
    const variants = {
      proposta_enviada: { label: 'Proposta Enviada', color: 'bg-blue-100 text-blue-700' },
      em_negociacao: { label: 'Em Negociação', color: 'bg-amber-100 text-amber-700' },
      aguardando_assinatura: { label: 'Aguardando Assinatura', color: 'bg-purple-100 text-purple-700' },
      fechado: { label: 'Fechado', color: 'bg-green-100 text-green-700' },
      cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
    };
    const variant = variants[stage as keyof typeof variants];
    return <Badge className={variant.color}>{variant.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      alta: { label: 'Alta', color: 'bg-red-100 text-red-700' },
      media: { label: 'Média', color: 'bg-yellow-100 text-yellow-700' },
      baixa: { label: 'Baixa', color: 'bg-gray-100 text-gray-700' },
    };
    const variant = variants[priority as keyof typeof variants];
    return <Badge className={variant.color}>{variant.label}</Badge>;
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'website':
        return <Activity className="w-3 h-3" />;
      case 'referral':
        return <Users className="w-3 h-3" />;
      case 'social':
        return <TrendingUp className="w-3 h-3" />;
      case 'cold_call':
        return <PhoneCall className="w-3 h-3" />;
      case 'event':
        return <Calendar className="w-3 h-3" />;
      case 'partner':
        return <Briefcase className="w-3 h-3" />;
      default:
        return <Activity className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard - Comercial</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gestão de pipeline de vendas, leads e oportunidades
          </p>
        </div>
        <Button className="bg-primary hover:bg-[#1260b5]">
          <Plus className="w-4 h-4 mr-2" />
          Novo Lead
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Novos Leads</p>
                <p className="text-3xl font-bold text-blue-600">{metrics.newLeads}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Este mês</p>
              </div>
              <UserPlus className="w-10 h-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 dark:text-purple-300 mb-1">Leads Qualificados</p>
                <p className="text-3xl font-bold text-purple-600">{metrics.qualifiedLeads}</p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Em pipeline</p>
              </div>
              <Target className="w-10 h-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-900/20 border-amber-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-1">Propostas Enviadas</p>
                <p className="text-3xl font-bold text-primary">{metrics.proposalsSent}</p>
                <p className="text-xs text-primary dark:text-amber-400 mt-1">Aguardando retorno</p>
              </div>
              <Mail className="w-10 h-10 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 dark:text-green-300 mb-1">Deals Fechados</p>
                <p className="text-3xl font-bold text-green-600">{metrics.closedDeals}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">Este mês</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Receita do Mês</span>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              R$ {metrics.revenue.toLocaleString()}
            </p>
            <p className="text-xs text-green-600 mt-1">+23% vs. mês anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Pipeline Total</span>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              R$ {metrics.pipelineValue.toLocaleString()}
            </p>
            <p className="text-xs text-blue-600 mt-1">Em negociação</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Taxa de Conversão</span>
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {metrics.conversionRate}%
            </p>
            <p className="text-xs text-purple-600 mt-1">Meta: 40%</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <Button
          variant={selectedTab === 'pipeline' ? 'default' : 'ghost'}
          onClick={() => setSelectedTab('pipeline')}
          className={selectedTab === 'pipeline' ? 'bg-primary hover:bg-[#1260b5]' : ''}
        >
          <Target className="w-4 h-4 mr-2" />
          Pipeline
        </Button>
        <Button
          variant={selectedTab === 'leads' ? 'default' : 'ghost'}
          onClick={() => setSelectedTab('leads')}
          className={selectedTab === 'leads' ? 'bg-primary hover:bg-[#1260b5]' : ''}
        >
          <Users className="w-4 h-4 mr-2" />
          Leads ({leads.length})
        </Button>
        <Button
          variant={selectedTab === 'deals' ? 'default' : 'ghost'}
          onClick={() => setSelectedTab('deals')}
          className={selectedTab === 'deals' ? 'bg-primary hover:bg-[#1260b5]' : ''}
        >
          <DollarSign className="w-4 h-4 mr-2" />
          Deals ({deals.length})
        </Button>
      </div>

      {selectedTab === 'pipeline' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Funil de Vendas</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Visualização do pipeline comercial
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                  { stage: 'novo', label: 'Novos', count: leads.filter(l => l.stage === 'novo').length, color: 'bg-gray-100' },
                  { stage: 'qualificado', label: 'Qualificados', count: leads.filter(l => l.stage === 'qualificado').length, color: 'bg-purple-100' },
                  { stage: 'proposta', label: 'Propostas', count: leads.filter(l => l.stage === 'proposta').length, color: 'bg-amber-100' },
                  { stage: 'negociacao', label: 'Negociação', count: leads.filter(l => l.stage === 'negociacao').length, color: 'bg-yellow-100' },
                  { stage: 'fechado', label: 'Fechados', count: leads.filter(l => l.stage === 'fechado').length, color: 'bg-green-100' },
                ].map((stage) => (
                  <div
                    key={stage.stage}
                    className={`${stage.color} dark:bg-opacity-20 p-6 rounded-lg text-center cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => setSelectedFilter(stage.stage)}
                  >
                    <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{stage.count}</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{stage.label}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      R$ {leads.filter(l => l.stage === stage.stage).reduce((sum, l) => sum + l.value, 0).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ações Pendentes Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leads.filter(l => l.nextActionDate === '08/11/2025').map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{lead.nextAction}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{lead.name} - {lead.company}</p>
                      </div>
                    </div>
                    <Button size="sm" className="bg-primary hover:bg-[#1260b5]">
                      Executar
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedTab === 'leads' && (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Gestão de Leads</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Todos os leads e oportunidades em andamento
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant={selectedFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedFilter('all')}
                  className={selectedFilter === 'all' ? 'bg-primary' : ''}
                >
                  Todos
                </Button>
                <Button
                  size="sm"
                  variant={selectedFilter === 'qualificado' ? 'default' : 'outline'}
                  onClick={() => setSelectedFilter('qualificado')}
                  className={selectedFilter === 'qualificado' ? 'bg-primary' : ''}
                >
                  Qualificados
                </Button>
                <Button
                  size="sm"
                  variant={selectedFilter === 'proposta' ? 'default' : 'outline'}
                  onClick={() => setSelectedFilter('proposta')}
                  className={selectedFilter === 'proposta' ? 'bg-primary' : ''}
                >
                  Propostas
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredLeads.map((lead) => (
                <Card key={lead.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center text-white font-bold text-lg">
                          {lead.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{lead.name}</h3>
                            {getPriorityBadge(lead.priority)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <Building2 className="w-3 h-3" />
                            <span>{lead.company}</span>
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <span>{lead.email}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <PhoneCall className="w-3 h-3" />
                              <span>{lead.phone}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {getSourceIcon(lead.source)}
                              <span className="capitalize">{lead.source}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              Valor: R$ {lead.value.toLocaleString()}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Prob: {lead.probability}%
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {lead.assignedTo}
                            </Badge>
                          </div>
                          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                            <p className="text-blue-800 dark:text-blue-200 font-medium">
                              📅 Próxima ação: {lead.nextAction} ({lead.nextActionDate})
                            </p>
                          </div>
                          {lead.notes && (
                            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <p className="text-xs text-gray-700 dark:text-gray-300">{lead.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      {getStageBadge(lead.stage)}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <PhoneCall className="w-3 h-3 mr-2" />
                        Ligar
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Mail className="w-3 h-3 mr-2" />
                        Email
                      </Button>
                      <Button size="sm" className="flex-1 bg-primary hover:bg-[#1260b5]">
                        Atualizar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedTab === 'deals' && (
        <Card className="border-2 border-green-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-green-900 dark:text-green-200">Negociações Ativas</CardTitle>
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                  Oportunidades próximas do fechamento
                </p>
              </div>
              <Badge className="bg-green-600 text-white text-lg px-3 py-1">
                R$ {deals.reduce((sum, d) => sum + d.value, 0).toLocaleString()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deals.map((deal) => (
                <Card key={deal.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                          <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{deal.client}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{deal.service}</p>
                          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              <span className="font-bold text-green-600">R$ {deal.value.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              <span>Prob: {deal.closeProbability}%</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>Previsão: {deal.expectedCloseDate}</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${deal.closeProbability}%` }}
                            />
                          </div>
                          {deal.notes && (
                            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200">
                              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                                💡 {deal.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      {getDealStageBadge(deal.stage)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance do Time</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Vendedores - Novembro 2025
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Carlos Vendas', deals: 8, revenue: 78000, conversion: 42 },
                { name: 'Ana Comercial', deals: 5, revenue: 45000, conversion: 35 },
              ].map((seller, i) => (
                <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center text-white font-bold">
                        {seller.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{seller.name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{seller.deals} deals fechados</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">R$ {seller.revenue.toLocaleString()}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{seller.conversion}% conversão</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${seller.conversion}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estatísticas do Mês</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Novembro 2025
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Meta de Vendas</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">R$ 45K / R$ 60K</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ticket Médio</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">R$ {metrics.averageTicket.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ciclo Médio de Venda</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">18 dias</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-2">
                <BarChart3 className="w-4 h-4 mr-2" />
                Ver Relatório Completo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
