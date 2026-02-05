'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  User,
  Mail,
  Phone,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Award,
  Calendar,
  DollarSign,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface TeamMember {
  id: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  avatar: string;
  performance: number;
  deliveries: number;
  delays: number;
  nps: number;
  alerts: number;
  trend: 'up' | 'down' | 'neutral';
  aiAnalysis: {
    recommendation: string;
    risk: 'low' | 'medium' | 'high';
    highlight: string;
  };
  history: {
    homeOffice: number;
    reimbursements: number;
    daysOff: number;
  };
}

export default function PessoasPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const team: TeamMember[] = [
    {
      id: 1,
      name: 'João Silva',
      role: 'Designer Gráfico',
      email: 'joao.silva@valle360.com',
      phone: '(11) 98765-4321',
      avatar: 'JS',
      performance: 95,
      deliveries: 48,
      delays: 2,
      nps: 9.5,
      alerts: 0,
      trend: 'up',
      aiAnalysis: {
        recommendation: 'merece aumento',
        risk: 'low',
        highlight: 'Desempenho excepcional e consistente. Alto NPS dos clientes.',
      },
      history: {
        homeOffice: 8,
        reimbursements: 3,
        daysOff: 5,
      },
    },
    {
      id: 2,
      name: 'Maria Santos',
      role: 'Social Media',
      email: 'maria.santos@valle360.com',
      phone: '(11) 98765-1234',
      avatar: 'MS',
      performance: 92,
      deliveries: 120,
      delays: 5,
      nps: 9.2,
      alerts: 0,
      trend: 'up',
      aiAnalysis: {
        recommendation: 'reter talento',
        risk: 'low',
        highlight: 'Alto volume de entregas com qualidade. Colaboradora chave.',
      },
      history: {
        homeOffice: 12,
        reimbursements: 2,
        daysOff: 8,
      },
    },
    {
      id: 3,
      name: 'Pedro Costa',
      role: 'Videomaker',
      email: 'pedro.costa@valle360.com',
      phone: '(11) 98765-5678',
      avatar: 'PC',
      performance: 88,
      deliveries: 32,
      delays: 3,
      nps: 8.8,
      alerts: 0,
      trend: 'neutral',
      aiAnalysis: {
        recommendation: 'bom desempenho',
        risk: 'low',
        highlight: 'Performance sólida. Manter acompanhamento regular.',
      },
      history: {
        homeOffice: 6,
        reimbursements: 5,
        daysOff: 10,
      },
    },
    {
      id: 4,
      name: 'Ana Lima',
      role: 'Gestor de Tráfego',
      email: 'ana.lima@valle360.com',
      phone: '(11) 98765-9876',
      avatar: 'AL',
      performance: 78,
      deliveries: 28,
      delays: 8,
      nps: 7.5,
      alerts: 1,
      trend: 'down',
      aiAnalysis: {
        recommendation: 'atenção',
        risk: 'medium',
        highlight: 'Atrasos recorrentes. Recomenda-se conversa para entender dificuldades.',
      },
      history: {
        homeOffice: 15,
        reimbursements: 8,
        daysOff: 12,
      },
    },
    {
      id: 5,
      name: 'Carlos Souza',
      role: 'Comercial',
      email: 'carlos.souza@valle360.com',
      phone: '(11) 98765-4567',
      avatar: 'CS',
      performance: 65,
      deliveries: 15,
      delays: 12,
      nps: 6.8,
      alerts: 2,
      trend: 'down',
      aiAnalysis: {
        recommendation: 'risco de desligamento',
        risk: 'high',
        highlight: 'Performance abaixo da média. NPS baixo. Necessário plano de ação imediato.',
      },
      history: {
        homeOffice: 20,
        reimbursements: 12,
        daysOff: 15,
      },
    },
  ];

  const filteredTeam = team.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return 'text-green-600';
    if (performance >= 75) return 'text-blue-600';
    if (performance >= 60) return 'text-primary';
    return 'text-red-600';
  };

  const getAIBadge = (recommendation: string) => {
    const getVariant = () => {
      switch (recommendation) {
        case 'merece aumento':
          return { color: 'bg-green-100 text-green-700', IconComponent: Award };
        case 'reter talento':
          return { color: 'bg-blue-100 text-blue-700', IconComponent: TrendingUp };
        case 'bom desempenho':
          return { color: 'bg-gray-100 text-gray-700', IconComponent: TrendingUp };
        case 'atenção':
          return { color: 'bg-amber-100 text-amber-700', IconComponent: AlertTriangle };
        case 'risco de desligamento':
          return { color: 'bg-red-100 text-red-700', IconComponent: TrendingDown };
        default:
          return { color: 'bg-gray-100 text-gray-700', IconComponent: TrendingUp };
      }
    };
    const variant = getVariant();
    const IconComponent = variant.IconComponent;
    return (
      <Badge className={`${variant.color} flex items-center gap-1`}>
        <IconComponent className="w-3 h-3" />
        {recommendation}
      </Badge>
    );
  };

  const getRiskColor = (risk: string) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-primary',
      high: 'text-red-600',
    };
    return colors[risk as keyof typeof colors];
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestão de Pessoas</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Visão completa da equipe com análise de IA
          </p>
        </div>
        <Button className="bg-primary hover:bg-[#1260b5]">
          <User className="w-4 h-4 mr-2" />
          Adicionar Colaborador
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{team.length}</p>
              </div>
              <User className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Top Performers</p>
                <p className="text-2xl font-bold text-green-600">
                  {team.filter((m) => m.performance >= 90).length}
                </p>
              </div>
              <Award className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Com Alertas</p>
                <p className="text-2xl font-bold text-primary">
                  {team.filter((m) => m.alerts > 0).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Performance Média</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(team.reduce((acc, m) => acc + m.performance, 0) / team.length)}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipe</CardTitle>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou cargo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTeam.map((member) => (
              <Card
                key={member.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedMember(member)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center text-white font-medium text-lg">
                        {member.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">{member.name}</h3>
                          {member.alerts > 0 && (
                            <Badge className="bg-red-100 text-red-700">
                              {member.alerts} {member.alerts === 1 ? 'Alerta' : 'Alertas'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{member.role}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {member.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {member.phone}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className={`text-2xl font-bold ${getPerformanceColor(member.performance)}`}>
                        {member.performance}%
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Análise IA</span>
                    </div>
                    <div className="flex items-start gap-3">
                      {getAIBadge(member.aiAnalysis.recommendation)}
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                        {member.aiAnalysis.highlight}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-4 gap-3">
                    <div className="text-center">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Entregas</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{member.deliveries}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Atrasos</p>
                      <p className="text-lg font-bold text-primary">{member.delays}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600 dark:text-gray-400">NPS</p>
                      <p className="text-lg font-bold text-blue-600">{member.nps.toFixed(1)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Tendência</p>
                      <div className="flex justify-center">
                        {member.trend === 'up' && <TrendingUp className="w-5 h-5 text-green-600" />}
                        {member.trend === 'down' && <TrendingDown className="w-5 h-5 text-red-600" />}
                        {member.trend === 'neutral' && <div className="w-5 h-0.5 bg-gray-400" />}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedMember && (
        <Card className="border-2 border-purple-200 dark:border-purple-900">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1672d6] to-[#001533] flex items-center justify-center text-white font-medium text-2xl">
                  {selectedMember.avatar}
                </div>
                <div>
                  <CardTitle>{selectedMember.name}</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedMember.role}</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => setSelectedMember(null)}>
                Fechar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-lg">Análise Completa de IA</h3>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    {getAIBadge(selectedMember.aiAnalysis.recommendation)}
                    <Badge className={`${getRiskColor(selectedMember.aiAnalysis.risk)}`}>
                      Risco: {selectedMember.aiAnalysis.risk === 'low' ? 'Baixo' : selectedMember.aiAnalysis.risk === 'medium' ? 'Médio' : 'Alto'}
                    </Badge>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{selectedMember.aiAnalysis.highlight}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">Histórico de Solicitações</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                      <p className="text-2xl font-bold">{selectedMember.history.homeOffice}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Home Office</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-600" />
                      <p className="text-2xl font-bold">{selectedMember.history.reimbursements}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Reembolsos</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Calendar className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                      <p className="text-2xl font-bold">{selectedMember.history.daysOff}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Folgas</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1 bg-green-600 hover:bg-green-700">Dar Feedback Positivo</Button>
                <Button variant="outline" className="flex-1">Ver Relatório Completo</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
