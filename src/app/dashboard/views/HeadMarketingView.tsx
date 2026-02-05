'use client';

import { KPICard } from '@/components/dashboard/KPICard';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Users, DollarSign, Target, Instagram, Video, Palette, Globe } from 'lucide-react';

export function HeadMarketingView() {
  // Dados consolidados - em produção viriam do backend
  const kpis = {
    revenue: 285000,
    clients: 45,
    projects: 128,
    teamPerformance: 87,
  };

  const departmentStats = [
    { name: 'Social Media', icon: Instagram, posts: 156, engagement: 8.5, color: '#E1306C' },
    { name: 'Videomaker', icon: Video, projects: 24, delivered: 18, color: '#FF0000' },
    { name: 'Design', icon: Palette, briefings: 89, approved: 76, color: '#7B68EE' },
    { name: 'Web Design', icon: Globe, sites: 12, tickets: 34, color: '#4169E1' },
  ];

  const topPerformers = [
    { name: 'Ana Silva', department: 'Social Media', score: 95, tasks: 45 },
    { name: 'Carlos Santos', department: 'Videomaker', score: 92, tasks: 38 },
    { name: 'Maria Lima', department: 'Design', score: 90, tasks: 52 },
    { name: 'João Costa', department: 'Web Design', score: 88, tasks: 41 },
    { name: 'Paula Souza', department: 'Comercial', score: 87, tasks: 48 },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs Globais */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Visão Estratégica Consolidada
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            label="Faturamento Mensal"
            value={kpis.revenue}
            format="currency"
            change={24}
            trend="up"
            icon={<DollarSign className="w-5 h-5" />}
            color="#10B981"
          />
          <KPICard
            label="Clientes Ativos"
            value={kpis.clients}
            change={8}
            trend="up"
            icon={<Users className="w-5 h-5" />}
            color="#3B82F6"
          />
          <KPICard
            label="Projetos em Andamento"
            value={kpis.projects}
            change={12}
            trend="up"
            icon={<Target className="w-5 h-5" />}
            color="#F59E0B"
          />
          <KPICard
            label="Performance da Equipe"
            value={kpis.teamPerformance}
            format="percentage"
            change={5}
            trend="up"
            icon={<TrendingUp className="w-5 h-5" />}
            color="#8B5CF6"
          />
        </div>
      </div>

      {/* Performance por Departamento */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Performance por Departamento
        </h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {departmentStats.map((dept) => {
            const Icon = dept.icon;
            return (
              <div
                key={dept.name}
                className="relative p-6 rounded-lg border-2 hover:shadow-lg transition-shadow cursor-pointer"
                style={{ borderColor: dept.color }}
              >
                <div
                  className="absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${dept.color}20` }}
                >
                  <Icon className="w-6 h-6" style={{ color: dept.color }} />
                </div>
                <h4 className="font-semibold mb-4" style={{ color: dept.color }}>
                  {dept.name}
                </h4>
                <div className="space-y-2 text-sm">
                  {'posts' in dept && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Posts:</span>
                        <span className="font-medium">{dept.posts}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Engajamento:</span>
                        <span className="font-medium">{dept.engagement}%</span>
                      </div>
                    </>
                  )}
                  {'projects' in dept && 'delivered' in dept && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Projetos:</span>
                        <span className="font-medium">{dept.projects}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Entregues:</span>
                        <span className="font-medium">{dept.delivered}</span>
                      </div>
                    </>
                  )}
                  {'briefings' in dept && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Briefings:</span>
                        <span className="font-medium">{dept.briefings}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Aprovados:</span>
                        <span className="font-medium">{dept.approved}</span>
                      </div>
                    </>
                  )}
                  {'sites' in dept && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sites:</span>
                        <span className="font-medium">{dept.sites}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tickets:</span>
                        <span className="font-medium">{dept.tickets}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Top Performers */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">🏆 Top Performers do Mês</h3>
        <div className="space-y-3">
          {topPerformers.map((performer, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex-shrink-0">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-bold text-white
                    ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-primary' : 'bg-blue-500'}
                  `}
                >
                  {index + 1}
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{performer.name}</h4>
                <p className="text-sm text-gray-600">{performer.department}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {performer.score}
                </div>
                <div className="text-xs text-gray-500">
                  {performer.tasks} tarefas
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Gráfico de Tendências (Placeholder) */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Faturamento Mensal</h3>
          <div className="h-64 flex items-end justify-around gap-2">
            {[65, 75, 85, 70, 90, 95].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-amber-500 to-amber-300 rounded-t"
                  style={{ height: `${height}%` }}
                />
                <span className="text-xs mt-2 text-gray-600">
                  {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'][i]}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Distribuição de Projetos</h3>
          <div className="h-64 flex items-center justify-center">
            <div className="relative w-48 h-48">
              {/* Placeholder para gráfico de pizza */}
              <div className="w-full h-full rounded-full" style={{
                background: 'conic-gradient(#E1306C 0% 25%, #FF0000 25% 45%, #7B68EE 45% 70%, #4169E1 70% 100%)'
              }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#E1306C]" />
              <span>Social (25%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FF0000]" />
              <span>Vídeo (20%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#7B68EE]" />
              <span>Design (25%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#4169E1]" />
              <span>Web (30%)</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
