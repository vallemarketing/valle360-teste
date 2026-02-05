'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator, TrendingUp, TrendingDown, DollarSign,
  Users, Percent, Target, Play, RotateCcw, Sparkles,
  AlertTriangle, CheckCircle, ArrowRight, Zap
} from 'lucide-react';

interface SimulationResult {
  metric: string;
  currentValue: number;
  projectedValue: number;
  change: number;
  changePercent: number;
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  parameters: ScenarioParameter[];
}

interface ScenarioParameter {
  id: string;
  label: string;
  type: 'percentage' | 'number' | 'currency';
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  currentValue?: number;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'price_increase',
    name: 'Aumento de Preço',
    description: 'Simule o impacto de aumentar os preços dos serviços',
    icon: <DollarSign className="w-5 h-5" />,
    parameters: [
      { id: 'price_change', label: 'Variação de Preço', type: 'percentage', min: -30, max: 50, step: 5, defaultValue: 10 },
      { id: 'churn_sensitivity', label: 'Sensibilidade ao Churn', type: 'percentage', min: 0, max: 100, step: 10, defaultValue: 30 }
    ]
  },
  {
    id: 'team_expansion',
    name: 'Expansão de Equipe',
    description: 'Simule o impacto de contratar novos colaboradores',
    icon: <Users className="w-5 h-5" />,
    parameters: [
      { id: 'new_hires', label: 'Novas Contratações', type: 'number', min: 1, max: 20, step: 1, defaultValue: 3 },
      { id: 'avg_salary', label: 'Salário Médio (R$)', type: 'currency', min: 3000, max: 15000, step: 500, defaultValue: 5000 },
      { id: 'productivity_gain', label: 'Ganho de Produtividade', type: 'percentage', min: 0, max: 100, step: 5, defaultValue: 20 }
    ]
  },
  {
    id: 'client_acquisition',
    name: 'Aquisição de Clientes',
    description: 'Simule o impacto de aumentar a base de clientes',
    icon: <Target className="w-5 h-5" />,
    parameters: [
      { id: 'new_clients', label: 'Novos Clientes', type: 'number', min: 1, max: 50, step: 1, defaultValue: 10 },
      { id: 'avg_ticket', label: 'Ticket Médio (R$)', type: 'currency', min: 1000, max: 50000, step: 1000, defaultValue: 8000 },
      { id: 'acquisition_cost', label: 'CAC por Cliente (R$)', type: 'currency', min: 100, max: 5000, step: 100, defaultValue: 500 }
    ]
  },
  {
    id: 'client_loss',
    name: 'Perda de Clientes',
    description: 'Simule o impacto de perder clientes importantes',
    icon: <AlertTriangle className="w-5 h-5" />,
    parameters: [
      { id: 'clients_lost', label: 'Clientes Perdidos', type: 'number', min: 1, max: 20, step: 1, defaultValue: 3 },
      { id: 'avg_revenue_lost', label: 'Receita Média/Cliente (R$)', type: 'currency', min: 1000, max: 50000, step: 1000, defaultValue: 10000 }
    ]
  },
  {
    id: 'marketing_investment',
    name: 'Investimento em Marketing',
    description: 'Simule o retorno de investimentos em marketing',
    icon: <Zap className="w-5 h-5" />,
    parameters: [
      { id: 'investment', label: 'Investimento Mensal (R$)', type: 'currency', min: 1000, max: 100000, step: 1000, defaultValue: 10000 },
      { id: 'expected_roi', label: 'ROI Esperado', type: 'percentage', min: 50, max: 500, step: 25, defaultValue: 200 },
      { id: 'conversion_rate', label: 'Taxa de Conversão', type: 'percentage', min: 1, max: 20, step: 1, defaultValue: 5 }
    ]
  }
];

// Dados base da empresa (em produção, viria do Supabase)
const BASE_METRICS = {
  monthlyRevenue: 850000,
  totalClients: 127,
  avgTicket: 8500,
  teamSize: 32,
  monthlyCosts: 520000,
  profitMargin: 38.8,
  churnRate: 3.5,
  nps: 72
};

