'use client';

/**
 * Valle 360 - Configuração de Análise de Sentimento e NLP
 * Permite escolher o provedor de IA e testar todas as funcionalidades
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Settings,
  Zap,
  Globe,
  MessageSquare,
  BarChart3,
  Play,
  RefreshCw,
  Info,
  ChevronRight,
  Save,
  TestTube,
  Users,
  MapPin,
  Building,
  Tag,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// =====================================================
// TIPOS
// =====================================================

type SentimentProvider = 'openai' | 'google' | 'claude' | 'auto';
type AnalysisType = 'sentiment' | 'entities' | 'entitySentiment' | 'classification' | 'full';

interface ProviderConfig {
  id: SentimentProvider;
  name: string;
  description: string;
  strengths: string[];
  bestFor: string[];
  pricing: string;
  status: 'active' | 'inactive' | 'error';
}

interface TestResult {
  type: AnalysisType;
  provider: string;
  data: any;
  time: number;
  error?: string;
}

// =====================================================
// DADOS DOS PROVEDORES
// =====================================================

const PROVIDERS: ProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI GPT-4',
    description: 'Análise avançada com compreensão contextual profunda e detecção de emoções',
    strengths: ['Compreensão contextual', 'Detecção de emoções', 'Textos complexos'],
    bestFor: ['Feedbacks detalhados', 'Textos longos', 'Resumos'],
    pricing: '~$0.03 por 1K tokens',
    status: 'active'
  },
  {
    id: 'google',
    name: 'Google Cloud NLP',
    description: 'API nativa do Google com todas as funcionalidades de NLP',
    strengths: ['Precisão em português', 'Análise de entidades', 'Classificação de texto'],
    bestFor: ['Reviews', 'Alto volume', 'Entidades'],
    pricing: '~$1.00 por 1K requisições',
    status: 'active'
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    description: 'IA conversacional com análise nuançada e segura',
    strengths: ['Análise nuançada', 'Contextos sensíveis', 'Explicações'],
    bestFor: ['Conteúdo sensível', 'Análises cuidadosas'],
    pricing: '~$0.025 por 1K tokens',
    status: 'active'
  }
];

const ANALYSIS_TYPES = [
  { id: 'sentiment', name: 'Análise de Sentimento', icon: TrendingUp, description: 'Detecta se o texto é positivo, negativo ou neutro' },
  { id: 'entities', name: 'Análise de Entidades', icon: Users, description: 'Identifica pessoas, lugares, organizações e produtos' },
  { id: 'entitySentiment', name: 'Sentimento por Entidade', icon: MessageSquare, description: 'Mostra o sentimento sobre cada entidade mencionada' },
  { id: 'classification', name: 'Classificação de Texto', icon: Tag, description: 'Categoriza automaticamente o conteúdo (mín. 20 palavras)' },
  { id: 'full', name: 'Análise Completa', icon: Brain, description: 'Executa todas as análises e gera insights' }
];

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function SentimentConfigPage() {
  const [selectedProvider, setSelectedProvider] = useState<SentimentProvider>('auto');
  const [fallbackProvider, setFallbackProvider] = useState<SentimentProvider>('google');
  const [enableAutoSelect, setEnableAutoSelect] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisType>('sentiment');
  const [testText, setTestText] = useState('O atendimento da Maria foi excelente! O produto chegou rápido em São Paulo, mas o preço da empresa TechCorp estava um pouco alto. No geral, estou satisfeito com a experiência de compra na loja online.');
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Carregar configuração salva
  useEffect(() => {
    const saved = localStorage.getItem('valle360_sentiment_config');
    if (saved) {
      const config = JSON.parse(saved);
      setSelectedProvider(config.defaultProvider || 'auto');
      setFallbackProvider(config.fallbackProvider || 'google');
      setEnableAutoSelect(config.enableAutoSelect ?? true);
    }
  }, []);

  // Salvar configuração
  const handleSave = () => {
    setIsSaving(true);
    const config = {
      defaultProvider: selectedProvider,
      fallbackProvider,
      enableAutoSelect
    };
    localStorage.setItem('valle360_sentiment_config', JSON.stringify(config));
    
    setTimeout(() => {
      setIsSaving(false);
      toast.success('✅ Configuração salva com sucesso!');
    }, 500);
  };

  // Testar análise
  const handleTest = async () => {
    if (!testText.trim()) {
      toast.error('Digite um texto para testar');
      return;
    }

    setIsTestRunning(true);
    setTestResults(null);

    const startTime = Date.now();

    try {
      // Simular chamada à API
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
      
      let result: TestResult;

      switch (selectedAnalysis) {
        case 'sentiment':
          result = {
            type: 'sentiment',
            provider: 'google',
            time: Date.now() - startTime,
            data: {
              overall: Math.random() > 0.3 ? 'positive' : Math.random() > 0.5 ? 'negative' : 'neutral',
              score: parseFloat((Math.random() * 2 - 1).toFixed(2)),
              magnitude: parseFloat((Math.random() * 3).toFixed(2)),
              sentences: [
                { text: 'O atendimento da Maria foi excelente!', score: 0.9, magnitude: 0.9 },
                { text: 'O produto chegou rápido em São Paulo, mas o preço da empresa TechCorp estava um pouco alto.', score: 0.1, magnitude: 0.6 },
                { text: 'No geral, estou satisfeito com a experiência de compra na loja online.', score: 0.7, magnitude: 0.5 }
              ]
            }
          };
          break;

        case 'entities':
          result = {
            type: 'entities',
            provider: 'google',
            time: Date.now() - startTime,
            data: {
              entities: [
                { name: 'Maria', type: 'PERSON', salience: 0.35 },
                { name: 'São Paulo', type: 'LOCATION', salience: 0.25 },
                { name: 'TechCorp', type: 'ORGANIZATION', salience: 0.20 },
                { name: 'loja online', type: 'CONSUMER_GOOD', salience: 0.15 }
              ]
            }
          };
          break;

        case 'entitySentiment':
          result = {
            type: 'entitySentiment',
            provider: 'google',
            time: Date.now() - startTime,
            data: {
              entities: [
                { name: 'Maria', type: 'PERSON', salience: 0.35, sentiment: { score: 0.9, magnitude: 0.9 } },
                { name: 'São Paulo', type: 'LOCATION', salience: 0.25, sentiment: { score: 0.5, magnitude: 0.3 } },
                { name: 'TechCorp', type: 'ORGANIZATION', salience: 0.20, sentiment: { score: -0.3, magnitude: 0.6 } },
                { name: 'experiência de compra', type: 'OTHER', salience: 0.15, sentiment: { score: 0.7, magnitude: 0.5 } }
              ]
            }
          };
          break;

        case 'classification':
          if (testText.split(/\s+/).length < 20) {
            throw new Error('Classificação requer pelo menos 20 palavras');
          }
          result = {
            type: 'classification',
            provider: 'google',
            time: Date.now() - startTime,
            data: {
              categories: [
                { name: '/Shopping/Consumer Electronics', confidence: 0.78 },
                { name: '/Business & Industrial/E-Commerce', confidence: 0.65 },
                { name: '/Reference/General Reference/Customer Service', confidence: 0.52 }
              ]
            }
          };
          break;

        case 'full':
        default:
          result = {
            type: 'full',
            provider: 'google',
            time: Date.now() - startTime,
            data: {
              sentiment: { score: 0.5, magnitude: 1.8, overall: 'positive' },
              entities: [
                { name: 'Maria', type: 'PERSON', sentiment: 'positive' },
                { name: 'TechCorp', type: 'ORGANIZATION', sentiment: 'negative' },
                { name: 'São Paulo', type: 'LOCATION', sentiment: 'neutral' }
              ],
              topics: ['E-Commerce', 'Customer Service', 'Consumer Electronics'],
              insights: [
                'O texto expressa sentimento predominantemente positivo',
                'Menções positivas: Maria, experiência de compra',
                'Menções negativas: preço da TechCorp',
                'Sugestão: Revisar política de preços'
              ]
            }
          };
      }

      setTestResults(result);
      toast.success('🧪 Análise concluída!');
    } catch (error: any) {
      setTestResults({
        type: selectedAnalysis,
        provider: 'google',
        time: Date.now() - startTime,
        data: null,
        error: error.message
      });
      toast.error(`Erro: ${error.message}`);
    }

    setIsTestRunning(false);
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'negative': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.25) return 'text-green-600 bg-green-100';
    if (score < -0.25) return 'text-red-600 bg-red-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getEntityTypeIcon = (type: string) => {
    switch (type) {
      case 'PERSON': return <Users className="w-4 h-4" />;
      case 'LOCATION': return <MapPin className="w-4 h-4" />;
      case 'ORGANIZATION': return <Building className="w-4 h-4" />;
      default: return <Tag className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Análise de Sentimento & NLP
              </h1>
              <p className="text-gray-500">
                Configure provedores de IA e teste análises de texto
              </p>
            </div>
          </div>
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#1672d6] hover:bg-[#1260b5]"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Coluna da Esquerda - Configurações */}
          <div className="col-span-1 space-y-6">
            {/* Provedor Padrão */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  Provedor de IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedProvider('auto')}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedProvider === 'auto' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">Auto Seleção</h3>
                      <p className="text-xs text-gray-500">Escolhe automaticamente</p>
                    </div>
                    {selectedProvider === 'auto' && <CheckCircle className="w-5 h-5 text-blue-600" />}
                  </div>
                </motion.div>

                {PROVIDERS.map((provider) => (
                  <motion.div
                    key={provider.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedProvider(provider.id)}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedProvider === provider.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center text-xl">
                        {provider.id === 'openai' && '🤖'}
                        {provider.id === 'google' && '🔍'}
                        {provider.id === 'claude' && '🧠'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{provider.name}</h3>
                        <p className="text-xs text-gray-500">{provider.pricing}</p>
                      </div>
                      {selectedProvider === provider.id && <CheckCircle className="w-5 h-5 text-blue-600" />}
                    </div>
                  </motion.div>
                ))}

                {/* Opções Avançadas */}
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between p-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  <span>Opções avançadas</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-3 overflow-hidden"
                    >
                      <div>
                        <label className="block text-xs font-medium mb-1">Fallback</label>
                        <select
                          value={fallbackProvider}
                          onChange={(e) => setFallbackProvider(e.target.value as SentimentProvider)}
                          className="w-full px-3 py-2 text-sm border rounded-lg"
                        >
                          <option value="google">Google Cloud</option>
                          <option value="openai">OpenAI</option>
                          <option value="claude">Claude</option>
                        </select>
                      </div>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enableAutoSelect}
                          onChange={(e) => setEnableAutoSelect(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600"
                        />
                        Auto-seleção por idioma
                      </label>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Tipo de Análise */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TestTube className="w-5 h-5 text-purple-600" />
                  Tipo de Análise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {ANALYSIS_TYPES.map((type) => (
                  <motion.div
                    key={type.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedAnalysis(type.id as AnalysisType)}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedAnalysis === type.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <type.icon className={`w-5 h-5 ${selectedAnalysis === type.id ? 'text-purple-600' : 'text-gray-400'}`} />
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{type.name}</h3>
                        <p className="text-xs text-gray-500 line-clamp-1">{type.description}</p>
                      </div>
                      {selectedAnalysis === type.id && <CheckCircle className="w-4 h-4 text-purple-600" />}
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Coluna Central e Direita - Teste */}
          <div className="col-span-2 space-y-6">
            {/* Área de Teste */}
            <Card className="border-2 border-purple-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Texto para Análise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  placeholder="Digite ou cole um texto para analisar..."
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 min-h-[120px] resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {testText.split(/\s+/).filter(w => w).length} palavras
                    {selectedAnalysis === 'classification' && testText.split(/\s+/).filter(w => w).length < 20 && (
                      <span className="text-primary ml-2">⚠️ Mínimo 20 palavras para classificação</span>
                    )}
                  </span>
                  <Button
                    onClick={handleTest}
                    disabled={isTestRunning}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isTestRunning ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Analisar
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Resultados */}
            <AnimatePresence>
              {testResults && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className={testResults.error ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {testResults.error ? (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          ) : (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                          Resultado da Análise
                        </CardTitle>
                        <Badge variant="outline">
                          {testResults.time}ms • {testResults.provider}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {testResults.error ? (
                        <div className="text-red-600">{testResults.error}</div>
                      ) : (
                        <div className="space-y-4">
                          {/* Sentimento */}
                          {(testResults.type === 'sentiment' || testResults.type === 'full') && testResults.data && (
                            <div className="space-y-3">
                              <h4 className="font-medium flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                Sentimento Geral
                              </h4>
                              <div className="flex items-center gap-4">
                                <div className={`px-4 py-2 rounded-lg font-medium ${getSentimentColor(testResults.data.sentiment?.score || testResults.data.score)}`}>
                                  {testResults.data.sentiment?.overall || testResults.data.overall || 'neutral'}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Score: <span className="font-mono">{(testResults.data.sentiment?.score || testResults.data.score || 0).toFixed(2)}</span>
                                </div>
                                {testResults.data.magnitude && (
                                  <div className="text-sm text-gray-600">
                                    Magnitude: <span className="font-mono">{testResults.data.magnitude.toFixed(2)}</span>
                                  </div>
                                )}
                              </div>

                              {testResults.data.sentences && (
                                <div className="space-y-2 pt-2">
                                  <h5 className="text-sm font-medium text-gray-600">Por Sentença:</h5>
                                  {testResults.data.sentences.map((s: any, i: number) => (
                                    <div key={i} className="flex items-start gap-2 p-2 bg-white rounded-lg text-sm">
                                      {getSentimentIcon(s.score > 0.25 ? 'positive' : s.score < -0.25 ? 'negative' : 'neutral')}
                                      <span className="flex-1">{s.text}</span>
                                      <span className="font-mono text-xs text-gray-500">{s.score.toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Entidades */}
                          {(testResults.type === 'entities' || testResults.type === 'entitySentiment' || testResults.type === 'full') && testResults.data?.entities && (
                            <div className="space-y-3">
                              <h4 className="font-medium flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Entidades Detectadas
                              </h4>
                              <div className="grid grid-cols-2 gap-2">
                                {testResults.data.entities.map((e: any, i: number) => (
                                  <div key={i} className="flex items-center gap-2 p-3 bg-white rounded-lg border">
                                    {getEntityTypeIcon(e.type)}
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm truncate">{e.name}</div>
                                      <div className="text-xs text-gray-500">{e.type}</div>
                                    </div>
                                    {e.sentiment && (
                                      <div className={`px-2 py-1 rounded text-xs ${getSentimentColor(e.sentiment.score || 0)}`}>
                                        {e.sentiment.score?.toFixed(2) || e.sentiment}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Classificação */}
                          {(testResults.type === 'classification' || testResults.type === 'full') && testResults.data?.categories && (
                            <div className="space-y-3">
                              <h4 className="font-medium flex items-center gap-2">
                                <Tag className="w-4 h-4" />
                                Categorias
                              </h4>
                              <div className="space-y-2">
                                {testResults.data.categories.map((c: any, i: number) => (
                                  <div key={i} className="flex items-center gap-2">
                                    <div className="flex-1 bg-white rounded-lg overflow-hidden">
                                      <div 
                                        className="h-8 bg-blue-500 flex items-center px-3"
                                        style={{ width: `${c.confidence * 100}%` }}
                                      >
                                        <span className="text-white text-xs font-medium truncate">{c.name}</span>
                                      </div>
                                    </div>
                                    <span className="text-sm font-mono w-12 text-right">{(c.confidence * 100).toFixed(0)}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Tópicos */}
                          {testResults.type === 'full' && testResults.data?.topics && (
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">Tópicos:</h4>
                              <div className="flex flex-wrap gap-2">
                                {testResults.data.topics.map((t: string, i: number) => (
                                  <Badge key={i} variant="secondary">{t}</Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Insights */}
                          {testResults.type === 'full' && testResults.data?.insights && (
                            <div className="space-y-2 pt-3 border-t">
                              <h4 className="font-medium flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-purple-600" />
                                Insights da IA
                              </h4>
                              <ul className="space-y-1">
                                {testResults.data.insights.map((insight: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2 text-sm">
                                    <ChevronRight className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                                    {insight}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Info */}
            {!testResults && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Funcionalidades Disponíveis</p>
                      <ul className="space-y-1 text-blue-700">
                        <li>• <strong>Sentimento</strong>: Detecta emoção geral e por sentença</li>
                        <li>• <strong>Entidades</strong>: Identifica pessoas, lugares, empresas</li>
                        <li>• <strong>Sentimento por Entidade</strong>: O que pensam sobre cada menção</li>
                        <li>• <strong>Classificação</strong>: Categoriza automaticamente (mín. 20 palavras)</li>
                        <li>• <strong>Análise Completa</strong>: Todas as análises + insights da IA</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
