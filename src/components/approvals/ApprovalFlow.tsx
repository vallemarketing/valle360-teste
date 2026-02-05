'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, XCircle, Clock, MessageSquare, Eye,
  AlertTriangle, User,
  Calendar, FileText, Image, Video
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ApprovalItem {
  id: string;
  title: string;
  description?: string;
  type: 'design' | 'video' | 'post' | 'document' | 'website';
  status: 'pending' | 'approved' | 'rejected' | 'revision';
  clientId: string;
  clientName: string;
  createdBy: string;
  createdByName: string;
  createdByArea: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  dueDate?: Date | string;
  attachments: string[];
  thumbnail?: string;
  comments: ApprovalComment[];
  priority: 'high' | 'normal' | 'low';
}

interface ApprovalComment {
  id: string;
  text: string;
  author: string;
  authorName: string;
  isClient: boolean;
  createdAt: Date | string;
}

interface ApprovalFlowProps {
  items?: ApprovalItem[];
  viewMode?: 'all' | 'pending' | 'approved' | 'rejected';
  onApprove?: (itemId: string, comment?: string) => void;
  onReject?: (itemId: string, comment: string) => void;
  onRequestRevision?: (itemId: string, comment: string) => void;
  onViewDetails?: (item: ApprovalItem) => void;
  isClientView?: boolean;
  readOnly?: boolean;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  design: <Image className="w-5 h-5" />,
  video: <Video className="w-5 h-5" />,
  post: <FileText className="w-5 h-5" />,
  document: <FileText className="w-5 h-5" />,
  website: <FileText className="w-5 h-5" />
};

const TYPE_LABELS: Record<string, string> = {
  design: 'Design',
  video: 'Vídeo',
  post: 'Post',
  document: 'Documento',
  website: 'Website'
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
  pending: { 
    color: '#F59E0B', 
    bg: '#FEF3C7', 
    label: 'Aguardando', 
    icon: <Clock className="w-4 h-4" /> 
  },
  approved: { 
    color: '#10B981', 
    bg: '#D1FAE5', 
    label: 'Aprovado', 
    icon: <CheckCircle className="w-4 h-4" /> 
  },
  rejected: { 
    color: '#EF4444', 
    bg: '#FEE2E2', 
    label: 'Rejeitado', 
    icon: <XCircle className="w-4 h-4" /> 
  },
  revision: { 
    color: '#8B5CF6', 
    bg: '#EDE9FE', 
    label: 'Em Revisão', 
    icon: <AlertTriangle className="w-4 h-4" /> 
  }
};

