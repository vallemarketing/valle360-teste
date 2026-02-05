'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Target, Zap } from 'lucide-react';

interface AIPerformanceSummaryProps {
  clientName?: string;
}

export function AIPerformanceSummary({ clientName = 'Cliente' }: AIPerformanceSummaryProps) {
  const insights = [
    {
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
      label: 'Crescimento',
      value: '+287%',
      description: 'em engajamento este trimestre'
    },
    {
      icon: Target,
      color: 'text-valle-blue-600',
      bg: 'bg-valle-blue-50',
      label: 'Meta Atingida',
      value: '142%',
      description: 'acima do objetivo mensal'
    },
    {
      icon: Zap,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      label: 'Velocidade',
      value: '3.2x',
      description: 'mais rápido que concorrentes'
    }
  ];

  return (
    <Card className="border-2 border-valle-blue-300 bg-gradient-to-br from-white via-valle-blue-50 to-valle-blue-100 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-valle-blue-200/30 to-transparent rounded-full blur-3xl" />

      <CardContent className="p-6 relative z-10">
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-valle-blue-500 to-valle-blue-700 flex items-center justify-center shadow-lg">
              <Sparkles className="w-8 h-8 text-white animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-gradient-to-r from-valle-blue-600 to-valle-blue-700 text-white border-0">
                Análise IA
              </Badge>
              <span className="text-xs text-valle-silver-600">Atualizado há 2 minutos</span>
            </div>

            <h3 className="text-lg font-bold text-valle-navy-900 mb-1">
              Olá, {clientName}! Sua marca está em alta 🚀
            </h3>

            <p className="text-sm text-valle-navy-700 leading-relaxed mb-4">
              Detectamos um crescimento excepcional em todos os indicadores este mês.
              Suas campanhas de mídia social estão performando <span className="font-bold text-valle-blue-600">287% acima</span> da média
              do mercado. Continue assim!
            </p>

            <div className="grid grid-cols-3 gap-3">
              {insights.map((insight, index) => {
                const Icon = insight.icon;
                return (
                  <div
                    key={index}
                    className={`${insight.bg} rounded-lg p-3 border border-valle-silver-200 hover:scale-105 transition-transform`}
                  >
                    <Icon className={`w-5 h-5 ${insight.color} mb-1`} />
                    <p className="text-xs text-valle-silver-600">{insight.label}</p>
                    <p className={`text-xl font-bold ${insight.color}`}>{insight.value}</p>
                    <p className="text-[10px] text-valle-silver-600 leading-tight mt-1">
                      {insight.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
