'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Calendar, Users, Eye, Heart, MessageCircle,
  ChevronLeft, ChevronRight, Play, Loader2, ArrowUp, ArrowDown,
  Sparkles, Target, Award, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'milestone' | 'campaign' | 'metric' | 'achievement';
  metrics?: {
    label: string;
    before: number;
    after: number;
    unit?: string;
  }[];
  image?: string;
}

interface BeforeAfterTimelineProps {
  clientId?: string;
}

export function BeforeAfterTimeline({ clientId }: BeforeAfterTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'comparison'>('timeline');

  useEffect(() => {
    loadTimeline();
  }, [clientId]);

  const loadTimeline = async () => {
    try {
      const response = await fetch('/api/client/timeline');
      const data = await response.json();
      
      if (data.success) {
        setEvents(data.events);
      } else {
        // Mock data para demonstração
        setEvents(getMockEvents());
      }
    } catch (error) {
      console.error('Erro ao carregar timeline:', error);
      setEvents(getMockEvents());
    } finally {
      setIsLoading(false);
    }
  };

  const getMockEvents = (): TimelineEvent[] => [
    {
      id: '1',
      date: '2026-01-01',
      title: 'Início da Parceria',
      description: 'Começamos nossa jornada juntos! Análise inicial e definição de estratégia.',
      type: 'milestone',
      metrics: [
        { label: 'Seguidores', before: 1250, after: 1250, unit: '' },
        { label: 'Engajamento', before: 1.2, after: 1.2, unit: '%' },
        { label: 'Alcance', before: 3500, after: 3500, unit: '' }
      ],
      image: '/timeline/start.jpg'
    },
    {
      id: '2',
      date: '2026-02-15',
      title: 'Primeira Campanha',
      description: 'Lançamento da primeira campanha estratégica de conteúdo.',
      type: 'campaign',
      metrics: [
        { label: 'Seguidores', before: 1250, after: 1890, unit: '' },
        { label: 'Engajamento', before: 1.2, after: 3.5, unit: '%' },
        { label: 'Alcance', before: 3500, after: 12000, unit: '' }
      ]
    },
    {
      id: '3',
      date: '2026-03-20',
      title: '5K Seguidores! 🎉',
      description: 'Alcançamos a marca de 5.000 seguidores orgânicos.',
      type: 'achievement',
      metrics: [
        { label: 'Seguidores', before: 1890, after: 5200, unit: '' },
        { label: 'Engajamento', before: 3.5, after: 4.8, unit: '%' },
        { label: 'Alcance', before: 12000, after: 45000, unit: '' }
      ]
    },
    {
      id: '4',
      date: '2026-06-01',
      title: '6 Meses de Crescimento',
      description: 'Resultados consolidados após 6 meses de trabalho estratégico.',
      type: 'metric',
      metrics: [
        { label: 'Seguidores', before: 1250, after: 8750, unit: '' },
        { label: 'Engajamento', before: 1.2, after: 5.2, unit: '%' },
        { label: 'Alcance', before: 3500, after: 85000, unit: '' },
        { label: 'Leads', before: 12, after: 187, unit: '' }
      ]
    }
  ];

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'milestone': return <Target className="w-5 h-5" />;
      case 'campaign': return <Sparkles className="w-5 h-5" />;
      case 'achievement': return <Award className="w-5 h-5" />;
      case 'metric': return <BarChart3 className="w-5 h-5" />;
      default: return <Calendar className="w-5 h-5" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'milestone': return 'bg-blue-500';
      case 'campaign': return 'bg-purple-500';
      case 'achievement': return 'bg-amber-500';
      case 'metric': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const calculateGrowth = (before: number, after: number) => {
    if (before === 0) return 100;
    return ((after - before) / before) * 100;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Calcular totais para o header
  const firstEvent = events[0];
  const lastEvent = events[events.length - 1];
  const overallGrowth = lastEvent?.metrics?.map((metric, i) => ({
    label: metric.label,
    before: firstEvent?.metrics?.[i]?.before || 0,
    after: metric.after,
    growth: calculateGrowth(firstEvent?.metrics?.[i]?.before || 0, metric.after)
  })) || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com resumo geral */}
      <Card className="bg-gradient-to-br from-primary/10 to-blue-500/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Sua Evolução
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Veja o quanto crescemos juntos
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'timeline' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('timeline')}
                className={viewMode === 'timeline' ? 'bg-primary' : ''}
              >
                Timeline
              </Button>
              <Button
                variant={viewMode === 'comparison' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('comparison')}
                className={viewMode === 'comparison' ? 'bg-primary' : ''}
              >
                Comparação
              </Button>
            </div>
          </div>

          {/* Overall Growth Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {overallGrowth.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
              >
                <p className="text-sm text-gray-500 mb-1">{item.label}</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {formatNumber(item.after)}
                  </span>
                  {item.growth > 0 && (
                    <span className="text-sm text-green-600 flex items-center mb-1">
                      <ArrowUp className="w-3 h-3" />
                      {item.growth.toFixed(0)}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  Era {formatNumber(item.before)}
                </p>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <div className="relative">
          {/* Linha central */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

          {/* Events */}
          <div className="space-y-8">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative pl-20"
              >
                {/* Icon */}
                <div 
                  className={`absolute left-4 w-8 h-8 rounded-full ${getEventColor(event.type)} flex items-center justify-center text-white shadow-lg`}
                >
                  {getEventIcon(event.type)}
                </div>

                {/* Content */}
                <Card 
                  className={`cursor-pointer transition-all hover:shadow-lg ${selectedEvent === event.id ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}
                >
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          {new Date(event.date).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                        <h3 className="font-bold text-lg">{event.title}</h3>
                      </div>
                      <Badge className={getEventColor(event.type).replace('bg-', 'bg-').replace('-500', '-100') + ' ' + getEventColor(event.type).replace('bg-', 'text-').replace('-500', '-800')}>
                        {event.type === 'milestone' ? 'Marco' : 
                         event.type === 'campaign' ? 'Campanha' :
                         event.type === 'achievement' ? 'Conquista' : 'Métricas'}
                      </Badge>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {event.description}
                    </p>

                    {/* Metrics (expandable) */}
                    <AnimatePresence>
                      {selectedEvent === event.id && event.metrics && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t pt-4 mt-4"
                        >
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {event.metrics.map((metric, i) => (
                              <div key={i} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">{metric.label}</p>
                                <div className="flex items-center justify-center gap-2 text-sm">
                                  <span className="text-gray-400">
                                    {formatNumber(metric.before)}{metric.unit}
                                  </span>
                                  <ArrowRight className="w-3 h-3 text-gray-400" />
                                  <span className="font-bold text-green-600">
                                    {formatNumber(metric.after)}{metric.unit}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison View */}
      {viewMode === 'comparison' && events.length >= 2 && (
        <BeforeAfterComparison
          before={events[0]}
          after={events[events.length - 1]}
        />
      )}
    </div>
  );
}

// Arrow Right Icon (inline)
function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}

// Before/After Comparison Component
function BeforeAfterComparison({ before, after }: { before: TimelineEvent; after: TimelineEvent }) {
  const [sliderPosition, setSliderPosition] = useState(50);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparação Antes vs Depois</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Before */}
          <div className="relative">
            <div className="absolute -top-3 left-4">
              <Badge className="bg-gray-500">ANTES</Badge>
            </div>
            <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-xl border-2 border-gray-300 dark:border-gray-600">
              <p className="text-sm text-gray-500 mb-4">
                {new Date(before.date).toLocaleDateString('pt-BR')}
              </p>
              <div className="space-y-4">
                {before.metrics?.map((metric, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{metric.label}</span>
                    <span className="font-bold text-xl">
                      {metric.before.toLocaleString()}{metric.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* After */}
          <div className="relative">
            <div className="absolute -top-3 left-4">
              <Badge className="bg-green-500">DEPOIS</Badge>
            </div>
            <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-300 dark:border-green-600">
              <p className="text-sm text-gray-500 mb-4">
                {new Date(after.date).toLocaleDateString('pt-BR')}
              </p>
              <div className="space-y-4">
                {after.metrics?.map((metric, i) => {
                  const beforeValue = before.metrics?.[i]?.before || 0;
                  const growth = ((metric.after - beforeValue) / beforeValue) * 100;
                  
                  return (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{metric.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xl text-green-600">
                          {metric.after.toLocaleString()}{metric.unit}
                        </span>
                        {growth > 0 && (
                          <span className="text-sm text-green-500 flex items-center">
                            <ArrowUp className="w-3 h-3" />
                            {growth.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Summary message */}
        <div className="mt-8 p-6 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-xl text-center">
          <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
          <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
            Resultados impressionantes em{' '}
            {Math.ceil((new Date(after.date).getTime() - new Date(before.date).getTime()) / (1000 * 60 * 60 * 24 * 30))}{' '}
            meses de parceria!
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Continue assim e veja seu negócio crescer ainda mais 🚀
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
