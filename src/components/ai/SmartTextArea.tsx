'use client';

/**
 * Valle 360 - Smart TextArea
 * Componente de textarea com análise de sentimento automática
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Meh, Frown, Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SentimentResult {
  score: number;
  label: 'positive' | 'neutral' | 'negative';
  confidence: number;
}

interface SmartTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  label?: string;
  showSentiment?: boolean;
  autoAnalyze?: boolean;
  debounceMs?: number;
  onSentimentChange?: (sentiment: SentimentResult | null) => void;
}

export function SmartTextArea({
  value,
  onChange,
  placeholder = 'Digite aqui...',
  className,
  rows = 4,
  label,
  showSentiment = true,
  autoAnalyze = true,
  debounceMs = 1000,
  onSentimentChange
}: SmartTextAreaProps) {
  const [sentiment, setSentiment] = useState<SentimentResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Análise automática com debounce
  useEffect(() => {
    if (!autoAnalyze || !showSentiment || value.length < 20) {
      setSentiment(null);
      return;
    }

    const timer = setTimeout(async () => {
      await analyzeSentiment(value);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, autoAnalyze, showSentiment, debounceMs]);

  const analyzeSentiment = useCallback(async (text: string) => {
    if (text.length < 20) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/sentiment/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error('Erro na análise');
      }

      const data = await response.json();
      
      const result: SentimentResult = {
        score: data.score || 0,
        label: data.score > 0.2 ? 'positive' : data.score < -0.2 ? 'negative' : 'neutral',
        confidence: data.confidence || data.magnitude || 0.5
      };

      setSentiment(result);
      onSentimentChange?.(result);
    } catch (err) {
      console.error('Erro ao analisar sentimento:', err);
      setError('Erro na análise');
    } finally {
      setIsAnalyzing(false);
    }
  }, [onSentimentChange]);

  const getSentimentIcon = () => {
    if (!sentiment) return null;
    
    switch (sentiment.label) {
      case 'positive':
        return <Smile className="w-5 h-5 text-green-500" />;
      case 'negative':
        return <Frown className="w-5 h-5 text-red-500" />;
      default:
        return <Meh className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getSentimentColor = () => {
    if (!sentiment) return 'border-gray-200';
    
    switch (sentiment.label) {
      case 'positive':
        return 'border-green-300 focus:border-green-500';
      case 'negative':
        return 'border-red-300 focus:border-red-500';
      default:
        return 'border-yellow-300 focus:border-yellow-500';
    }
  };

  const getSentimentText = () => {
    if (!sentiment) return '';
    
    const labels = {
      positive: 'Positivo',
      negative: 'Negativo',
      neutral: 'Neutro'
    };

    return labels[sentiment.label];
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={cn(
            "w-full px-4 py-3 rounded-xl border-2 transition-colors",
            "bg-white dark:bg-gray-800 text-gray-900 dark:text-white",
            "placeholder:text-gray-400 focus:outline-none focus:ring-0",
            showSentiment && sentiment ? getSentimentColor() : "border-gray-200 focus:border-blue-500",
            className
          )}
        />

        {/* Indicador de sentimento */}
        <AnimatePresence>
          {showSentiment && (value.length >= 20 || isAnalyzing) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-3 right-3 flex items-center gap-2"
            >
              {isAnalyzing ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                  <RefreshCw className="w-4 h-4 text-gray-500 animate-spin" />
                  <span className="text-xs text-gray-500">Analisando...</span>
                </div>
              ) : sentiment ? (
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full",
                  sentiment.label === 'positive' && "bg-green-100",
                  sentiment.label === 'negative' && "bg-red-100",
                  sentiment.label === 'neutral' && "bg-yellow-100"
                )}>
                  {getSentimentIcon()}
                  <span className={cn(
                    "text-xs font-medium",
                    sentiment.label === 'positive' && "text-green-700",
                    sentiment.label === 'negative' && "text-red-700",
                    sentiment.label === 'neutral' && "text-yellow-700"
                  )}>
                    {getSentimentText()}
                  </span>
                  <span className={cn(
                    "text-xs",
                    sentiment.label === 'positive' && "text-green-500",
                    sentiment.label === 'negative' && "text-red-500",
                    sentiment.label === 'neutral' && "text-yellow-500"
                  )}>
                    ({Math.round(sentiment.confidence * 100)}%)
                  </span>
                </div>
              ) : error ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 rounded-full">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-xs text-red-600">{error}</span>
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dica */}
      {showSentiment && value.length > 0 && value.length < 20 && (
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Digite mais {20 - value.length} caracteres para análise de sentimento
        </p>
      )}
    </div>
  );
}

export default SmartTextArea;

