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
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';

type PeriodType = 'mensal' | 'semestral' | 'anual' | 'personalizado';

interface MetricDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metricName: string;
  currentValue: string | number;
  previousValue: number;
  contractStartDate: Date;
  icon: React.ElementType;
}

export function MetricDetailModal({
  open,
  onOpenChange,
  metricName,
  currentValue,
  previousValue,
  contractStartDate,
  icon: Icon,
}: MetricDetailModalProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('mensal');

  const monthsSinceStart = Math.floor(
    (new Date().getTime() - contractStartDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  const availablePeriods: { value: PeriodType; label: string; enabled: boolean }[] = [
    { value: 'mensal', label: 'Mensal', enabled: true },
    { value: 'semestral', label: 'Semestral', enabled: monthsSinceStart >= 6 },
    { value: 'anual', label: 'Anual', enabled: monthsSinceStart >= 12 },
    { value: 'personalizado', label: 'Personalizado', enabled: true },
  ];

  const monthlyData = [
    { month: 'Jan', value: 85000 },
    { month: 'Fev', value: 92000 },
    { month: 'Mar', value: 98000 },
    { month: 'Abr', value: 105000 },
    { month: 'Mai', value: 112000 },
    { month: 'Jun', value: 123500 },
  ];

  const comparisonData = [
    { period: 'Mês 1', value: 85000 },
    { period: 'Mês 2', value: 92000 },
    { period: 'Mês 3', value: 98000 },
    { period: 'Mês Atual', value: 123500 },
  ];

  const percentageChange = ((Number(currentValue.toString().replace(/[^0-9.]/g, '')) - previousValue) / previousValue) * 100;
  const isPositive = percentageChange >= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-valle-platinum dark:bg-valle-charcoal/30 rounded-lg">
              <Icon className="w-6 h-6 text-valle-steel" />
            </div>
            <div>
              <DialogTitle>{metricName}</DialogTitle>
              <DialogDescription>Análise detalhada de performance</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Valor Atual</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{currentValue}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Mês Anterior</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {previousValue.toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Variação</p>
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-2xl font-bold ${
                        isPositive ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {percentageChange.toFixed(1)}%
                    </p>
                    {isPositive ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Período de Análise
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>Início do contrato: {contractStartDate.toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              <div className="flex gap-2 mb-6">
                {availablePeriods.map((period) => (
                  <Button
                    key={period.value}
                    variant={selectedPeriod === period.value ? 'default' : 'outline'}
                    size="sm"
                    disabled={!period.enabled}
                    onClick={() => period.enabled && setSelectedPeriod(period.value)}
                    className={
                      selectedPeriod === period.value
                        ? 'bg-valle-charcoal hover:bg-valle-steel'
                        : ''
                    }
                  >
                    {period.label}
                  </Button>
                ))}
              </div>

              {!availablePeriods.find((p) => p.value === 'anual')?.enabled && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Nota:</strong> Visualização anual disponível após 12 meses de contrato.
                    Você está conosco há {monthsSinceStart} meses.
                  </p>
                </div>
              )}
            </div>

            <Card>
              <CardContent className="p-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  Evolução no Período
                </h4>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#6b7280"
                      strokeWidth={2}
                      dot={{ fill: '#374151' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  Comparativo por Período
                </h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#94a3b8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
              <Button className="bg-valle-charcoal hover:bg-valle-steel">
                Exportar Relatório
              </Button>
            </div>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
