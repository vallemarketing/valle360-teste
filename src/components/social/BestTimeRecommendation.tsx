'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  TrendingUp,
  Calendar,
  Zap,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  ChevronRight,
  Sparkles,
  Info,
  CheckCircle
} from 'lucide-react';
import {
  analyzeBestTimes,
  getNextBestTime,
  BestTimeRecommendation as BestTimeData,
  PostPerformance
} from '@/lib/ai/bestTimeAnalyzer';

interface BestTimeRecommendationProps {
  clientId: string;
  posts?: PostPerformance[];
  onSchedulePost?: (datetime: Date) => void;
}

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'from-pink-500 to-purple-600' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'from-blue-600 to-blue-700' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'from-blue-700 to-blue-800' },
  { id: 'twitter', name: 'Twitter/X', icon: Twitter, color: 'from-gray-700 to-gray-900' },
];

// Mock data para demonstração
const mockPosts: PostPerformance[] = Array.from({ length: 100 }, (_, i) => ({
  id: `post-${i}`,
  platform: ['instagram', 'facebook', 'linkedin'][i % 3],
  postedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
  likes: Math.floor(Math.random() * 500) + 50,
  comments: Math.floor(Math.random() * 50) + 5,
  shares: Math.floor(Math.random() * 30),
  reach: Math.floor(Math.random() * 10000) + 1000,
  impressions: Math.floor(Math.random() * 15000) + 2000,
  engagement_rate: Math.random() * 10 + 2
}));

