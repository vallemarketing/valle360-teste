'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Globe, TrendingUp, TrendingDown, Target,
  AlertTriangle, CheckCircle, ExternalLink, Plus,
  Sparkles, BarChart3, Radar, RefreshCw, Trash2
} from 'lucide-react';

interface Competitor {
  id: string;
  name: string;
  website: string;
  logo?: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  services: string[];
  priceRange: 'low' | 'medium' | 'high' | 'premium';
  marketPosition: number; // 1-10
  threatLevel: 'low' | 'medium' | 'high';
  lastAnalyzed: Date;
}

interface MarketInsight {
  type: 'opportunity' | 'threat' | 'trend';
  title: string;
  description: string;
  source: string;
  relevance: number;
}

const SAMPLE_COMPETITORS: Competitor[] = [
  {
    id: '1',
    name: 'Agência Alpha',
    website: 'agenciaalpha.com.br',
    description: 'Agência full-service com foco em grandes empresas',
    strengths: ['Equipe grande', 'Clientes enterprise', 'Presença nacional'],
    weaknesses: ['Preços altos', 'Atendimento impessoal', 'Processos lentos'],
    services: ['Marketing Digital', 'Branding', 'Publicidade'],
    priceRange: 'premium',
    marketPosition: 8,
    threatLevel: 'medium',
    lastAnalyzed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  },
  {
    id: '2',
    name: 'Digital Pro',
    website: 'digitalpro.com.br',
    description: 'Especializada em performance e tráfego pago',
    strengths: ['Especialização em tráfego', 'Resultados rápidos', 'Preços competitivos'],
    weaknesses: ['Escopo limitado', 'Sem branding', 'Equipe pequena'],
    services: ['Google Ads', 'Meta Ads', 'SEO'],
    priceRange: 'medium',
    marketPosition: 6,
    threatLevel: 'high',
    lastAnalyzed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  },
  {
    id: '3',
    name: 'Creative Hub',
    website: 'creativehub.agency',
    description: 'Boutique criativa focada em startups',
    strengths: ['Criatividade', 'Agilidade', 'Inovação'],
    weaknesses: ['Capacidade limitada', 'Preços variáveis', 'Pouca estrutura'],
    services: ['Design', 'Social Media', 'Vídeo'],
    priceRange: 'high',
    marketPosition: 5,
    threatLevel: 'low',
    lastAnalyzed: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  }
];

const MARKET_INSIGHTS: MarketInsight[] = [
  {
    type: 'opportunity',
    title: 'Crescimento em E-commerce',
    description: 'Demanda por marketing digital para e-commerce cresceu 45% no último trimestre. Poucos concorrentes oferecem pacotes específicos.',
    source: 'Análise de mercado',
    relevance: 95
  },
  {
    type: 'threat',
    title: 'Entrada de Player Internacional',
    description: 'Agência global "WorldMedia" anunciou expansão para o Brasil com preços agressivos.',
    source: 'Notícias do setor',
    relevance: 78
  },
  {
    type: 'trend',
    title: 'IA em Marketing',
    description: 'Agências que usam IA para automação estão ganhando market share. Considere destacar a Val como diferencial.',
    source: 'Tendências de mercado',
    relevance: 88
  },
  {
    type: 'opportunity',
    title: 'Nicho de Saúde',
    description: 'Setor de saúde busca agências especializadas. Nenhum concorrente direto tem foco nesse nicho.',
    source: 'Análise de demanda',
    relevance: 72
  }
];

