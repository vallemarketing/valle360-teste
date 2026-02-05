'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, Users, Eye, Heart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function CompetitorAnalysis() {
  const competitorData = [
    {
      name: 'Sua Marca',
      seguidores: 45200,
      engajamento: 8.7,
      alcance: 128000,
      crescimento: '+287%',
      color: '#2563eb',
    },
    {
      name: 'Concorrente A',
      seguidores: 38500,
      engajamento: 6.2,
      alcance: 95000,
      crescimento: '+142%',
      color: '#9ca3af',
    },
    {
      name: 'Concorrente B',
      seguidores: 41200,
      engajamento: 5.8,
      alcance: 103000,
      crescimento: '+165%',
      color: '#d1d5db',
    },
    {
      name: 'Concorrente C',
      seguidores: 35800,
      engajamento: 5.4,
      alcance: 88000,
      crescimento: '+128%',
      color: '#e5e7eb',
    },
  ];

  const chartData = [
    {
      metric: 'Seguidores',
      'Sua Marca': 45.2,
      'Concorrente A': 38.5,
      'Concorrente B': 41.2,
      'Concorrente C': 35.8,
    },
    {
      metric: 'Engajamento',
      'Sua Marca': 8.7,
      'Concorrente A': 6.2,
      'Concorrente B': 5.8,
      'Concorrente C': 5.4,
    },
  ];

  return (
    <Card className="border-2 border-valle-silver-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-valle-navy-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-valle-blue-600" />
            Análise Competitiva
          </CardTitle>
          <Badge className="bg-green-600 text-white">
            Você está na liderança
          </Badge>
        </div>
        <p className="text-sm text-valle-silver-600">
          Comparativo de performance com principais concorrentes do setor
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {competitorData.map((competitor, index) => {
            const isYou = index === 0;
            return (
              <div
                key={competitor.name}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isYou
                    ? 'bg-gradient-to-br from-valle-blue-50 to-valle-blue-100 border-valle-blue-300 shadow-lg'
                    : 'bg-valle-silver-50 border-valle-silver-200 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  {isYou && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                      <span className="text-white text-lg">👑</span>
                    </div>
                  )}
                  <h4
                    className={`font-bold ${
                      isYou ? 'text-valle-blue-800' : 'text-valle-silver-700'
                    }`}
                  >
                    {competitor.name}
                  </h4>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-valle-silver-600 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Seguidores
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        isYou ? 'text-valle-blue-700' : 'text-valle-silver-700'
                      }`}
                    >
                      {(competitor.seguidores / 1000).toFixed(1)}K
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-valle-silver-600 flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      Engajamento
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        isYou ? 'text-valle-blue-700' : 'text-valle-silver-700'
                      }`}
                    >
                      {competitor.engajamento}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-valle-silver-600 flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      Alcance
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        isYou ? 'text-valle-blue-700' : 'text-valle-silver-700'
                      }`}
                    >
                      {(competitor.alcance / 1000).toFixed(0)}K
                    </span>
                  </div>

                  <div className="pt-2 border-t border-valle-silver-200">
                    <Badge
                      className={`w-full justify-center ${
                        isYou ? 'bg-green-600 text-white' : 'bg-valle-silver-300 text-valle-silver-700'
                      }`}
                    >
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {competitor.crescimento}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Card className="border-2 border-valle-blue-200 bg-valle-blue-50/30">
          <CardContent className="p-4">
            <h4 className="font-semibold text-valle-navy-800 mb-4">
              Comparativo de Performance
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
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
                <Bar dataKey="Sua Marca" fill="#2563eb" />
                <Bar dataKey="Concorrente A" fill="#9ca3af" />
                <Bar dataKey="Concorrente B" fill="#d1d5db" />
                <Bar dataKey="Concorrente C" fill="#e5e7eb" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="p-4 bg-gradient-to-r from-green-50 to-valle-blue-50 border-2 border-green-200 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-valle-navy-800 mb-1">Vantagem Competitiva</h4>
              <p className="text-sm text-valle-navy-700">
                Sua marca está superando todos os concorrentes em engajamento (+40% acima da média)
                e crescimento (+102% mais rápido). Continue investindo em conteúdo de qualidade e
                relacionamento com a audiência para manter a liderança.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
