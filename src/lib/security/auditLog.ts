// Audit Log System - Valle 360
// Sistema de logs de auditoria para rastreamento de ações

import { supabase } from '@/lib/supabase';

export type AuditAction = 
  // Auth
  | 'auth.login'
  | 'auth.logout'
  | 'auth.login_failed'
  | 'auth.password_reset'
  | 'auth.password_changed'
  
  // Users
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.role_changed'
  | 'user.status_changed'
  
  // Clients
  | 'client.created'
  | 'client.updated'
  | 'client.deleted'
  | 'client.status_changed'
  
  // Tasks
  | 'task.created'
  | 'task.updated'
  | 'task.deleted'
  | 'task.status_changed'
  | 'task.assigned'
  
  // Approvals
  | 'approval.requested'
  | 'approval.approved'
  | 'approval.rejected'
  | 'approval.revision_requested'
  
  // Financial
  | 'invoice.created'
  | 'invoice.sent'
  | 'invoice.paid'
  | 'invoice.cancelled'
  | 'payment.received'
  | 'payment.refunded'
  
  // Messages
  | 'message.sent'
  | 'whatsapp.sent'
  | 'email.sent'
  
  // Settings
  | 'settings.updated'
  | 'integration.connected'
  | 'integration.disconnected'
  
  // Security
  | 'security.rate_limit_exceeded'
  | 'security.suspicious_activity'
  | 'security.permission_denied'
  
  // System
  | 'system.error'
  | 'system.backup'
  | 'system.maintenance';

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AuditLogEntry {
  id?: string;
  timestamp: Date;
  action: AuditAction;
  severity: AuditSeverity;
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  targetType?: string;      // 'user', 'client', 'task', etc.
  targetId?: string;
  targetName?: string;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  duration?: number;        // em ms
  success: boolean;
  errorMessage?: string;
}

function isUuid(v?: string) {
  if (!v) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

// Buffer para batch insert (performance)
let logBuffer: AuditLogEntry[] = [];
let flushTimeout: NodeJS.Timeout | null = null;
const BUFFER_SIZE = 50;
const FLUSH_INTERVAL = 5000; // 5 segundos

/**
 * Registrar uma ação no audit log
 */
export async function logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
  const fullEntry: AuditLogEntry = {
    ...entry,
    timestamp: new Date()
  };

  // Adicionar ao buffer
  logBuffer.push(fullEntry);

  // Log no console em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    const emoji = entry.success ? '✅' : '❌';
    const severityColor = {
      info: '\x1b[34m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      critical: '\x1b[35m'
    };
    console.log(
      `${severityColor[entry.severity]}[AUDIT]${emoji} ${entry.action}\x1b[0m`,
      entry.description,
      entry.metadata ? JSON.stringify(entry.metadata) : ''
    );
  }

  // Flush se buffer cheio
  if (logBuffer.length >= BUFFER_SIZE) {
    await flushLogs();
  } else if (!flushTimeout) {
    // Agendar flush
    flushTimeout = setTimeout(flushLogs, FLUSH_INTERVAL);
  }
}

/**
 * Enviar logs para o banco de dados
 */
async function flushLogs(): Promise<void> {
  if (logBuffer.length === 0) return;

  const logsToFlush = [...logBuffer];
  logBuffer = [];

  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }

  try {
    // Salvar no schema atual (audit_logs)
    const { error } = await supabase.from('audit_logs').insert(
      logsToFlush.map((log) => ({
        user_id: log.userId || null,
        action: log.action,
        entity_type: log.targetType || 'system',
        entity_id: isUuid(log.targetId) ? log.targetId : null,
        old_values: null,
        new_values: {
          severity: log.severity,
          success: log.success,
          description: log.description,
          metadata: log.metadata || null,
          user_email: log.userEmail,
          user_name: log.userName,
          user_role: log.userRole,
          target_name: log.targetName,
          request_id: log.requestId,
          duration_ms: log.duration,
          error_message: log.errorMessage || null,
        },
        ip_address: log.ipAddress || null,
        user_agent: log.userAgent || null,
        created_at: log.timestamp.toISOString(),
      }))
    );

    if (error) {
      console.error('Erro ao salvar audit logs:', error);
    }
  } catch (error) {
    console.error('Erro ao flush audit logs:', error);
    // Colocar de volta no buffer em caso de erro
    logBuffer = [...logsToFlush, ...logBuffer];
  }
}

/**
 * Helpers para tipos comuns de log
 */
