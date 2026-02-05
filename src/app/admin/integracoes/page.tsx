'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plug, Check, X, Settings, ExternalLink, RefreshCw,
  CreditCard, MessageSquare, Mail, Calendar, BarChart3,
  Globe, Zap, Shield, AlertTriangle, ChevronRight, Loader2,
  Eye, EyeOff, Activity, Clock, CheckCircle2, XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { IntegrationIcon } from '@/components/icons/IntegrationIcons';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  category: 'payment' | 'communication' | 'marketing' | 'productivity' | 'ai';
  connected: boolean;
  lastSync?: string;
  status?: 'connected' | 'disconnected' | 'error' | 'pending';
  error?: string;
  fields: IntegrationField[];
}

interface IntegrationField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  helpText?: string;
}

const INTEGRATION_CONFIGS: Record<string, { fields: IntegrationField[] }> = {
  openrouter: {
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sk-or-...', required: true, helpText: 'Chave do OpenRouter (gateway de modelos)' },
      { key: 'config.model', label: 'Modelo fixo (opcional)', type: 'text', placeholder: 'openrouter/auto', helpText: 'Se preencher, fixa um modelo para todas as tarefas e ignora a política por função.' },
      {
        key: 'config.model_policy',
        label: 'Política de modelos (JSON, opcional)',
        type: 'text',
        placeholder:
          '{"default":["openrouter/auto"],"kanban_insights":["anthropic/claude-3.5-sonnet","openrouter/auto"],"copywriting":["openai/gpt-4o-mini","openrouter/auto"]}',
        helpText:
          'Mapeia task → lista de modelos. Ex: {"analysis":["...","openrouter/auto"],"default":["openrouter/auto"]}. Se algum modelo falhar, o sistema tenta o próximo.',
      },
    ]
  },
  anthropic: {
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sk-ant-...', required: true, helpText: 'Chave da Anthropic (Claude)' },
      { key: 'config.model', label: 'Modelo (opcional)', type: 'text', placeholder: 'claude-3-5-sonnet-20241022' }
    ]
  },
  gemini: {
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true, helpText: 'Chave Google Gemini/Cloud' },
      { key: 'config.model', label: 'Modelo (opcional)', type: 'text', placeholder: 'gemini-1.5-flash' }
    ]
  },
  openai: {
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sk-...', required: true, helpText: 'Encontre em platform.openai.com' }
    ]
  },
  perplexity: {
    fields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        placeholder: 'pplx-...',
        required: true,
        helpText: 'Chave do Perplexity API (Sonar). Usada para “busca web com fontes” dentro da Val.',
      },
      {
        key: 'config.model',
        label: 'Modelo (opcional)',
        type: 'text',
        placeholder: 'sonar',
        helpText: 'Deixe vazio para usar "sonar". Você pode testar "sonar-pro" se estiver disponível na sua conta.',
      },
    ],
  },
  stripe: {
    fields: [
      { key: 'apiKey', label: 'Secret Key', type: 'password', placeholder: 'sk_live_... ou sk_test_...', required: true },
      { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', placeholder: 'whsec_...', helpText: 'Para receber eventos' }
    ]
  },
  paypal: {
    fields: [
      { key: 'apiKey', label: 'Client ID', type: 'text', required: true },
      { key: 'apiSecret', label: 'Client Secret', type: 'password', required: true }
    ]
  },
  whatsapp: {
    fields: [
      {
        key: 'accessToken',
        label: 'Access Token',
        type: 'password',
        required: true,
        helpText: 'Token do WhatsApp Cloud API (Meta). Você poderá colar aqui quando estiver pronto para integrar.',
      },
      {
        key: 'config.phoneNumberId',
        label: 'Phone Number ID',
        type: 'text',
        required: true,
        helpText: 'ID do número (Phone Number ID) do WhatsApp Cloud API. É obrigatório para enviar mensagens e para o health-check.',
      },
      {
        key: 'config.businessId',
        label: 'Business Account ID (opcional)',
        type: 'text',
        helpText: 'Opcional: WhatsApp Business Account ID (WABA). Útil para auditoria e futuras automações.',
      }
    ]
  },
  sendgrid: {
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'SG....', required: true },
      { key: 'config.fromEmail', label: 'Email de Envio', type: 'text', placeholder: 'noreply@suaempresa.com' }
    ]
  },
  slack: {
    fields: [
      { key: 'accessToken', label: 'Bot Token', type: 'password', placeholder: 'xoxb-...', required: true },
      { key: 'config.channel', label: 'Canal Padrão', type: 'text', placeholder: '#geral' }
    ]
  },
  google_ads: {
    fields: [
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { key: 'config.customerId', label: 'Customer ID', type: 'text', required: true },
      { key: 'config.developerToken', label: 'Developer Token', type: 'password' }
    ]
  },
  meta_ads: {
    fields: [
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { key: 'config.adAccountId', label: 'Ad Account ID', type: 'text', placeholder: 'act_...' }
    ]
  },
  instagram: {
    fields: [
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { key: 'config.businessAccountId', label: 'Business Account ID', type: 'text' }
    ]
  },
  instagramback: {
    fields: [
      {
        key: 'config.baseUrl',
        label: 'Base URL',
        type: 'text',
        placeholder: 'https://instagramback-production-9211.up.railway.app',
        required: true,
        helpText: 'Base do Railway (com ou sem "/api"). Ex.: https://...up.railway.app',
      },
      {
        key: 'config.email',
        label: 'Email (opcional)',
        type: 'text',
        placeholder: 'seu@email.com',
        helpText: 'Se informar email/senha, o sistema faz login e salva o Access Token automaticamente.',
      },
      {
        key: 'config.password',
        label: 'Senha (opcional)',
        type: 'password',
        placeholder: '••••••••',
        helpText: 'Usada apenas para login no InstagramBack (token fica salvo no Valle 360).',
      },
      {
        key: 'accessToken',
        label: 'Access Token (opcional)',
        type: 'password',
        placeholder: 'Bearer ...',
        helpText: 'Se você já tiver o token, pode colar aqui e não precisa informar email/senha.',
      },
    ]
  },
  linkedin: {
    fields: [
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { key: 'config.organizationId', label: 'Organization ID', type: 'text' }
    ]
  },
  google_calendar: {
    fields: [
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { key: 'refreshToken', label: 'Refresh Token', type: 'password' }
    ]
  },
  google_meet: {
    fields: [
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { key: 'refreshToken', label: 'Refresh Token', type: 'password' }
    ]
  },
  zapier: {
    fields: [
      { key: 'webhookSecret', label: 'Webhook URL', type: 'text', required: true, helpText: 'URL do seu Zap' }
    ]
  }
};