export function ScenarioSimulator() {
  const [selectedScenario, setSelectedScenario] = useState<string>(SCENARIOS[0].id);
  const [parameters, setParameters] = useState<Record<string, number>>({});
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const scenario = SCENARIOS.find(s => s.id === selectedScenario)!;

  // Inicializar parâmetros quando cenário muda
  useEffect(() => {
    const defaultParams: Record<string, number> = {};
    scenario.parameters.forEach(p => {
      defaultParams[p.id] = p.defaultValue;
    });
    setParameters(defaultParams);
    setShowResults(false);
  }, [selectedScenario]);

  const runSimulation = async () => {
    setIsSimulating(true);
    
    // Simular delay de processamento
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const simulationResults = calculateSimulation(selectedScenario, parameters);
    setResults(simulationResults);
    setShowResults(true);
    setIsSimulating(false);
  };

  const calculateSimulation = (scenarioId: string, params: Record<string, number>): SimulationResult[] => {
    const results: SimulationResult[] = [];
    
    switch (scenarioId) {
      case 'price_increase': {
        const priceChange = params.price_change / 100;
        const churnSensitivity = params.churn_sensitivity / 100;
        
        // Estimativa: cada 10% de aumento = 3% de churn adicional (ajustado pela sensibilidade)
        const estimatedChurnIncrease = (priceChange / 0.1) * 0.03 * churnSensitivity;
        const newChurnRate = BASE_METRICS.churnRate + (estimatedChurnIncrease * 100);
        const clientsLost = Math.round(BASE_METRICS.totalClients * estimatedChurnIncrease);
        const remainingClients = BASE_METRICS.totalClients - clientsLost;
        
        // Nova receita = clientes restantes * ticket médio * (1 + aumento)
        const newRevenue = remainingClients * BASE_METRICS.avgTicket * (1 + priceChange);
        const revenueChange = newRevenue - BASE_METRICS.monthlyRevenue;
        
        results.push({
          metric: 'Receita Mensal',
          currentValue: BASE_METRICS.monthlyRevenue,
          projectedValue: newRevenue,
          change: revenueChange,
          changePercent: (revenueChange / BASE_METRICS.monthlyRevenue) * 100,
          impact: revenueChange > 0 ? 'positive' : 'negative',
          confidence: 75
        });
        
        results.push({
          metric: 'Taxa de Churn',
          currentValue: BASE_METRICS.churnRate,
          projectedValue: newChurnRate,
          change: newChurnRate - BASE_METRICS.churnRate,
          changePercent: ((newChurnRate - BASE_METRICS.churnRate) / BASE_METRICS.churnRate) * 100,
          impact: newChurnRate > BASE_METRICS.churnRate ? 'negative' : 'positive',
          confidence: 65
        });
        
        results.push({
          metric: 'Clientes Ativos',
          currentValue: BASE_METRICS.totalClients,
          projectedValue: remainingClients,
          change: -clientsLost,
          changePercent: (-clientsLost / BASE_METRICS.totalClients) * 100,
          impact: clientsLost > 0 ? 'negative' : 'neutral',
          confidence: 70
        });
        break;
      }
      
      case 'team_expansion': {
        const newHires = params.new_hires;
        const avgSalary = params.avg_salary;
        const productivityGain = params.productivity_gain / 100;
        
        const additionalCost = newHires * avgSalary * 1.8; // 1.8x para encargos
        const newCosts = BASE_METRICS.monthlyCosts + additionalCost;
        
        // Estimativa: cada colaborador pode gerar X% mais receita
        const revenueGain = BASE_METRICS.monthlyRevenue * (newHires / BASE_METRICS.teamSize) * productivityGain;
        const newRevenue = BASE_METRICS.monthlyRevenue + revenueGain;
        
        const newProfit = newRevenue - newCosts;
        const currentProfit = BASE_METRICS.monthlyRevenue - BASE_METRICS.monthlyCosts;
        
        results.push({
          metric: 'Custos Mensais',
          currentValue: BASE_METRICS.monthlyCosts,
          projectedValue: newCosts,
          change: additionalCost,
          changePercent: (additionalCost / BASE_METRICS.monthlyCosts) * 100,
          impact: 'negative',
          confidence: 90
        });
        
        results.push({
          metric: 'Receita Mensal',
          currentValue: BASE_METRICS.monthlyRevenue,
          projectedValue: newRevenue,
          change: revenueGain,
          changePercent: (revenueGain / BASE_METRICS.monthlyRevenue) * 100,
          impact: 'positive',
          confidence: 60
        });
        
        results.push({
          metric: 'Lucro Mensal',
          currentValue: currentProfit,
          projectedValue: newProfit,
          change: newProfit - currentProfit,
          changePercent: ((newProfit - currentProfit) / currentProfit) * 100,
          impact: newProfit > currentProfit ? 'positive' : 'negative',
          confidence: 55
        });
        
        results.push({
          metric: 'Tamanho da Equipe',
          currentValue: BASE_METRICS.teamSize,
          projectedValue: BASE_METRICS.teamSize + newHires,
          change: newHires,
          changePercent: (newHires / BASE_METRICS.teamSize) * 100,
          impact: 'neutral',
          confidence: 100
        });
        break;
      }
      
      case 'client_acquisition': {
        const newClients = params.new_clients;
        const avgTicket = params.avg_ticket;
        const cac = params.acquisition_cost;
        
        const additionalRevenue = newClients * avgTicket;
        const acquisitionCost = newClients * cac;
        const netGain = additionalRevenue - acquisitionCost;
        
        results.push({
          metric: 'Receita Mensal',
          currentValue: BASE_METRICS.monthlyRevenue,
          projectedValue: BASE_METRICS.monthlyRevenue + additionalRevenue,
          change: additionalRevenue,
          changePercent: (additionalRevenue / BASE_METRICS.monthlyRevenue) * 100,
          impact: 'positive',
          confidence: 80
        });
        
        results.push({
          metric: 'Total de Clientes',
          currentValue: BASE_METRICS.totalClients,
          projectedValue: BASE_METRICS.totalClients + newClients,
          change: newClients,
          changePercent: (newClients / BASE_METRICS.totalClients) * 100,
          impact: 'positive',
          confidence: 100
        });
        
        results.push({
          metric: 'Custo de Aquisição Total',
          currentValue: 0,
          projectedValue: acquisitionCost,
          change: acquisitionCost,
          changePercent: 0,
          impact: 'negative',
          confidence: 95
        });
        
        results.push({
          metric: 'Ganho Líquido (1º mês)',
          currentValue: 0,
          projectedValue: netGain,
          change: netGain,
          changePercent: 0,
          impact: netGain > 0 ? 'positive' : 'negative',
          confidence: 75
        });
        break;
      }
      
      case 'client_loss': {
        const clientsLost = params.clients_lost;
        const avgRevenueLost = params.avg_revenue_lost;
        
        const revenueLoss = clientsLost * avgRevenueLost;
        const newRevenue = BASE_METRICS.monthlyRevenue - revenueLoss;
        
        results.push({
          metric: 'Receita Mensal',
          currentValue: BASE_METRICS.monthlyRevenue,
          projectedValue: newRevenue,
          change: -revenueLoss,
          changePercent: (-revenueLoss / BASE_METRICS.monthlyRevenue) * 100,
          impact: 'negative',
          confidence: 95
        });
        
        results.push({
          metric: 'Total de Clientes',
          currentValue: BASE_METRICS.totalClients,
          projectedValue: BASE_METRICS.totalClients - clientsLost,
          change: -clientsLost,
          changePercent: (-clientsLost / BASE_METRICS.totalClients) * 100,
          impact: 'negative',
          confidence: 100
        });
        
        const newProfit = newRevenue - BASE_METRICS.monthlyCosts;
        const currentProfit = BASE_METRICS.monthlyRevenue - BASE_METRICS.monthlyCosts;
        
        results.push({
          metric: 'Lucro Mensal',
          currentValue: currentProfit,
          projectedValue: newProfit,
          change: newProfit - currentProfit,
          changePercent: ((newProfit - currentProfit) / currentProfit) * 100,
          impact: 'negative',
          confidence: 90
        });
        break;
      }
      
      case 'marketing_investment': {
        const investment = params.investment;
        const expectedRoi = params.expected_roi / 100;
        const conversionRate = params.conversion_rate / 100;
        
        const expectedReturn = investment * expectedRoi;
        const estimatedLeads = Math.round(investment / 50); // R$50 por lead
        const estimatedNewClients = Math.round(estimatedLeads * conversionRate);
        const estimatedNewRevenue = estimatedNewClients * BASE_METRICS.avgTicket;
        
        results.push({
          metric: 'Investimento Mensal',
          currentValue: 0,
          projectedValue: investment,
          change: investment,
          changePercent: 0,
          impact: 'negative',
          confidence: 100
        });
        
        results.push({
          metric: 'Leads Estimados',
          currentValue: 0,
          projectedValue: estimatedLeads,
          change: estimatedLeads,
          changePercent: 0,
          impact: 'positive',
          confidence: 70
        });
        
        results.push({
          metric: 'Novos Clientes Estimados',
          currentValue: 0,
          projectedValue: estimatedNewClients,
          change: estimatedNewClients,
          changePercent: 0,
          impact: 'positive',
          confidence: 55
        });
        
        results.push({
          metric: 'Retorno Estimado',
          currentValue: 0,
          projectedValue: estimatedNewRevenue,
          change: estimatedNewRevenue - investment,
          changePercent: ((estimatedNewRevenue - investment) / investment) * 100,
          impact: estimatedNewRevenue > investment ? 'positive' : 'negative',
          confidence: 50
        });
        break;
      }
    }
    
    return results;
  };

  const formatValue = (value: number, isPercent: boolean = false) => {
    if (isPercent) {
      return `${value.toFixed(1)}%`;
    }
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}k`;
    }
    return `R$ ${value.toLocaleString('pt-BR')}`;
  };

  return (
    <div 
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      {/* Header */}
      <div className="p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}
          >
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">Simulador de Cenários</h3>
            <p className="text-xs text-gray-400">Teste hipóteses e veja o impacto em tempo real</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Scenario Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-3">
            Selecione o cenário
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedScenario(s.id)}
                className="flex items-center gap-2 p-3 rounded-xl text-left transition-all"
                style={{
                  backgroundColor: selectedScenario === s.id 
                    ? 'rgba(245, 158, 11, 0.2)' 
                    : 'rgba(255,255,255,0.05)',
                  border: selectedScenario === s.id 
                    ? '1px solid rgba(245, 158, 11, 0.5)' 
                    : '1px solid transparent'
                }}
              >
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ 
                    backgroundColor: selectedScenario === s.id 
                      ? 'rgba(245, 158, 11, 0.3)' 
                      : 'rgba(255,255,255,0.1)',
                    color: selectedScenario === s.id ? '#F59E0B' : '#9CA3AF'
                  }}
                >
                  {s.icon}
                </div>
                <span 
                  className="text-sm font-medium"
                  style={{ color: selectedScenario === s.id ? 'white' : '#9CA3AF' }}
                >
                  {s.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Parameters */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-3">
            Parâmetros: {scenario.description}
          </label>
          <div className="space-y-4">
            {scenario.parameters.map((param) => (
              <div key={param.id}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300">{param.label}</span>
                  <span className="text-sm font-bold text-white">
                    {param.type === 'percentage' && `${parameters[param.id] || param.defaultValue}%`}
                    {param.type === 'number' && (parameters[param.id] || param.defaultValue)}
                    {param.type === 'currency' && `R$ ${(parameters[param.id] || param.defaultValue).toLocaleString('pt-BR')}`}
                  </span>
                </div>
                <input
                  type="range"
                  min={param.min}
                  max={param.max}
                  step={param.step}
                  value={parameters[param.id] || param.defaultValue}
                  onChange={(e) => setParameters(prev => ({
                    ...prev,
                    [param.id]: parseFloat(e.target.value)
                  }))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #F59E0B 0%, #F59E0B ${((parameters[param.id] || param.defaultValue) - param.min) / (param.max - param.min) * 100}%, rgba(255,255,255,0.1) ${((parameters[param.id] || param.defaultValue) - param.min) / (param.max - param.min) * 100}%, rgba(255,255,255,0.1) 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{param.type === 'currency' ? `R$ ${param.min.toLocaleString()}` : param.min}{param.type === 'percentage' ? '%' : ''}</span>
                  <span>{param.type === 'currency' ? `R$ ${param.max.toLocaleString()}` : param.max}{param.type === 'percentage' ? '%' : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={runSimulation}
            disabled={isSimulating}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-white transition-all"
            style={{ backgroundColor: '#F59E0B' }}
          >
            {isSimulating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Simulando...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Simular Cenário
              </>
            )}
          </button>
          <button
            onClick={() => {
              const defaultParams: Record<string, number> = {};
              scenario.parameters.forEach(p => {
                defaultParams[p.id] = p.defaultValue;
              });
              setParameters(defaultParams);
              setShowResults(false);
            }}
            className="px-4 py-3 rounded-xl font-medium transition-all"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#9CA3AF' }}
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <AnimatePresence>
          {showResults && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span className="font-medium text-white">Resultados da Simulação</span>
              </div>
              
              {results.map((result, index) => (
                <motion.div
                  key={result.metric}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-xl"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">{result.metric}</span>
                    <span 
                      className="text-xs px-2 py-1 rounded"
                      style={{ 
                        backgroundColor: `rgba(${result.impact === 'positive' ? '16, 185, 129' : result.impact === 'negative' ? '239, 68, 68' : '107, 114, 128'}, 0.2)`,
                        color: result.impact === 'positive' ? '#10B981' : result.impact === 'negative' ? '#EF4444' : '#6B7280'
                      }}
                    >
                      Confiança: {result.confidence}%
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-lg text-gray-500">
                      {formatValue(result.currentValue, result.metric.includes('Taxa'))}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-600" />
                    <span className="text-lg font-bold text-white">
                      {formatValue(result.projectedValue, result.metric.includes('Taxa'))}
                    </span>
                    <span 
                      className="flex items-center gap-1 text-sm font-medium"
                      style={{ 
                        color: result.impact === 'positive' ? '#10B981' : result.impact === 'negative' ? '#EF4444' : '#6B7280'
                      }}
                    >
                      {result.impact === 'positive' ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : result.impact === 'negative' ? (
                        <TrendingDown className="w-4 h-4" />
                      ) : null}
                      {result.changePercent > 0 ? '+' : ''}{result.changePercent.toFixed(1)}%
                    </span>
                  </div>
                </motion.div>
              ))}

              {/* AI Recommendation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: results.length * 0.1 + 0.2 }}
                className="p-4 rounded-xl mt-4"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
                  border: '1px solid rgba(139, 92, 246, 0.3)'
                }}
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-purple-300 mb-1">Análise da Val</p>
                    <p className="text-sm text-gray-300">
                      {getAIRecommendation(selectedScenario, results)}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function getAIRecommendation(scenarioId: string, results: SimulationResult[]): string {
  const positiveResults = results.filter(r => r.impact === 'positive').length;
  const negativeResults = results.filter(r => r.impact === 'negative').length;
  
  if (positiveResults > negativeResults) {
    switch (scenarioId) {
      case 'price_increase':
        return "Este cenário mostra potencial positivo. Recomendo testar um aumento gradual de 5% primeiro e monitorar o NPS por 30 dias antes de aplicar o aumento total.";
      case 'team_expansion':
        return "A expansão parece viável. Sugiro começar com 1-2 contratações e avaliar o impacto real na produtividade antes de expandir mais.";
      case 'client_acquisition':
        return "Excelente oportunidade de crescimento! Foque em clientes com perfil similar aos seus melhores clientes atuais para maximizar o LTV.";
      case 'marketing_investment':
        return "O investimento tem bom potencial de retorno. Recomendo dividir o orçamento em 60% performance e 40% branding para resultados sustentáveis.";
      default:
        return "Os resultados são promissores. Recomendo implementar gradualmente e monitorar os KPIs semanalmente.";
    }
  } else {
    switch (scenarioId) {
      case 'price_increase':
        return "⚠️ Cuidado: O risco de churn pode superar os ganhos. Considere aumentar o valor percebido antes de aumentar preços.";
      case 'client_loss':
        return "🚨 Alerta: Este cenário teria impacto significativo. Priorize ações de retenção para os clientes em risco identificados.";
      default:
        return "Os riscos superam os benefícios neste cenário. Considere ajustar os parâmetros ou explorar alternativas.";
    }
  }
}

export default ScenarioSimulator;









