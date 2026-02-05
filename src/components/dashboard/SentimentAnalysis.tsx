'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smile, Meh, Frown, TrendingUp, TrendingDown, MessageCircle, RefreshCw, Loader2, Sparkles } from 'lucide-react';

interface SentimentData {
  positive: number;
  neutral: number;
  negative: number;
  totalMentions: number;
  trend: string;
  trendDirection: 'up' | 'down' | 'stable';
  topPositiveKeywords: string[];
  topNegativeKeywords: string[];
  insight?: string;
  lastUpdated?: string;
}

interface SentimentAnalysisProps {
  clientId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // em minutos
}

export function SentimentAnalysis({ 
  clientId, 
  autoRefresh = false, 
  refreshInterval = 30 
}: SentimentAnalysisProps) {
  const [sentimentData, setSentimentData] = useState<SentimentData>({
    positive: 72,
    neutral: 21,
    negative: 7,
    totalMentions: 1847,
    trend: '+15%',
    trendDirection: 'up',
    topPositiveKeywords: ['qualidade', 'excelente', 'recomendo', 'satisfeito', 'ótimo'],
    topNegativeKeywords: ['demora', 'preço', 'atendimento'],
    insight: 'Sua marca está sendo muito bem avaliada! 72% das menções são positivas, superando a média do mercado (58%).'
  });
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [useAI, setUseAI] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    loadSentimentData();

    // Auto refresh
    if (autoRefresh) {
      const interval = setInterval(loadSentimentData, refreshInterval * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [clientId, autoRefresh, refreshInterval]);

  const loadSentimentData = async () => {
    setLoading(true);
    try {
      // Tentar buscar dados reais via API
      const response = await fetch('/api/ai/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'social',
          data: {
            posts: [
              // Simular posts para análise (em produção, viriam do banco de dados)
              { text: 'Excelente atendimento, recomendo muito!', platform: 'instagram', engagement: 150 },
              { text: 'Produto de qualidade, satisfeito com a compra', platform: 'facebook', engagement: 89 },
              { text: 'Demorou um pouco para entregar, mas valeu a pena', platform: 'twitter', engagement: 45 },
              { text: 'Preço um pouco alto, mas o serviço é ótimo', platform: 'instagram', engagement: 200 },
              { text: 'Melhor agência que já trabalhei!', platform: 'linkedin', engagement: 120 }
            ]
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.result) {
          const result = data.result;
          setSentimentData({
            positive: result.bySentiment?.positive || 72,
            neutral: result.bySentiment?.neutral || 21,
            negative: result.bySentiment?.negative || 7,
            totalMentions: 1847,
            trend: '+15%',
            trendDirection: 'up',
            topPositiveKeywords: result.topKeywords?.slice(0, 5) || ['qualidade', 'excelente', 'recomendo', 'satisfeito', 'ótimo'],
            topNegativeKeywords: ['demora', 'preço', 'atendimento'],
            insight: result.recommendations?.[0] || 'Continue investindo na qualidade do atendimento e produto.',
            lastUpdated: new Date().toISOString()
          });
          setUseAI(true);
        }
      }
    } catch (error) {
      console.log('Usando dados mockados para análise de sentimento');
      // Manter dados mockados em caso de erro
    } finally {
      setLoading(false);
    }
  };

  const analyzeNewContent = async (text: string) => {
    setAnalyzing(true);
    try {
      const response = await fetch('/api/ai/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'single',
          data: { text }
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.result;
      }
    } catch (error) {
      console.error('Erro na análise:', error);
    } finally {
      setAnalyzing(false);
    }
    return null;
  };

  const sentiments = [
    {
      type: 'Positivo',
      percentage: sentimentData.positive,
      icon: Smile,
      color: 'text-green-600',
      bg: 'bg-green-100',
      borderColor: 'border-green-300',
    },
    {
      type: 'Neutro',
      percentage: sentimentData.neutral,
      icon: Meh,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
      borderColor: 'border-yellow-300',
    },
    {
      type: 'Negativo',
      percentage: sentimentData.negative,
      icon: Frown,
      color: 'text-red-600',
      bg: 'bg-red-100',
      borderColor: 'border-red-300',
    },
  ];

  return (
    <Card className="border-2 border-valle-silver-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-valle-navy-900 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-valle-blue-600" />
            Análise de Sentimento
            {useAI && (
              <Badge variant="outline" className="ml-2 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                <Sparkles className="w-3 h-3 mr-1" />
                IA
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <button
              onClick={loadSentimentData}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Atualizar análise"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
              ) : (
                <RefreshCw className="w-4 h-4 text-gray-500" />
              )}
            </button>
            <Badge className={`${
              sentimentData.trendDirection === 'up' 
                ? 'bg-gradient-to-r from-green-500 to-green-600' 
                : sentimentData.trendDirection === 'down'
                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                  : 'bg-gradient-to-r from-gray-500 to-gray-600'
            } text-white`}>
              {sentimentData.trendDirection === 'up' ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : sentimentData.trendDirection === 'down' ? (
                <TrendingDown className="w-3 h-3 mr-1" />
              ) : null}
              {sentimentData.trend}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-valle-silver-600">
          Análise de {sentimentData.totalMentions.toLocaleString()} menções da sua marca
          {sentimentData.lastUpdated && (
            <span className="ml-2 text-xs text-gray-400">
              • Atualizado {new Date(sentimentData.lastUpdated).toLocaleTimeString('pt-BR')}
            </span>
          )}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          {sentiments.map((sentiment) => {
            const Icon = sentiment.icon;
            return (
              <div
                key={sentiment.type}
                className={`p-4 rounded-xl border-2 ${sentiment.borderColor} ${sentiment.bg} hover:shadow-lg transition-all`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm`}>
                    <Icon className={`w-6 h-6 ${sentiment.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-valle-silver-700 font-medium">{sentiment.type}</p>
                    <p className={`text-3xl font-bold ${sentiment.color}`}>{sentiment.percentage}%</p>
                  </div>
                </div>

                <div className="w-full bg-white rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      sentiment.type === 'Positivo'
                        ? 'bg-green-600'
                        : sentiment.type === 'Neutro'
                        ? 'bg-yellow-600'
                        : 'bg-red-600'
                    }`}
                    style={{ width: `${sentiment.percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
            <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
              <Smile className="w-4 h-4" />
              Palavras Mais Positivas
            </h4>
            <div className="flex flex-wrap gap-2">
              {sentimentData.topPositiveKeywords.map((keyword, i) => (
                <Badge key={i} className="bg-green-600 text-white hover:bg-green-700 cursor-default">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>

          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
            <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
              <Frown className="w-4 h-4" />
              Pontos de Atenção
            </h4>
            <div className="flex flex-wrap gap-2">
              {sentimentData.topNegativeKeywords.map((keyword, i) => (
                <Badge key={i} className="bg-red-600 text-white hover:bg-red-700 cursor-default">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-valle-blue-50 border-2 border-valle-blue-200 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-valle-blue-600 flex items-center justify-center flex-shrink-0">
              {sentimentData.positive >= 60 ? (
                <TrendingUp className="w-5 h-5 text-white" />
              ) : (
                <TrendingDown className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h4 className="font-semibold text-valle-navy-800 mb-1">
                {sentimentData.positive >= 60 ? 'Percepção da Marca em Alta' : 'Atenção Necessária'}
              </h4>
              <p className="text-sm text-valle-navy-700">
                {sentimentData.insight || 
                  `Sua marca está sendo ${sentimentData.positive >= 60 ? 'muito bem' : 'moderadamente'} avaliada! 
                  ${sentimentData.positive}% das menções são positivas${sentimentData.positive >= 60 ? ', superando a média do mercado (58%)' : ''}. 
                  Continue investindo na qualidade do atendimento e produto.`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Análise rápida de texto */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            Analisar Texto
          </h4>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Cole um comentário ou avaliação para analisar..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-valle-blue-500"
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  const input = e.currentTarget;
                  const result = await analyzeNewContent(input.value);
                  if (result) {
                    alert(`Sentimento: ${result.overall}\nScore: ${(result.score * 100).toFixed(0)}%\nResumo: ${result.summary}`);
                  }
                  input.value = '';
                }
              }}
            />
            <button
              disabled={analyzing}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors disabled:opacity-50"
              onClick={async (e) => {
                const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                if (input.value) {
                  const result = await analyzeNewContent(input.value);
                  if (result) {
                    alert(`Sentimento: ${result.overall}\nScore: ${(result.score * 100).toFixed(0)}%\nResumo: ${result.summary}`);
                  }
                  input.value = '';
                }
              }}
            >
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Analisar'}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
