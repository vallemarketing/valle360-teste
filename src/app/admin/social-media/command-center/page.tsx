'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Sparkles,
  Zap,
  Calendar,
  BarChart3,
  Settings,
  RefreshCw,
  Plus,
  Loader2,
} from 'lucide-react';
import { ContentStepper, ContentGenerationResult } from '@/components/social/ContentStepper';

interface Client {
  id: string;
  name: string;
}

interface ConnectedNetwork {
  platform: string;
  accountName: string;
}

export default function CommandCenterPage() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [connectedNetworks, setConnectedNetworks] = useState<ConnectedNetwork[]>([]);
  const [showStepper, setShowStepper] = useState(false);
  const [stats, setStats] = useState({
    postsToday: 0,
    postsWeek: 0,
    pendingApproval: 0,
    scheduled: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load clients
      const clientsRes = await fetch('/api/social/clients', { cache: 'no-store' });
      const clientsData = await clientsRes.json();
      if (clientsRes.ok) {
        setClients(
          (clientsData.clients || []).map((c: any) => ({
            id: c.id,
            name: c.name || 'Cliente',
          }))
        );
      }

      // Load stats (mock for now)
      setStats({
        postsToday: 3,
        postsWeek: 18,
        pendingApproval: 5,
        scheduled: 12,
      });

      // Mock connected networks (will be real after OAuth implementation)
      setConnectedNetworks([
        { platform: 'instagram', accountName: '@exemplo' },
        { platform: 'facebook', accountName: 'Página Exemplo' },
        { platform: 'linkedin', accountName: 'Empresa Exemplo' },
      ]);
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleStepperComplete = async (data: {
    clientId: string;
    content: ContentGenerationResult;
    selectedNetworks: string[];
    scheduledAt?: string;
  }) => {
    try {
      // Create post draft and send for approval
      const response = await fetch('/api/admin/agency/kanban-task-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: data.clientId,
          title: `Post - ${data.content.copy?.substring(0, 50) || 'Novo conteúdo'}`,
          description: data.content.copy,
          metadata: {
            hashtags: data.content.hashtags,
            cta: data.content.cta,
            visualPrompt: data.content.visualPrompt,
            selectedNetworks: data.selectedNetworks,
            scheduledAt: data.scheduledAt,
          },
          area: 'Social Media',
          targetColumn: 'aprovacao_interna',
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Falha ao criar draft');
      }

      toast.success('Post enviado para aprovação!');
      setShowStepper(false);
      loadData();
    } catch (e: any) {
      throw e;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--primary-500)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Carregando Command Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--primary-50)' }}
          >
            <Zap className="w-7 h-7" style={{ color: 'var(--primary-500)' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Social Command Center
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Crie conteúdo com IA e gerencie suas redes sociais
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium border"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-light)',
              color: 'var(--text-secondary)',
            }}
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          <button
            onClick={() => setShowStepper(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white"
            style={{ backgroundColor: 'var(--primary-500)' }}
          >
            <Plus className="w-4 h-4" />
            Criar Conteúdo
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Posts Hoje', value: stats.postsToday, icon: Sparkles, color: 'var(--primary-500)' },
          { label: 'Posts Semana', value: stats.postsWeek, icon: BarChart3, color: 'var(--success-500)' },
          { label: 'Aguardando Aprovação', value: stats.pendingApproval, icon: Settings, color: 'var(--warning-500)' },
          { label: 'Agendados', value: stats.scheduled, icon: Calendar, color: 'var(--info-500)' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border p-5"
              style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                    {stat.value}
                  </p>
                </div>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <Icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content Area */}
      {showStepper ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border p-6"
          style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Criar Novo Conteúdo
            </h2>
            <button
              onClick={() => setShowStepper(false)}
              className="text-sm px-3 py-1 rounded-lg"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Cancelar
            </button>
          </div>

          <ContentStepper
            clients={clients}
            connectedNetworks={connectedNetworks}
            onComplete={handleStepperComplete}
          />
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border p-6"
            style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
          >
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Ações Rápidas
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowStepper(true)}
                className="p-4 rounded-xl border text-left hover:border-[var(--primary-300)] transition-colors"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}
              >
                <Sparkles className="w-6 h-6 mb-2" style={{ color: 'var(--primary-500)' }} />
                <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  Gerar com IA
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  Criar conteúdo do zero
                </div>
              </button>

              <a
                href="/admin/social-media/approvals"
                className="p-4 rounded-xl border text-left hover:border-[var(--primary-300)] transition-colors"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}
              >
                <Sparkles className="w-6 h-6 mb-2" style={{ color: 'var(--primary-500)' }} />
                <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  Aprovações
                  {stats.pendingApproval > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-white text-xs rounded-full">
                      {stats.pendingApproval}
                    </span>
                  )}
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  Revisar conteúdos IA
                </div>
              </a>

              <a
                href="/admin/social-media/gestao"
                className="p-4 rounded-xl border text-left hover:border-[var(--primary-300)] transition-colors"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}
              >
                <Calendar className="w-6 h-6 mb-2" style={{ color: 'var(--success-500)' }} />
                <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  Calendário
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  Ver posts agendados
                </div>
              </a>

              <a
                href="/admin/social-media/upload"
                className="p-4 rounded-xl border text-left hover:border-[var(--primary-300)] transition-colors"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}
              >
                <Plus className="w-6 h-6 mb-2" style={{ color: 'var(--warning-500)' }} />
                <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  Upload Manual
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  Agendar post existente
                </div>
              </a>

              <a
                href="/admin/relatorios"
                className="p-4 rounded-xl border text-left hover:border-[var(--primary-300)] transition-colors"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}
              >
                <BarChart3 className="w-6 h-6 mb-2" style={{ color: 'var(--info-500)' }} />
                <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  Relatórios
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  Ver métricas e insights
                </div>
              </a>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border p-6"
            style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
          >
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Atividade Recente
            </h3>
            <div className="space-y-3">
              {[
                { text: 'Post "Dicas de Marketing" aprovado', time: 'Há 5 min', type: 'success' },
                { text: 'Novo post gerado para Cliente X', time: 'Há 15 min', type: 'info' },
                { text: 'Post agendado para amanhã às 10h', time: 'Há 1h', type: 'warning' },
                { text: 'Conteúdo reprovado - ajustes necessários', time: 'Há 2h', type: 'error' },
              ].map((activity, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        activity.type === 'success'
                          ? 'var(--success-500)'
                          : activity.type === 'error'
                          ? 'var(--error-500)'
                          : activity.type === 'warning'
                          ? 'var(--warning-500)'
                          : 'var(--primary-500)',
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {activity.text}
                    </p>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* AI Suggestions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border p-6 lg:col-span-2"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-light)',
              background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--primary-50) 100%)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--primary-100)' }}
              >
                <Sparkles className="w-5 h-5" style={{ color: 'var(--primary-600)' }} />
              </div>
              <div>
                <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  Sugestões da IA
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Baseado nas tendências e performance dos seus clientes
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: '📈 Tendência detectada',
                  description: '"IA no Marketing" está em alta. Considere criar conteúdo sobre isso.',
                },
                {
                  title: '⏰ Melhor horário',
                  description: 'Posts às 18h têm 40% mais engajamento para seus clientes.',
                },
                {
                  title: '🎯 Conteúdo sugerido',
                  description: 'Cliente X não posta há 3 dias. Sugerimos um carrossel educativo.',
                },
              ].map((suggestion, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border"
                  style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
                >
                  <div className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                    {suggestion.title}
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {suggestion.description}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
