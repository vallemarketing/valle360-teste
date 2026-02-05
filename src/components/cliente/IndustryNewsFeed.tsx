'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Newspaper,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
  RefreshCw,
  Zap,
  Clock,
  Tag,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { fetchIndustryNews, NewsItem, analyzeTrends, TrendReport } from '@/lib/ai/trendAnalyzer';

interface IndustryNewsFeedProps {
  industry?: string;
  clientName?: string;
  compact?: boolean;
}

const CATEGORIES = [
  { id: 'all', label: 'Todas' },
  { id: 'platform_update', label: 'Plataformas' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'technology', label: 'Tecnologia' },
  { id: 'consumer_behavior', label: 'Comportamento' },
  { id: 'seasonal', label: 'Sazonal' }
];

export default function IndustryNewsFeed({ 
  industry = 'marketing_digital',
  clientName = 'Cliente',
  compact = false 
}: IndustryNewsFeedProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [trendReport, setTrendReport] = useState<TrendReport | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [expandedNews, setExpandedNews] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [industry]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [newsData, report] = await Promise.all([
        fetchIndustryNews(industry, 10),
        Promise.resolve(analyzeTrends(industry))
      ]);
      setNews(newsData);
      setTrendReport(report);
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNews = selectedCategory === 'all' 
    ? news 
    : news.filter(n => n.category === selectedCategory);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="w-4 h-4" style={{ color: 'var(--success-500)' }} />;
      case 'negative':
        return <TrendingDown className="w-4 h-4" style={{ color: 'var(--error-500)' }} />;
      default:
        return <Minus className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Agora';
    if (hours < 24) return `${hours}h atrás`;
    return `${days}d atrás`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (compact) {
    return (
      <div 
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)' }}
      >
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-light)' }}>
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5" style={{ color: 'var(--primary-500)' }} />
            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Notícias do Setor</span>
          </div>
          <a href="/cliente/noticias" className="text-sm flex items-center gap-1" style={{ color: 'var(--primary-500)' }}>
            Ver todas
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
          {news.slice(0, 3).map((item) => (
            <div key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div className="flex items-start gap-3">
                {getSentimentIcon(item.sentiment)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                    {item.title}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    {item.source} • {formatTimeAgo(item.publishedAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Newspaper className="w-6 h-6" style={{ color: 'var(--primary-500)' }} />
            Notícias do Setor
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Fique por dentro das novidades que impactam seu negócio
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Trends Summary */}
      {trendReport && trendReport.trends.length > 0 && (
        <div 
          className="p-4 rounded-xl"
          style={{ 
            background: 'linear-gradient(135deg, var(--purple-50) 0%, var(--primary-50) 100%)',
            border: '1px solid var(--purple-200)'
          }}
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--purple-500)' }}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold" style={{ color: 'var(--purple-700)' }}>
                🔥 Tendência em Alta
              </h3>
              <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>
                {trendReport.trends[0].title}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {trendReport.trends[0].description.slice(0, 150)}...
              </p>
              {trendReport.trends[0].actionItems[0] && (
                <div className="mt-3 flex items-center gap-2">
                  <Zap className="w-4 h-4" style={{ color: 'var(--warning-500)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--warning-600)' }}>
                    Dica: {trendReport.trends[0].actionItems[0]}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat.id 
                ? 'shadow-md' 
                : ''
            }`}
            style={{
              backgroundColor: selectedCategory === cat.id ? 'var(--primary-500)' : 'var(--bg-secondary)',
              color: selectedCategory === cat.id ? 'white' : 'var(--text-primary)'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* News List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredNews.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)' }}
            >
              <div 
                className="p-4 cursor-pointer"
                onClick={() => setExpandedNews(expandedNews === item.id ? null : item.id)}
              >
                <div className="flex items-start gap-4">
                  {/* Sentiment Indicator */}
                  <div 
                    className="p-2 rounded-lg flex-shrink-0"
                    style={{ 
                      backgroundColor: item.sentiment === 'positive' ? 'var(--success-100)' 
                        : item.sentiment === 'negative' ? 'var(--error-100)' 
                        : 'var(--bg-secondary)'
                    }}
                  >
                    {getSentimentIcon(item.sentiment)}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                      {item.title}
                    </h3>

                    {/* Summary */}
                    <p 
                      className={`text-sm ${expandedNews === item.id ? '' : 'line-clamp-2'}`}
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {item.summary}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(item.publishedAt)}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {item.source}
                      </span>
                      <span 
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                      >
                        {item.relevanceScore}% relevante
                      </span>
                    </div>
                  </div>

                  {/* External Link */}
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 rounded-lg flex-shrink-0 transition-colors"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <ExternalLink className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                  </a>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedNews === item.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 mt-4 border-t" style={{ borderColor: 'var(--border-light)' }}>
                        {/* Keywords */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {item.keywords.map((keyword, i) => (
                            <span
                              key={i}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                            >
                              <Tag className="w-3 h-3" />
                              {keyword}
                            </span>
                          ))}
                        </div>

                        {/* AI Analysis */}
                        {item.aiAnalysis && (
                          <div 
                            className="p-3 rounded-lg"
                            style={{ backgroundColor: 'var(--purple-50)' }}
                          >
                            <div className="flex items-start gap-2">
                              <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--purple-500)' }} />
                              <div>
                                <p className="text-xs font-medium mb-1" style={{ color: 'var(--purple-700)' }}>
                                  Análise da Val
                                </p>
                                <p className="text-sm" style={{ color: 'var(--purple-600)' }}>
                                  {item.aiAnalysis}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredNews.length === 0 && (
          <div className="text-center py-12">
            <Newspaper className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>
              Nenhuma notícia encontrada nesta categoria
            </p>
          </div>
        )}
      </div>

      {/* Insights Section */}
      {trendReport && trendReport.insights.length > 0 && (
        <div 
          className="p-4 rounded-xl"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Sparkles className="w-5 h-5" style={{ color: 'var(--warning-500)' }} />
            Insights para {clientName}
          </h3>
          <div className="space-y-2">
            {trendReport.insights.map((insight, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-2 rounded-lg"
                style={{ backgroundColor: 'var(--bg-primary)' }}
              >
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {insight}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}









