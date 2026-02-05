'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  ArrowRight,
  DollarSign,
  MousePointerClick,
  Eye,
  Target,
  Zap,
} from 'lucide-react';

interface TrafficMetrics {
  roas: number;
  cpc: number;
  cpm: number;
  ctr: number;
  investment: number;
  conversions: number;
  leads: number;
}

interface TrafficComparisonSectionProps {
  clientName: string;
}

export function TrafficComparisonSection({ clientName }: TrafficComparisonSectionProps) {
  // TODO: Buscar dados reais do Supabase
  const beforeMetrics: TrafficMetrics = {
    roas: 1.8,
    cpc: 4.50,
    cpm: 35.00,
    ctr: 1.2,
    investment: 15000,
    conversions: 45,
    leads: 120,
  };

  const afterMetrics: TrafficMetrics = {
    roas: 5.2,
    cpc: 2.10,
    cpm: 18.50,
    ctr: 3.8,
    investment: 15000,
    conversions: 187,
    leads: 425,
  };

  const calculateImprovement = (before: number, after: number, inverse: boolean = false) => {
    if (inverse) {
      // Para métricas onde menor é melhor (CPC, CPM)
      return (((before - after) / before) * 100).toFixed(0);
    }
    // Para métricas onde maior é melhor (ROAS, CTR, conversões)
    return (((after - before) / before) * 100).toFixed(0);
  };

  const totalROI = (((afterMetrics.conversions * 1000) - beforeMetrics.investment) / beforeMetrics.investment * 100).toFixed(0);

  return (
    <Card className="border-2 border-valle-blue-200 bg-gradient-to-br from-white to-valle-blue-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-valle-navy-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-valle-blue-600" />
            Comparativo de Tráfego Pago
          </CardTitle>
          <Badge className="bg-gradient-to-r from-green-600 to-green-700 text-white">
            ROI +{totalROI}%
          </Badge>
        </div>
        <p className="text-sm text-valle-silver-600 mt-2">
          Resultados antes e depois da gestão profissional Valle 360
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* BEFORE Column */}
          <div className="space-y-4">
            <div className="text-center mb-4">
              <Badge variant="outline" className="text-base px-4 py-2 border-2 border-valle-silver-400">
                Antes da Valle 360
              </Badge>
            </div>

            <Card className="border-2 border-valle-silver-300 bg-gradient-to-br from-valle-silver-100 to-valle-silver-50">
              <CardContent className="p-6 space-y-4">
                {/* ROAS */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-valle-silver-200">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-valle-silver-500" />
                    <span className="text-sm text-valle-silver-700">ROAS</span>
                  </div>
                  <span className="text-2xl font-bold text-valle-silver-700">
                    {beforeMetrics.roas.toFixed(1)}x
                  </span>
                </div>

                {/* CPC */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-valle-silver-200">
                  <div className="flex items-center gap-2">
                    <MousePointerClick className="w-5 h-5 text-valle-silver-500" />
                    <span className="text-sm text-valle-silver-700">CPC</span>
                  </div>
                  <span className="text-2xl font-bold text-valle-silver-700">
                    R$ {beforeMetrics.cpc.toFixed(2)}
                  </span>
                </div>

                {/* CPM */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-valle-silver-200">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-valle-silver-500" />
                    <span className="text-sm text-valle-silver-700">CPM</span>
                  </div>
                  <span className="text-2xl font-bold text-valle-silver-700">
                    R$ {beforeMetrics.cpm.toFixed(2)}
                  </span>
                </div>

                {/* CTR */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-valle-silver-200">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-valle-silver-500" />
                    <span className="text-sm text-valle-silver-700">CTR</span>
                  </div>
                  <span className="text-2xl font-bold text-valle-silver-700">
                    {beforeMetrics.ctr.toFixed(1)}%
                  </span>
                </div>

                {/* Conversions */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-valle-silver-200">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-valle-silver-500" />
                    <span className="text-sm text-valle-silver-700">Conversões</span>
                  </div>
                  <span className="text-2xl font-bold text-valle-silver-700">
                    {beforeMetrics.conversions}
                  </span>
                </div>

                {/* Investment */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-valle-silver-200">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-valle-silver-500" />
                    <span className="text-sm text-valle-silver-700">Investimento</span>
                  </div>
                  <span className="text-xl font-bold text-valle-silver-700">
                    R$ {beforeMetrics.investment.toLocaleString('pt-BR')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AFTER Column */}
          <div className="space-y-4">
            <div className="text-center mb-4">
              <Badge className="text-base px-4 py-2 bg-gradient-to-r from-valle-blue-600 to-valle-blue-700 text-white">
                Depois da Valle 360
              </Badge>
            </div>

            <Card className="border-2 border-valle-blue-300 bg-gradient-to-br from-valle-blue-50 to-white shadow-xl">
              <CardContent className="p-6 space-y-4">
                {/* ROAS */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-valle-blue-200 relative">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-valle-blue-600" />
                    <span className="text-sm text-valle-blue-700 font-medium">ROAS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-valle-blue-700">
                      {afterMetrics.roas.toFixed(1)}x
                    </span>
                    <Badge className="bg-green-600 text-white text-xs">
                      +{calculateImprovement(beforeMetrics.roas, afterMetrics.roas)}%
                    </Badge>
                  </div>
                </div>

                {/* CPC */}
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
                      -{calculateImprovement(beforeMetrics.cpc, afterMetrics.cpc, true)}%
                    </Badge>
                  </div>
                </div>

                {/* CPM */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-valle-blue-200">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-valle-blue-600" />
                    <span className="text-sm text-valle-blue-700 font-medium">CPM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-valle-blue-700">
                      R$ {afterMetrics.cpm.toFixed(2)}
                    </span>
                    <Badge className="bg-green-600 text-white text-xs">
                      -{calculateImprovement(beforeMetrics.cpm, afterMetrics.cpm, true)}%
                    </Badge>
                  </div>
                </div>

                {/* CTR */}
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
                      +{calculateImprovement(beforeMetrics.ctr, afterMetrics.ctr)}%
                    </Badge>
                  </div>
                </div>

                {/* Conversions */}
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
                      +{calculateImprovement(beforeMetrics.conversions, afterMetrics.conversions)}%
                    </Badge>
                  </div>
                </div>

                {/* Investment */}
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-valle-silver-600 mb-1">ROI Total</p>
              <p className="text-4xl font-bold text-green-700">+{totalROI}%</p>
              <p className="text-xs text-valle-silver-600 mt-2">Retorno sobre investimento</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-valle-blue-200 bg-gradient-to-br from-valle-blue-50 to-white">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-valle-silver-600 mb-1">Investimento Mensal</p>
              <p className="text-3xl font-bold text-valle-blue-700">
                R$ {(afterMetrics.investment / 1000).toFixed(0)}K
              </p>
              <p className="text-xs text-valle-silver-600 mt-2">Mesmo investimento, resultados melhores</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-valle-silver-600 mb-1">Economia Gerada</p>
              <p className="text-3xl font-bold text-green-700">
                R$ {((beforeMetrics.cpc - afterMetrics.cpc) * afterMetrics.conversions).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-valle-silver-600 mt-2">Redução de custos</p>
            </CardContent>
          </Card>
        </div>

        {/* Period Info */}
        <div className="text-center text-sm text-valle-silver-600 mt-4">
          <p>Comparativo baseado nos últimos 90 dias de campanha</p>
        </div>
      </CardContent>
    </Card>
  );
}