const INTEGRATIONS_BASE: Omit<Integration, 'connected' | 'lastSync' | 'status' | 'error'>[] = [
  // IA
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Gateway de modelos (fallback automático e roteamento)',
    icon: <IntegrationIcon integrationId="openrouter" className="w-6 h-6" fallback={<Zap className="w-6 h-6" />} />,
    color: '#111827',
    category: 'ai',
    fields: INTEGRATION_CONFIGS.openrouter.fields
  },
  {
    id: 'anthropic',
    name: 'Claude (Anthropic)',
    description: 'Fallback de IA (Claude) para tarefas críticas',
    icon: <IntegrationIcon integrationId="anthropic" className="w-6 h-6" fallback={<Zap className="w-6 h-6" />} />,
    color: '#7C3AED',
    category: 'ai',
    fields: INTEGRATION_CONFIGS.anthropic.fields
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Fallback de IA (Gemini) + NLP',
    icon: <IntegrationIcon integrationId="gemini" className="w-6 h-6" fallback={<Zap className="w-6 h-6" />} />,
    color: '#4285F4',
    category: 'ai',
    fields: INTEGRATION_CONFIGS.gemini.fields
  },
  {
    id: 'openai',
    name: 'OpenAI / ChatGPT',
    description: 'Val IA, análise de sentimentos e geração de textos',
    icon: <IntegrationIcon integrationId="openai" className="w-6 h-6" fallback={<Zap className="w-6 h-6" />} />,
    color: '#10A37F',
    category: 'ai',
    fields: INTEGRATION_CONFIGS.openai.fields
  },
  {
    id: 'perplexity',
    name: 'Perplexity (Sonar)',
    description: 'Busca web com fontes (para a Val responder com links)',
    icon: <IntegrationIcon integrationId="perplexity" className="w-6 h-6" fallback={<Globe className="w-6 h-6" />} />,
    color: '#111827',
    category: 'ai',
    fields: INTEGRATION_CONFIGS.perplexity.fields,
  },
  // Pagamentos
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Pagamentos, assinaturas e faturas',
    icon: <IntegrationIcon integrationId="stripe" className="w-6 h-6" fallback={<CreditCard className="w-6 h-6" />} />,
    color: '#635BFF',
    category: 'payment',
    fields: INTEGRATION_CONFIGS.stripe.fields
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Pagamentos alternativos',
    icon: <IntegrationIcon integrationId="paypal" className="w-6 h-6" fallback={<CreditCard className="w-6 h-6" />} />,
    color: '#003087',
    category: 'payment',
    fields: INTEGRATION_CONFIGS.paypal.fields
  },
  // Comunicação
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Mensagens automáticas para clientes',
    icon: <IntegrationIcon integrationId="whatsapp" className="w-6 h-6" fallback={<MessageSquare className="w-6 h-6" />} />,
    color: '#25D366',
    category: 'communication',
    fields: INTEGRATION_CONFIGS.whatsapp.fields
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Envio de emails transacionais',
    icon: <IntegrationIcon integrationId="sendgrid" className="w-6 h-6" fallback={<Mail className="w-6 h-6" />} />,
    color: '#1A82E2',
    category: 'communication',
    fields: INTEGRATION_CONFIGS.sendgrid.fields
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Notificações para equipe',
    icon: <IntegrationIcon integrationId="slack" className="w-6 h-6" fallback={<MessageSquare className="w-6 h-6" />} />,
    color: '#4A154B',
    category: 'communication',
    fields: INTEGRATION_CONFIGS.slack.fields
  },
  // Marketing
  {
    id: 'google_ads',
    name: 'Google Ads',
    description: 'Importar métricas de campanhas',
    icon: <IntegrationIcon integrationId="google_ads" className="w-6 h-6" fallback={<BarChart3 className="w-6 h-6" />} />,
    color: '#4285F4',
    category: 'marketing',
    fields: INTEGRATION_CONFIGS.google_ads.fields
  },
  {
    id: 'meta_ads',
    name: 'Meta Ads',
    description: 'Facebook e Instagram Ads',
    icon: <IntegrationIcon integrationId="meta_ads" className="w-6 h-6" fallback={<Globe className="w-6 h-6" />} />,
    color: '#1877F2',
    category: 'marketing',
    fields: INTEGRATION_CONFIGS.meta_ads.fields
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Agendar posts de clientes',
    icon: <IntegrationIcon integrationId="instagram" className="w-6 h-6" fallback={<Globe className="w-6 h-6" />} />,
    color: '#E4405F',
    category: 'marketing',
    fields: INTEGRATION_CONFIGS.instagram.fields
  },
  {
    id: 'instagramback',
    name: 'InstagramBack',
    description: 'Agendar Postagem (Railway) + token (sem expor no browser)',
    icon: <IntegrationIcon integrationId="instagramback" className="w-6 h-6" fallback={<Globe className="w-6 h-6" />} />,
    color: '#E1306C',
    category: 'marketing',
    fields: INTEGRATION_CONFIGS.instagramback.fields
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Publicar vagas e posts',
    icon: <IntegrationIcon integrationId="linkedin" className="w-6 h-6" fallback={<Globe className="w-6 h-6" />} />,
    color: '#0A66C2',
    category: 'marketing',
    fields: INTEGRATION_CONFIGS.linkedin.fields
  },
  // Produtividade
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    description: 'Sincronizar reuniões',
    icon: <IntegrationIcon integrationId="google_calendar" className="w-6 h-6" fallback={<Calendar className="w-6 h-6" />} />,
    color: '#4285F4',
    category: 'productivity',
    fields: INTEGRATION_CONFIGS.google_calendar.fields
  },
  {
    id: 'google_meet',
    name: 'Google Meet',
    description: 'Criar reuniões automaticamente',
    icon: <IntegrationIcon integrationId="google_meet" className="w-6 h-6" fallback={<Calendar className="w-6 h-6" />} />,
    color: '#00897B',
    category: 'productivity',
    fields: INTEGRATION_CONFIGS.google_meet.fields
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Automações customizadas',
    icon: <IntegrationIcon integrationId="zapier" className="w-6 h-6" fallback={<Zap className="w-6 h-6" />} />,
    color: '#FF4A00',
    category: 'productivity',
    fields: INTEGRATION_CONFIGS.zapier.fields
  }
];

