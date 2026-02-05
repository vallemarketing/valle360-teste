'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Bell,
  Shield,
  Database,
  Globe,
  Palette,
  Mail,
  MessageSquare,
  CreditCard,
  Users,
  Building,
  Key,
  Save,
  RefreshCw,
  Check,
  AlertTriangle,
  ChevronRight,
  Moon,
  Sun,
  Zap
} from 'lucide-react';

interface SettingSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
}

const sections: SettingSection[] = [
  { id: 'general', title: 'Geral', icon: <Settings className="w-5 h-5" />, description: 'Configurações gerais do sistema' },
  { id: 'company', title: 'Empresa', icon: <Building className="w-5 h-5" />, description: 'Dados da empresa' },
  { id: 'notifications', title: 'Notificações', icon: <Bell className="w-5 h-5" />, description: 'Preferências de notificação' },
  { id: 'security', title: 'Segurança', icon: <Shield className="w-5 h-5" />, description: 'Configurações de segurança' },
  { id: 'integrations', title: 'Integrações', icon: <Zap className="w-5 h-5" />, description: 'APIs e serviços externos' },
  { id: 'email', title: 'Email', icon: <Mail className="w-5 h-5" />, description: 'Configurações de email' },
  { id: 'whatsapp', title: 'WhatsApp', icon: <MessageSquare className="w-5 h-5" />, description: 'WhatsApp Business API' },
  { id: 'payments', title: 'Pagamentos', icon: <CreditCard className="w-5 h-5" />, description: 'Gateways de pagamento' },
  { id: 'appearance', title: 'Aparência', icon: <Palette className="w-5 h-5" />, description: 'Tema e personalização' },
  { id: 'backup', title: 'Backup', icon: <Database className="w-5 h-5" />, description: 'Backup e exportação' },
];

