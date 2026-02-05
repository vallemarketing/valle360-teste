// Webhooks System - Valle 360
// Sistema de webhooks para integrações externas

import crypto from 'crypto';

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  timestamp: Date;
  data: Record<string, unknown>;
  source: string;
}

export type WebhookEventType =
  // Client events
  | 'client.created'
  | 'client.updated'
  | 'client.deleted'
  | 'client.status_changed'
  
  // Task events
  | 'task.created'
  | 'task.updated'
  | 'task.completed'
  | 'task.deleted'
  | 'task.assigned'
  
  // Payment events
  | 'payment.received'
  | 'payment.failed'
  | 'payment.refunded'
  | 'invoice.created'
  | 'invoice.paid'
  | 'invoice.overdue'
  
  // Approval events
  | 'approval.requested'
  | 'approval.approved'
  | 'approval.rejected'
  
  // User events
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.login'
  
  // Message events
  | 'message.sent'
  | 'message.received'
  
  // NPS events
  | 'nps.submitted'
  | 'nps.low_score';

export interface WebhookSubscription {
  id: string;
  url: string;
  events: WebhookEventType[];
  secret: string;
  active: boolean;
  createdAt: Date;
  lastTriggered?: Date;
  failureCount: number;
}

// Store em memória (em produção, usar banco de dados)
const subscriptions: Map<string, WebhookSubscription> = new Map();
const eventLog: WebhookEvent[] = [];

/**
 * Criar assinatura de webhook
 */
export function createWebhookSubscription(
  url: string,
  events: WebhookEventType[]
): WebhookSubscription {
  const id = generateId();
  const secret = generateSecret();
  
  const subscription: WebhookSubscription = {
    id,
    url,
    events,
    secret,
    active: true,
    createdAt: new Date(),
    failureCount: 0
  };
  
  subscriptions.set(id, subscription);
  return subscription;
}

/**
 * Atualizar assinatura
 */
export function updateWebhookSubscription(
  id: string,
  updates: Partial<Pick<WebhookSubscription, 'url' | 'events' | 'active'>>
): WebhookSubscription | null {
  const subscription = subscriptions.get(id);
  if (!subscription) return null;
  
  const updated = { ...subscription, ...updates };
  subscriptions.set(id, updated);
  return updated;
}

/**
 * Deletar assinatura
 */
export function deleteWebhookSubscription(id: string): boolean {
  return subscriptions.delete(id);
}

/**
 * Listar assinaturas
 */
export function listWebhookSubscriptions(): WebhookSubscription[] {
  return Array.from(subscriptions.values());
}

/**
 * Disparar evento de webhook
 */
export async function triggerWebhook(
  eventType: WebhookEventType,
  data: Record<string, unknown>,
  source: string = 'system'
): Promise<void> {
  const event: WebhookEvent = {
    id: generateId(),
    type: eventType,
    timestamp: new Date(),
    data,
    source
  };
  
  // Log do evento
  eventLog.push(event);
  if (eventLog.length > 1000) {
    eventLog.shift(); // Manter apenas os últimos 1000 eventos
  }
  
  // Encontrar assinaturas interessadas
  const relevantSubscriptions = Array.from(subscriptions.values())
    .filter(sub => sub.active && sub.events.includes(eventType));
  
  // Disparar para cada assinatura
  const promises = relevantSubscriptions.map(sub => 
    sendWebhook(sub, event).catch(error => {
      console.error(`Webhook failed for ${sub.url}:`, error);
      // Incrementar contador de falhas
      sub.failureCount++;
      // Desativar após 10 falhas consecutivas
      if (sub.failureCount >= 10) {
        sub.active = false;
      }
    })
  );
  
  await Promise.allSettled(promises);
}

/**
 * Enviar webhook para URL
 */
async function sendWebhook(
  subscription: WebhookSubscription,
  event: WebhookEvent
): Promise<void> {
  const payload = JSON.stringify(event);
  const signature = generateSignature(payload, subscription.secret);
  
  const response = await fetch(subscription.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-ID': event.id,
      'X-Webhook-Signature': signature,
      'X-Webhook-Timestamp': event.timestamp.toISOString(),
      'User-Agent': 'Valle360-Webhook/1.0'
    },
    body: payload,
    signal: AbortSignal.timeout(10000) // 10s timeout
  });
  
  if (!response.ok) {
    throw new Error(`Webhook returned ${response.status}`);
  }
  
  // Atualizar último disparo e resetar falhas
  subscription.lastTriggered = new Date();
  subscription.failureCount = 0;
}

/**
 * Gerar assinatura HMAC
 */
function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verificar assinatura de webhook recebido
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = generateSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

/**
 * Gerar ID único
 */
function generateId(): string {
  return `wh_${Date.now().toString(36)}_${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * Gerar secret para assinatura
 */
function generateSecret(): string {
  return `whsec_${crypto.randomBytes(32).toString('hex')}`;
}

/**
 * Obter log de eventos
 */
export function getEventLog(limit: number = 100): WebhookEvent[] {
  return eventLog.slice(-limit);
}

/**
 * Helpers para disparar eventos comuns
 */
export const webhookEvents = {
  // Clients
  clientCreated: (client: Record<string, unknown>) =>
    triggerWebhook('client.created', { client }, 'clients'),
  
  clientUpdated: (client: Record<string, unknown>, changes: Record<string, unknown>) =>
    triggerWebhook('client.updated', { client, changes }, 'clients'),
  
  // Tasks
  taskCreated: (task: Record<string, unknown>) =>
    triggerWebhook('task.created', { task }, 'tasks'),
  
  taskCompleted: (task: Record<string, unknown>) =>
    triggerWebhook('task.completed', { task }, 'tasks'),
  
  taskAssigned: (task: Record<string, unknown>, assignee: Record<string, unknown>) =>
    triggerWebhook('task.assigned', { task, assignee }, 'tasks'),
  
  // Payments
  paymentReceived: (payment: Record<string, unknown>) =>
    triggerWebhook('payment.received', { payment }, 'payments'),
  
  invoicePaid: (invoice: Record<string, unknown>) =>
    triggerWebhook('invoice.paid', { invoice }, 'payments'),
  
  invoiceOverdue: (invoice: Record<string, unknown>) =>
    triggerWebhook('invoice.overdue', { invoice }, 'payments'),
  
  // Approvals
  approvalRequested: (item: Record<string, unknown>) =>
    triggerWebhook('approval.requested', { item }, 'approvals'),
  
  approvalApproved: (item: Record<string, unknown>) =>
    triggerWebhook('approval.approved', { item }, 'approvals'),
  
  approvalRejected: (item: Record<string, unknown>, reason?: string) =>
    triggerWebhook('approval.rejected', { item, reason }, 'approvals'),
  
  // NPS
  npsSubmitted: (nps: Record<string, unknown>) =>
    triggerWebhook('nps.submitted', { nps }, 'nps'),
  
  npsLowScore: (nps: Record<string, unknown>) =>
    triggerWebhook('nps.low_score', { nps }, 'nps'),
};

export default {
  createWebhookSubscription,
  updateWebhookSubscription,
  deleteWebhookSubscription,
  listWebhookSubscriptions,
  triggerWebhook,
  verifyWebhookSignature,
  getEventLog,
  webhookEvents
};









