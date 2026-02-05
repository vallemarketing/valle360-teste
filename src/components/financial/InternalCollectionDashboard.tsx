'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Users,
  Target,
  Send,
  MessageSquare,
  Calendar,
  ChevronRight,
  Award,
  XCircle,
  Clock,
  Zap
} from 'lucide-react';

interface Salesperson {
  id: string;
  name: string;
  avatar?: string;
  monthlyGoal: number;
  achieved: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  lastSale?: Date;
  pendingDeals: number;
  pendingValue: number;
}

interface CollectionAlert {
  id: string;
  type: 'warning' | 'critical' | 'success';
  salesperson: string;
  message: string;
  suggestedAction: string;
  createdAt: Date;
}

// Mock data
const mockSalespeople: Salesperson[] = [
  {
    id: '1',
    name: 'Maria Silva',
    monthlyGoal: 100000,
    achieved: 125000,
    percentage: 125,
    trend: 'up',
    lastSale: new Date(Date.now() - 1000 * 60 * 60 * 2),
    pendingDeals: 3,
    pendingValue: 45000
  },
  {
    id: '2',
    name: 'João Santos',
    monthlyGoal: 100000,
    achieved: 78000,
    percentage: 78,
    trend: 'down',
    lastSale: new Date(Date.now() - 1000 * 60 * 60 * 48),
    pendingDeals: 5,
    pendingValue: 62000
  },
  {
    id: '3',
    name: 'Pedro Costa',
    monthlyGoal: 100000,
    achieved: 55000,
    percentage: 55,
    trend: 'down',
    lastSale: new Date(Date.now() - 1000 * 60 * 60 * 72),
    pendingDeals: 2,
    pendingValue: 28000
  },
  {
    id: '4',
    name: 'Ana Oliveira',
    monthlyGoal: 100000,
    achieved: 92000,
    percentage: 92,
    trend: 'up',
    lastSale: new Date(Date.now() - 1000 * 60 * 60 * 5),
    pendingDeals: 4,
    pendingValue: 38000
  }
];

const mockAlerts: CollectionAlert[] = [
  {
    id: '1',
    type: 'critical',
    salesperson: 'Pedro Costa',
    message: 'Está 45% abaixo da meta com apenas 7 dias restantes',
    suggestedAction: 'Agendar reunião urgente para revisar pipeline',
    createdAt: new Date()
  },
  {
    id: '2',
    type: 'warning',
    salesperson: 'João Santos',
    message: 'Não fechou vendas nos últimos 2 dias',
    suggestedAction: 'Enviar mensagem de acompanhamento via Val',
    createdAt: new Date(Date.now() - 1000 * 60 * 30)
  },
  {
    id: '3',
    type: 'success',
    salesperson: 'Maria Silva',
    message: 'Bateu a meta! 125% alcançado',
    suggestedAction: 'Enviar parabéns e considerar bônus',
    createdAt: new Date(Date.now() - 1000 * 60 * 60)
  }
];

