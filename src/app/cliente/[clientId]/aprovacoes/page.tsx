'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Instagram,
  Facebook,
  Linkedin,
  Loader2,
  MessageSquare,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import { ConfirmModal } from '@/components/ui';
import { PostPreview } from '@/components/social/PostPreview';

interface PendingPost {
  id: string;
  copy: string;
  hashtags: string[];
  cta?: string;
  platforms: string[];
  scheduled_at?: string;
  status: string;
  created_at: string;
}

const PLATFORM_ICONS: Record<string, React.ComponentType<any>> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
};

export default function ClientApprovalPage() {
  const params = useParams();
  const clientId = params.clientId as string;

  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PendingPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<PendingPost | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadPendingPosts();
  }, [clientId]);

  const loadPendingPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/social/publish?client_id=${clientId}&status=pending_approval`);
      const data = await response.json();
      if (response.ok) {
        // Filter only posts waiting for client approval
        const clientPending = (data.posts || []).filter(
          (p: any) => p.approval_flow_step === 'client' && p.status === 'pending_approval'
        );
        setPosts(clientPending);
      }
    } catch (e) {
      console.error('Error loading posts:', e);
      toast.error('Erro ao carregar posts');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (postId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/social/publish', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          action: 'approve',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Post aprovado com sucesso! 🎉');
        setShowPreview(false);
        setSelectedPost(null);
        loadPendingPosts();
      } else {
        throw new Error(data.error || 'Erro ao aprovar');
      }
    } catch (e: any) {
      toast.error(e.message || 'Erro ao aprovar');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPost) return;
    if (!rejectReason.trim()) {
      toast.error('Por favor, informe o motivo da reprovação');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/social/publish', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: selectedPost.id,
          action: 'reject',
          reason: rejectReason,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Post reprovado. A equipe foi notificada.');
        setShowRejectModal(false);
        setShowPreview(false);
        setSelectedPost(null);
        setRejectReason('');
        loadPendingPosts();
      } else {
        throw new Error(data.error || 'Erro ao reprovar');
      }
    } catch (e: any) {
      toast.error(e.message || 'Erro ao reprovar');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--primary-500)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--warning-100)' }}
          >
            <Clock className="w-7 h-7" style={{ color: 'var(--warning-600)' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Aprovações
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              {posts.length} post{posts.length !== 1 ? 's' : ''} aguardando sua aprovação
            </p>
          </div>
        </div>

        {/* Posts List */}
        {posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border p-12 text-center"
            style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
          >
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--success-300)' }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Tudo aprovado! 🎉
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Não há posts aguardando sua aprovação no momento.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl border p-5"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
              >
                {/* Post header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {post.platforms.map((p) => {
                      const Icon = PLATFORM_ICONS[p];
                      return Icon ? (
                        <div
                          key={p}
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: 'var(--bg-secondary)' }}
                        >
                          <Icon className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                        </div>
                      ) : null;
                    })}
                  </div>
                  {post.scheduled_at && (
                    <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      <Calendar className="w-4 h-4" />
                      {new Date(post.scheduled_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  )}
                </div>

                {/* Post content */}
                <div
                  className="p-4 rounded-xl mb-4"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                    {post.copy}
                  </p>
                  {post.hashtags && post.hashtags.length > 0 && (
                    <p className="text-sm mt-2" style={{ color: 'var(--primary-600)' }}>
                      {post.hashtags.join(' ')}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSelectedPost(post);
                      setShowPreview(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                  >
                    <Eye className="w-4 h-4" />
                    Ver Preview
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedPost(post);
                        setShowRejectModal(true);
                      }}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border disabled:opacity-50"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--error-300)',
                        color: 'var(--error-600)',
                      }}
                    >
                      <ThumbsDown className="w-4 h-4" />
                      Reprovar
                    </button>
                    <button
                      onClick={() => handleApprove(post.id)}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                      style={{ backgroundColor: 'var(--success-500)' }}
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ThumbsUp className="w-4 h-4" />
                      )}
                      Aprovar
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Preview Modal */}
        <AnimatePresence>
          {showPreview && selectedPost && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowPreview(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Preview do Post
                </h3>

                <PostPreview
                  platform={selectedPost.platforms[0] as any || 'instagram'}
                  accountName="Sua Conta"
                  copy={selectedPost.copy}
                  hashtags={selectedPost.hashtags}
                />

                <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-light)' }}>
                  <button
                    onClick={() => {
                      setShowPreview(false);
                      setShowRejectModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                    style={{ color: 'var(--error-600)' }}
                  >
                    <ThumbsDown className="w-4 h-4" />
                    Reprovar
                  </button>
                  <button
                    onClick={() => handleApprove(selectedPost.id)}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                    style={{ backgroundColor: 'var(--success-500)' }}
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ThumbsUp className="w-4 h-4" />
                    )}
                    Aprovar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reject Modal */}
        <ConfirmModal
          isOpen={showRejectModal}
          onClose={() => {
            if (!actionLoading) {
              setShowRejectModal(false);
              setRejectReason('');
            }
          }}
          onConfirm={handleReject}
          title="Reprovar Post"
          message={
            <div className="space-y-4">
              <p style={{ color: 'var(--text-secondary)' }}>
                Por favor, informe o motivo da reprovação para que a equipe possa fazer os ajustes necessários.
              </p>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Motivo *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ex: A imagem não está de acordo com a identidade visual..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-light)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>
          }
          confirmText="Reprovar"
          cancelText="Cancelar"
          variant="danger"
          loading={actionLoading}
        />
      </div>
    </div>
  );
}
