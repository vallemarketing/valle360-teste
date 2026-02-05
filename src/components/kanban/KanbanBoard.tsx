'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Plus, MoreVertical, Clock, User, Tag, Paperclip,
  MessageSquare, AlertTriangle, Calendar, CheckCircle,
  Edit3, Trash2, Eye, ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { subscribeToKanbanTasks } from '@/lib/realtime';

// Types
interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  column: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  assignees: string[];
  assigneeNames?: string[];
  tags: string[];
  dueDate?: Date;
  attachments: number;
  comments: number;
  createdAt: Date;
  area?: string;
  columnEnteredAt?: Date;
  clientName?: string;
}

interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  cards: KanbanCard[];
  wipLimit?: number;
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  onCardMove?: (cardId: string, fromColumn: string, toColumn: string) => void;
  onCardClick?: (card: KanbanCard) => void;
  onAddCard?: (columnId: string) => void;
  onEditCard?: (card: KanbanCard) => void;
  onDeleteCard?: (cardId: string) => void;
  showWipAlerts?: boolean;
  showAgingAlerts?: boolean;
  agingThresholdDays?: number;
}

const PRIORITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  urgent: { bg: '#FEE2E2', text: '#DC2626', border: '#EF4444' },
  high: { bg: '#FEF3C7', text: '#D97706', border: '#F59E0B' },
  normal: { bg: '#DBEAFE', text: '#2563EB', border: '#3B82F6' },
  low: { bg: '#F3F4F6', text: '#6B7280', border: '#9CA3AF' }
};

const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'Urgente',
  high: 'Alta',
  normal: 'Normal',
  low: 'Baixa'
};