export function CompetitiveAnalysis() {
  const [competitors, setCompetitors] = useState<Competitor[]>(SAMPLE_COMPETITORS);
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [newCompetitor, setNewCompetitor] = useState({ name: '', website: '' });

  const analyzeCompetitor = async (competitorId: string) => {
    setIsAnalyzing(true);
    // Simular análise com IA
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setCompetitors(prev => prev.map(c => 
      c.id === competitorId 
        ? { ...c, lastAnalyzed: new Date() }
        : c
    ));
    setIsAnalyzing(false);
  };

  const addCompetitor = async () => {
    if (!newCompetitor.name || !newCompetitor.website) return;
    
    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newComp: Competitor = {
      id: Date.now().toString(),
      name: newCompetitor.name,
      website: newCompetitor.website,
      description: 'Análise em andamento...',
      strengths: [],
      weaknesses: [],
      services: [],
      priceRange: 'medium',
      marketPosition: 5,
      threatLevel: 'medium',
      lastAnalyzed: new Date()
    };
    
    setCompetitors(prev => [...prev, newComp]);
    setNewCompetitor({ name: '', website: '' });
    setShowAddModal(false);
    setIsAnalyzing(false);
  };

  const removeCompetitor = (id: string) => {
    setCompetitors(prev => prev.filter(c => c.id !== id));
    if (selectedCompetitor?.id === id) {
      setSelectedCompetitor(null);
    }
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getPriceLabel = (range: string) => {
    switch (range) {
      case 'low': return '💰 Baixo';
      case 'medium': return '💰💰 Médio';
      case 'high': return '💰💰💰 Alto';
      case 'premium': return '💰💰💰💰 Premium';
      default: return range;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' }}
          >
            <Radar className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Análise de Concorrência
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Monitore seus concorrentes com IA
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white"
          style={{ backgroundColor: 'var(--primary-500)' }}
        >
          <Plus className="w-4 h-4" />
          Adicionar Concorrente
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Competitors List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Concorrentes Monitorados ({competitors.length})
          </h3>

          <div className="space-y-3">
            {competitors.map((competitor, index) => (
              <motion.div
                key={competitor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedCompetitor(competitor)}
                className={`rounded-xl p-4 border cursor-pointer transition-all ${
                  selectedCompetitor?.id === competitor.id ? 'ring-2' : ''
                }`}
                style={{ 
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: selectedCompetitor?.id === competitor.id 
                    ? 'var(--primary-500)' 
                    : 'var(--border-light)'
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold"
                      style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    >
                      {competitor.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {competitor.name}
                      </h4>
                      <a 
                        href={`https://${competitor.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm flex items-center gap-1 hover:underline"
                        style={{ color: 'var(--primary-500)' }}
                      >
                        {competitor.website}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span 
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ 
                        backgroundColor: `${getThreatColor(competitor.threatLevel)}20`,
                        color: getThreatColor(competitor.threatLevel)
                      }}
                    >
                      {competitor.threatLevel === 'high' ? '⚠️ Alto Risco' : 
                       competitor.threatLevel === 'medium' ? '⚡ Médio' : '✓ Baixo'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCompetitor(competitor.id);
                      }}
                      className="p-1 rounded hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>

                <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                  {competitor.description}
                </p>

                <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-light)' }}>
                  <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    <span>{getPriceLabel(competitor.priceRange)}</span>
                    <span>Posição: {competitor.marketPosition}/10</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      analyzeCompetitor(competitor.id);
                    }}
                    disabled={isAnalyzing}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--primary-500)' }}
                  >
                    <RefreshCw className={`w-3 h-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
                    Atualizar
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Insights Panel */}
        <div className="space-y-4">
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Insights de Mercado
          </h3>

          <div className="space-y-3">
            {MARKET_INSIGHTS.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-xl p-4 border"
                style={{ 
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border-light)'
                }}
              >
                <div className="flex items-start gap-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ 
                      backgroundColor: insight.type === 'opportunity' 
                        ? 'var(--success-100)' 
                        : insight.type === 'threat' 
                          ? 'var(--error-100)' 
                          : 'var(--info-100)'
                    }}
                  >
                    {insight.type === 'opportunity' ? (
                      <Target className="w-4 h-4" style={{ color: 'var(--success-600)' }} />
                    ) : insight.type === 'threat' ? (
                      <AlertTriangle className="w-4 h-4" style={{ color: 'var(--error-600)' }} />
                    ) : (
                      <TrendingUp className="w-4 h-4" style={{ color: 'var(--info-600)' }} />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {insight.title}
                    </h4>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {insight.description}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {insight.source}
                      </span>
                      <span 
                        className="text-xs font-medium"
                        style={{ color: 'var(--primary-500)' }}
                      >
                        {insight.relevance}% relevante
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* AI Summary */}
          <div 
            className="rounded-xl p-4"
            style={{ 
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.2)'
            }}
          >
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                  Análise da Val
                </h4>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Baseado na análise dos concorrentes, recomendo focar em: 
                  <strong> diferenciação por atendimento personalizado</strong> e 
                  <strong> especialização em nichos específicos</strong>. 
                  A Digital Pro é sua maior ameaça atual - considere criar um pacote competitivo de tráfego pago.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Competitor Detail */}
      <AnimatePresence>
        {selectedCompetitor && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="rounded-xl p-6 border"
            style={{ 
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-light)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                Detalhes: {selectedCompetitor.name}
              </h3>
              <button
                onClick={() => setSelectedCompetitor(null)}
                className="text-sm"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Fechar ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Strengths */}
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2" style={{ color: 'var(--success-600)' }}>
                  <CheckCircle className="w-4 h-4" />
                  Pontos Fortes
                </h4>
                <ul className="space-y-1">
                  {selectedCompetitor.strengths.map((s, i) => (
                    <li key={i} className="text-sm flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--success-500)' }}>+</span> {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2" style={{ color: 'var(--error-600)' }}>
                  <AlertTriangle className="w-4 h-4" />
                  Pontos Fracos
                </h4>
                <ul className="space-y-1">
                  {selectedCompetitor.weaknesses.map((w, i) => (
                    <li key={i} className="text-sm flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--error-500)' }}>-</span> {w}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Services */}
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2" style={{ color: 'var(--primary-600)' }}>
                  <BarChart3 className="w-4 h-4" />
                  Serviços
                </h4>
                <div className="flex flex-wrap gap-1">
                  {selectedCompetitor.services.map((s, i) => (
                    <span 
                      key={i}
                      className="text-xs px-2 py-1 rounded"
                      style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Competitor Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 rounded-2xl z-50"
              style={{ backgroundColor: 'var(--bg-primary)' }}
            >
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Adicionar Concorrente
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Nome da Empresa
                  </label>
                  <input
                    type="text"
                    value={newCompetitor.name}
                    onChange={(e) => setNewCompetitor(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Agência XYZ"
                    className="w-full px-4 py-2 rounded-xl border"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-light)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Website
                  </label>
                  <input
                    type="text"
                    value={newCompetitor.website}
                    onChange={(e) => setNewCompetitor(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="Ex: agenciaxyz.com.br"
                    className="w-full px-4 py-2 rounded-xl border"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-light)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  A Val irá analisar automaticamente o site e extrair informações sobre serviços, posicionamento e diferenciais.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 rounded-xl font-medium"
                  style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={addCompetitor}
                  disabled={isAnalyzing || !newCompetitor.name || !newCompetitor.website}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium text-white disabled:opacity-50"
                  style={{ backgroundColor: 'var(--primary-500)' }}
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Analisar com IA
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CompetitiveAnalysis;

