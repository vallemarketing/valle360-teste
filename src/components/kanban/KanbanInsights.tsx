'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Clock, AlertTriangle, CheckCircle2, 
  BarChart3, Users, Zap, Target, ArrowUp, ArrowDown,
  Brain, Sparkles, Calendar, ChevronRight, Play,
  X, ThumbsUp, MessageSquare, Mail, Send, Eye, Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface KanbanCard {
  id: string;
  title: string;
  clientName?: string;
  assignees: string[];
  dueDate?: Date;
  temperature?: 'hot' | 'warm' | 'cold';
  /** stageKey do board (ex.: demanda, aprovacao, finalizado...) */
  stageKey?: string;
}

interface KanbanInsightsProps {
  columns: {
    id: string;
    title: string;
    color: string;
    cards: KanbanCard[];
    /** stageKey do board (quando disponível) */
    stageKey?: string;
  }[];
  area: string;
  /** Board atual (para IA/insights reais) */
  boardId?: string | null;
}

type ModalType = 'overdue' | 'pending' | 'inProgress' | 'praise' | 'charge' | null;

function normalizeKey(input: string) {
  return String(input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function isStage(stage: string | undefined, expected: string) {
  const s = normalizeKey(stage || '');
  const e = normalizeKey(expected);
  return s === e || s.includes(e);
}

function isDoneStage(stage: string | undefined) {
  const s = normalizeKey(stage || '');
  return s === 'finalizado' || s.includes('finaliz') || s === 'done' || s.includes('conclu');
}

export default function KanbanInsights({ columns, area, boardId }: KanbanInsightsProps) {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedCards, setSelectedCards] = useState<KanbanCard[]>([]);
  const [selectedCollaborator, setSelectedCollaborator] = useState<string>('');
  const [messageGenerated, setMessageGenerated] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [riskCount, setRiskCount] = useState<number>(0);
  const [topRisk, setTopRisk] = useState<Array<{ id: string; title: string; score: number; reasons: string[] }>>([]);

  const now = Date.now();
  const today = new Date();

  const totalCards = useMemo(() => columns.reduce((acc, col) => acc + col.cards.length, 0), [columns]);
  const completedCards = useMemo(
    () => columns.filter((c) => isDoneStage(c.stageKey || c.id)).reduce((acc, col) => acc + col.cards.length, 0),
    [columns]
  );

  const inProgressCards = useMemo(() => {
    return columns
      .filter((c) => {
        const stage = c.stageKey || c.id;
        if (isDoneStage(stage)) return false;
        if (isStage(stage, 'bloqueado')) return false;
        if (isStage(stage, 'demanda')) return false;
        return true;
      })
      .flatMap((c) => c.cards.map((card) => ({ ...card, stageKey: c.stageKey || c.id })));
  }, [columns]);

  const pendingCards = useMemo(() => {
    return columns
      .filter((c) => isStage(c.stageKey || c.id, 'demanda'))
      .flatMap((c) => c.cards.map((card) => ({ ...card, stageKey: c.stageKey || c.id })));
  }, [columns]);

  const overdueCards = useMemo(() => {
    return columns
      .filter((c) => !isDoneStage(c.stageKey || c.id))
      .flatMap((c) => c.cards.map((card) => ({ ...card, stageKey: c.stageKey || c.id })))
      .filter((card) => !!card.dueDate && card.dueDate!.getTime() < now);
  }, [columns, now]);

  const allCollaborators = useMemo(
    () => [...new Set(columns.flatMap((c) => c.cards.flatMap((card) => card.assignees)).filter(Boolean))],
    [columns]
  );

  const completionRate = totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0;

  useEffect(() => {
    const load = async () => {
      if (!boardId) return;
      try {
        const res = await fetch(`/api/kanban/insights?boardId=${encodeURIComponent(boardId)}`);
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) return;
        setRiskCount(Number(data?.risk?.count || data?.metrics?.at_risk || 0));
        setTopRisk((data?.risk?.top || []).map((t: any) => ({
          id: String(t.id),
          title: String(t.title || ''),
          score: Number(t.score || 0),
          reasons: Array.isArray(t.reasons) ? t.reasons.map((x: any) => String(x)) : [],
        })));
      } catch {
        // ignore
      }
    };
    load();
  }, [boardId]);

  const bottleneck = useMemo(() => {
    const activeCols = columns.filter((c) => !isDoneStage(c.stageKey || c.id) && !isStage(c.stageKey || c.id, 'bloqueado'));
    if (activeCols.length === 0) return null;
    return activeCols.reduce((max, col) => (col.cards.length > max.cards.length ? col : max), activeCols[0]);
  }, [columns]);

  // Handler para clicar nos cards de insights
  const handleInsightClick = (type: 'overdue' | 'pending' | 'inProgress') => {
    switch (type) {
      case 'overdue':
        setSelectedCards(overdueCards);
        break;
      case 'pending':
        setSelectedCards(pendingCards);
        break;
      case 'inProgress':
        setSelectedCards(inProgressCards);
        break;
    }
    setActiveModal(type);
  };

  async function generateMessage(params: { messageType: 'praise' | 'charge' | 'approval_reminder'; collaborator?: string; cards?: KanbanCard[] }) {
    setIsGenerating(true);
    setMessageSent(false);
    setMessageGenerated('');
    setSelectedCollaborator(params.collaborator || '');
    try {
      const res = await fetch('/api/kanban/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_message',
          boardId: boardId || '',
          messageType: params.messageType,
          collaboratorId: params.collaborator || undefined,
          taskIds: (params.cards || []).map((c) => c.id),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Falha ao gerar mensagem');
      }
      setMessageGenerated(String(data.message || '').trim());
    } catch (e: any) {
      setMessageGenerated(e?.message ? `Erro ao gerar mensagem: ${e.message}` : 'Erro ao gerar mensagem');
    } finally {
      setIsGenerating(false);
    }
  }

  // Handler para elogiar colaborador (IA real + fallback)
  const handlePraise = async (collaborator: string) => {
    setSelectedCollaborator(collaborator);
    setActiveModal('praise');
    await generateMessage({ messageType: 'praise', collaborator });
  };

  // Handler para cobrar colaborador (IA real + fallback)
  const handleCharge = async (collaborator: string, cards: KanbanCard[]) => {
    setSelectedCollaborator(collaborator);
    setSelectedCards(cards);
    setActiveModal('charge');
    await generateMessage({ messageType: 'charge', collaborator, cards });
  };

  // Handler para enviar mensagem
  const handleSendMessage = () => {
    setMessageSent(true);
    setTimeout(() => {
      setActiveModal(null);
      setMessageSent(false);
      setMessageGenerated('');
      setSelectedCollaborator('');
    }, 2000);
  };

  // Handler para copiar mensagem
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageGenerated);
    alert('✅ Mensagem copiada!');
  };

  const insights: Array<{
    id: string;
    title: string;
    value: string;
    subtitle?: string;
    change?: string;
    positive?: boolean;
    icon: any;
    color: string;
    alert?: boolean;
    clickable?: boolean;
    onClick?: () => void;
  }> = [
    {
      id: 'completion',
      title: 'Taxa de Conclusão',
      value: `${completionRate}%`,
      icon: CheckCircle2,
      color: '#10b981',
      clickable: false,
    },
    {
      id: 'in_progress',
      title: 'Em Andamento',
      value: inProgressCards.length.toString(),
      subtitle: 'cards ativos',
      icon: Zap,
      color: '#f97316',
      clickable: true,
      onClick: () => handleInsightClick('inProgress'),
    },
    {
      id: 'pending',
      title: 'Aguardando',
      value: pendingCards.length.toString(),
      subtitle: 'na fila',
      icon: Clock,
      color: '#6366f1',
      clickable: true,
      onClick: () => handleInsightClick('pending'),
    },
    {
      id: 'overdue',
      title: 'Atrasados',
      value: overdueCards.length.toString(),
      subtitle: overdueCards.length > 0 ? 'atenção!' : 'nenhum',
      icon: AlertTriangle,
      color: overdueCards.length > 0 ? '#ef4444' : '#10b981',
      alert: overdueCards.length > 0,
      clickable: overdueCards.length > 0,
      onClick: () => handleInsightClick('overdue'),
    },
    {
      id: 'risk',
      title: 'Em risco',
      value: String(riskCount || 0),
      subtitle: riskCount > 0 ? 'priorizar' : 'ok',
      icon: AlertTriangle,
      color: riskCount > 0 ? '#f97316' : '#10b981',
      alert: riskCount > 0,
      clickable: false,
    },
  ];

  return (
    <>
    <div className="bg-white rounded-xl border shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          Insights do Kanban
        </h3>
          <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {area}
        </span>
            {/* Botões de Ação Rápida */}
            <div className="flex gap-1">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                onClick={() => {
                  if (allCollaborators.length > 0) {
                    handlePraise(allCollaborators[0]);
                  }
                }}
              >
                <ThumbsUp className="w-3 h-3 mr-1" />
                Elogiar
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs text-primary border-primary/30 hover:bg-primary/10"
                onClick={() => {
                  if (overdueCards.length > 0 && overdueCards[0].assignees.length > 0) {
                    handleCharge(overdueCards[0].assignees[0], overdueCards.filter(c => c.assignees.includes(overdueCards[0].assignees[0])));
                  }
                }}
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                Cobrar
              </Button>
            </div>
          </div>
      </div>

        {/* Métricas principais - agora clicáveis */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
                onClick={insight.clickable ? insight.onClick : undefined}
                className={cn(
                  "p-3 rounded-xl border transition-all",
                  insight.alert ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50',
                  insight.clickable && 'cursor-pointer hover:shadow-md hover:scale-[1.02]'
                )}
            >
              <div className="flex items-center gap-2 mb-1">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${insight.color}20` }}
                >
                  <Icon className="w-4 h-4" style={{ color: insight.color }} />
                </div>
                <span className="text-xs text-gray-500">{insight.title}</span>
                  {insight.clickable && (
                    <Eye className="w-3 h-3 text-gray-400 ml-auto" />
                  )}
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold" style={{ color: insight.color }}>
                  {insight.value}
                </span>
                {insight.change && (
                  <span className={`text-xs flex items-center gap-0.5 ${insight.positive ? 'text-green-600' : 'text-red-600'}`}>
                    {insight.positive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    {insight.change}
                  </span>
                )}
                {insight.subtitle && (
                  <span className="text-xs text-gray-400">{insight.subtitle}</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Insights inteligentes */}
      <div className="space-y-2">
        {/* Gargalo identificado */}
        {bottleneck && bottleneck.cards.length > 3 && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Gargalo identificado</p>
              <p className="text-xs text-amber-700">
                A fase <strong>{bottleneck.title}</strong> tem {bottleneck.cards.length} cards acumulados. 
                Considere redistribuir tarefas ou adicionar recursos.
              </p>
            </div>
          </div>
        )}

        {/* Cards atrasados */}
        {overdueCards.length > 0 && (
            <div 
              className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
              onClick={() => handleInsightClick('overdue')}
            >
            <Clock className="w-4 h-4 text-red-600 mt-0.5" />
              <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                {overdueCards.length} {overdueCards.length === 1 ? 'card atrasado' : 'cards atrasados'}
              </p>
              <p className="text-xs text-red-700">
                {overdueCards.slice(0, 3).map(c => c.title).join(', ')}
                {overdueCards.length > 3 && ` e mais ${overdueCards.length - 3}`}
              </p>
            </div>
              <ChevronRight className="w-4 h-4 text-red-400" />
          </div>
        )}

        {/* Boa performance */}
        {completionRate >= 70 && overdueCards.length === 0 && (
          <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <TrendingUp className="w-4 h-4 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Excelente performance!</p>
              <p className="text-xs text-green-700">
                Sua taxa de conclusão está em {completionRate}% e não há cards atrasados. Continue assim!
              </p>
            </div>
          </div>
        )}

          {/* Risco (preditivo) */}
          {riskCount > 0 && topRisk.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-800">Itens em risco</p>
              <ul className="mt-1 space-y-1">
                {topRisk.slice(0, 3).map((t) => (
                  <li key={t.id} className="text-xs text-amber-700">
                    <strong>{t.score}</strong> — {t.title}
                    {t.reasons?.length ? ` (${t.reasons[0]})` : ''}
                  </li>
                ))}
              </ul>
              {topRisk.length > 3 && (
                <p className="text-xs text-amber-700 mt-1">+{topRisk.length - 3} outros</p>
              )}
            </div>
          )}
      </div>

      {/* Distribuição por fase */}
      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-gray-500 mb-2">Distribuição por fase</p>
        <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
          {columns.map((col, index) => {
            const percentage = totalCards > 0 ? (col.cards.length / totalCards) * 100 : 0;
            if (percentage === 0) return null;
            return (
              <motion.div
                key={col.id}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="h-full"
                style={{ backgroundColor: col.color }}
                title={`${col.title}: ${col.cards.length} cards (${Math.round(percentage)}%)`}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3 mt-2">
          {columns.map(col => (
            <div key={col.id} className="flex items-center gap-1 text-xs">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: col.color }} 
              />
              <span className="text-gray-600">{col.title}</span>
              <span className="text-gray-400">({col.cards.length})</span>
            </div>
          ))}
        </div>
      </div>

        {/* Colaboradores para Elogiar/Cobrar */}
        {allCollaborators.length > 0 && (
      <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-500 mb-2">Colaboradores Ativos</p>
            <div className="flex flex-wrap gap-2">
              {allCollaborators.map(collaborator => {
                const collabCards = columns.flatMap(c => c.cards.filter(card => card.assignees.includes(collaborator)));
                const hasOverdue = collabCards.some(c => c.dueDate && new Date(c.dueDate) < today);
                
                return (
                  <div 
                    key={collaborator}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm">
                      {collaborator.charAt(0)}
                </div>
                <div>
                      <p className="text-sm font-medium text-gray-800">{collaborator}</p>
                      <p className="text-xs text-gray-500">{collabCards.length} cards</p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 w-7 p-0 text-emerald-600 hover:bg-emerald-50"
                        onClick={() => handlePraise(collaborator)}
                        title="Elogiar"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </Button>
                      {hasOverdue && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 w-7 p-0 text-primary hover:bg-primary/10"
                          onClick={() => handleCharge(collaborator, collabCards.filter(c => c.dueDate && new Date(c.dueDate) < today))}
                          title="Cobrar"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </Button>
                      )}
                </div>
              </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Cards */}
      <AnimatePresence>
        {(activeModal === 'overdue' || activeModal === 'pending' || activeModal === 'inProgress') && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[80vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-3 rounded-xl",
                      activeModal === 'overdue' ? 'bg-red-100' : 
                      activeModal === 'pending' ? 'bg-indigo-100' : 'bg-amber-100'
                    )}>
                      {activeModal === 'overdue' ? <AlertTriangle className="w-6 h-6 text-red-600" /> :
                       activeModal === 'pending' ? <Clock className="w-6 h-6 text-indigo-600" /> :
                       <Zap className="w-6 h-6 text-primary" />}
                </div>
                <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {activeModal === 'overdue' ? 'Cards Atrasados' :
                         activeModal === 'pending' ? 'Cards Aguardando' : 'Cards em Andamento'}
                      </h2>
                      <p className="text-sm text-gray-500">{selectedCards.length} demandas</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setActiveModal(null)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="p-6 overflow-auto max-h-[50vh] space-y-3">
                {selectedCards.map((card) => (
                  <div 
                    key={card.id}
                    className={cn(
                      "p-4 rounded-xl border transition-all hover:shadow-md",
                      activeModal === 'overdue' ? 'bg-red-50 border-red-200' :
                      activeModal === 'pending' ? 'bg-indigo-50 border-indigo-200' : 
                      'bg-amber-50 border-amber-200'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{card.title}</h4>
                      <Badge className={cn(
                        "text-white text-xs",
                        card.temperature === 'hot' ? 'bg-red-500' :
                        card.temperature === 'warm' ? 'bg-amber-500' : 'bg-blue-500'
                      )}>
                        {card.temperature === 'hot' ? 'Quente' : card.temperature === 'warm' ? 'Morno' : 'Frio'}
                      </Badge>
                    </div>
                    {card.clientName && (
                      <p className="text-sm text-gray-600 mb-2">Cliente: {card.clientName}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {card.assignees.map((a, i) => (
                          <div 
                            key={i}
                            className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
                            title={a}
                          >
                            {a.charAt(0)}
                          </div>
                        ))}
                        <span className="text-xs text-gray-500">{card.assignees.join(', ')}</span>
                      </div>
                      <div className="flex gap-1">
                        {card.assignees.map((assignee) => (
                          <React.Fragment key={assignee}>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 px-2 text-xs text-emerald-600"
                              onClick={() => handlePraise(assignee)}
                            >
                              <ThumbsUp className="w-3 h-3 mr-1" />
                              Elogiar
                            </Button>
                            {activeModal === 'overdue' && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-7 px-2 text-xs text-primary"
                                onClick={() => handleCharge(assignee, [card])}
                              >
                                <MessageSquare className="w-3 h-3 mr-1" />
                                Cobrar
                              </Button>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Elogio */}
      <AnimatePresence>
        {activeModal === 'praise' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => !isGenerating && setActiveModal(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-100">
                    <ThumbsUp className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Elogiar Colaborador</h2>
                    <p className="text-sm text-gray-500">Mensagem para {selectedCollaborator}</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
                    <p className="text-gray-600">Gerando mensagem com IA...</p>
                  </div>
                ) : messageSent ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
                    <p className="text-xl font-bold text-gray-900">Mensagem Enviada!</p>
                    <p className="text-gray-500 mt-2">O colaborador será notificado.</p>
                  </div>
                ) : (
                  <>
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 mb-4">
                      <p className="whitespace-pre-line text-gray-700">{messageGenerated}</p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handleCopyMessage}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar
                      </Button>
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        onClick={handleSendMessage}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Enviar
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
            </motion.div>
          )}
      </AnimatePresence>

      {/* Modal de Cobrança */}
      <AnimatePresence>
        {activeModal === 'charge' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => !isGenerating && setActiveModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-amber-100">
                    <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Cobrar Colaborador</h2>
                    <p className="text-sm text-gray-500">Mensagem para {selectedCollaborator}</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
                    <p className="text-gray-600">Gerando mensagem com IA...</p>
                  </div>
                ) : messageSent ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <CheckCircle2 className="w-16 h-16 text-primary mb-4" />
                    <p className="text-xl font-bold text-gray-900">Mensagem Enviada!</p>
                    <p className="text-gray-500 mt-2">O colaborador será notificado.</p>
                  </div>
                ) : (
                  <>
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 mb-4">
                      <p className="whitespace-pre-line text-gray-700">{messageGenerated}</p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handleCopyMessage}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar
                      </Button>
                      <Button
                        className="flex-1 bg-primary hover:bg-[#1260b5]"
                        onClick={handleSendMessage}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Enviar
              </Button>
            </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
