'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Webhook,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface WebhookSubscription {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  createdAt: string;
  lastTriggered?: string;
  failureCount: number;
}

const AVAILABLE_EVENTS = [
  { value: 'client.created', label: 'Cliente Criado' },
  { value: 'client.updated', label: 'Cliente Atualizado' },
  { value: 'task.created', label: 'Tarefa Criada' },
  { value: 'task.completed', label: 'Tarefa Concluída' },
  { value: 'payment.received', label: 'Pagamento Recebido' },
  { value: 'invoice.paid', label: 'Fatura Paga' },
  { value: 'invoice.overdue', label: 'Fatura Vencida' },
  { value: 'approval.requested', label: 'Aprovação Solicitada' },
  { value: 'approval.approved', label: 'Aprovação Concedida' },
  { value: 'nps.submitted', label: 'NPS Enviado' },
  { value: 'nps.low_score', label: 'NPS Baixo' },
];

// Mock data
const mockWebhooks: WebhookSubscription[] = [
  {
    id: 'wh_1',
    url: 'https://api.exemplo.com/webhooks/valle360',
    events: ['client.created', 'payment.received'],
    secret: 'whsec_abc123def456',
    active: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    lastTriggered: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    failureCount: 0
  },
  {
    id: 'wh_2',
    url: 'https://n8n.exemplo.com/webhook/valle360',
    events: ['task.created', 'task.completed'],
    secret: 'whsec_xyz789ghi012',
    active: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    lastTriggered: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    failureCount: 0
  },
  {
    id: 'wh_3',
    url: 'https://zapier.com/hooks/catch/123456',
    events: ['nps.submitted', 'nps.low_score'],
    secret: 'whsec_jkl345mno678',
    active: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    failureCount: 5
  }
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookSubscription[]>(mockWebhooks);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState<string | null>(null);
  
  // Form state
  const [newUrl, setNewUrl] = useState('');
  const [newEvents, setNewEvents] = useState<string[]>([]);

  const handleCreate = () => {
    if (!newUrl || newEvents.length === 0) return;
    
    const newWebhook: WebhookSubscription = {
      id: `wh_${Date.now()}`,
      url: newUrl,
      events: newEvents,
      secret: `whsec_${Math.random().toString(36).substring(2)}`,
      active: true,
      createdAt: new Date().toISOString(),
      failureCount: 0
    };
    
    setWebhooks([...webhooks, newWebhook]);
    setNewUrl('');
    setNewEvents([]);
    setIsCreating(false);
  };

  const handleDelete = (id: string) => {
    setWebhooks(webhooks.filter(w => w.id !== id));
  };

  const handleToggleActive = (id: string) => {
    setWebhooks(webhooks.map(w => 
      w.id === id ? { ...w, active: !w.active } : w
    ));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Webhook className="w-7 h-7" style={{ color: 'var(--primary-500)' }} />
              Webhooks
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Configure webhooks para integrar com sistemas externos
            </p>
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium"
            style={{ backgroundColor: 'var(--primary-500)', color: 'white' }}
          >
            <Plus className="w-5 h-5" />
            Novo Webhook
          </button>
        </div>

        {/* Info Card */}
        <div 
          className="p-4 rounded-xl mb-6"
          style={{ backgroundColor: 'var(--info-100)', border: '1px solid var(--info-200)' }}
        >
          <div className="flex items-start gap-3">
            <Activity className="w-5 h-5 mt-0.5" style={{ color: 'var(--info-600)' }} />
            <div>
              <p className="font-medium" style={{ color: 'var(--info-700)' }}>
                Como funcionam os Webhooks
              </p>
              <p className="text-sm" style={{ color: 'var(--info-600)' }}>
                Webhooks enviam notificações HTTP POST em tempo real quando eventos ocorrem no sistema.
                Use para integrar com Zapier, N8N, Make, ou seu próprio sistema.
              </p>
            </div>
          </div>
        </div>

        {/* Create Form */}
        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div 
                className="p-6 rounded-xl"
                style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)' }}
              >
                <h3 className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
                  Novo Webhook
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      URL do Endpoint
                    </label>
                    <input
                      type="url"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="https://api.exemplo.com/webhook"
                      className="w-full px-4 py-2 rounded-xl"
                      style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      Eventos
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {AVAILABLE_EVENTS.map((event) => (
                        <label
                          key={event.value}
                          className="flex items-center gap-2 p-2 rounded-lg cursor-pointer"
                          style={{ 
                            backgroundColor: newEvents.includes(event.value) ? 'var(--primary-100)' : 'var(--bg-secondary)',
                            border: `1px solid ${newEvents.includes(event.value) ? 'var(--primary-500)' : 'var(--border-light)'}`
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={newEvents.includes(event.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewEvents([...newEvents, event.value]);
                              } else {
                                setNewEvents(newEvents.filter(ev => ev !== event.value));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                            {event.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setIsCreating(false);
                        setNewUrl('');
                        setNewEvents([]);
                      }}
                      className="px-4 py-2 rounded-xl"
                      style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCreate}
                      disabled={!newUrl || newEvents.length === 0}
                      className="px-4 py-2 rounded-xl font-medium disabled:opacity-50"
                      style={{ backgroundColor: 'var(--primary-500)', color: 'white' }}
                    >
                      Criar Webhook
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Webhooks List */}
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <motion.div
              key={webhook.id}
              layout
              className="p-6 rounded-xl"
              style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: webhook.active ? 'var(--success-500)' : 'var(--neutral-400)' }}
                  />
                  <div>
                    <p className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
                      {webhook.url}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Criado em {formatDate(webhook.createdAt)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(webhook.id)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                    title={webhook.active ? 'Desativar' : 'Ativar'}
                  >
                    {webhook.active ? (
                      <CheckCircle className="w-5 h-5" style={{ color: 'var(--success-500)' }} />
                    ) : (
                      <X className="w-5 h-5" style={{ color: 'var(--neutral-400)' }} />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(webhook.id)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                    title="Excluir"
                  >
                    <Trash2 className="w-5 h-5" style={{ color: 'var(--error-500)' }} />
                  </button>
                </div>
              </div>
              
              {/* Events */}
              <div className="flex flex-wrap gap-2 mb-4">
                {webhook.events.map((event) => (
                  <span
                    key={event}
                    className="px-2 py-1 rounded-lg text-xs font-medium"
                    style={{ backgroundColor: 'var(--primary-100)', color: 'var(--primary-700)' }}
                  >
                    {AVAILABLE_EVENTS.find(e => e.value === event)?.label || event}
                  </span>
                ))}
              </div>
              
              {/* Secret */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Secret:</span>
                <code 
                  className="px-2 py-1 rounded text-sm font-mono"
                  style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                >
                  {showSecret === webhook.id ? webhook.secret : '••••••••••••••••'}
                </code>
                <button
                  onClick={() => setShowSecret(showSecret === webhook.id ? null : webhook.id)}
                  className="p-1 rounded"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {showSecret === webhook.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => copyToClipboard(webhook.secret)}
                  className="p-1 rounded"
                  style={{ color: 'var(--text-tertiary)' }}
                  title="Copiar"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-4 text-sm">
                {webhook.lastTriggered && (
                  <div className="flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                    <Clock className="w-4 h-4" />
                    Último disparo: {formatDate(webhook.lastTriggered)}
                  </div>
                )}
                {webhook.failureCount > 0 && (
                  <div className="flex items-center gap-1" style={{ color: 'var(--warning-500)' }}>
                    <AlertTriangle className="w-4 h-4" />
                    {webhook.failureCount} falhas
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {webhooks.length === 0 && (
            <div 
              className="p-12 text-center rounded-xl"
              style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)' }}
            >
              <Webhook className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
              <p className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Nenhum webhook configurado
              </p>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Crie seu primeiro webhook para integrar com sistemas externos
              </p>
              <button
                onClick={() => setIsCreating(true)}
                className="px-4 py-2 rounded-xl font-medium"
                style={{ backgroundColor: 'var(--primary-500)', color: 'white' }}
              >
                Criar Webhook
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}









