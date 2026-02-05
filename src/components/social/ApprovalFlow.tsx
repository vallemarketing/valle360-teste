'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Settings,
  CheckCircle2,
  ArrowRight,
  User,
  Shield,
  Users,
  Loader2,
  Save,
} from 'lucide-react';

interface ApprovalFlowConfig {
  flowType: 'head_only' | 'head_admin' | 'direct';
  requireClientApproval: boolean;
  autoPublish: boolean;
  notifyOnApproval: boolean;
  notifyOnRejection: boolean;
}

interface ApprovalFlowProps {
  clientId: string;
  onSave?: (config: ApprovalFlowConfig) => void;
}

const FLOW_OPTIONS = [
  {
    id: 'head_only',
    title: 'Head → Cliente',
    description: 'Head aprova primeiro, depois envia para cliente',
    steps: ['Head Estratégico', 'Cliente'],
    icon: User,
  },
  {
    id: 'head_admin',
    title: 'Head → Admin → Cliente',
    description: 'Passa pelo Head, Super Admin, e depois cliente',
    steps: ['Head Estratégico', 'Super Admin', 'Cliente'],
    icon: Shield,
  },
  {
    id: 'direct',
    title: 'Publicação Direta',
    description: 'Sem aprovação - publica direto após criação',
    steps: ['Criação', 'Publicação'],
    icon: CheckCircle2,
  },
];

/**
 * ApprovalFlow - Component to configure approval workflow per client
 */
export function ApprovalFlow({ clientId, onSave }: ApprovalFlowProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<ApprovalFlowConfig>({
    flowType: 'head_only',
    requireClientApproval: true,
    autoPublish: false,
    notifyOnApproval: true,
    notifyOnRejection: true,
  });

  useEffect(() => {
    loadConfig();
  }, [clientId]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/clients/${clientId}/approval-flow`);
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setConfig({
            flowType: data.config.flow_type || 'head_only',
            requireClientApproval: data.config.require_client_approval ?? true,
            autoPublish: data.config.auto_publish ?? false,
            notifyOnApproval: data.config.notify_on_approval ?? true,
            notifyOnRejection: data.config.notify_on_rejection ?? true,
          });
        }
      }
    } catch (e) {
      console.error('Error loading approval config:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/clients/${clientId}/approval-flow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flow_type: config.flowType,
          require_client_approval: config.requireClientApproval,
          auto_publish: config.autoPublish,
          notify_on_approval: config.notifyOnApproval,
          notify_on_rejection: config.notifyOnRejection,
        }),
      });

      if (response.ok) {
        toast.success('Configuração salva com sucesso!');
        onSave?.(config);
      } else {
        throw new Error('Falha ao salvar');
      }
    } catch (e) {
      toast.error('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-6 h-6 mx-auto animate-spin" style={{ color: 'var(--primary-500)' }} />
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Carregando configuração...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--primary-100)' }}
        >
          <Settings className="w-5 h-5" style={{ color: 'var(--primary-600)' }} />
        </div>
        <div>
          <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>
            Fluxo de Aprovação
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Configure como os posts deste cliente são aprovados
          </p>
        </div>
      </div>

      {/* Flow Options */}
      <div className="space-y-3">
        {FLOW_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = config.flowType === option.id;

          return (
            <motion.button
              key={option.id}
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setConfig({ ...config, flowType: option.id as ApprovalFlowConfig['flowType'] })}
              className="w-full p-4 rounded-xl border text-left transition-all"
              style={{
                backgroundColor: isSelected ? 'var(--primary-50)' : 'var(--bg-secondary)',
                borderColor: isSelected ? 'var(--primary-300)' : 'var(--border-light)',
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: isSelected ? 'var(--primary-500)' : 'var(--neutral-200)',
                  }}
                >
                  <Icon
                    className="w-5 h-5"
                    style={{ color: isSelected ? 'white' : 'var(--text-tertiary)' }}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-medium"
                      style={{ color: isSelected ? 'var(--primary-700)' : 'var(--text-primary)' }}
                    >
                      {option.title}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--primary-500)' }} />
                    )}
                  </div>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {option.description}
                  </p>

                  {/* Flow visualization */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {option.steps.map((step, i) => (
                      <React.Fragment key={i}>
                        <span
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{
                            backgroundColor: isSelected ? 'var(--primary-100)' : 'var(--neutral-100)',
                            color: isSelected ? 'var(--primary-700)' : 'var(--text-secondary)',
                          }}
                        >
                          {step}
                        </span>
                        {i < option.steps.length - 1 && (
                          <ArrowRight
                            className="w-3 h-3"
                            style={{ color: 'var(--text-tertiary)' }}
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Additional Options */}
      {config.flowType !== 'direct' && (
        <div
          className="p-4 rounded-xl border space-y-4"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}
        >
          <h4 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
            Opções adicionais
          </h4>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.requireClientApproval}
              onChange={(e) => setConfig({ ...config, requireClientApproval: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <div>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Exigir aprovação do cliente
              </span>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Cliente precisa aprovar antes de publicar
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.autoPublish}
              onChange={(e) => setConfig({ ...config, autoPublish: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <div>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Publicar automaticamente após aprovação
              </span>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Post é publicado automaticamente quando aprovado
              </p>
            </div>
          </label>

          <div className="border-t pt-4" style={{ borderColor: 'var(--border-light)' }}>
            <h5 className="text-xs font-medium mb-3" style={{ color: 'var(--text-tertiary)' }}>
              NOTIFICAÇÕES
            </h5>

            <label className="flex items-center gap-3 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={config.notifyOnApproval}
                onChange={(e) => setConfig({ ...config, notifyOnApproval: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                Notificar quando aprovado
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.notifyOnRejection}
                onChange={(e) => setConfig({ ...config, notifyOnRejection: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                Notificar quando reprovado
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: 'var(--primary-500)' }}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Salvar Configuração
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default ApprovalFlow;
