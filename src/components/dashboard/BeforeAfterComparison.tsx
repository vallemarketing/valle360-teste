'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  TrendingUp,
  Users,
  Target,
  DollarSign,
  Share2,
  MessageCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface ServiceArea {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
}

const serviceAreas: ServiceArea[] = [
  {
    id: 'social_media',
    name: 'Social Media',
    icon: Share2,
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 'traffic',
    name: 'Tráfego Pago',
    icon: Target,
    color: 'from-green-500 to-green-600',
  },
  {
    id: 'commercial',
    name: 'Comercial',
    icon: DollarSign,
    color: 'from-purple-500 to-purple-600',
  },
];

interface BeforeAfterComparisonProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BeforeAfterComparison({ open, onOpenChange }: BeforeAfterComparisonProps) {
  const [selectedArea, setSelectedArea] = useState<string>('social_media');

  const socialMediaData = {
    before: {
      period: '3 meses antes da Valle 360',
      metrics: {
        followers: 8500,
        engagement: 2.1,
        reach: 45000,
        posts: 45,
        comments: 320,
        shares: 85,
      },
    },
    after: {
      period: 'Últimos 3 meses com Valle 360',
      metrics: {
        followers: 15200,
        engagement: 5.8,
        reach: 123500,
        posts: 90,
        comments: 1240,
        shares: 450,
      },
    },
  };

  const trafficData = {
    before: {
      period: '3 meses antes da Valle 360',
      metrics: {
        investment: 5000,
        leads: 120,
        cpl: 41.67,
        roas: 1.8,
        conversions: 18,
        ctr: 1.2,
      },
    },
    after: {
      period: 'Últimos 3 meses com Valle 360',
      metrics: {
        investment: 8000,
        leads: 380,
        cpl: 21.05,
        roas: 5.2,
        conversions: 85,
        ctr: 3.8,
      },
    },
  };

  const commercialData = {
    before: {
      period: '3 meses antes da Valle 360',
      metrics: {
        revenue: 85000,
        newClients: 12,
        ticketMedio: 7083,
        conversion: 15,
        retention: 65,
        nps: 42,
      },
    },
    after: {
      period: 'Últimos 3 meses com Valle 360',
      metrics: {
        revenue: 156000,
        newClients: 28,
        ticketMedio: 5571,
        conversion: 35,
        retention: 82,
        nps: 78,
      },
    },
  };

  const getDataByArea = (area: string) => {
    switch (area) {
      case 'social_media':
        return socialMediaData;
      case 'traffic':
        return trafficData;
      case 'commercial':
        return commercialData;
      default:
        return socialMediaData;
    }
  };

  const currentData = getDataByArea(selectedArea);

  const comparisonChartData = Object.keys(currentData.before.metrics).map((key) => ({
    metric: key.charAt(0).toUpperCase() + key.slice(1),
    antes: currentData.before.metrics[key as keyof typeof currentData.before.metrics],
    depois: currentData.after.metrics[key as keyof typeof currentData.after.metrics],
  }));

  const radarData = comparisonChartData.map((item) => ({
    metric: item.metric,
    antes: (item.antes / Math.max(item.antes, item.depois)) * 100,
    depois: (item.depois / Math.max(item.antes, item.depois)) * 100,
  }));

  const calculateImprovement = (before: number, after: number) => {
    const improvement = ((after - before) / before) * 100;
    return improvement.toFixed(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-valle-steel to-valle-charcoal rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle>Comparativo: Antes vs Depois</DialogTitle>
              <DialogDescription>
                Veja o impacto real da Valle 360 no seu negócio
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              {serviceAreas.map((area) => {
                const Icon = area.icon;
                const isSelected = selectedArea === area.id;

                return (
                  <button
                    key={area.id}
                    onClick={() => setSelectedArea(area.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-valle-charcoal bg-valle-platinum dark:bg-valle-charcoal/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-valle-steel'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-br ${area.color} flex items-center justify-center mb-2 mx-auto`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white text-center">
                      {area.name}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="border-2 border-red-200 dark:border-red-900/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="secondary" className="bg-red-100 text-red-700">
                      Antes
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    {currentData.before.period}
                  </p>
                  <div className="space-y-2">
                    {Object.entries(currentData.before.metrics).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400 capitalize">{key}:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {typeof value === 'number' && value > 1000
                            ? value.toLocaleString()
                            : value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200 dark:border-green-900/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      Depois
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    {currentData.after.period}
                  </p>
                  <div className="space-y-2">
                    {Object.entries(currentData.after.metrics).map(([key, value]) => {
                      const beforeValue =
                        currentData.before.metrics[key as keyof typeof currentData.before.metrics];
                      const improvement = calculateImprovement(beforeValue, value);

                      return (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400 capitalize">
                            {key}:
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {typeof value === 'number' && value > 1000
                                ? value.toLocaleString()
                                : value}
                            </span>
                            <span className="text-xs text-green-600 font-medium">
                              +{improvement}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  Comparativo Visual
                </h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="antes" fill="#ef4444" name="Antes" />
                    <Bar dataKey="depois" fill="#10b981" name="Depois" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  Análise Comparativa 360°
                </h4>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Antes"
                      dataKey="antes"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.3}
                    />
                    <Radar
                      name="Depois"
                      dataKey="depois"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.3}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Resultado Geral da Parceria
                </h4>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Com a Valle 360, você alcançou melhorias significativas em todas as métricas chave.
                Este é apenas o começo - continuamos trabalhando para levar seu negócio ainda mais
                longe!
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
              <Button className="bg-valle-charcoal hover:bg-valle-steel">
                <ArrowRight className="w-4 h-4 mr-2" />
                Explorar Mais Serviços
              </Button>
            </div>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
