'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Search,
  Filter,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  ChevronDown,
  ChevronRight,
  Download,
  RefreshCw,
  Clock
} from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: Date;
  action: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  success: boolean;
  errorMessage?: string;
}

// Dados mock para demonstração
const mockLogs: AuditLog[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    action: 'auth.login',
    severity: 'info',
    userId: 'user-1',
    userEmail: 'joao@valle360.com',
    userName: 'João Silva',
    userRole: 'colaborador',
    description: 'Login bem-sucedido: joao@valle360.com',
    ipAddress: '192.168.1.100',
    success: true
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    action: 'task.created',
    severity: 'info',
    userId: 'user-2',
    userEmail: 'maria@valle360.com',
    userName: 'Maria Santos',
    userRole: 'head',
    targetType: 'task',
    targetId: 'task-123',
    targetName: 'Banner Cliente X',
    description: 'Tarefa criada: Banner Cliente X',
    success: true
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    action: 'auth.login_failed',
    severity: 'warning',
    userEmail: 'hacker@evil.com',
    description: 'Tentativa de login falhou: hacker@evil.com',
    metadata: { reason: 'Credenciais inválidas' },
    ipAddress: '45.67.89.123',
    success: false,
    errorMessage: 'Credenciais inválidas'
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    action: 'security.rate_limit_exceeded',
    severity: 'warning',
    description: 'Rate limit excedido: /api/login',
    metadata: { endpoint: '/api/login', attempts: 10 },
    ipAddress: '45.67.89.123',
    success: false
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    action: 'payment.received',
    severity: 'info',
    userId: 'user-3',
    userEmail: 'admin@valle360.com',
    userName: 'Admin',
    userRole: 'admin',
    targetType: 'client',
    targetId: 'client-456',
    targetName: 'Tech Corp',
    description: 'Pagamento recebido: R$ 5.000,00 de Tech Corp',
    metadata: { amount: 500000 },
    success: true
  },
  {
    id: '6',
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
    action: 'user.role_changed',
    severity: 'warning',
    userId: 'user-3',
    userEmail: 'admin@valle360.com',
    userName: 'Admin',
    userRole: 'admin',
    targetType: 'user',
    targetId: 'user-1',
    targetName: 'João Silva',
    description: 'Role alterada: João Silva de colaborador para head',
    metadata: { oldRole: 'colaborador', newRole: 'head' },
    success: true
  },
  {
    id: '7',
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    action: 'system.error',
    severity: 'error',
    description: 'Erro ao processar pagamento',
    metadata: { error: 'Gateway timeout', paymentId: 'pay-789' },
    success: false,
    errorMessage: 'Gateway timeout'
  },
  {
    id: '8',
    timestamp: new Date(Date.now() - 1000 * 60 * 180),
    action: 'security.suspicious_activity',
    severity: 'critical',
    description: 'Múltiplas tentativas de login de IP suspeito',
    metadata: { attempts: 50, timeWindow: '5 minutos' },
    ipAddress: '123.45.67.89',
    success: false
  }
];

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>(mockLogs);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>(mockLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadRealLogs = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/audit-logs?limit=300');
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `Falha ao carregar logs [${res.status}]`);

      const parsed = (data?.logs || []).map((l: any) => ({
        ...l,
        timestamp: new Date(l.timestamp),
      }));

      if (Array.isArray(parsed) && parsed.length > 0) {
        setLogs(parsed);
      } else {
        // Sem logs ainda (modo teste) -> mantém mock
        setLogs(mockLogs);
      }
    } catch (e) {
      // fallback para mock
      setLogs(mockLogs);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar logs
  useEffect(() => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter(log => log.severity === severityFilter);
    }

    setFilteredLogs(filtered);
  }, [logs, searchTerm, severityFilter]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'info':
        return <Info className="w-4 h-4" style={{ color: 'var(--info-500)' }} />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" style={{ color: 'var(--warning-500)' }} />;
      case 'error':
        return <XCircle className="w-4 h-4" style={{ color: 'var(--error-500)' }} />;
      case 'critical':
        return <Shield className="w-4 h-4" style={{ color: 'var(--error-600)' }} />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info':
        return 'var(--info-100)';
      case 'warning':
        return 'var(--warning-100)';
      case 'error':
        return 'var(--error-100)';
      case 'critical':
        return 'var(--error-200)';
      default:
        return 'var(--bg-secondary)';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRefresh = async () => {
    await loadRealLogs();
  };

  // Load inicial
  useEffect(() => {
    loadRealLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Ação', 'Severidade', 'Usuário', 'Descrição', 'IP', 'Sucesso'],
      ...filteredLogs.map(log => [
        log.timestamp.toISOString(),
        log.action,
        log.severity,
        log.userEmail || '-',
        log.description,
        log.ipAddress || '-',
        log.success ? 'Sim' : 'Não'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Shield className="w-7 h-7" style={{ color: 'var(--primary-500)' }} />
            Logs de Auditoria
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Monitoramento de atividades e segurança do sistema
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all"
            style={{ backgroundColor: 'var(--primary-500)', color: 'white' }}
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div 
        className="flex flex-col md:flex-row gap-4 p-4 rounded-xl"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Buscar por ação, usuário, descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl"
            style={{ 
              backgroundColor: 'var(--bg-primary)', 
              color: 'var(--text-primary)',
              border: '1px solid var(--border-light)'
            }}
          />
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-4 py-2 rounded-xl"
            style={{ 
              backgroundColor: 'var(--bg-primary)', 
              color: 'var(--text-primary)',
              border: '1px solid var(--border-light)'
            }}
          >
            <option value="all">Todas severidades</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: logs.length, color: 'var(--primary-500)' },
          { label: 'Info', value: logs.filter(l => l.severity === 'info').length, color: 'var(--info-500)' },
          { label: 'Warnings', value: logs.filter(l => l.severity === 'warning').length, color: 'var(--warning-500)' },
          { label: 'Erros', value: logs.filter(l => l.severity === 'error' || l.severity === 'critical').length, color: 'var(--error-500)' }
        ].map((stat, index) => (
          <div
            key={index}
            className="p-4 rounded-xl"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{stat.label}</p>
            <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Logs List */}
      <div 
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}
      >
        <AnimatePresence>
          {filteredLogs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.05 }}
              className="border-b last:border-b-0"
              style={{ borderColor: 'var(--border-light)' }}
            >
              {/* Log Header */}
              <div
                className="p-4 cursor-pointer hover:bg-opacity-50 transition-colors"
                style={{ backgroundColor: expandedLog === log.id ? getSeverityColor(log.severity) : 'transparent' }}
                onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
              >
                <div className="flex items-center gap-4">
                  {/* Expand Icon */}
                  <div>
                    {expandedLog === log.id ? (
                      <ChevronDown className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
                    ) : (
                      <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
                    )}
                  </div>

                  {/* Severity Icon */}
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: getSeverityColor(log.severity) }}
                  >
                    {getSeverityIcon(log.severity)}
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span 
                        className="font-medium"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {log.action}
                      </span>
                      {log.success ? (
                        <CheckCircle className="w-4 h-4" style={{ color: 'var(--success-500)' }} />
                      ) : (
                        <XCircle className="w-4 h-4" style={{ color: 'var(--error-500)' }} />
                      )}
                    </div>
                    <p 
                      className="text-sm truncate"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {log.description}
                    </p>
                  </div>

                  {/* User */}
                  {log.userName && (
                    <div className="hidden md:flex items-center gap-2">
                      <User className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {log.userName}
                      </span>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                    <span className="text-sm whitespace-nowrap" style={{ color: 'var(--text-tertiary)' }}>
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {expandedLog === log.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div 
                      className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4"
                      style={{ backgroundColor: getSeverityColor(log.severity) }}
                    >
                      {/* Details */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                          Detalhes
                        </h4>
                        <div className="space-y-1 text-sm">
                          <p><span style={{ color: 'var(--text-tertiary)' }}>ID:</span> <span style={{ color: 'var(--text-secondary)' }}>{log.id}</span></p>
                          <p><span style={{ color: 'var(--text-tertiary)' }}>Timestamp:</span> <span style={{ color: 'var(--text-secondary)' }}>{log.timestamp.toISOString()}</span></p>
                          {log.userEmail && <p><span style={{ color: 'var(--text-tertiary)' }}>Email:</span> <span style={{ color: 'var(--text-secondary)' }}>{log.userEmail}</span></p>}
                          {log.userRole && <p><span style={{ color: 'var(--text-tertiary)' }}>Role:</span> <span style={{ color: 'var(--text-secondary)' }}>{log.userRole}</span></p>}
                          {log.ipAddress && <p><span style={{ color: 'var(--text-tertiary)' }}>IP:</span> <span style={{ color: 'var(--text-secondary)' }}>{log.ipAddress}</span></p>}
                          {log.targetType && <p><span style={{ color: 'var(--text-tertiary)' }}>Target:</span> <span style={{ color: 'var(--text-secondary)' }}>{log.targetType} - {log.targetName}</span></p>}
                        </div>
                      </div>

                      {/* Metadata */}
                      {log.metadata && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                            Metadata
                          </h4>
                          <pre 
                            className="text-xs p-3 rounded-lg overflow-auto max-h-40"
                            style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
                          >
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* Error Message */}
                      {log.errorMessage && (
                        <div className="md:col-span-2 space-y-2">
                          <h4 className="font-medium text-sm" style={{ color: 'var(--error-600)' }}>
                            Mensagem de Erro
                          </h4>
                          <p 
                            className="text-sm p-3 rounded-lg"
                            style={{ backgroundColor: 'var(--error-100)', color: 'var(--error-700)' }}
                          >
                            {log.errorMessage}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {filteredLogs.length === 0 && (
          <div className="p-12 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Nenhum log encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}









