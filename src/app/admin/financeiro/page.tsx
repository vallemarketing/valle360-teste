'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, TrendingUp, Download, Filter, Calendar,
  PieChart, BarChart3, FileText, AlertTriangle, Brain, Sparkles, 
  Zap, ThumbsUp, Mail, ArrowRight, CheckCircle, FileSpreadsheet, X
} from 'lucide-react';
import { CashFlowKPIs } from '@/components/financial/FinancialKPICards';
import { WaterfallChart } from '@/components/financial/WaterfallChart';
import { DRETable } from '@/components/financial/DRETable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function FinanceiroPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('2024');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);

  // Handler para exportar relatório
  const handleExport = async (format: 'pdf' | 'excel') => {
    setIsExporting(true);
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        period: selectedPeriod,
        month: selectedMonth,
        format,
        note: 'Export gerado a partir da visualização atual do dashboard.',
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-financeiro-${selectedPeriod}-${selectedMonth}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Relatório exportado (${format.toUpperCase()}).`);
    } finally {
      setIsExporting(false);
      setShowExportModal(false);
    }
  };

  // Handler para gerar nova análise
  const handleGenerateAnalysis = async () => {
    setIsGeneratingAnalysis(true);
    try {
      toast.message('Abrindo Centro de Inteligência para gerar insights financeiros...');
      window.location.href = '/admin/centro-inteligencia';
    } finally {
      setIsGeneratingAnalysis(false);
    }
  };

  // Handler para cobrar inadimplentes
  const handleChargeClients = async () => {
    toast.message('Abrindo Financeiro → Clientes para cobrar inadimplentes...');
    window.location.href = '/admin/financeiro/clientes';
  };

  // Handler para ver clientes
  const handleViewClients = () => {
    window.location.href = '/admin/clientes?filter=upsell';
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#0F172A' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
            >
              <DollarSign className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard Financeiro</h1>
              <p className="text-gray-400">Análise de Receita e Margem</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ 
                backgroundColor: '#1E293B',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ 
                backgroundColor: '#1E293B',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <option value="all">Todos os Meses</option>
              <option value="01">Janeiro</option>
              <option value="02">Fevereiro</option>
              <option value="03">Março</option>
              <option value="04">Abril</option>
              <option value="05">Maio</option>
              <option value="06">Junho</option>
              <option value="07">Julho</option>
              <option value="08">Agosto</option>
              <option value="09">Setembro</option>
              <option value="10">Outubro</option>
              <option value="11">Novembro</option>
              <option value="12">Dezembro</option>
            </select>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowExportModal(true)}
              className="p-2 rounded-xl"
              style={{ 
                backgroundColor: '#1E293B',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <Download className="w-5 h-5 text-gray-400" />
            </motion.button>
          </div>
        </div>

        {/* KPI Cards */}
        <CashFlowKPIs />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Waterfall Chart */}
          <WaterfallChart />

          {/* Revenue Evolution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6"
            style={{
              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Evolução da Receita</h3>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <TrendingUp className="w-4 h-4 text-green-500" />
                +12% vs ano anterior
              </div>
            </div>

            {/* Placeholder for chart */}
            <div className="h-[250px] flex items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                <p className="text-gray-500">Gráfico de Evolução</p>
                <p className="text-xs text-gray-600">Dados carregando...</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* DRE Table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Demonstrativo de Resultados (DRE)
            </h2>
            <button 
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-[#2E3B4B]"
              style={{ 
                backgroundColor: '#1E293B',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <Download className="w-4 h-4" />
              Exportar Excel/PDF
            </button>
          </div>
          <DRETable />
        </div>

        {/* Alerts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6"
          style={{
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-bold text-white">Alertas Financeiros</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AlertCard
              title="Contas a Receber Vencidas"
              value="R$ 45.230"
              description="12 faturas vencidas há mais de 30 dias"
              type="warning"
            />
            <AlertCard
              title="Fluxo de Caixa Projetado"
              value="R$ 128.500"
              description="Saldo previsto para os próximos 30 dias"
              type="info"
            />
            <AlertCard
              title="Inadimplência"
              value="3,2%"
              description="Taxa atual de inadimplência"
              type="success"
            />
          </div>
        </motion.div>

        {/* ========== INSIGHTS DA IA ========== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(22, 114, 214, 0.15) 0%, rgba(0, 21, 51, 0.3) 100%)',
            border: '1px solid rgba(22, 114, 214, 0.3)'
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#1672d6] to-[#001533]">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Insights da Val (IA)
                  <Badge className="bg-[#1672d6]/20 text-[#1672d6] border-[#1672d6]/30">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Atualizado
                  </Badge>
                </h3>
                <p className="text-gray-400 text-sm">Análise inteligente dos dados financeiros</p>
              </div>
            </div>
            <Button 
              className="bg-[#1672d6] hover:bg-[#1260b5]"
              onClick={handleGenerateAnalysis}
              disabled={isGeneratingAnalysis}
            >
              {isGeneratingAnalysis ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Gerando...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Gerar Nova Análise
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Insight 1 - Previsão de Receita */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1">Previsão de Receita</h4>
                  <p className="text-sm text-gray-400 mb-3">
                    Com base nos contratos ativos e histórico, a previsão para o próximo trimestre é de{' '}
                    <strong className="text-emerald-400">R$ 892.500</strong> (+15% vs trimestre atual).
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">Alta confiança</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Insight 2 - Inadimplência */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1">Alerta de Inadimplência</h4>
                  <p className="text-sm text-gray-400 mb-3">
                    <strong className="text-amber-400">3 clientes</strong> estão com pagamento atrasado há mais de 15 dias. 
                    Recomendo ação de cobrança imediata.
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                    onClick={handleChargeClients}
                  >
                    <Mail className="w-3 h-3 mr-1" />
                    Enviar Cobrança
                  </Button>
                </div>
              </div>
            </div>

            {/* Insight 3 - Otimização */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1">Oportunidade de Upsell</h4>
                  <p className="text-sm text-gray-400 mb-3">
                    <strong className="text-purple-400">5 clientes</strong> têm potencial para upgrade de plano, 
                    o que pode aumentar a receita em até <strong className="text-purple-400">R$ 18.500/mês</strong>.
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                    onClick={handleViewClients}
                  >
                    Ver Clientes
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Insight 4 - Redução de Custos */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <DollarSign className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1">Economia Identificada</h4>
                  <p className="text-sm text-gray-400 mb-3">
                    Identifiquei <strong className="text-blue-400">R$ 3.200</strong> em assinaturas de ferramentas 
                    que podem ser canceladas ou renegociadas.
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Ação Recomendada
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <h4 className="text-sm font-medium text-gray-400 mb-3">Ações Rápidas com IA</h4>
            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="border-white/10 text-white hover:bg-white/5"
                onClick={() => setShowExportModal(true)}
              >
                <FileText className="w-3 h-3 mr-1" />
                Gerar Relatório Mensal
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="border-white/10 text-white hover:bg-white/5"
                onClick={handleChargeClients}
              >
                <Mail className="w-3 h-3 mr-1" />
                Cobrar Inadimplentes
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="border-white/10 text-white hover:bg-white/5"
                onClick={handleGenerateAnalysis}
              >
                <BarChart3 className="w-3 h-3 mr-1" />
                Análise de Tendências
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="border-white/10 text-white hover:bg-white/5"
                onClick={handleGenerateAnalysis}
              >
                <PieChart className="w-3 h-3 mr-1" />
                Projeção de Fluxo de Caixa
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Modal de Exportação */}
        <AnimatePresence>
          {showExportModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
              onClick={() => !isExporting && setShowExportModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="rounded-2xl w-full max-w-md shadow-2xl"
                style={{ backgroundColor: '#1E293B' }}
              >
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">Exportar Relatório</h2>
                    <p className="text-sm text-gray-400">Escolha o formato do arquivo</p>
                  </div>
                  <button onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleExport('pdf')}
                      disabled={isExporting}
                      className="p-6 rounded-xl border-2 border-red-500/30 bg-red-500/5 hover:bg-red-500/10 transition-all text-center"
                    >
                      <Download className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <p className="font-semibold text-red-400">PDF</p>
                      <p className="text-xs text-gray-400">Relatório formatado</p>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleExport('excel')}
                      disabled={isExporting}
                      className="p-6 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all text-center"
                    >
                      <FileSpreadsheet className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="font-semibold text-emerald-400">Excel</p>
                      <p className="text-xs text-gray-400">Planilha editável</p>
                    </motion.button>
                  </div>

                  {isExporting && (
                    <div className="flex items-center justify-center gap-2 text-[#1672d6]">
                      <div className="w-4 h-4 border-2 border-[#1672d6]/30 border-t-[#1672d6] rounded-full animate-spin" />
                      <span className="text-sm text-white">Gerando relatório...</span>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Alert Card Component
function AlertCard({ title, value, description, type }: {
  title: string;
  value: string;
  description: string;
  type: 'success' | 'warning' | 'error' | 'info';
}) {
  const colors = {
    success: { bg: 'rgba(16, 185, 129, 0.1)', border: '#10B981', text: '#10B981' },
    warning: { bg: 'rgba(245, 158, 11, 0.1)', border: '#F59E0B', text: '#F59E0B' },
    error: { bg: 'rgba(239, 68, 68, 0.1)', border: '#EF4444', text: '#EF4444' },
    info: { bg: 'rgba(59, 130, 246, 0.1)', border: '#3B82F6', text: '#3B82F6' }
  };

  const color = colors[type];

  return (
    <div 
      className="p-4 rounded-xl"
      style={{ 
        backgroundColor: color.bg,
        border: `1px solid ${color.border}30`
      }}
    >
      <p className="text-sm text-gray-400 mb-1">{title}</p>
      <p className="text-2xl font-bold mb-1" style={{ color: color.text }}>{value}</p>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
}