const CATEGORIES = [
  { id: 'all', label: 'Todas', icon: Globe },
  { id: 'ai', label: 'Inteligência Artificial', icon: Zap },
  { id: 'payment', label: 'Pagamentos', icon: CreditCard },
  { id: 'communication', label: 'Comunicação', icon: MessageSquare },
  { id: 'marketing', label: 'Marketing', icon: BarChart3 },
  { id: 'productivity', label: 'Produtividade', icon: Calendar }
];

export default function IntegracoesPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Carregar status das integrações
  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      setAuthError(null);
      const response = await fetch('/api/integrations/status');
      if (response.status === 401) {
        setIntegrations(INTEGRATIONS_BASE.map(base => ({ ...base, connected: false, status: 'disconnected' })));
        setAuthError('Você precisa estar logado para ver as integrações.');
        return;
      }
      if (response.status === 403) {
        setIntegrations(INTEGRATIONS_BASE.map(base => ({ ...base, connected: false, status: 'disconnected' })));
        setAuthError('Acesso negado. Apenas Admin/Super Admin pode configurar integrações.');
        return;
      }
      const data = await response.json();

      if (data.success) {
        // Mesclar dados do banco com configurações base
        const merged = INTEGRATIONS_BASE.map(base => {
          const dbData = data.integrations.find((i: any) => i.id === base.id);
          return {
            ...base,
            connected: dbData?.connected || false,
            lastSync: dbData?.lastSync,
            status: dbData?.status || 'disconnected',
            error: dbData?.error
          };
        });
        setIntegrations(merged);
      }
    } catch (error) {
      console.error('Erro ao carregar integrações:', error);
      // Fallback para dados base
      setIntegrations(INTEGRATIONS_BASE.map(base => ({
        ...base,
        connected: false,
        status: 'disconnected'
      })));
    } finally {
      setLoading(false);
    }
  };

  const filteredIntegrations = integrations.filter(integration => {
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          integration.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const connectedCount = integrations.filter(i => i.connected).length;

  const handleOpenConfig = (integration: Integration) => {
    setSelectedIntegration(integration);
    setFormData({});
    setShowPasswords({});
  };

  const handleConnect = async () => {
    if (!selectedIntegration) return;

    // Validar campos obrigatórios
    const requiredFields = selectedIntegration.fields.filter(f => f.required);
    const missingFields = requiredFields.filter(f => !formData[f.key]);
    
    if (missingFields.length > 0) {
      toast.error(`Preencha os campos obrigatórios: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    setSaving(true);
    try {
      // Preparar dados para envio
      const payload: any = {
        integrationId: selectedIntegration.id
      };

      // Mapear campos para o formato esperado pela API
      selectedIntegration.fields.forEach(field => {
        const value = formData[field.key];
        if (value) {
          if (field.key.startsWith('config.')) {
            const configKey = field.key.replace('config.', '');
            if (!payload.config) payload.config = {};
            payload.config[configKey] = value;
          } else {
            payload[field.key] = value;
          }
        }
      });

      const response = await fetch('/api/integrations/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setSelectedIntegration(null);
        // Atualiza status e dispara health-check automaticamente
        await loadIntegrations();
        try {
          const hc = await fetch('/api/integrations/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ integrationId: selectedIntegration.id }),
          });
          const hcData = await hc.json();
          if (hcData?.healthy) {
            toast.success(`${selectedIntegration.name} validado com sucesso.`);
          } else {
            toast.error(`${selectedIntegration.name}: ${hcData?.reason || hcData?.error || 'Falha no health check'}`);
          }
        } catch {
          // best-effort
        }
      } else {
        toast.error(data.error || 'Erro ao conectar');
        if (data.details) {
          toast.error(data.details);
        }
      }
    } catch (error: any) {
      toast.error('Erro ao conectar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async (integration: Integration) => {
    if (!confirm(`Deseja desconectar ${integration.name}? Isso removerá todas as credenciais salvas.`)) {
      return;
    }

    try {
      const response = await fetch('/api/integrations/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId: integration.id })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        loadIntegrations();
      } else {
        toast.error(data.error || 'Erro ao desconectar');
      }
    } catch (error: any) {
      toast.error('Erro ao desconectar: ' + error.message);
    }
  };

  const handleTestConnection = async (integration: Integration) => {
    setTesting(integration.id);
    try {
      const response = await fetch('/api/integrations/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId: integration.id })
      });

      const data = await response.json();

      if (data.healthy) {
        toast.success(`${integration.name} está funcionando! (${data.responseTime}ms)`);
      } else {
        toast.error(`${integration.name}: ${data.reason || data.error || 'Falha na conexão'}`);
      }
    } catch (error: any) {
      toast.error('Erro ao testar: ' + error.message);
    } finally {
      setTesting(null);
    }
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--primary-500)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Carregando integrações...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {authError && (
          <div
            className="p-4 rounded-xl border"
            style={{
              backgroundColor: 'var(--warning-100)',
              borderColor: 'var(--warning-200)',
              color: 'var(--warning-700)',
            }}
          >
            {authError}
          </div>
        )}
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--primary-100)' }}
            >
              <Plug className="w-7 h-7" style={{ color: 'var(--primary-500)' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Integrações
              </h1>
              <p style={{ color: 'var(--text-secondary)' }}>
                {connectedCount} de {integrations.length} conectadas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh Button */}
            <button
              onClick={loadIntegrations}
              className="p-2 rounded-xl border transition-colors hover:bg-opacity-80"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border-light)'
              }}
              title="Atualizar"
            >
              <RefreshCw className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            </button>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar integração..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 px-4 py-2 pl-10 rounded-xl border"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border-light)',
                  color: 'var(--text-primary)'
                }}
              />
              <Globe 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                style={{ color: 'var(--text-tertiary)' }}
              />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--success-500)' }} />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Conectadas</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--success-600)' }}>{connectedCount}</p>
          </div>
          <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Desconectadas</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{integrations.length - connectedCount}</p>
          </div>
          <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5" style={{ color: 'var(--warning-500)' }} />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Com Erro</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--warning-600)' }}>
              {integrations.filter(i => i.status === 'error').length}
            </p>
          </div>
          <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5" style={{ color: 'var(--primary-500)' }} />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Disponíveis</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--primary-600)' }}>{integrations.length}</p>
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{
                  backgroundColor: selectedCategory === category.id 
                    ? 'var(--primary-500)' 
                    : 'var(--bg-primary)',
                  color: selectedCategory === category.id 
                    ? 'white' 
                    : 'var(--text-secondary)',
                  border: `1px solid ${selectedCategory === category.id ? 'var(--primary-500)' : 'var(--border-light)'}`
                }}
              >
                <Icon className="w-4 h-4" />
                {category.label}
              </button>
            );
          })}
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIntegrations.map((integration, index) => (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-xl p-5 border transition-all hover:shadow-lg"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: integration.connected 
                  ? `${integration.color}50` 
                  : 'var(--border-light)'
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ 
                      backgroundColor: `${integration.color}20`,
                      color: integration.color
                    }}
                  >
                    {integration.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {integration.name}
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {integration.description}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div 
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: integration.status === 'connected' 
                      ? 'var(--success-100)' 
                      : integration.status === 'error'
                        ? 'var(--error-100)'
                        : 'var(--bg-secondary)',
                    color: integration.status === 'connected' 
                      ? 'var(--success-700)' 
                      : integration.status === 'error'
                        ? 'var(--error-700)'
                        : 'var(--text-tertiary)'
                  }}
                >
                  {integration.status === 'connected' && <Check className="w-3 h-3" />}
                  {integration.status === 'error' && <AlertTriangle className="w-3 h-3" />}
                  {integration.status === 'connected' ? 'Ativo' : 
                   integration.status === 'error' ? 'Erro' : 'Desconectado'}
                </div>
              </div>

              {/* Last Sync & Error */}
              {integration.connected && integration.lastSync && (
                <div className="flex items-center gap-2 text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
                  <Clock className="w-3 h-3" />
                  Último sync: {new Date(integration.lastSync).toLocaleString('pt-BR')}
                </div>
              )}

              {integration.error && (
                <div className="flex items-center gap-2 text-xs mb-3 p-2 rounded-lg" 
                  style={{ backgroundColor: 'var(--error-100)', color: 'var(--error-700)' }}>
                  <AlertTriangle className="w-3 h-3" />
                  {integration.error}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                {integration.connected ? (
                  <>
                    <button
                      onClick={() => handleOpenConfig(integration)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <Settings className="w-4 h-4" />
                      Configurar
                    </button>
                    <button
                      onClick={() => handleTestConnection(integration)}
                      disabled={testing === integration.id}
                      className="p-2 rounded-lg transition-colors"
                      style={{
                        backgroundColor: 'var(--primary-100)',
                        color: 'var(--primary-600)'
                      }}
                      title="Testar conexão"
                    >
                      {testing === integration.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Activity className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDisconnect(integration)}
                      className="p-2 rounded-lg transition-colors"
                      style={{
                        backgroundColor: 'var(--error-100)',
                        color: 'var(--error-600)'
                      }}
                      title="Desconectar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleOpenConfig(integration)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white"
                    style={{ backgroundColor: integration.color }}
                  >
                    <Plug className="w-4 h-4" />
                    Conectar
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredIntegrations.length === 0 && (
          <div className="text-center py-12">
            <Globe 
              className="w-16 h-16 mx-auto mb-4 opacity-20"
              style={{ color: 'var(--text-tertiary)' }}
            />
            <p style={{ color: 'var(--text-secondary)' }}>
              Nenhuma integração encontrada
            </p>
          </div>
        )}

        {/* Configuration Modal */}
        <AnimatePresence>
          {selectedIntegration && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedIntegration(null)}
                className="fixed inset-0 bg-black/50 z-50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-lg p-6 rounded-2xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto"
                style={{ backgroundColor: 'var(--bg-primary)' }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ 
                      backgroundColor: `${selectedIntegration.color}20`,
                      color: selectedIntegration.color
                    }}
                  >
                    {selectedIntegration.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                      {selectedIntegration.connected ? 'Configurar' : 'Conectar'} {selectedIntegration.name}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {selectedIntegration.description}
                    </p>
                  </div>
                </div>

                {/* Configuration Form */}
                <div className="space-y-4">
                  {selectedIntegration.fields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        {field.label}
                        {field.required && <span style={{ color: 'var(--error-500)' }}> *</span>}
                      </label>
                      <div className="relative">
                        <input
                          type={field.type === 'password' && !showPasswords[field.key] ? 'password' : 'text'}
                          placeholder={field.placeholder}
                          value={formData[field.key] || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                          className="w-full px-4 py-2 rounded-lg border pr-10"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            borderColor: 'var(--border-light)',
                            color: 'var(--text-primary)'
                          }}
                        />
                        {field.type === 'password' && (
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(field.key)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                            style={{ color: 'var(--text-tertiary)' }}
                          >
                            {showPasswords[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                      {field.helpText && (
                        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                          {field.helpText}
                        </p>
                      )}
                    </div>
                  ))}

                  <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: 'var(--info-100)' }}>
                    <Shield className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--info-600)' }} />
                    <p className="text-xs" style={{ color: 'var(--info-700)' }}>
                      Suas credenciais são criptografadas e armazenadas com segurança. Nunca compartilhamos seus dados.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 mt-6">
                  <button
                    onClick={() => setSelectedIntegration(null)}
                    disabled={saving}
                    className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConnect}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-colors"
                    style={{ backgroundColor: selectedIntegration.color }}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Conectando...
                      </>
                    ) : (
                      <>
                        {selectedIntegration.connected ? 'Salvar' : 'Conectar'}
                      </>
                    )}
                  </button>
                </div>

                {/* Documentation Link */}
                <div className="mt-4 text-center">
                  <a
                    href={`https://docs.valle360.com.br/integracoes/${selectedIntegration.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm hover:underline"
                    style={{ color: 'var(--primary-500)' }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ver documentação
                  </a>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
