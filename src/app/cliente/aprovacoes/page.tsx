'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, X, MessageSquare, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AREA_BOARDS } from '@/lib/kanban/areaBoards'
import { toast } from 'sonner'

// ============================================
// APROVAÇÕES - LAYOUT VERTICAL COMPACTO
// Cards empilhados com scroll, visualização completa no modal
// ============================================

type ApprovalItem = {
  id: string;
  title: string;
  description?: string | null;
  board?: { id: string; area_key?: string | null } | null;
  requested_at: string;
  due_at: string;
  overdue: boolean;
}

function isRisk(dueAtIso: string) {
  const ms = new Date(dueAtIso).getTime() - Date.now();
  return ms > 0 && ms <= 12 * 60 * 60 * 1000;
}

export default function ClientApprovals() {
  const [items, setItems] = useState<ApprovalItem[]>([])
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null)
  const [comment, setComment] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/client/approvals')
        const data = await res.json().catch(() => null)
        if (!res.ok || !data?.success) throw new Error(data?.error || 'Falha ao carregar aprovações')
        setItems((data.approvals || []) as ApprovalItem[])
      } catch (e) {
        console.error(e)
        setItems([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const pendingItems = useMemo(() => items, [items])
  const completedItems = useMemo<ApprovalItem[]>(() => [], [])
  const areaLabelByKey = useMemo(() => new Map<string, string>(AREA_BOARDS.map((b) => [String(b.areaKey), String(b.label)])), [])

  const handleAction = async (id: string, action: 'approve' | 'request_changes') => {
    if (action === 'request_changes' && !comment.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/client/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: id, action, comment: comment.trim() || undefined }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Falha ao enviar aprovação')

      setItems((prev) => prev.filter((x) => x.id !== id))
      setSelectedItem(null)
      setComment('')
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : 'Falha ao enviar')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-[#001533] dark:text-white">Aprovações</h1>
        <p className="text-[#001533]/60 dark:text-white/60 mt-1">
          {loading ? 'Carregando...' : `${pendingItems.length} itens aguardando sua aprovação`}
        </p>
      </header>

      {/* Lista de Aprovações Pendentes */}
      <div className="space-y-3">
        {pendingItems.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-[#001533]/50 rounded-xl border-2 border-[#001533]/10 dark:border-white/10">
            <div className="text-4xl mb-3">🎉</div>
            <p className="text-[#001533]/60 dark:text-white/60">
              Todas as aprovações foram processadas!
            </p>
          </div>
        ) : (
          pendingItems.map((item) => (
            (() => {
              const risk = !item.overdue && isRisk(item.due_at);
              const statusLabel = item.overdue ? 'Atrasado' : risk ? 'Em risco' : 'Dentro do prazo';
              const statusCls = item.overdue ? 'text-red-600' : risk ? 'text-primary' : 'text-emerald-700';
              return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#001533]/50 rounded-xl border-2 border-[#001533]/10 dark:border-white/10 overflow-hidden"
            >
              {/* Card Header - Sempre visível */}
              <div 
                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-[#001533]/5 dark:hover:bg-white/5 transition-colors"
                onClick={() => toggleExpand(item.id)}
              >
                {/* Thumbnail */}
                <div 
                  className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedItem(item)
                  }}
                >
                  <div className="w-full h-full bg-[#001533]/5 dark:bg-white/5 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-[#001533]/40 dark:text-white/40" />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-[#001533] dark:text-white truncate">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs bg-[#1672d6]/10 text-[#1672d6]">
                          {areaLabelByKey.get(String(item.board?.area_key || '')) || 'Equipe'}
                        </Badge>
                        <span className={cn("text-xs", statusCls)}>
                          {statusLabel}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#001533]/50 dark:text-white/50 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        vence {new Date(item.due_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </span>
                      {expandedId === item.id ? (
                        <ChevronUp className="w-5 h-5 text-[#001533]/40" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[#001533]/40" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              <AnimatePresence>
                {expandedId === item.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-2 border-t border-[#001533]/10 dark:border-white/10">
                      {item.description && (
                        <p className="text-sm text-[#001533]/70 dark:text-white/70 mb-4">
                          {item.description}
                        </p>
                      )}
                      
                      {/* Comment Input */}
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={2}
                        className="w-full p-3 text-sm border-2 border-[#001533]/10 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-[#1672d6] focus:border-transparent resize-none bg-[#001533]/5 dark:bg-white/5 text-[#001533] dark:text-white placeholder:text-[#001533]/40"
                        placeholder="Comentários ou ajustes necessários..."
                      />

                      {/* Action Buttons */}
                      <div className="flex gap-3 mt-3">
                        <Button
                          onClick={() => handleAction(item.id, 'request_changes')}
                          variant="outline"
                          className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                          disabled={submitting}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Solicitar Ajustes
                        </Button>
                        <Button
                          onClick={() => handleAction(item.id, 'approve')}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={submitting}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Aprovar
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
              );
            })()
          ))
        )}
      </div>

      {/* Histórico de Aprovações */}
      {/* Histórico de Aprovações
          (v2) aqui entraremos com histórico real baseado em `reference_links.client_approval.history`.
          Por enquanto mantemos só a lista de pendentes (completedItems é vazio).
      */}

      {/* Modal de Visualização - Layout limpo focado no conteúdo */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex"
          >
            {/* Área da Imagem/Vídeo - placeholder (sem mídia real por enquanto) */}
            <div className="flex-1 relative flex items-center justify-center bg-black">
              {/* Close button */}
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 left-4 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-sm"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-white/70 text-center px-8">
                <div className="flex items-center justify-center mb-3">
                  <MessageSquare className="w-10 h-10" />
                </div>
                <p className="text-sm">Preview do arquivo será integrado via anexos (próximo passo).</p>
              </div>
            </div>

            {/* Sidebar de Ações - Painel lateral */}
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className="w-[380px] bg-white dark:bg-[#0a0f1a] flex flex-col h-full"
            >
              {/* Header */}
              <div className="p-6 border-b border-[#001533]/10 dark:border-white/10">
                <Badge className="bg-[#1672d6]/10 text-[#1672d6] mb-3">
                  {(selectedItem.board?.area_key && areaLabelByKey.get(String(selectedItem.board.area_key))) || 'Kanban'}
                </Badge>
                <h2 className="text-xl font-bold text-[#001533] dark:text-white mb-2">
                  {selectedItem.title}
                </h2>
                <p className="text-sm text-[#001533]/60 dark:text-white/60">
                  {selectedItem.description}
                </p>
                <div className="flex items-center gap-2 mt-3 text-xs text-[#001533]/50 dark:text-white/50">
                  <span>{selectedItem.overdue ? 'Atrasado' : 'Dentro do prazo'}</span>
                  <span>•</span>
                  <span>Vence {new Date(selectedItem.due_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              {/* Área de Comentário */}
              <div className="flex-1 p-6 overflow-y-auto">
                <label className="block text-sm font-medium text-[#001533] dark:text-white mb-2">
                  Comentários ou Ajustes
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={6}
                  className="w-full p-4 text-sm border-2 border-[#001533]/10 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-[#1672d6] focus:border-transparent resize-none bg-[#001533]/5 dark:bg-white/5 text-[#001533] dark:text-white placeholder:text-[#001533]/40"
                  placeholder="Descreva aqui os ajustes necessários ou deixe em branco para aprovar..."
                />
              </div>

              {/* Botões de Ação */}
              <div className="p-6 border-t border-[#001533]/10 dark:border-white/10 space-y-3">
                <Button
                  onClick={() => handleAction(selectedItem.id, 'approve')}
                  size="lg"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12"
                  disabled={submitting}
                >
                  <Check className="w-5 h-5 mr-2" />
                  Aprovar Material
                </Button>
                <Button
                  onClick={() => handleAction(selectedItem.id, 'request_changes')}
                  variant="outline"
                  size="lg"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50 h-12"
                  disabled={submitting}
                >
                  <X className="w-5 h-5 mr-2" />
                  Solicitar Ajustes
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
