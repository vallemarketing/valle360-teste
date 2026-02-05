'use client';

import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { TrendingUp, Eye, Clock, DollarSign, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ValueCounterProps {
  impressions?: number;
  timeSavedHours?: number;
  estimatedValue?: number;
  leadsGenerated?: number;
}

function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    if (latest >= 1000000) return `${(latest / 1000000).toFixed(1)}M`;
    if (latest >= 1000) return `${(latest / 1000).toFixed(1)}K`;
    return Math.round(latest).toLocaleString('pt-BR');
  });

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 2,
      ease: 'easeOut'
    });
    return controls.stop;
  }, [value]);

  return (
    <motion.span>
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </motion.span>
  );
}

export function ValueCounter({ 
  impressions = 0, 
  timeSavedHours = 0, 
  estimatedValue = 0,
  leadsGenerated = 0
}: ValueCounterProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const metrics = [
    {
      id: 'impressions',
      label: 'Impressões Geradas',
      value: impressions,
      icon: Eye,
      color: 'from-blue-500 to-cyan-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600',
      suffix: ''
    },
    {
      id: 'time',
      label: 'Horas Economizadas',
      value: timeSavedHours,
      icon: Clock,
      color: 'from-purple-500 to-pink-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600',
      suffix: 'h'
    },
    {
      id: 'value',
      label: 'Valor Estimado',
      value: estimatedValue,
      icon: DollarSign,
      color: 'from-emerald-500 to-green-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      textColor: 'text-emerald-600',
      prefix: 'R$ '
    },
    {
      id: 'leads',
      label: 'Leads Gerados',
      value: leadsGenerated,
      icon: TrendingUp,
      color: 'from-amber-500 to-orange-400',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      textColor: 'text-amber-600',
      suffix: ''
    }
  ];

  // Filtrar métricas com valor > 0
  const activeMetrics = metrics.filter(m => m.value > 0);

  if (activeMetrics.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-[#001533] to-[#1672d6] text-white">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Valor Gerado</h3>
            <p className="text-white/70 text-sm">Resultados do trabalho com a Valle</p>
          </div>
        </div>

        <div className={`grid gap-4 ${activeMetrics.length === 1 ? 'grid-cols-1' : activeMetrics.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
          {activeMetrics.map((metric, index) => (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <div className={`${metric.bgColor} rounded-xl p-4 backdrop-blur-sm`}>
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${metric.color} flex items-center justify-center`}>
                    <metric.icon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className={`text-2xl font-bold ${metric.textColor}`}>
                  {isVisible && (
                    <AnimatedNumber 
                      value={metric.value} 
                      prefix={metric.prefix || ''} 
                      suffix={metric.suffix || ''} 
                    />
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{metric.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Barra de progresso visual */}
        <div className="mt-6 pt-4 border-t border-white/20">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-white/70">Impacto Total</span>
            <span className="font-bold">
              {estimatedValue > 0 ? `R$ ${estimatedValue.toLocaleString('pt-BR')}` : 'Calculando...'}
            </span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"
            />
          </div>
          <p className="text-xs text-white/50 mt-2 text-center">
            * Valores estimados baseados em métricas de mercado
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