export function ApprovalFlow({
  items = [],
  viewMode = 'all',
  onApprove,
  onReject,
  onRequestRevision,
  onViewDetails,
  isClientView = false,
  readOnly = false
}: ApprovalFlowProps) {
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const [comment, setComment] = useState('');
  const [showCommentModal, setShowCommentModal] = useState<{ type: 'approve' | 'reject' | 'revision'; item: ApprovalItem } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    // ao abrir/fechar modal, limpa erro e comentário
    setModalError(null);
    setComment('');
  }, [showCommentModal?.type, showCommentModal?.item?.id]);

  // Filter items based on viewMode
  const filteredItems = items.filter(item => {
    if (viewMode === 'all') return true;
    return item.status === viewMode;
  });

  const handleApprove = (item: ApprovalItem) => {
    onApprove?.(item.id, comment);
    setShowCommentModal(null);
    setComment('');
  };

  const handleReject = (item: ApprovalItem) => {
    if (!comment.trim()) {
      setModalError('Por favor, adicione um comentário explicando a rejeição.');
      return;
    }
    onReject?.(item.id, comment);
    setShowCommentModal(null);
    setComment('');
  };

  const handleRevision = (item: ApprovalItem) => {
    if (!comment.trim()) {
      setModalError('Por favor, adicione um comentário com as alterações necessárias.');
      return;
    }
    onRequestRevision?.(item.id, comment);
    setShowCommentModal(null);
    setComment('');
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          label="Pendentes" 
          value={items.filter(i => i.status === 'pending').length}
          color="#F59E0B"
        />
        <StatCard 
          label="Aprovados" 
          value={items.filter(i => i.status === 'approved').length}
          color="#10B981"
        />
        <StatCard 
          label="Rejeitados" 
          value={items.filter(i => i.status === 'rejected').length}
          color="#EF4444"
        />
        <StatCard 
          label="Em Revisão" 
          value={items.filter(i => i.status === 'revision').length}
          color="#8B5CF6"
        />
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {filteredItems.map((item, index) => {
          const status = STATUS_CONFIG[item.status];
          const isOverdue = item.dueDate && new Date(item.dueDate) < new Date() && item.status === 'pending';

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-xl border overflow-hidden"
              style={{ 
                backgroundColor: 'var(--bg-primary)',
                borderColor: isOverdue ? 'var(--error-400)' : 'var(--border-light)'
              }}
            >
              <div className="flex items-stretch">
                {/* Thumbnail */}
                {item.thumbnail && (
                  <div className="w-32 h-32 flex-shrink-0">
                    <img 
                      src={item.thumbnail} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Type & Status */}
                      <div className="flex items-center gap-2 mb-2">
                        <span 
                          className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                          style={{ 
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {TYPE_ICONS[item.type]}
                          {TYPE_LABELS[item.type]}
                        </span>
                        <span 
                          className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                          style={{ backgroundColor: status.bg, color: status.color }}
                        >
                          {status.icon}
                          {status.label}
                        </span>
                        {isOverdue && (
                          <span 
                            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                            style={{ backgroundColor: 'var(--error-100)', color: 'var(--error-700)' }}
                          >
                            <AlertTriangle className="w-3 h-3" />
                            Atrasado
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 
                        className="font-semibold mb-1"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {item.title}
                      </h3>

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {isClientView ? item.createdByName : item.clientName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: ptBR })}
                        </span>
                        {item.comments.length > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {item.comments.length} comentários
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          onViewDetails?.(item);
                        }}
                        className="p-2 rounded-lg transition-colors"
                        style={{ backgroundColor: 'var(--bg-secondary)' }}
                      >
                        <Eye className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                      </button>

                      {!readOnly && item.status === 'pending' && onApprove && onReject && onRequestRevision && (
                        <>
                          <button
                            onClick={() => setShowCommentModal({ type: 'approve', item })}
                            className="p-2 rounded-lg transition-colors text-white"
                            style={{ backgroundColor: 'var(--success-500)' }}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowCommentModal({ type: 'revision', item })}
                            className="p-2 rounded-lg transition-colors text-white"
                            style={{ backgroundColor: 'var(--purple-500)' }}
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowCommentModal({ type: 'reject', item })}
                            className="p-2 rounded-lg transition-colors text-white"
                            style={{ backgroundColor: 'var(--error-500)' }}
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle 
              className="w-16 h-16 mx-auto mb-4 opacity-20"
              style={{ color: 'var(--text-tertiary)' }}
            />
            <p style={{ color: 'var(--text-secondary)' }}>
              Nenhuma aprovação {viewMode !== 'all' ? STATUS_CONFIG[viewMode]?.label.toLowerCase() : ''} encontrada
            </p>
          </div>
        )}
      </div>

      {/* Comment Modal */}
      <AnimatePresence>
        {showCommentModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCommentModal(null)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 rounded-2xl shadow-2xl z-50"
              style={{ backgroundColor: 'var(--bg-primary)' }}
            >
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                {showCommentModal.type === 'approve' && 'Aprovar Item'}
                {showCommentModal.type === 'reject' && 'Rejeitar Item'}
                {showCommentModal.type === 'revision' && 'Solicitar Revisão'}
              </h3>

              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                {showCommentModal.item.title}
              </p>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  showCommentModal.type === 'approve' 
                    ? 'Comentário opcional...' 
                    : 'Adicione um comentário explicando...'
                }
                rows={4}
                className="w-full px-4 py-3 rounded-xl border resize-none"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-light)',
                  color: 'var(--text-primary)'
                }}
              />

              {modalError && (
                <p className="text-sm mt-2" style={{ color: 'var(--error-600)' }}>
                  {modalError}
                </p>
              )}

              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => setShowCommentModal(null)}
                  className="flex-1 px-4 py-2 rounded-xl font-medium transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (showCommentModal.type === 'approve') handleApprove(showCommentModal.item);
                    if (showCommentModal.type === 'reject') handleReject(showCommentModal.item);
                    if (showCommentModal.type === 'revision') handleRevision(showCommentModal.item);
                  }}
                  className="flex-1 px-4 py-2 rounded-xl font-medium text-white transition-colors"
                  style={{ 
                    backgroundColor: 
                      showCommentModal.type === 'approve' ? 'var(--success-500)' :
                      showCommentModal.type === 'reject' ? 'var(--error-500)' :
                      'var(--purple-500)'
                  }}
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div 
      className="p-4 rounded-xl"
      style={{ 
        backgroundColor: `${color}10`,
        border: `1px solid ${color}30`
      }}
    >
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</p>
    </div>
  );
}

export default ApprovalFlow;