export const audit = {
  // Auth
  loginSuccess: (userId: string, email: string, ip?: string) =>
    logAudit({
      action: 'auth.login',
      severity: 'info',
      userId,
      userEmail: email,
      description: `Login bem-sucedido: ${email}`,
      ipAddress: ip,
      success: true
    }),

  loginFailed: (email: string, reason: string, ip?: string) =>
    logAudit({
      action: 'auth.login_failed',
      severity: 'warning',
      userEmail: email,
      description: `Tentativa de login falhou: ${email}`,
      metadata: { reason },
      ipAddress: ip,
      success: false,
      errorMessage: reason
    }),

  logout: (userId: string, email: string) =>
    logAudit({
      action: 'auth.logout',
      severity: 'info',
      userId,
      userEmail: email,
      description: `Logout: ${email}`,
      success: true
    }),

  // CRUD genérico
  created: (
    userId: string,
    targetType: string,
    targetId: string,
    targetName: string,
    metadata?: Record<string, unknown>
  ) =>
    logAudit({
      action: `${targetType}.created` as AuditAction,
      severity: 'info',
      userId,
      targetType,
      targetId,
      targetName,
      description: `${targetType} criado: ${targetName}`,
      metadata,
      success: true
    }),

  updated: (
    userId: string,
    targetType: string,
    targetId: string,
    targetName: string,
    changes?: Record<string, unknown>
  ) =>
    logAudit({
      action: `${targetType}.updated` as AuditAction,
      severity: 'info',
      userId,
      targetType,
      targetId,
      targetName,
      description: `${targetType} atualizado: ${targetName}`,
      metadata: { changes },
      success: true
    }),

  deleted: (
    userId: string,
    targetType: string,
    targetId: string,
    targetName: string
  ) =>
    logAudit({
      action: `${targetType}.deleted` as AuditAction,
      severity: 'warning',
      userId,
      targetType,
      targetId,
      targetName,
      description: `${targetType} deletado: ${targetName}`,
      success: true
    }),

  // Security
  rateLimitExceeded: (identifier: string, endpoint: string, ip?: string) =>
    logAudit({
      action: 'security.rate_limit_exceeded',
      severity: 'warning',
      description: `Rate limit excedido: ${endpoint}`,
      metadata: { identifier, endpoint },
      ipAddress: ip,
      success: false
    }),

  permissionDenied: (userId: string, resource: string, action: string) =>
    logAudit({
      action: 'security.permission_denied',
      severity: 'warning',
      userId,
      description: `Permissão negada: ${action} em ${resource}`,
      metadata: { resource, action },
      success: false
    }),

  suspiciousActivity: (description: string, metadata: Record<string, unknown>, ip?: string) =>
    logAudit({
      action: 'security.suspicious_activity',
      severity: 'critical',
      description,
      metadata,
      ipAddress: ip,
      success: false
    }),

  // System
  error: (error: Error, context?: Record<string, unknown>) =>
    logAudit({
      action: 'system.error',
      severity: 'error',
      description: error.message,
      metadata: { stack: error.stack, ...context },
      success: false,
      errorMessage: error.message
    }),

  // Financial
  paymentReceived: (userId: string, clientId: string, clientName: string, amount: number) =>
    logAudit({
      action: 'payment.received',
      severity: 'info',
      userId,
      targetType: 'client',
      targetId: clientId,
      targetName: clientName,
      description: `Pagamento recebido: R$ ${amount.toFixed(2)} de ${clientName}`,
      metadata: { amount },
      success: true
    }),

  // Messages
  messageSent: (userId: string, channel: 'whatsapp' | 'email' | 'internal', recipient: string) =>
    logAudit({
      action: channel === 'whatsapp' ? 'whatsapp.sent' : channel === 'email' ? 'email.sent' : 'message.sent',
      severity: 'info',
      userId,
      description: `Mensagem enviada via ${channel} para ${recipient}`,
      metadata: { channel, recipient },
      success: true
    })
};

/**
 * Buscar logs de auditoria
 */
export async function getAuditLogs(filters: {
  userId?: string;
  action?: AuditAction;
  severity?: AuditSeverity;
  targetType?: string;
  targetId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<{ logs: AuditLogEntry[]; total: number }> {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' });

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters.action) {
      query = query.eq('action', filters.action);
    }
    if (filters.severity) {
      query = query.eq('severity', filters.severity);
    }
    if (filters.targetType) {
      query = query.eq('target_type', filters.targetType);
    }
    if (filters.targetId) {
      query = query.eq('target_id', filters.targetId);
    }
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }

    query = query
      .order('created_at', { ascending: false })
      .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 50) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      logs: (data || []).map(log => ({
        id: log.id,
        timestamp: new Date(log.created_at),
        action: log.action,
        severity: log.severity,
        userId: log.user_id,
        userEmail: log.user_email,
        userName: log.user_name,
        userRole: log.user_role,
        targetType: log.target_type,
        targetId: log.target_id,
        targetName: log.target_name,
        description: log.description,
        metadata: log.metadata,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        requestId: log.request_id,
        duration: log.duration,
        success: log.success,
        errorMessage: log.error_message
      })),
      total: count || 0
    };
  } catch (error) {
    console.error('Erro ao buscar audit logs:', error);
    return { logs: [], total: 0 };
  }
}

export default audit;









