'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Calendar, User, Tag, Paperclip, MessageSquare, Clock,
  AlertCircle, Edit2, Trash2, Save, Upload, CheckSquare, FileText,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { DbTaskPriority, DbTaskStatus, KanbanCard } from '@/lib/kanban/types'
import { fetchProfileByAuthId } from '@/lib/messaging/userProfiles'

interface CardModalProps {
  card: KanbanCard | null
  isOpen: boolean
  onClose: () => void
  onSave: (card: KanbanCard) => void | Promise<void>
  onDelete: (cardId: string) => void
  isSuperAdmin?: boolean
}

export function CardModal({ card, isOpen, onClose, onSave, onDelete, isSuperAdmin }: CardModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedCard, setEditedCard] = useState<KanbanCard | null>(card)
  const [newComment, setNewComment] = useState('')
  const [userRole, setUserRole] = useState<string | null>(null)
  const [canDelete, setCanDelete] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [taskAging, setTaskAging] = useState<{ days: number, status: 'normal' | 'warning' | 'critical' } | null>(null)

  // Atualizar estado interno quando card muda
  useEffect(() => {
    setEditedCard(card)
    if (card) {
        calculateTaskAging(card)
    }
  }, [card])

  useEffect(() => {
    const checkPermissions = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const profile = await fetchProfileByAuthId(supabase as any, user.id)
        if (profile) {
          const role = String((profile as any).user_type || (profile as any).role || '')
          setUserRole(role)
          setCanDelete(role === 'super_admin' || role === 'admin' || !!isSuperAdmin)
        }
      }
    }
    checkPermissions()
  }, [isSuperAdmin])

  const calculateTaskAging = (currentCard: KanbanCard) => {
      if (!currentCard.columnEnteredAt) return;

      const enteredAt = new Date(currentCard.columnEnteredAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - enteredAt.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let status: 'normal' | 'warning' | 'critical' = 'normal';
      if (diffDays > 5) status = 'critical';
      else if (diffDays > 3) status = 'warning';

      setTaskAging({ days: diffDays, status });
  }

  if (!card || !editedCard) return null

  // Lógica de validação para movimentação
  const validateMove = (targetColumn: string) => {
    // Regras de Negócio
    if (targetColumn === 'done') {
        // Exemplo: Para mover para Done, precisa ter anexo ou link se for tarefa de Design
        if (editedCard.area === 'Design' && editedCard.attachments === 0 && !editedCard.description?.includes('http')) {
            return 'Para concluir tarefas de Design, é obrigatório anexar o arquivo ou link do projeto.'
        }
    }
    
    if (targetColumn !== 'backlog' && !editedCard.description) {
        return 'É necessário preencher a descrição antes de iniciar a tarefa.'
    }

    return null
  }

  const handleSave = async () => {
    if (!editedCard) return

    // Validar mudança de coluna
    if (editedCard.column !== card.column) {
        const error = validateMove(editedCard.column)
        if (error) {
            setValidationError(error)
            toast.error(error)
            return
        }
        // Atualizar timestamp se mudou de coluna
        editedCard.columnEnteredAt = new Date();
    }

    try {
      await onSave(editedCard)
    } catch (e) {
      console.error('Erro ao salvar card:', e)
      toast.error('Erro ao salvar tarefa')
      return
    }
    setIsEditing(false)
    setValidationError(null)
  }

  const handleDelete = () => {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
      onDelete(card.id)
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden bg-white flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3 flex-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedCard.title}
                      onChange={(e) => setEditedCard({ ...editedCard, title: e.target.value })}
                      className="text-xl font-bold flex-1 px-2 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  ) : (
                    <div className="flex flex-col">
                        <h2 className="text-xl font-bold text-gray-900">
                        {editedCard.title}
                        </h2>
                        {/* Task Aging Indicator */}
                        {taskAging && (
                            <div className={`flex items-center gap-1 text-xs font-medium mt-1 ${
                                taskAging.status === 'critical' ? 'text-red-600' : 
                                taskAging.status === 'warning' ? 'text-yellow-600' : 'text-gray-500'
                            }`}>
                                <Clock className="w-3 h-3" />
                                {taskAging.days} dias nesta fase
                                {taskAging.status === 'critical' && <span className="bg-red-100 text-red-700 px-1 rounded ml-1">Gargalo</span>}
                            </div>
                        )}
                    </div>
                  )}
                  
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                      editedCard.priority === 'urgent' ? 'bg-red-50 text-red-700 border-red-200' :
                      editedCard.priority === 'high' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      editedCard.priority === 'medium' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-green-50 text-green-700 border-green-200'
                  }`}>
                    {editedCard.priority === 'urgent' && '🔴 Urgente'}
                    {editedCard.priority === 'high' && '🟡 Alta'}
                    {editedCard.priority === 'medium' && '🔵 Média'}
                    {editedCard.priority === 'low' && '🟢 Baixa'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSave}
                        className="p-2 rounded-lg hover:bg-green-600 bg-green-500 text-white transition-all shadow-sm"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditedCard(card)
                          setIsEditing(false)
                          setValidationError(null)
                        }}
                        className="p-2 rounded-lg hover:bg-gray-200 bg-gray-100 text-gray-600 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="p-2 rounded-lg hover:bg-gray-200 bg-gray-100 text-gray-600 transition-all"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {canDelete ? (
                        <button
                          onClick={handleDelete}
                          className="p-2 rounded-lg hover:bg-red-600 bg-red-500 text-white transition-all shadow-sm"
                          title="Deletar (apenas admin)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <div 
                          className="p-2 rounded-lg opacity-30 cursor-not-allowed bg-gray-100 text-gray-400"
                          title="Apenas admin pode deletar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </div>
                      )}
                      <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-200 bg-gray-100 text-gray-600 transition-all"
                        title="Fechar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Validation Error Message */}
              {validationError && (
                <div className="bg-red-50 px-6 py-3 border-b border-red-100 flex items-center gap-2 text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {validationError}
                </div>
              )}

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-3 gap-6 h-full">
                  {/* Left Column - Main Content */}
                  <div className="col-span-2 space-y-6">
                    {/* Description */}
                    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        Descrição
                      </label>
                      {isEditing ? (
                        <textarea
                          value={editedCard.description || ''}
                          onChange={(e) => setEditedCard({ ...editedCard, description: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[120px] text-gray-700"
                          placeholder="Adicione uma descrição detalhada..."
                        />
                      ) : (
                        <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">
                          {editedCard.description || 'Sem descrição'}
                        </p>
                      )}
                    </div>

                    {/* Checklist (Mockup for Quality Gate) */}
                    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                            <CheckSquare className="w-4 h-4 text-green-500" />
                            Checklist de Qualidade
                        </label>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
                                <span className="text-sm text-gray-600">Briefing revisado</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
                                <span className="text-sm text-gray-600">Arquivos anexados</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
                                <span className="text-sm text-gray-600">Aprovado pelo gestor</span>
                            </div>
                        </div>
                    </div>

                    {/* Attachments */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                        <Paperclip className="w-4 h-4 text-gray-500" />
                        Anexos ({editedCard.attachments})
                      </label>
                      <button
                        className="w-full px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 flex items-center justify-center gap-2 transition-all text-gray-500 hover:text-indigo-600"
                      >
                        <Upload className="w-4 h-4" />
                        <span className="text-sm">Adicionar anexo ou Link do Drive</span>
                      </button>
                    </div>

                    {/* Comments */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                        <MessageSquare className="w-4 h-4 text-gray-500" />
                        Comentários ({editedCard.comments})
                      </label>
                      
                      <div className="flex gap-2 mb-4">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Adicione um comentário..."
                        />
                        <button
                          onClick={() => {
                            if (newComment.trim()) {
                              setNewComment('')
                              toast.success('Comentário adicionado')
                            }
                          }}
                          className="px-4 py-2 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                        >
                          Enviar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Meta Info */}
                  <div className="space-y-6">
                    {/* Status */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <label className="text-xs font-semibold text-gray-500 mb-2 block uppercase tracking-wider">
                        STATUS
                      </label>
                      {isEditing ? (
                        <select
                          value={editedCard.column}
                          onChange={(e) =>
                            setEditedCard({ ...editedCard, column: e.target.value as DbTaskStatus })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="backlog">Backlog</option>
                          <option value="todo">A Fazer</option>
                          <option value="in_progress">Em Progresso</option>
                          <option value="in_review">Em Revisão</option>
                          <option value="blocked">Bloqueado</option>
                          <option value="cancelled">Cancelado</option>
                          <option value="done">Concluído</option>
                        </select>
                      ) : (
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                                editedCard.column === 'done' ? 'bg-green-500' : 
                                editedCard.column === 'in_progress' ? 'bg-blue-500' : 
                                editedCard.column === 'in_review' ? 'bg-purple-500' :
                                editedCard.column === 'blocked' ? 'bg-red-500' :
                                editedCard.column === 'cancelled' ? 'bg-gray-500' :
                                'bg-gray-400'
                            }`}></div>
                            <span className="text-sm font-medium text-gray-700 capitalize">
                                {editedCard.column}
                            </span>
                        </div>
                      )}
                    </div>

                    {/* Priority */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <label className="text-xs font-semibold text-gray-500 mb-2 block uppercase tracking-wider">
                        PRIORIDADE
                      </label>
                      {isEditing ? (
                        <select
                          value={editedCard.priority}
                          onChange={(e) =>
                            setEditedCard({ ...editedCard, priority: e.target.value as DbTaskPriority })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="urgent">🔴 Urgente</option>
                          <option value="high">🟡 Alta</option>
                          <option value="medium">🔵 Média</option>
                          <option value="low">🟢 Baixa</option>
                        </select>
                      ) : (
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {editedCard.priority}
                        </span>
                      )}
                    </div>

                    {/* Due Date */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <label className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                        <Calendar className="w-3 h-3" />
                        PRAZO
                      </label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editedCard.dueDate ? new Date(editedCard.dueDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => setEditedCard({ ...editedCard, dueDate: new Date(e.target.value) })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      ) : (
                        <div className="flex flex-col">
                            <span className={`text-sm font-medium ${
                                editedCard.dueDate && new Date(editedCard.dueDate) < new Date() ? 'text-red-600' : 'text-gray-700'
                            }`}>
                            {editedCard.dueDate ? new Date(editedCard.dueDate).toLocaleDateString('pt-BR') : 'Sem prazo'}
                            </span>
                            {editedCard.dueDate && new Date(editedCard.dueDate) < new Date() && (
                                <span className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                    <AlertTriangle className="w-3 h-3" /> Atrasado
                                </span>
                            )}
                        </div>
                      )}
                    </div>

                    {/* Assignees */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <label className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                        <User className="w-3 h-3" />
                        RESPONSÁVEIS
                      </label>
                      <div className="space-y-2">
                        {editedCard.assignees.map((assignee, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs text-indigo-700 font-bold">
                                {assignee.charAt(0)}
                            </div>
                            <span className="text-sm text-gray-700">{assignee}</span>
                          </div>
                        ))}
                        {isEditing && (
                            <button className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                                <User className="w-3 h-3" /> Adicionar
                            </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