export default function BestTimeRecommendation({ 
  clientId, 
  posts = mockPosts,
  onSchedulePost 
}: BestTimeRecommendationProps) {
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [recommendation, setRecommendation] = useState<BestTimeData | null>(null);
  const [nextBestTime, setNextBestTime] = useState<{ datetime: Date; score: number; reason: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  useEffect(() => {
    analyzeData();
  }, [selectedPlatform, posts]);

  const analyzeData = () => {
    setLoading(true);
    
    // Simular delay de análise
    setTimeout(() => {
      const analysis = analyzeBestTimes(posts, selectedPlatform);
      setRecommendation(analysis);
      setNextBestTime(getNextBestTime(analysis));
      setLoading(false);
    }, 500);
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--success-500)';
    if (score >= 60) return 'var(--warning-500)';
    return 'var(--error-500)';
  };

  const PlatformIcon = PLATFORMS.find(p => p.id === selectedPlatform)?.icon || Instagram;

  return (
    <div 
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)' }}
    >
      {/* Header */}
      <div 
        className="p-6"
        style={{ 
          background: 'linear-gradient(135deg, var(--primary-500) 0%, var(--purple-500) 100%)'
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Melhor Horário para Postar</h2>
            <p className="text-white/80 text-sm">Análise baseada em IA dos seus dados</p>
          </div>
        </div>

        {/* Platform Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {PLATFORMS.map((platform) => {
            const Icon = platform.icon;
            const isSelected = selectedPlatform === platform.id;
            return (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                  isSelected 
                    ? 'bg-white text-gray-900 shadow-lg' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <Icon className="w-4 h-4" />
                {platform.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p style={{ color: 'var(--text-secondary)' }}>Analisando seus dados...</p>
          </div>
        ) : recommendation ? (
          <div className="space-y-6">
            {/* Next Best Time - Destaque */}
            {nextBestTime && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-xl"
                style={{ 
                  background: 'linear-gradient(135deg, var(--success-50) 0%, var(--primary-50) 100%)',
                  border: '2px solid var(--success-200)'
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5" style={{ color: 'var(--success-600)' }} />
                      <span className="font-bold" style={{ color: 'var(--success-700)' }}>
                        Próximo Melhor Horário
                      </span>
                    </div>
                    <p className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                      {formatDateTime(nextBestTime.datetime)}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {nextBestTime.reason}
                    </p>
                  </div>
                  <div className="text-right">
                    <div 
                      className="text-3xl font-bold"
                      style={{ color: getScoreColor(nextBestTime.score) }}
                    >
                      {nextBestTime.score}%
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Score de engajamento
                    </p>
                  </div>
                </div>
                {onSchedulePost && (
                  <button
                    onClick={() => onSchedulePost(nextBestTime.datetime)}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all"
                    style={{ backgroundColor: 'var(--success-500)', color: 'white' }}
                  >
                    <Calendar className="w-5 h-5" />
                    Agendar Post para Este Horário
                  </button>
                )}
              </motion.div>
            )}

            {/* Confidence Indicator */}
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <Info className="w-5 h-5" style={{ color: 'var(--primary-500)' }} />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Confiança da Análise
                  </span>
                  <span className="text-sm font-bold" style={{ color: 'var(--primary-500)' }}>
                    {recommendation.confidence}%
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${recommendation.confidence}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: 'var(--primary-500)' }}
                  />
                </div>
              </div>
            </div>

            {/* Best Times by Day */}
            <div>
              <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Calendar className="w-5 h-5" style={{ color: 'var(--primary-500)' }} />
                Melhores Horários por Dia
              </h3>
              <div className="space-y-2">
                {recommendation.bestTimes.map((day, index) => (
                  <motion.div
                    key={day.day}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <button
                      onClick={() => setExpandedDay(expandedDay === index ? null : index)}
                      className="w-full p-4 rounded-xl flex items-center justify-between transition-all"
                      style={{ 
                        backgroundColor: expandedDay === index ? 'var(--primary-50)' : 'var(--bg-secondary)',
                        border: expandedDay === index ? '1px solid var(--primary-200)' : '1px solid transparent'
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {day.day}
                        </span>
                        <div className="flex gap-1">
                          {day.times.slice(0, 3).map((time, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 rounded text-xs font-medium"
                              style={{ 
                                backgroundColor: i === 0 ? 'var(--success-100)' : 'var(--bg-primary)',
                                color: i === 0 ? 'var(--success-700)' : 'var(--text-secondary)'
                              }}
                            >
                              {time.hour}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ChevronRight 
                        className={`w-5 h-5 transition-transform ${expandedDay === index ? 'rotate-90' : ''}`}
                        style={{ color: 'var(--text-tertiary)' }}
                      />
                    </button>

                    <AnimatePresence>
                      {expandedDay === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 space-y-3">
                            {day.times.map((time, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between p-3 rounded-lg"
                                style={{ backgroundColor: 'var(--bg-primary)' }}
                              >
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="w-10 h-10 rounded-lg flex items-center justify-center font-bold"
                                    style={{ 
                                      backgroundColor: i === 0 ? 'var(--success-500)' : 'var(--bg-secondary)',
                                      color: i === 0 ? 'white' : 'var(--text-primary)'
                                    }}
                                  >
                                    {i + 1}º
                                  </div>
                                  <div>
                                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                      {time.hour}
                                    </p>
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                      {time.reason}
                                    </p>
                                  </div>
                                </div>
                                <div 
                                  className="text-lg font-bold"
                                  style={{ color: getScoreColor(time.score) }}
                                >
                                  {time.score}%
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Insights */}
            {recommendation.insights.length > 0 && (
              <div>
                <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Sparkles className="w-5 h-5" style={{ color: 'var(--purple-500)' }} />
                  Insights da Val IA
                </h3>
                <div className="space-y-2">
                  {recommendation.insights.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-xl"
                      style={{ backgroundColor: 'var(--bg-secondary)' }}
                    >
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--success-500)' }} />
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                        {insight}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Worst Times Warning */}
            {recommendation.worstTimes.length > 0 && (
              <div 
                className="p-4 rounded-xl"
                style={{ backgroundColor: 'var(--warning-50)', border: '1px solid var(--warning-200)' }}
              >
                <h4 className="font-medium mb-2 flex items-center gap-2" style={{ color: 'var(--warning-700)' }}>
                  ⚠️ Evite Postar Nestes Horários
                </h4>
                <div className="flex flex-wrap gap-2">
                  {recommendation.worstTimes.slice(0, 3).map((day, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-lg text-sm"
                      style={{ backgroundColor: 'var(--warning-100)', color: 'var(--warning-700)' }}
                    >
                      {day.day}: {day.times.join(', ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>
              Não foi possível analisar os dados
            </p>
          </div>
        )}
      </div>
    </div>
  );
}









