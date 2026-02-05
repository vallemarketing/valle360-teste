'use client';

import { useState } from 'react';
import { KPICard } from '@/components/dashboard/KPICard';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, DollarSign, Target, Plus, Sparkles } from 'lucide-react';

export function SalesView() {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  // Dados mock - substituir por dados reais
  const pipeline = {
    lead: [
      { id: '1', title: 'Empresa XYZ', value: 15000, probability: 20 },
      { id: '2', title: 'Startup ABC', value: 8000, probability: 30 },
    ],
    qualified: [
      { id: '3', title: 'Tech Corp', value: 25000, probability: 50 },
      { id: '4', title: 'Digital House', value: 12000, probability: 60 },
    ],
    proposal: [
      { id: '5', title: 'Marketing Pro', value: 35000, probability: 70 },
    ],
    negotiation: [
      { id: '6', title: 'Agência Top', value: 45000, probability: 80 },
      { id: '7', title: 'Empresa Beta', value: 18000, probability: 75 },
    ],
    won: [
      { id: '8', title: 'Cliente Novo', value: 30000, probability: 100 },
    ],
    lost: [],
  };

  const stages = [
    { id: 'lead', label: 'Lead', color: '#6B7280', deals: pipeline.lead },
    { id: 'qualified', label: 'Qualificado', color: '#3B82F6', deals: pipeline.qualified },
    { id: 'proposal', label: 'Proposta', color: '#F59E0B', deals: pipeline.proposal },
    { id: 'negotiation', label: 'Negociação', color: '#8B5CF6', deals: pipeline.negotiation },
    { id: 'won', label: 'Ganho', color: '#10B981', deals: pipeline.won },
    { id: 'lost', label: 'Perdido', color: '#EF4444', deals: pipeline.lost },
  ];

  const totalValue = Object.values(pipeline)
    .flat()
    .reduce((sum, deal) => sum + deal.value, 0);

  const totalDeals = Object.values(pipeline).flat().length;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Pipeline Total"
          value={totalValue}
          format="currency"
          change={18}
          trend="up"
          icon={<DollarSign className="w-5 h-5" />}
          color="#10B981"
        />
        <KPICard
          label="Negócios Ativos"
          value={totalDeals}
          change={12}
          trend="up"
          icon={<Target className="w-5 h-5" />}
          color="#3B82F6"
        />
        <KPICard
          label="Taxa de Conversão"
          value={34}
          format="percentage"
          change={5}
          trend="up"
          icon={<TrendingUp className="w-5 h-5" />}
          color="#F59E0B"
        />
        <KPICard
          label="Novos Leads"
          value={23}
          change={15}
          trend="up"
          icon={<Users className="w-5 h-5" />}
          color="#8B5CF6"
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Pipeline de Vendas
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Gerencie suas oportunidades de negócio
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Sparkles className="w-4 h-4 mr-2" />
            IA Sugestões
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Deal
          </Button>
        </div>
      </div>

      {/* Pipeline Kanban */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {stages.map((stage) => (
            <div
              key={stage.id}
              className="w-80 flex-shrink-0"
            >
              <div
                className="rounded-lg p-4 mb-4"
                style={{ backgroundColor: `${stage.color}20` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold" style={{ color: stage.color }}>
                    {stage.label}
                  </h3>
                  <Badge
                    className="rounded-full"
                    style={{
                      backgroundColor: stage.color,
                      color: 'white',
                    }}
                  >
                    {stage.deals.length}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(
                    stage.deals.reduce((sum, d) => sum + d.value, 0)
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {stage.deals.map((deal) => (
                  <Card
                    key={deal.id}
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <h4 className="font-medium mb-2">{deal.title}</h4>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-green-600">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(deal.value)}
                      </span>
                      <Badge variant="outline">{deal.probability}%</Badge>
                    </div>
                  </Card>
                ))}

                {stage.deals.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Nenhum deal neste estágio
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* IA para Negociação */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">
              Assistente de Negociação com IA
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Obtenha sugestões inteligentes para seus e-mails e argumentos de venda
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Digite o contexto da negociação..."
                className="flex-1 px-4 py-2 border rounded-lg"
              />
              <Button>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Sugestão
              </Button>
            </div>
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 italic">
                💡 Exemplo: "Olá [Nome], espero que esteja bem! Gostaria de retomar nossa conversa sobre..."
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Contratos para Renovação */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Contratos Próximos de Renovação</h3>
        <div className="space-y-3">
          {[
            { client: 'Empresa XYZ', value: 25000, daysLeft: 15, status: 'warning' },
            { client: 'Tech Corp', value: 35000, daysLeft: 30, status: 'ok' },
            { client: 'Digital House', value: 18000, daysLeft: 7, status: 'critical' },
          ].map((contract, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <h4 className="font-medium">{contract.client}</h4>
                <p className="text-sm text-gray-600">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(contract.value)}
                  /mês
                </p>
              </div>
              <div className="text-right">
                <Badge
                  className={
                    contract.status === 'critical'
                      ? 'bg-red-100 text-red-800'
                      : contract.status === 'warning'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }
                >
                  {contract.daysLeft} dias
                </Badge>
                <Button size="sm" variant="outline" className="ml-2">
                  Renovar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