export default function InternalCollectionDashboard() {
  const [salespeople] = useState<Salesperson[]>(mockSalespeople);
  const [alerts] = useState<CollectionAlert[]>(mockAlerts);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageTarget, setMessageTarget] = useState<Salesperson | null>(null);

  const totalGoal = salespeople.reduce((sum, s) => sum + s.monthlyGoal, 0);
  const totalAchieved = salespeople.reduce((sum, s) => sum + s.achieved, 0);
  const totalPercentage = Math.round((totalAchieved / totalGoal) * 100);
  const daysRemaining = 7; // Mock

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatTimeAgo = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d atrás`;
    if (hours > 0) return `${hours}h atrás`;
    return 'Agora';
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return 'var(--success-500)';
    if (percentage >= 80) return 'var(--warning-500)';
    if (percentage >= 60) return 'var(--warning-600)';
    return 'var(--error-500)';
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <XCircle className="w-5 h-5" style={{ color: 'var(--error-500)' }} />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" style={{ color: 'var(--warning-500)' }} />;
      case 'success':
        return <CheckCircle className="w-5 h-5" style={{ color: 'var(--success-500)' }} />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const handleSendMessage = (person: Salesperson) => {
    setMessageTarget(person);
    setShowMessageModal(true);
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <DollarSign className="w-7 h-7" style={{ color: 'var(--success-500)' }} />
              Cobrança Comercial
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Acompanhamento de metas e performance da equipe
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <Calendar className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
            <span style={{ color: 'var(--text-primary)' }}>Novembro 2024</span>
            <span className="px-2 py-1 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--warning-100)', color: 'var(--warning-700)' }}>
              {daysRemaining} dias restantes
            </span>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Meta Total */}
          <div 
            className="p-6 rounded-xl"
            style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <Target className="w-8 h-8" style={{ color: 'var(--primary-500)' }} />
              <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Meta do Mês</span>
            </div>
            <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {formatCurrency(totalGoal)}
            </p>
          </div>

          {/* Realizado */}
          <div 
            className="p-6 rounded-xl"
            style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8" style={{ color: 'var(--success-500)' }} />
              <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Realizado</span>
            </div>
            <p className="text-3xl font-bold" style={{ color: 'var(--success-500)' }}>
              {formatCurrency(totalAchieved)}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {totalPercentage}% da meta
            </p>
          </div>

          {/* Faltando */}
          <div 
            className="p-6 rounded-xl"
            style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <AlertTriangle className="w-8 h-8" style={{ color: 'var(--warning-500)' }} />
              <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Faltando</span>
            </div>
            <p className="text-3xl font-bold" style={{ color: 'var(--warning-500)' }}>
              {formatCurrency(Math.max(0, totalGoal - totalAchieved))}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              em {daysRemaining} dias
            </p>
          </div>

          {/* Projeção */}
          <div 
            className="p-6 rounded-xl"
            style={{ 
              background: totalPercentage >= 100 
                ? 'linear-gradient(135deg, var(--success-500) 0%, var(--success-600) 100%)'
                : 'linear-gradient(135deg, var(--primary-500) 0%, var(--purple-500) 100%)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <Zap className="w-8 h-8 text-white" />
              <span className="text-sm text-white/80">Projeção</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {Math.round(totalPercentage * 1.1)}%
            </p>
            <p className="text-sm mt-1 text-white/80">
              {totalPercentage >= 100 ? 'Meta batida! 🎉' : 'Estimativa fim do mês'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vendedores */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Users className="w-5 h-5" style={{ color: 'var(--primary-500)' }} />
              Performance por Vendedor
            </h2>

            <div className="space-y-3">
              {salespeople
                .sort((a, b) => b.percentage - a.percentage)
                .map((person, index) => (
                  <motion.div
                    key={person.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)' }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {/* Ranking */}
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                          style={{ 
                            backgroundColor: index === 0 ? 'var(--warning-100)' : 'var(--bg-secondary)',
                            color: index === 0 ? 'var(--warning-600)' : 'var(--text-secondary)'
                          }}
                        >
                          {index === 0 ? '👑' : index + 1}
                        </div>

                        {/* Avatar */}
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                          style={{ backgroundColor: 'var(--primary-100)', color: 'var(--primary-600)' }}
                        >
                          {person.name.split(' ').map(n => n[0]).join('')}
                        </div>

                        <div>
                          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                            {person.name}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            Última venda: {person.lastSale ? formatTimeAgo(person.lastSale) : 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {person.percentage < 80 && (
                          <button
                            onClick={() => handleSendMessage(person)}
                            className="p-2 rounded-lg transition-colors"
                            style={{ backgroundColor: 'var(--error-100)' }}
                            title="Enviar cobrança"
                          >
                            <Send className="w-4 h-4" style={{ color: 'var(--error-600)' }} />
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedPerson(selectedPerson === person.id ? null : person.id)}
                          className="p-2 rounded-lg transition-colors"
                          style={{ backgroundColor: 'var(--bg-secondary)' }}
                        >
                          <ChevronRight 
                            className={`w-4 h-4 transition-transform ${selectedPerson === person.id ? 'rotate-90' : ''}`}
                            style={{ color: 'var(--text-tertiary)' }}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {formatCurrency(person.achieved)} / {formatCurrency(person.monthlyGoal)}
                        </span>
                        <span 
                          className="font-bold"
                          style={{ color: getStatusColor(person.percentage) }}
                        >
                          {person.percentage}%
                        </span>
                      </div>
                      <div 
                        className="h-3 rounded-full overflow-hidden"
                        style={{ backgroundColor: 'var(--bg-secondary)' }}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(person.percentage, 100)}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: getStatusColor(person.percentage) }}
                        />
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {selectedPerson === person.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 mt-4 border-t grid grid-cols-2 gap-4" style={{ borderColor: 'var(--border-light)' }}>
                            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Negócios Pendentes</p>
                              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                                {person.pendingDeals}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Valor em Pipeline</p>
                              <p className="text-lg font-bold" style={{ color: 'var(--primary-500)' }}>
                                {formatCurrency(person.pendingValue)}
                              </p>
                            </div>
                            <div className="col-span-2 flex gap-2">
                              <button
                                onClick={() => handleSendMessage(person)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium"
                                style={{ backgroundColor: 'var(--primary-500)', color: 'white' }}
                              >
                                <MessageSquare className="w-4 h-4" />
                                Enviar Mensagem
                              </button>
                              <button
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium"
                                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                              >
                                <Calendar className="w-4 h-4" />
                                Agendar 1:1
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
            </div>
          </div>

          {/* Alertas */}
          <div className="space-y-4">
            <h2 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <AlertTriangle className="w-5 h-5" style={{ color: 'var(--warning-500)' }} />
              Alertas Automáticos
            </h2>

            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-xl"
                  style={{ 
                    backgroundColor: alert.type === 'critical' ? 'var(--error-50)' 
                      : alert.type === 'warning' ? 'var(--warning-50)' 
                      : 'var(--success-50)',
                    border: `1px solid ${
                      alert.type === 'critical' ? 'var(--error-200)' 
                      : alert.type === 'warning' ? 'var(--warning-200)' 
                      : 'var(--success-200)'
                    }`
                  }}
                >
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                        {alert.salesperson}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {alert.message}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          className="text-xs px-3 py-1 rounded-lg font-medium"
                          style={{ 
                            backgroundColor: alert.type === 'critical' ? 'var(--error-500)' 
                              : alert.type === 'warning' ? 'var(--warning-500)' 
                              : 'var(--success-500)',
                            color: 'white'
                          }}
                        >
                          {alert.suggestedAction}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Mensagem Automática da Val */}
            <div 
              className="p-4 rounded-xl"
              style={{ 
                background: 'linear-gradient(135deg, var(--purple-100) 0%, var(--primary-100) 100%)',
                border: '1px solid var(--purple-200)'
              }}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--purple-500)' }}>
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm" style={{ color: 'var(--purple-700)' }}>
                    Mensagem Automática da Val
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    "Pedro, você está 45% abaixo da meta. Precisa fechar R$ 45k em 7 dias. Posso ajudar com leads quentes?"
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      className="text-xs px-3 py-1.5 rounded-lg font-medium"
                      style={{ backgroundColor: 'var(--purple-500)', color: 'white' }}
                    >
                      Enviar via Val
                    </button>
                    <button
                      className="text-xs px-3 py-1.5 rounded-lg font-medium"
                      style={{ backgroundColor: 'var(--success-500)', color: 'white' }}
                    >
                      Enviar WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message Modal */}
        <AnimatePresence>
          {showMessageModal && messageTarget && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
              onClick={() => setShowMessageModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md p-6 rounded-2xl"
                style={{ backgroundColor: 'var(--bg-primary)' }}
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Enviar Mensagem para {messageTarget.name}
                </h3>
                <textarea
                  className="w-full p-4 rounded-xl resize-none"
                  rows={4}
                  placeholder="Digite sua mensagem..."
                  defaultValue={`Oi ${messageTarget.name.split(' ')[0]}! Vi que você está em ${messageTarget.percentage}% da meta. Precisa de ajuda com algum negócio? Vamos conversar!`}
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)', 
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-light)'
                  }}
                />
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setShowMessageModal(false)}
                    className="flex-1 px-4 py-2 rounded-xl font-medium"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      // Enviar mensagem
                      setShowMessageModal(false);
                    }}
                    className="flex-1 px-4 py-2 rounded-xl font-medium"
                    style={{ backgroundColor: 'var(--primary-500)', color: 'white' }}
                  >
                    Enviar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}









