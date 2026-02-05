'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Download, Mail, Calendar, Clock,
  TrendingUp, Users, DollarSign, Target,
  CheckCircle, Loader2, Eye, Settings
} from 'lucide-react';

interface ReportConfig {
  type: 'weekly' | 'monthly' | 'quarterly';
  sections: string[];
  recipients: string[];
  autoSend: boolean;
  sendDay: number;
  sendTime: string;
}

interface ReportPreview {
  title: string;
  period: string;
  generatedAt: Date;
  sections: ReportSection[];
}

interface ReportSection {
  title: string;
  metrics: ReportMetric[];
  insights: string[];
  chart?: 'line' | 'bar' | 'pie';
}

interface ReportMetric {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

const REPORT_SECTIONS = [
  { id: 'financial', label: 'Financeiro', icon: <DollarSign className="w-4 h-4" /> },
  { id: 'commercial', label: 'Comercial', icon: <Target className="w-4 h-4" /> },
  { id: 'clients', label: 'Clientes', icon: <Users className="w-4 h-4" /> },
  { id: 'operations', label: 'Operações', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'team', label: 'Equipe', icon: <Users className="w-4 h-4" /> },
  { id: 'insights', label: 'Insights IA', icon: <TrendingUp className="w-4 h-4" /> }
];

const SAMPLE_REPORT: ReportPreview = {
  title: 'Relatório Executivo Semanal',
  period: '18 a 24 de Novembro, 2024',
  generatedAt: new Date(),
  sections: [
    {
      title: 'Resumo Financeiro',
      metrics: [
        { label: 'Receita', value: 'R$ 212.500', change: 8.5, trend: 'up' },
        { label: 'Custos', value: 'R$ 130.000', change: 2.1, trend: 'up' },
        { label: 'Lucro', value: 'R$ 82.500', change: 15.2, trend: 'up' },
        { label: 'Margem', value: '38.8%', change: 2.3, trend: 'up' }
      ],
      insights: [
        'Receita 8.5% acima da semana anterior',
        'Margem de lucro melhorou devido à otimização de custos',
        'Projeção de fechamento do mês: R$ 920k'
      ],
      chart: 'line'
    },
    {
      title: 'Performance Comercial',
      metrics: [
        { label: 'Novos Leads', value: '47', change: 12, trend: 'up' },
        { label: 'Propostas Enviadas', value: '18', change: -5, trend: 'down' },
        { label: 'Fechamentos', value: '6', change: 20, trend: 'up' },
        { label: 'Taxa de Conversão', value: '33%', change: 8, trend: 'up' }
      ],
      insights: [
        '6 novos contratos fechados (R$ 48k MRR)',
        'Taxa de conversão acima da média histórica',
        'Pipeline: R$ 180k em propostas ativas'
      ],
      chart: 'bar'
    },
    {
      title: 'Saúde dos Clientes',
      metrics: [
        { label: 'NPS', value: '72', change: 3, trend: 'up' },
        { label: 'Churn', value: '2.1%', change: -0.5, trend: 'up' },
        { label: 'Tickets Abertos', value: '12', change: -8, trend: 'up' },
        { label: 'Satisfação', value: '4.5/5', change: 0.2, trend: 'up' }
      ],
      insights: [
        'NPS subiu 3 pontos - melhor resultado do trimestre',
        '3 clientes em risco identificados - ações em andamento',
        'Tempo médio de resposta: 2.4h (meta: 4h)'
      ],
      chart: 'pie'
    }
  ]
};

export function ExecutiveReportGenerator() {
  const [config, setConfig] = useState<ReportConfig>({
    type: 'weekly',
    sections: ['financial', 'commercial', 'clients'],
    recipients: ['diretoria@valle360.com'],
    autoSend: true,
    sendDay: 1, // Segunda-feira
    sendTime: '08:00'
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [newRecipient, setNewRecipient] = useState('');

  const generateReport = async () => {
    setIsGenerating(true);
    // Simular geração
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
    setShowPreview(true);
  };

  const downloadPDF = () => {
    // Em produção, chamaria API para gerar PDF
    console.log('Downloading PDF...');
    alert('Download do PDF iniciado!');
  };

  const sendByEmail = () => {
    // Em produção, chamaria API para enviar email
    console.log('Sending email to:', config.recipients);
    alert(`Relatório enviado para: ${config.recipients.join(', ')}`);
  };

  const toggleSection = (sectionId: string) => {
    setConfig(prev => ({
      ...prev,
      sections: prev.sections.includes(sectionId)
        ? prev.sections.filter(s => s !== sectionId)
        : [...prev.sections, sectionId]
    }));
  };

  const addRecipient = () => {
    if (newRecipient && newRecipient.includes('@')) {
      setConfig(prev => ({
        ...prev,
        recipients: [...prev.recipients, newRecipient]
      }));
      setNewRecipient('');
    }
  };

  const removeRecipient = (email: string) => {
    setConfig(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r !== email)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' }}
          >
            <FileText className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Relatórios Executivos
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Gere e agende relatórios automáticos
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div 
          className="rounded-xl p-6 border"
          style={{ 
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-light)'
          }}
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Settings className="w-5 h-5" style={{ color: 'var(--primary-500)' }} />
            Configuração do Relatório
          </h3>

          {/* Report Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Tipo de Relatório
            </label>
            <div className="flex gap-2">
              {[
                { id: 'weekly', label: 'Semanal' },
                { id: 'monthly', label: 'Mensal' },
                { id: 'quarterly', label: 'Trimestral' }
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setConfig(prev => ({ ...prev, type: type.id as any }))}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: config.type === type.id ? 'var(--primary-500)' : 'var(--bg-secondary)',
                    color: config.type === type.id ? 'white' : 'var(--text-secondary)'
                  }}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Seções do Relatório
            </label>
            <div className="grid grid-cols-2 gap-2">
              {REPORT_SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => toggleSection(section.id)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{
                    backgroundColor: config.sections.includes(section.id) 
                      ? 'var(--primary-100)' 
                      : 'var(--bg-secondary)',
                    color: config.sections.includes(section.id) 
                      ? 'var(--primary-700)' 
                      : 'var(--text-secondary)',
                    border: config.sections.includes(section.id) 
                      ? '1px solid var(--primary-300)' 
                      : '1px solid transparent'
                  }}
                >
                  {section.icon}
                  {section.label}
                  {config.sections.includes(section.id) && (
                    <CheckCircle className="w-4 h-4 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Recipients */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Destinatários
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="email"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addRecipient()}
                placeholder="email@empresa.com"
                className="flex-1 px-3 py-2 rounded-lg border text-sm"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-light)',
                  color: 'var(--text-primary)'
                }}
              />
              <button
                onClick={addRecipient}
                className="px-4 py-2 rounded-lg text-white"
                style={{ backgroundColor: 'var(--primary-500)' }}
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {config.recipients.map((email) => (
                <span
                  key={email}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                  style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  {email}
                  <button
                    onClick={() => removeRecipient(email)}
                    className="text-red-500 hover:text-red-700 ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Auto Send */}
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoSend}
                onChange={(e) => setConfig(prev => ({ ...prev, autoSend: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                Enviar automaticamente
              </span>
            </label>
            
            {config.autoSend && (
              <div className="flex gap-2 mt-2">
                <select
                  value={config.sendDay}
                  onChange={(e) => setConfig(prev => ({ ...prev, sendDay: parseInt(e.target.value) }))}
                  className="flex-1 px-3 py-2 rounded-lg border text-sm"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-light)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value={1}>Segunda-feira</option>
                  <option value={2}>Terça-feira</option>
                  <option value={3}>Quarta-feira</option>
                  <option value={4}>Quinta-feira</option>
                  <option value={5}>Sexta-feira</option>
                </select>
                <input
                  type="time"
                  value={config.sendTime}
                  onChange={(e) => setConfig(prev => ({ ...prev, sendTime: e.target.value }))}
                  className="px-3 py-2 rounded-lg border text-sm"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-light)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={generateReport}
              disabled={isGenerating || config.sections.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-white"
              style={{ backgroundColor: 'var(--primary-500)' }}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Eye className="w-5 h-5" />
                  Visualizar
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Preview Panel */}
        <div 
          className="rounded-xl p-6 border"
          style={{ 
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-light)'
          }}
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Eye className="w-5 h-5" style={{ color: 'var(--primary-500)' }} />
            Preview do Relatório
          </h3>

          {showPreview ? (
            <div className="space-y-4">
              {/* Report Header */}
              <div 
                className="p-4 rounded-lg"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              >
                <h4 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                  {SAMPLE_REPORT.title}
                </h4>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {SAMPLE_REPORT.period}
                </p>
              </div>

              {/* Sections Preview */}
              {SAMPLE_REPORT.sections.map((section, index) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-lg border"
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-light)'
                  }}
                >
                  <h5 className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                    {section.title}
                  </h5>
                  
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {section.metrics.map((metric) => (
                      <div 
                        key={metric.label}
                        className="p-2 rounded"
                        style={{ backgroundColor: 'var(--bg-primary)' }}
                      >
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {metric.label}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                            {metric.value}
                          </span>
                          <span 
                            className="text-xs"
                            style={{ 
                              color: metric.trend === 'up' 
                                ? (metric.label === 'Custos' || metric.label === 'Churn' ? 'var(--error-500)' : 'var(--success-500)')
                                : metric.trend === 'down' 
                                  ? (metric.label === 'Custos' || metric.label === 'Churn' ? 'var(--success-500)' : 'var(--error-500)')
                                  : 'var(--text-tertiary)'
                            }}
                          >
                            {metric.change > 0 ? '+' : ''}{metric.change}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Insights */}
                  <div className="space-y-1">
                    {section.insights.slice(0, 2).map((insight, i) => (
                      <p 
                        key={i}
                        className="text-xs flex items-start gap-1"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <span style={{ color: 'var(--primary-500)' }}>•</span>
                        {insight}
                      </p>
                    ))}
                  </div>
                </motion.div>
              ))}

              {/* Download Actions */}
              <div className="flex gap-2 pt-4 border-t" style={{ borderColor: 'var(--border-light)' }}>
                <button
                  onClick={downloadPDF}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium"
                  style={{ backgroundColor: 'var(--success-500)', color: 'white' }}
                >
                  <Download className="w-4 h-4" />
                  Baixar PDF
                </button>
                <button
                  onClick={sendByEmail}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium"
                  style={{ backgroundColor: 'var(--primary-500)', color: 'white' }}
                >
                  <Mail className="w-4 h-4" />
                  Enviar por Email
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText 
                className="w-16 h-16 mb-4 opacity-20"
                style={{ color: 'var(--text-tertiary)' }}
              />
              <p style={{ color: 'var(--text-secondary)' }}>
                Configure as opções e clique em "Visualizar"<br />
                para ver o preview do relatório
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExecutiveReportGenerator;









