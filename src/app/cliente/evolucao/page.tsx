'use client';

import { BeforeAfterTimeline } from '@/components/cliente/BeforeAfterTimeline';
import { ValueCounter } from '@/components/cliente/ValueCounter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Award, Target, Sparkles } from 'lucide-react';

export default function ClienteEvolucaoPage() {
  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
        <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Evolução da Sua Marca
          </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Acompanhe o crescimento e resultados da sua presença digital
        </p>
      </div>

      {/* Value Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <TrendingUp className="w-6 h-6 text-blue-600" />
        </div>
              <div>
                <p className="text-sm text-gray-500">Crescimento Total</p>
                <p className="text-2xl font-bold text-blue-600">+347%</p>
                </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                <Target className="w-6 h-6 text-green-600" />
        </div>
              <div>
                <p className="text-sm text-gray-500">Metas Atingidas</p>
                <p className="text-2xl font-bold text-green-600">12/15</p>
          </div>
        </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <Award className="w-6 h-6 text-purple-600" />
        </div>
              <div>
                <p className="text-sm text-gray-500">Conquistas</p>
                <p className="text-2xl font-bold text-purple-600">8</p>
          </div>
        </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <Sparkles className="w-6 h-6 text-amber-600" />
      </div>
      <div>
                <p className="text-sm text-gray-500">Meses de Parceria</p>
                <p className="text-2xl font-bold text-amber-600">12</p>
              </div>
        </div>
          </CardContent>
        </Card>
      </div>

      {/* Value Counter */}
      <ValueCounter />

      {/* Timeline */}
      <BeforeAfterTimeline />
    </div>
  );
}
