'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, TrendingDown, AlertTriangle, Award, Target, Star } from 'lucide-react';

export default function RankingPage() {
  const ranking = [
    { name: 'Ana Lima', role: 'Gestor de Tráfego', score: 98, trend: 'up', deliveries: 45, delays: 0, nps: 9.8, streak: 3 },
    { name: 'Carlos Souza', role: 'Designer', score: 95, trend: 'up', deliveries: 52, delays: 1, nps: 9.5, streak: 3 },
    { name: 'Julia Alves', role: 'Social Media', score: 92, trend: 'up', deliveries: 48, delays: 2, nps: 9.2, streak: 2 },
    { name: 'Pedro Costa', role: 'Videomaker', score: 88, trend: 'same', deliveries: 35, delays: 3, nps: 8.8, streak: 1 },
    { name: 'Maria Santos', role: 'Web Designer', score: 85, trend: 'down', deliveries: 28, delays: 5, nps: 8.5, streak: 0, alerts: 1 },
    { name: 'Roberto Lima', role: 'Comercial', score: 82, trend: 'down', deliveries: 22, delays: 8, nps: 7.8, streak: 0, alerts: 2 },
  ];

  const benefits = [
    { title: 'Bônus do Mês', description: 'Meta batida = R$ 500 extras', icon: Trophy, color: 'text-yellow-600' },
    { title: 'Aumento Salarial', description: '3 meses consecutivos no top 3', icon: TrendingUp, color: 'text-green-600' },
    { title: 'Premiação Mensal', description: 'Evento com toda equipe', icon: Award, color: 'text-purple-600' },
  ];

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <span className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ranking e Gamificação</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Performance da equipe e sistema de benefícios</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {benefits.map((benefit, i) => {
          const Icon = benefit.icon;
          return (
            <Card key={i} className="border-2 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <Icon className={`w-6 h-6 ${benefit.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{benefit.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{benefit.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ranking do Mês - Novembro 2025</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Top performers e colaboradores que precisam de atenção
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ranking.map((person, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 transition-all ${
                  index < 3
                    ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20'
                    : person.alerts
                    ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-200 bg-gray-50 dark:bg-gray-800'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                        index === 0
                          ? 'bg-yellow-400 text-white'
                          : index === 1
                          ? 'bg-gray-300 text-gray-700'
                          : index === 2
                          ? 'bg-amber-400 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{person.name}</h3>
                        {getTrendIcon(person.trend)}
                        {person.streak >= 3 && (
                          <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0">
                            🔥 {person.streak} meses
                          </Badge>
                        )}
                        {person.alerts && person.alerts > 0 && (
                          <Badge className="bg-red-600 text-white">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {person.alerts} alerta{person.alerts > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{person.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{person.score}</div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">pontos</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{person.deliveries}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Entregas</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-lg font-semibold ${person.delays > 5 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                      {person.delays}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Atrasos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{person.nps}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">NPS Médio</p>
                  </div>
                </div>

                {person.alerts && person.alerts >= 2 && (
                  <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/30 rounded border border-red-300 dark:border-red-700">
                    <p className="text-xs text-red-800 dark:text-red-200 font-medium">
                      ⚠️ Atenção: {person.alerts === 2 ? 'Segundo alerta' : 'Risco de desligamento'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sistema de Alertas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-300">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-200">Alerta 1</h4>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    1 mês com baixa avaliação ou NPS abaixo de 7.0
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-amber-300">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-900 dark:text-amber-200">Alerta 2</h4>
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    2 meses consecutivos com problemas ou muitos atrasos
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-300">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 dark:text-red-200">Alerta 3 - Crítico</h4>
                  <p className="text-sm text-red-800 dark:text-red-300">
                    3 alertas = processo de desligamento com aviso progressivo
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pendências da Equipe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Maria Santos - 5 atrasos</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Banner Cliente A (venceu há 2 dias)</li>
                <li>• Post Instagram Cliente B (venceu ontem)</li>
                <li>• Arte LinkedIn Cliente C (vence hoje)</li>
              </ul>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Roberto Lima - 8 atrasos</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Proposta Cliente X (venceu há 5 dias)</li>
                <li>• Follow-up leads (venceu há 3 dias)</li>
                <li>• Relatório semanal (venceu há 1 dia)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