export function KanbanBoard({
  columns: initialColumns,
  onCardMove,
  onCardClick,
  onAddCard,
  onEditCard,
  onDeleteCard,
  showWipAlerts = true,
  showAgingAlerts = true,
  agingThresholdDays = 3
}: KanbanBoardProps) {
  const [columns, setColumns] = useState(initialColumns);
  const [draggedCard, setDraggedCard] = useState<KanbanCard | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);

  // Update columns when initialColumns change
  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToKanbanTasks((payload) => {
      // Refresh columns on any change
      window.dispatchEvent(new CustomEvent('kanban-refresh'));
    });

    return unsubscribe;
  }, []);

  // Calculate days in column
  const getDaysInColumn = (card: KanbanCard): number => {
    if (!card.columnEnteredAt) return 0;
    const now = new Date();
    const entered = new Date(card.columnEnteredAt);
    const diffTime = Math.abs(now.getTime() - entered.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Check if card is aging
  const isCardAging = (card: KanbanCard): boolean => {
    return getDaysInColumn(card) >= agingThresholdDays;
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, card: KanbanCard) => {
    setDraggedCard(card);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('cardId', card.id);
    e.dataTransfer.setData('fromColumn', card.column);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  // Handle drag leave
  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, toColumnId: string) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('cardId');
    const fromColumnId = e.dataTransfer.getData('fromColumn');

    if (fromColumnId !== toColumnId) {
      // Update local state
      setColumns(prev => {
        const newColumns = [...prev];
        const fromColumn = newColumns.find(c => c.id === fromColumnId);
        const toColumn = newColumns.find(c => c.id === toColumnId);

        if (fromColumn && toColumn) {
          const cardIndex = fromColumn.cards.findIndex(c => c.id === cardId);
          if (cardIndex !== -1) {
            const [card] = fromColumn.cards.splice(cardIndex, 1);
            card.column = toColumnId;
            card.columnEnteredAt = new Date();
            toColumn.cards.push(card);
          }
        }

        return newColumns;
      });

      // Notify parent
      onCardMove?.(cardId, fromColumnId, toColumnId);
    }

    setDraggedCard(null);
    setDragOverColumn(null);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedCard(null);
    setDragOverColumn(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[600px]">
      {columns.map((column) => {
        const isOverWipLimit = column.wipLimit && column.cards.length > column.wipLimit;
        const isDropTarget = dragOverColumn === column.id;

        return (
          <div
            key={column.id}
            className="flex-shrink-0 w-80"
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div 
              className="flex items-center justify-between p-3 rounded-t-xl"
              style={{ backgroundColor: `${column.color}20` }}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: column.color }}
                />
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {column.title}
                </h3>
                <span 
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: isOverWipLimit ? 'var(--error-100)' : 'var(--bg-tertiary)',
                    color: isOverWipLimit ? 'var(--error-700)' : 'var(--text-secondary)'
                  }}
                >
                  {column.cards.length}
                  {column.wipLimit && `/${column.wipLimit}`}
                </span>
              </div>

              <button
                onClick={() => onAddCard?.(column.id)}
                className="p-1 rounded-lg transition-colors hover:bg-white/50"
              >
                <Plus className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>

            {/* WIP Alert */}
            {showWipAlerts && isOverWipLimit && (
              <div 
                className="flex items-center gap-2 px-3 py-2 text-xs"
                style={{ backgroundColor: 'var(--error-100)', color: 'var(--error-700)' }}
              >
                <AlertTriangle className="w-3 h-3" />
                Limite WIP excedido!
              </div>
            )}

            {/* Cards Container */}
            <div 
              className={`p-2 space-y-2 rounded-b-xl min-h-[400px] transition-colors ${
                isDropTarget ? 'ring-2' : ''
              }`}
              style={{ 
                backgroundColor: 'var(--bg-secondary)',
                borderColor: isDropTarget ? column.color : 'transparent'
              }}
            >
              <AnimatePresence>
                {column.cards.map((card) => (
                  <KanbanCardComponent
                    key={card.id}
                    card={card}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onClick={() => {
                      setSelectedCard(card);
                      onCardClick?.(card);
                    }}
                    onEdit={() => onEditCard?.(card)}
                    onDelete={() => onDeleteCard?.(card.id)}
                    isAging={showAgingAlerts && isCardAging(card)}
                    daysInColumn={getDaysInColumn(card)}
                    isDragging={draggedCard?.id === card.id}
                  />
                ))}
              </AnimatePresence>

              {/* Empty State */}
              {column.cards.length === 0 && (
                <div 
                  className="flex flex-col items-center justify-center py-8 text-center"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  <CheckCircle className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma tarefa</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Kanban Card Component
function KanbanCardComponent({
  card,
  onDragStart,
  onDragEnd,
  onClick,
  onEdit,
  onDelete,
  isAging,
  daysInColumn,
  isDragging
}: {
  card: KanbanCard;
  onDragStart: (e: React.DragEvent, card: KanbanCard) => void;
  onDragEnd: () => void;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isAging: boolean;
  daysInColumn: number;
  isDragging: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const priority = PRIORITY_COLORS[card.priority];

  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      draggable
      onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, card)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
        isAging ? 'ring-2 ring-primary400' : ''
      }`}
      style={{ 
        backgroundColor: 'var(--bg-primary)',
        borderColor: isAging ? 'var(--warning-500)' : 'var(--border-light)'
      }}
    >
      {/* Priority & Menu */}
      <div className="flex items-center justify-between mb-2">
        <span 
          className="px-2 py-0.5 rounded text-xs font-medium"
          style={{ 
            backgroundColor: priority.bg,
            color: priority.text,
            border: `1px solid ${priority.border}`
          }}
        >
          {PRIORITY_LABELS[card.priority]}
        </span>

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 rounded-lg transition-colors hover:bg-gray-100"
          >
            <MoreVertical className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-full mt-1 w-32 rounded-lg shadow-lg border z-10"
                style={{ 
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border-light)'
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-gray-50"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <Edit3 className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-red-50"
                  style={{ color: 'var(--error-600)' }}
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Aging Alert */}
      {isAging && (
        <div 
          className="flex items-center gap-1 text-xs mb-2 px-2 py-1 rounded"
          style={{ backgroundColor: 'var(--warning-100)', color: 'var(--warning-700)' }}
        >
          <AlertTriangle className="w-3 h-3" />
          {daysInColumn} dias nesta coluna
        </div>
      )}

      {/* Title */}
      <h4 
        className="font-medium text-sm mb-2 line-clamp-2"
        style={{ color: 'var(--text-primary)' }}
      >
        {card.title}
      </h4>

      {/* Client Name */}
      {card.clientName && (
        <p className="text-xs mb-2" style={{ color: 'var(--primary-500)' }}>
          {card.clientName}
        </p>
      )}

      {/* Description */}
      {card.description && (
        <p 
          className="text-xs mb-3 line-clamp-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          {card.description}
        </p>
      )}

      {/* Tags */}
      {card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {card.tags.slice(0, 3).map((tag) => (
            <span 
              key={tag}
              className="px-2 py-0.5 rounded text-xs"
              style={{ 
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)'
              }}
            >
              {tag}
            </span>
          ))}
          {card.tags.length > 3 && (
            <span 
              className="px-2 py-0.5 rounded text-xs"
              style={{ color: 'var(--text-tertiary)' }}
            >
              +{card.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        {/* Due Date */}
        {card.dueDate && (
          <div 
            className="flex items-center gap-1"
            style={{ color: isOverdue ? 'var(--error-500)' : 'var(--text-tertiary)' }}
          >
            <Calendar className="w-3 h-3" />
            {new Date(card.dueDate).toLocaleDateString('pt-BR')}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3" style={{ color: 'var(--text-tertiary)' }}>
          {card.attachments > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip className="w-3 h-3" />
              {card.attachments}
            </div>
          )}
          {card.comments > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {card.comments}
            </div>
          )}
        </div>
      </div>

      {/* Assignees */}
      {card.assignees.length > 0 && (
        <div className="flex items-center gap-1 mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-light)' }}>
          <div className="flex -space-x-2">
            {card.assignees.slice(0, 3).map((assignee, i) => (
              <img
                key={i}
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${assignee}`}
                alt=""
                className="w-6 h-6 rounded-full border-2"
                style={{ borderColor: 'var(--bg-primary)' }}
              />
            ))}
          </div>
          {card.assigneeNames && card.assigneeNames.length > 0 && (
            <span className="text-xs ml-2" style={{ color: 'var(--text-tertiary)' }}>
              {card.assigneeNames[0]}
              {card.assigneeNames.length > 1 && ` +${card.assigneeNames.length - 1}`}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default KanbanBoard;









