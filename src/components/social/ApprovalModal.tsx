'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  X,
  Check,
  Ban,
  Edit3,
  Eye,
  Save,
  Loader2,
  Hash,
  Target,
  Image as ImageIcon,
  Calendar,
  AlertCircle,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Youtube,
} from 'lucide-react';

interface DraftMetadata {
  hashtags?: string[];
  cta?: string;
  visualPrompt?: string;
  selectedNetworks?: string[];
  scheduledAt?: string;
  client_id?: string;
  area_key?: string;
  stage_key?: string;
}

interface Draft {
  id: string;
  action_type: string;
  action_payload: {
    title: string;
    description: string;
    metadata: DraftMetadata;
  };
  preview?: {
    label?: string;
    description?: string;
  };
  status: string;
  created_at: string;
  updated_at: string;
}

interface ApprovalModalProps {
  draft: Draft | null;
  onClose: () => void;
  onApprove: (draftId: string) => Promise<void>;
  onReject: (draftId: string, reason: string) => Promise<void>;
  onUpdate?: () => void;
}

const networkIcons: Record<string, any> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  twitter: Twitter,
  youtube: Youtube,
};

export function ApprovalModal({ draft, onClose, onApprove, onReject, onUpdate }: ApprovalModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  // Campos editáveis
  const [title, setTitle] = useState('');
  const [copy, setCopy] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [cta, setCta] = useState('');
  const [visualPrompt, setVisualPrompt] = useState('');
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>([]);

  // Inicializar campos quando o draft mudar
  useEffect(() => {
    if (draft) {
      const payload = draft.action_payload;
      const metadata = payload.metadata || {};

      setTitle(payload.title || '');
      setCopy(payload.description || '');
      setHashtags(metadata.hashtags || []);
      setCta(metadata.cta || '');
      setVisualPrompt(metadata.visualPrompt || '');
      setSelectedNetworks(metadata.selectedNetworks || []);
      setIsEditing(false);
      setIsPreview(false);
      setShowRejectInput(false);
      setRejectReason('');
    }
  }, [draft]);

  if (!draft) return null;

  const handleSaveEdit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/csuite/actions/edit', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draft_id: draft.id,
          title,
          description: copy,
          hashtags,
          cta,
          visualPrompt,
          selectedNetworks,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao salvar edições');
      }

      toast.success('Edições salvas com sucesso!');
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar edições');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/csuite/actions/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft_id: draft.id }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao aprovar conteúdo');
      }

      // Se temos URL do Kanban, mostrar link direto
      if (data.kanban_url) {
        toast.success('✅ Conteúdo aprovado! Tarefa criada no Kanban.', {
          description: 'Clique no botão abaixo para visualizar a tarefa criada.',
          action: {
            label: 'Ver no Kanban →',
            onClick: () => window.location.href = data.kanban_url,
          },
          duration: 10000,
        });
      } else {
        toast.success('✅ Conteúdo aprovado e publicado!', {
          description: 'Acesse o Kanban Geral para gerenciar o post.',
          action: {
            label: 'Ir para Kanban',
            onClick: () => window.location.href = '/admin/kanban-app',
          },
          duration: 8000,
        });
      }
      
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao aprovar');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Por favor, informe o motivo da rejeição');
      return;
    }

    setLoading(true);
    try {
      await onReject(draft.id, rejectReason);
      toast.success('Conteúdo rejeitado');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao rejeitar');
    } finally {
      setLoading(false);
    }
  };

  const addHashtag = () => {
    const tag = hashtagInput.trim();
    if (tag && !hashtags.includes(tag)) {
      setHashtags([...hashtags, tag.startsWith('#') ? tag : `#${tag}`]);
      setHashtagInput('');
    }
  };

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter((h) => h !== tag));
  };

  const toggleNetwork = (network: string) => {
    if (selectedNetworks.includes(network)) {
      setSelectedNetworks(selectedNetworks.filter((n) => n !== network));
    } else {
      setSelectedNetworks([...selectedNetworks, network]);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Edit3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {isEditing ? 'Editar Conteúdo' : isPreview ? 'Pré-visualização' : 'Aprovar Conteúdo'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Criado em {new Date(draft.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isEditing && !showRejectInput && (
                <>
                  <button
                    onClick={() => setIsPreview(!isPreview)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title={isPreview ? 'Modo Edição' : 'Pré-visualizar'}
                  >
                    <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isPreview ? (
              // Preview Mode
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-800">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {title}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-4">
                    {copy}
                  </p>
                  {hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {hashtags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {cta && (
                    <div className="inline-block px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold">
                      {cta}
                    </div>
                  )}
                </div>

                {visualPrompt && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <ImageIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Prompt Visual
                      </h4>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 italic">
                      {visualPrompt}
                    </p>
                  </div>
                )}

                {selectedNetworks.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Redes Selecionadas
                    </h4>
                    <div className="flex gap-3">
                      {selectedNetworks.map((network) => {
                        const Icon = networkIcons[network.toLowerCase()];
                        return Icon ? (
                          <div
                            key={network}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                          >
                            <Icon className="w-5 h-5" />
                            <span className="capitalize text-sm font-medium text-gray-700 dark:text-gray-300">
                              {network}
                            </span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : isEditing ? (
              // Edit Mode
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Título
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                    placeholder="Título do post"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Copy (Texto do Post)
                  </label>
                  <textarea
                    value={copy}
                    onChange={(e) => setCopy(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white resize-none"
                    placeholder="Texto principal do conteúdo..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hashtags
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={hashtagInput}
                      onChange={(e) => setHashtagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
                      className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                      placeholder="Digite uma hashtag e pressione Enter"
                    />
                    <button
                      onClick={addHashtag}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <Hash className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {hashtags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          onClick={() => removeHashtag(tag)}
                          className="hover:text-blue-900 dark:hover:text-blue-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    CTA (Call to Action)
                  </label>
                  <input
                    type="text"
                    value={cta}
                    onChange={(e) => setCta(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                    placeholder="Ex: Saiba mais, Compre agora, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prompt Visual (para geração de imagem)
                  </label>
                  <textarea
                    value={visualPrompt}
                    onChange={(e) => setVisualPrompt(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white resize-none"
                    placeholder="Descrição para geração de imagem..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Redes Sociais
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {['instagram', 'facebook', 'linkedin', 'twitter', 'youtube'].map((network) => {
                      const Icon = networkIcons[network];
                      const isSelected = selectedNetworks.includes(network);
                      return (
                        <button
                          key={network}
                          onClick={() => toggleNetwork(network)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400'
                              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-blue-300'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="capitalize text-sm font-medium">
                            {network}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="space-y-4">
                {showRejectInput ? (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border-2 border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <h4 className="font-semibold text-red-900 dark:text-red-100">
                        Rejeitar Conteúdo
                      </h4>
                    </div>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-red-300 dark:border-red-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 dark:text-white resize-none"
                      placeholder="Informe o motivo da rejeição..."
                    />
                  </div>
                ) : (
                  <>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {title}
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {copy}
                      </p>
                    </div>

                    {hashtags.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Hashtags
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {hashtags.map((tag) => (
                            <span
                              key={tag}
                              className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {cta && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Call to Action
                        </h5>
                        <p className="text-gray-900 dark:text-white font-medium">{cta}</p>
                      </div>
                    )}

                    {visualPrompt && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Prompt Visual
                        </h5>
                        <p className="text-gray-700 dark:text-gray-300 italic">{visualPrompt}</p>
                      </div>
                    )}

                    {selectedNetworks.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Redes Selecionadas
                        </h5>
                        <div className="flex gap-2">
                          {selectedNetworks.map((network) => {
                            const Icon = networkIcons[network.toLowerCase()];
                            return Icon ? (
                              <div
                                key={network}
                                className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg"
                              >
                                <Icon className="w-4 h-4" />
                                <span className="capitalize text-sm">{network}</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Salvar Edições
                    </>
                  )}
                </button>
              </>
            ) : showRejectInput ? (
              <>
                <button
                  onClick={() => setShowRejectInput(false)}
                  className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReject}
                  disabled={loading || !rejectReason.trim()}
                  className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Rejeitando...
                    </>
                  ) : (
                    <>
                      <Ban className="w-5 h-5" />
                      Confirmar Rejeição
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowRejectInput(true)}
                  className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  disabled={loading}
                >
                  <Ban className="w-5 h-5" />
                  Rejeitar
                </button>
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Aprovando...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Aprovar e Publicar
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