export default function ConfiguracoesPage() {
  const [activeSection, setActiveSection] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Estados das configurações
  const [settings, setSettings] = useState({
    // Geral
    siteName: 'Valle 360',
    siteUrl: 'https://valle360.com.br',
    timezone: 'America/Sao_Paulo',
    language: 'pt-BR',
    maintenanceMode: false,

    // Empresa
    companyName: 'Valle 360 Marketing Digital',
    companyTradeName: 'Valle 360',
    companyCNPJ: '12.345.678/0001-90',
    companyEmail: 'contato@valle360.com.br',
    companyPhone: '(11) 99999-9999',
    // Endereço Completo
    companyCep: '01310-100',
    companyStreet: 'Av. Paulista',
    companyNumber: '1000',
    companyComplement: 'Sala 1001',
    companyNeighborhood: 'Bela Vista',
    companyCity: 'São Paulo',
    companyState: 'SP',
    // Dados do Sócio (para contratos)
    ownerName: 'Guilherme Valle',
    ownerCPF: '000.000.000-00',
    ownerEmail: 'guilherme@valle360.com.br',
    ownerPhone: '(11) 99999-9999',
    ownerMaritalStatus: 'solteiro',
    ownerSpouseName: '',
    // Template de Contrato
    contractTemplate: '',

    // Notificações
    emailNotifications: true,
    pushNotifications: true,
    whatsappNotifications: false,
    notifyNewClient: true,
    notifyNewTask: true,
    notifyPayment: true,
    notifyDeadline: true,

    // Segurança
    twoFactorAuth: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordExpiration: 90,
    ipWhitelist: '',

    // Email
    smtpHost: 'smtp.sendgrid.net',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    emailFrom: 'noreply@valle360.com.br',
    emailFromName: 'Valle 360',

    // WhatsApp
    whatsappApiKey: '',
    whatsappPhoneId: '',
    whatsappBusinessId: '',

    // Pagamentos
    stripePublicKey: '',
    stripeSecretKey: '',
    paypalClientId: '',
    paypalSecret: '',

    // Aparência
    theme: 'dark',
    primaryColor: '#4370d1',
    accentColor: '#a855f7',

    // Backup
    autoBackup: true,
    backupFrequency: 'daily',
    backupRetention: 30,
  });

  const handleSave = async () => {
    setIsSaving(true);
    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Nome do Sistema
              </label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full px-4 py-2 rounded-xl"
                style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                URL do Site
              </label>
              <input
                type="url"
                value={settings.siteUrl}
                onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                className="w-full px-4 py-2 rounded-xl"
                style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Fuso Horário
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl"
                  style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                >
                  <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                  <option value="America/Manaus">Manaus (GMT-4)</option>
                  <option value="America/Fortaleza">Fortaleza (GMT-3)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Idioma
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl"
                  style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es">Español</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Modo Manutenção</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Desativa acesso ao sistema para usuários</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                className={`w-12 h-6 rounded-full transition-colors ${settings.maintenanceMode ? 'bg-primary-500' : 'bg-gray-600'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.maintenanceMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        );

      case 'company':
        return (
          <div className="space-y-8">
            {/* Dados Básicos */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Building className="w-5 h-5" style={{ color: 'var(--primary-500)' }} />
                Dados da Empresa
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Razão Social *
                  </label>
                  <input
                    type="text"
                    value={settings.companyName}
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Nome Fantasia
                  </label>
                  <input
                    type="text"
                    value={settings.companyTradeName}
                    onChange={(e) => setSettings({ ...settings, companyTradeName: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    CNPJ *
                  </label>
                  <input
                    type="text"
                    value={settings.companyCNPJ}
                    onChange={(e) => setSettings({ ...settings, companyCNPJ: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={settings.companyEmail}
                    onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={settings.companyPhone}
                    onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                  />
                </div>
              </div>
            </div>

            {/* Endereço Completo */}
            <div className="space-y-4 pt-4 border-t" style={{ borderColor: 'var(--border-light)' }}>
              <h3 className="font-semibold text-lg flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Globe className="w-5 h-5" style={{ color: 'var(--primary-500)' }} />
                Endereço Completo
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>CEP</label>
                  <input
                    type="text"
                    value={settings.companyCep}
                    onChange={(e) => setSettings({ ...settings, companyCep: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Logradouro</label>
                  <input
                    type="text"
                    value={settings.companyStreet}
                    onChange={(e) => setSettings({ ...settings, companyStreet: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Número</label>
                  <input
                    type="text"
                    value={settings.companyNumber}
                    onChange={(e) => setSettings({ ...settings, companyNumber: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Complemento</label>
                  <input
                    type="text"
                    value={settings.companyComplement}
                    onChange={(e) => setSettings({ ...settings, companyComplement: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Bairro</label>
                  <input
                    type="text"
                    value={settings.companyNeighborhood}
                    onChange={(e) => setSettings({ ...settings, companyNeighborhood: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Cidade</label>
                  <input
                    type="text"
                    value={settings.companyCity}
                    onChange={(e) => setSettings({ ...settings, companyCity: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Estado</label>
                  <input
                    type="text"
                    value={settings.companyState}
                    onChange={(e) => setSettings({ ...settings, companyState: e.target.value })}
                    maxLength={2}
                    className="w-full px-4 py-2 rounded-xl"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                  />
                </div>
              </div>
            </div>

            {/* Dados do Sócio */}
            <div className="space-y-4 pt-4 border-t" style={{ borderColor: 'var(--border-light)' }}>
              <h3 className="font-semibold text-lg flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Users className="w-5 h-5" style={{ color: 'var(--primary-500)' }} />
                Dados do Sócio (Para Contratos)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Nome Completo *</label>
                  <input
                    type="text"
                    value={settings.ownerName}
                    onChange={(e) => setSettings({ ...settings, ownerName: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>CPF *</label>
                  <input
                    type="text"
                    value={settings.ownerCPF}
                    onChange={(e) => setSettings({ ...settings, ownerCPF: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Email</label>
                  <input
                    type="email"
                    value={settings.ownerEmail}
                    onChange={(e) => setSettings({ ...settings, ownerEmail: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Telefone</label>
                  <input
                    type="tel"
                    value={settings.ownerPhone}
                    onChange={(e) => setSettings({ ...settings, ownerPhone: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Estado Civil</label>
                  <select
                    value={settings.ownerMaritalStatus}
                    onChange={(e) => setSettings({ ...settings, ownerMaritalStatus: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                  >
                    <option value="solteiro">Solteiro(a)</option>
                    <option value="casado">Casado(a)</option>
                    <option value="divorciado">Divorciado(a)</option>
                    <option value="viuvo">Viúvo(a)</option>
                  </select>
                </div>
              </div>
              {settings.ownerMaritalStatus === 'casado' && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Nome do Cônjuge</label>
                  <input
                    type="text"
                    value={settings.ownerSpouseName}
                    onChange={(e) => setSettings({ ...settings, ownerSpouseName: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                  />
                </div>
              )}
            </div>

            {/* Template de Contrato */}
            <div className="space-y-4 pt-4 border-t" style={{ borderColor: 'var(--border-light)' }}>
              <h3 className="font-semibold text-lg flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Key className="w-5 h-5" style={{ color: 'var(--primary-500)' }} />
                Template de Contrato Padrão
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Faça upload do modelo de contrato que será usado para preenchimento automático com dados dos clientes.
              </p>
              <div 
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary-500 transition-colors"
                style={{ borderColor: 'var(--border-light)' }}
              >
                <Database className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  Arraste o arquivo ou clique para selecionar
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  Suporta: .docx, .pdf (máx. 10MB)
                </p>
                <input type="file" accept=".docx,.pdf" className="hidden" />
                <button 
                  className="mt-4 px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ backgroundColor: 'var(--primary-500)', color: 'white' }}
                >
                  Selecionar Arquivo
                </button>
              </div>
              <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Variáveis disponíveis:</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {'{{cliente_nome}}'}, {'{{cliente_cpf}}'}, {'{{cliente_endereco}}'}, {'{{empresa_nome}}'}, {'{{empresa_cnpj}}'}, {'{{valor_mensal}}'}, {'{{data_inicio}}'}, {'{{servicos}}'}
                </p>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>Canais de Notificação</h3>
              {[
                { key: 'emailNotifications', label: 'Email', desc: 'Receber notificações por email' },
                { key: 'pushNotifications', label: 'Push', desc: 'Notificações no navegador' },
                { key: 'whatsappNotifications', label: 'WhatsApp', desc: 'Notificações via WhatsApp' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, [item.key]: !settings[item.key as keyof typeof settings] })}
                    className={`w-12 h-6 rounded-full transition-colors ${settings[item.key as keyof typeof settings] ? 'bg-primary-500' : 'bg-gray-600'}`}
                    style={{ backgroundColor: settings[item.key as keyof typeof settings] ? 'var(--primary-500)' : 'var(--neutral-600)' }}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings[item.key as keyof typeof settings] ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>Eventos</h3>
              {[
                { key: 'notifyNewClient', label: 'Novo Cliente', desc: 'Quando um novo cliente é cadastrado' },
                { key: 'notifyNewTask', label: 'Nova Tarefa', desc: 'Quando uma tarefa é atribuída' },
                { key: 'notifyPayment', label: 'Pagamento', desc: 'Quando um pagamento é recebido' },
                { key: 'notifyDeadline', label: 'Prazo', desc: 'Alertas de prazo próximo' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, [item.key]: !settings[item.key as keyof typeof settings] })}
                    className={`w-12 h-6 rounded-full transition-colors`}
                    style={{ backgroundColor: settings[item.key as keyof typeof settings] ? 'var(--primary-500)' : 'var(--neutral-600)' }}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings[item.key as keyof typeof settings] ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Autenticação em 2 Fatores</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Exigir 2FA para todos os usuários</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, twoFactorAuth: !settings.twoFactorAuth })}
                className={`w-12 h-6 rounded-full transition-colors`}
                style={{ backgroundColor: settings.twoFactorAuth ? 'var(--primary-500)' : 'var(--neutral-600)' }}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.twoFactorAuth ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Timeout da Sessão (minutos)
                </label>
                <input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 rounded-xl"
                  style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Máximo de Tentativas de Login
                </label>
                <input
                  type="number"
                  value={settings.maxLoginAttempts}
                  onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 rounded-xl"
                  style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Expiração de Senha (dias)
              </label>
              <input
                type="number"
                value={settings.passwordExpiration}
                onChange={(e) => setSettings({ ...settings, passwordExpiration: parseInt(e.target.value) })}
                className="w-full px-4 py-2 rounded-xl"
                style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                IPs Permitidos (whitelist)
              </label>
              <textarea
                value={settings.ipWhitelist}
                onChange={(e) => setSettings({ ...settings, ipWhitelist: e.target.value })}
                placeholder="Um IP por linha (deixe vazio para permitir todos)"
                rows={3}
                className="w-full px-4 py-2 rounded-xl resize-none"
                style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
              />
            </div>
          </div>
        );

      case 'integrations':
        return (
          <div className="space-y-6">
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--info-100)' }}>
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 mt-0.5" style={{ color: 'var(--info-600)' }} />
                <div>
                  <p className="font-medium" style={{ color: 'var(--info-700)' }}>Integrações Disponíveis</p>
                  <p className="text-sm" style={{ color: 'var(--info-600)' }}>
                    Configure as APIs externas para habilitar funcionalidades avançadas
                  </p>
                </div>
              </div>
            </div>

            {[
              { name: 'OpenAI', status: 'connected', icon: '🤖' },
              { name: 'Stripe', status: 'disconnected', icon: '💳' },
              { name: 'WhatsApp Business', status: 'disconnected', icon: '📱' },
              { name: 'Google Ads', status: 'disconnected', icon: '📊' },
              { name: 'Meta Ads', status: 'disconnected', icon: '📈' },
              { name: 'SendGrid', status: 'disconnected', icon: '📧' },
            ].map((integration) => (
              <div
                key={integration.name}
                className="flex items-center justify-between p-4 rounded-xl"
                style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)' }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{integration.icon}</span>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{integration.name}</p>
                    <p className="text-sm" style={{ color: integration.status === 'connected' ? 'var(--success-500)' : 'var(--text-tertiary)' }}>
                      {integration.status === 'connected' ? '✓ Conectado' : 'Não configurado'}
                    </p>
                  </div>
                </div>
                <button
                  className="px-4 py-2 rounded-xl text-sm font-medium"
                  style={{
                    backgroundColor: integration.status === 'connected' ? 'var(--bg-secondary)' : 'var(--primary-500)',
                    color: integration.status === 'connected' ? 'var(--text-primary)' : 'white'
                  }}
                >
                  {integration.status === 'connected' ? 'Configurar' : 'Conectar'}
                </button>
              </div>
            ))}
          </div>
        );

      case 'email':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Host SMTP
                </label>
                <input
                  type="text"
                  value={settings.smtpHost}
                  onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl"
                  style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Porta SMTP
                </label>
                <input
                  type="number"
                  value={settings.smtpPort}
                  onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 rounded-xl"
                  style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Usuário SMTP
                </label>
                <input
                  type="text"
                  value={settings.smtpUser}
                  onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl"
                  style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Senha SMTP
                </label>
                <input
                  type="password"
                  value={settings.smtpPassword}
                  onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl"
                  style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Email Remetente
                </label>
                <input
                  type="email"
                  value={settings.emailFrom}
                  onChange={(e) => setSettings({ ...settings, emailFrom: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl"
                  style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Nome Remetente
                </label>
                <input
                  type="text"
                  value={settings.emailFromName}
                  onChange={(e) => setSettings({ ...settings, emailFromName: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl"
                  style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                />
              </div>
            </div>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
            >
              <Mail className="w-4 h-4" />
              Enviar Email de Teste
            </button>
          </div>
        );

      case 'whatsapp':
        return (
          <div className="space-y-6">
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--success-100)' }}>
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 mt-0.5" style={{ color: 'var(--success-600)' }} />
                <div>
                  <p className="font-medium" style={{ color: 'var(--success-700)' }}>WhatsApp Business API</p>
                  <p className="text-sm" style={{ color: 'var(--success-600)' }}>
                    Configure sua conta do WhatsApp Business para enviar mensagens automáticas
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                API Key
              </label>
              <input
                type="password"
                value={settings.whatsappApiKey}
                onChange={(e) => setSettings({ ...settings, whatsappApiKey: e.target.value })}
                placeholder="Sua chave de API do WhatsApp"
                className="w-full px-4 py-2 rounded-xl"
                style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Phone Number ID
              </label>
              <input
                type="text"
                value={settings.whatsappPhoneId}
                onChange={(e) => setSettings({ ...settings, whatsappPhoneId: e.target.value })}
                className="w-full px-4 py-2 rounded-xl"
                style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Business Account ID
              </label>
              <input
                type="text"
                value={settings.whatsappBusinessId}
                onChange={(e) => setSettings({ ...settings, whatsappBusinessId: e.target.value })}
                className="w-full px-4 py-2 rounded-xl"
                style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
              />
            </div>
          </div>
        );

      case 'payments':
        return (
          <div className="space-y-6">
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)' }}>
              <h3 className="font-medium mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <CreditCard className="w-5 h-5" style={{ color: 'var(--primary-500)' }} />
                Stripe
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Chave Pública
                  </label>
                  <input
                    type="text"
                    value={settings.stripePublicKey}
                    onChange={(e) => setSettings({ ...settings, stripePublicKey: e.target.value })}
                    placeholder="pk_live_..."
                    className="w-full px-4 py-2 rounded-xl"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Chave Secreta
                  </label>
                  <input
                    type="password"
                    value={settings.stripeSecretKey}
                    onChange={(e) => setSettings({ ...settings, stripeSecretKey: e.target.value })}
                    placeholder="sk_live_..."
                    className="w-full px-4 py-2 rounded-xl"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)' }}>
              <h3 className="font-medium mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                💳 PayPal
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Client ID
                  </label>
                  <input
                    type="text"
                    value={settings.paypalClientId}
                    onChange={(e) => setSettings({ ...settings, paypalClientId: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Secret
                  </label>
                  <input
                    type="password"
                    value={settings.paypalSecret}
                    onChange={(e) => setSettings({ ...settings, paypalSecret: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
                Tema
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: 'light', label: 'Claro', icon: <Sun className="w-5 h-5" /> },
                  { value: 'dark', label: 'Escuro', icon: <Moon className="w-5 h-5" /> },
                  { value: 'system', label: 'Sistema', icon: <Settings className="w-5 h-5" /> },
                ].map((theme) => (
                  <button
                    key={theme.value}
                    onClick={() => setSettings({ ...settings, theme: theme.value })}
                    className="p-4 rounded-xl flex flex-col items-center gap-2 transition-all"
                    style={{
                      backgroundColor: settings.theme === theme.value ? 'var(--primary-500)' : 'var(--bg-primary)',
                      color: settings.theme === theme.value ? 'white' : 'var(--text-primary)',
                      border: '1px solid var(--border-light)'
                    }}
                  >
                    {theme.icon}
                    <span className="text-sm font-medium">{theme.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Cor Primária
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="w-12 h-10 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="flex-1 px-4 py-2 rounded-xl"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Cor de Destaque
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.accentColor}
                    onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                    className="w-12 h-10 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.accentColor}
                    onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                    className="flex-1 px-4 py-2 rounded-xl"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'backup':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Backup Automático</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Realizar backup automático dos dados</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, autoBackup: !settings.autoBackup })}
                className={`w-12 h-6 rounded-full transition-colors`}
                style={{ backgroundColor: settings.autoBackup ? 'var(--primary-500)' : 'var(--neutral-600)' }}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.autoBackup ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Frequência
                </label>
                <select
                  value={settings.backupFrequency}
                  onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl"
                  style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                >
                  <option value="hourly">A cada hora</option>
                  <option value="daily">Diário</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Retenção (dias)
                </label>
                <input
                  type="number"
                  value={settings.backupRetention}
                  onChange={(e) => setSettings({ ...settings, backupRetention: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 rounded-xl"
                  style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>Ações</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-xl"
                  style={{ backgroundColor: 'var(--primary-500)', color: 'white' }}
                >
                  <Database className="w-4 h-4" />
                  Criar Backup Agora
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-xl"
                  style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Restaurar Backup
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-xl"
                  style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                >
                  <Globe className="w-4 h-4" />
                  Exportar Dados (CSV)
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)' }}>
              <h4 className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Últimos Backups</h4>
              <div className="space-y-2">
                {[
                  { date: 'Hoje, 03:00', size: '245 MB', status: 'success' },
                  { date: 'Ontem, 03:00', size: '243 MB', status: 'success' },
                  { date: '25/11/2024, 03:00', size: '241 MB', status: 'success' },
                ].map((backup, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0" style={{ borderColor: 'var(--border-light)' }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{backup.date}</p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{backup.size}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4" style={{ color: 'var(--success-500)' }} />
                      <button className="text-sm" style={{ color: 'var(--primary-500)' }}>Baixar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Settings className="w-7 h-7" style={{ color: 'var(--primary-500)' }} />
              Configurações
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Gerencie as configurações do sistema
            </p>
          </div>

          <motion.button
            onClick={handleSave}
            disabled={isSaving}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium"
            style={{ backgroundColor: saved ? 'var(--success-500)' : 'var(--primary-500)', color: 'white' }}
          >
            {isSaving ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : saved ? (
              <Check className="w-5 h-5" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {isSaving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar Alterações'}
          </motion.button>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-64 space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                style={{
                  backgroundColor: activeSection === section.id ? 'var(--primary-500)' : 'var(--bg-primary)',
                  color: activeSection === section.id ? 'white' : 'var(--text-primary)'
                }}
              >
                {section.icon}
                <span className="font-medium">{section.title}</span>
                <ChevronRight className="w-4 h-4 ml-auto" />
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-6 rounded-xl"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}
            >
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {sections.find(s => s.id === activeSection)?.title}
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                {sections.find(s => s.id === activeSection)?.description}
              </p>
              {renderSection()}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
