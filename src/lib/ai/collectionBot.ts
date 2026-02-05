// Sistema de Cobrança Inteligente - Val IA
// Cobra clientes e colaboradores de forma automatizada

import { supabase } from '@/lib/supabase';

interface CollectionTarget {
  id: string;
  type: 'employee' | 'client';
  name: string;
  email: string;
  phone?: string;
  reason: 'task_overdue' | 'payment_overdue' | 'approval_pending' | 'nps_feedback' | 'engagement_low';
  context: Record<string, any>;
}

interface CollectionMessage {
  platform: 'internal' | 'whatsapp' | 'email';
  message: string;
  actions?: string[];
}

function getBaseUrlForServerFetch(): string | null {
  // No browser, usamos URL relativa.
  if (typeof window !== 'undefined') return '';
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').trim();
  if (appUrl) return appUrl.replace(/\/+$/, '');
  // fallback Vercel (sem protocolo em VERCEL_URL)
  const vercel = (process.env.VERCEL_URL || '').trim();
  if (vercel) return `https://${vercel.replace(/\/+$/, '')}`;
  return null;
}

function getCronAuthHeader() {
  // Quando rodando em cron/server, podemos autenticar /api/email/send com CRON_SECRET.
  const secret = (process.env.CRON_SECRET || '').trim();
  return secret ? `Bearer ${secret}` : '';
}

// Templates de mensagens para colaboradores
const EMPLOYEE_TEMPLATES: Record<string, (ctx: any) => string> = {
  task_overdue: (ctx) => `Oi ${ctx.name.split(' ')[0]}! 👋

Notei que a tarefa "${ctx.taskTitle}" está há ${ctx.daysOverdue} dias sem movimentação.

Está tudo bem? Precisa de ajuda?

Posso:
1️⃣ Estender o prazo
2️⃣ Pedir ajuda de outro colega
3️⃣ Falar com seu gestor

Me avisa! 💜`,

  engagement_low: (ctx) => `Oi ${ctx.name.split(' ')[0]}! 

Percebi que você não tem aparecido muito por aqui ultimamente. 

Tá tudo bem? Se precisar conversar sobre algo, estou aqui!

Que tal respondermos juntos o quebra-gelo de hoje? 😊`,

  approval_pending: (ctx) => `${ctx.name.split(' ')[0]}, você tem ${ctx.pendingCount} aprovações pendentes!

Seus clientes estão aguardando. Vamos revisar juntos?

👉 Ver aprovações: ${ctx.approvalLink}`,
};

// Templates de mensagens para clientes
const CLIENT_TEMPLATES: Record<string, (ctx: any) => string> = {
  payment_overdue: (ctx) => `Olá ${ctx.name}! 😊

Passando para lembrar que a fatura #${ctx.invoiceNumber} no valor de ${ctx.amount} venceu há ${ctx.daysOverdue} dias.

💳 Link para pagamento: ${ctx.paymentLink}

Se precisar de ajuda com parcelamento, é só me avisar!

Atenciosamente,
Val - Valle 360`,

  approval_pending: (ctx) => `Oi ${ctx.name}! 

Você tem ${ctx.pendingCount} ${ctx.pendingCount === 1 ? 'item' : 'itens'} aguardando sua aprovação há ${ctx.daysWaiting} dias.

${ctx.pendingCount > 1 ? 'Se não aprovarmos logo, podemos perder as datas ideais de publicação 📅' : ''}

👉 Aprovar agora: ${ctx.approvalLink}

Leva menos de 2 minutos! 😉`,

  nps_feedback: (ctx) => `${ctx.name}, tudo bem?

Faz ${ctx.daysSinceLastContact} dias que não conversamos!

Como está sendo sua experiência com a Valle?

De 0 a 10, qual nota você daria?

Sua opinião é super importante pra gente! 💜`,
};

// Gerar mensagem de cobrança
export function generateCollectionMessage(target: CollectionTarget): CollectionMessage[] {
  const messages: CollectionMessage[] = [];
  const template = target.type === 'employee' 
    ? EMPLOYEE_TEMPLATES[target.reason]
    : CLIENT_TEMPLATES[target.reason];

  if (!template) {
    console.error(`Template não encontrado para: ${target.type} - ${target.reason}`);
    return [];
  }

  const message = template(target.context);

  // Mensagem interna (sempre)
  messages.push({
    platform: 'internal',
    message,
    actions: getActionsForReason(target.reason)
  });

  // WhatsApp (se tiver telefone e for cobrança importante)
  if (target.phone && shouldSendWhatsApp(target)) {
    messages.push({
      platform: 'whatsapp',
      message: formatForWhatsApp(message)
    });
  }

  // Email (para cobranças financeiras)
  if (target.reason === 'payment_overdue') {
    messages.push({
      platform: 'email',
      message: formatForEmail(message, target)
    });
  }

  return messages;
}

// Verificar se deve enviar WhatsApp
function shouldSendWhatsApp(target: CollectionTarget): boolean {
  const whatsappReasons = ['task_overdue', 'payment_overdue', 'approval_pending'];
  const daysThreshold = target.type === 'employee' ? 2 : 3;
  
  return whatsappReasons.includes(target.reason) && 
         (target.context.daysOverdue >= daysThreshold || target.context.daysWaiting >= daysThreshold);
}

// Obter ações disponíveis para cada razão
function getActionsForReason(reason: string): string[] {
  const actions: Record<string, string[]> = {
    task_overdue: ['extend_deadline', 'request_help', 'notify_manager'],
    payment_overdue: ['send_payment_link', 'offer_installment', 'contact_finance'],
    approval_pending: ['view_approvals', 'send_reminder'],
    nps_feedback: ['send_survey', 'schedule_call'],
    engagement_low: ['send_icebreaker', 'schedule_1on1']
  };
  
  return actions[reason] || [];
}

// Formatar mensagem para WhatsApp
function formatForWhatsApp(message: string): string {
  return message
    .replace(/\*\*/g, '*')
    .replace(/\n{3,}/g, '\n\n');
}

// Formatar mensagem para Email
function formatForEmail(message: string, target: CollectionTarget): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0f1b35 0%, #4370d1 100%); padding: 20px; text-align: center; }
    .header img { max-width: 150px; }
    .content { padding: 30px; background: #fff; }
    .button { display: inline-block; padding: 12px 24px; background: #4370d1; color: white; text-decoration: none; border-radius: 8px; margin-top: 20px; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="color: white; margin: 0;">Valle 360</h2>
    </div>
    <div class="content">
      ${message.replace(/\n/g, '<br>')}
    </div>
    <div class="footer">
      <p>Este é um email automático da Val - Assistente Virtual Valle 360</p>
      <p>Se não deseja mais receber estes emails, <a href="#">clique aqui</a></p>
    </div>
  </div>
</body>
</html>`;
}

// Buscar alvos de cobrança
export async function getCollectionTargets(): Promise<CollectionTarget[]> {
  const targets: CollectionTarget[] = [];

  try {
    // Buscar tarefas atrasadas
    const { data: overdueTasks } = await supabase
      .from('kanban_tasks')
      .select(`
        *,
        assignee:employees(id, full_name, email, phone)
      `)
      .lt('due_date', new Date().toISOString())
      .eq('status', 'in_progress');

    if (overdueTasks) {
      overdueTasks.forEach(task => {
        if (task.assignee) {
          const daysOverdue = Math.ceil(
            (new Date().getTime() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24)
          );
          
          targets.push({
            id: task.assignee.id,
            type: 'employee',
            name: task.assignee.full_name,
            email: task.assignee.email,
            phone: task.assignee.phone,
            reason: 'task_overdue',
            context: {
              name: task.assignee.full_name,
              taskTitle: task.title,
              daysOverdue
            }
          });
        }
      });
    }

    // Buscar aprovações pendentes (clientes)
    const { data: pendingApprovals } = await supabase
      .from('approvals')
      .select(`
        *,
        client:clients(id, name, email, phone)
      `)
      .eq('status', 'pending')
      .lt('created_at', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString());

    if (pendingApprovals) {
      // Agrupar por cliente
      const clientApprovals: Record<string, any> = {};
      pendingApprovals.forEach(approval => {
        if (approval.client) {
          if (!clientApprovals[approval.client.id]) {
            clientApprovals[approval.client.id] = {
              client: approval.client,
              count: 0,
              oldestDate: new Date()
            };
          }
          clientApprovals[approval.client.id].count++;
          const approvalDate = new Date(approval.created_at);
          if (approvalDate < clientApprovals[approval.client.id].oldestDate) {
            clientApprovals[approval.client.id].oldestDate = approvalDate;
          }
        }
      });

      Object.values(clientApprovals).forEach((data: any) => {
        const daysWaiting = Math.ceil(
          (new Date().getTime() - data.oldestDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        targets.push({
          id: data.client.id,
          type: 'client',
          name: data.client.name,
          email: data.client.email,
          phone: data.client.phone,
          reason: 'approval_pending',
          context: {
            name: data.client.name,
            pendingCount: data.count,
            daysWaiting,
            approvalLink: `/cliente/aprovacoes`
          }
        });
      });
    }

    // Buscar colaboradores com baixo engajamento
    const { data: lowEngagement } = await supabase
      .from('employee_gamification')
      .select(`
        *,
        employee:employees(id, full_name, email, phone)
      `)
      .lt('engagement_score', 50);

    if (lowEngagement) {
      lowEngagement.forEach(record => {
        if (record.employee) {
          targets.push({
            id: record.employee.id,
            type: 'employee',
            name: record.employee.full_name,
            email: record.employee.email,
            phone: record.employee.phone,
            reason: 'engagement_low',
            context: {
              name: record.employee.full_name,
              engagementScore: record.engagement_score
            }
          });
        }
      });
    }

  } catch (error) {
    console.error('Erro ao buscar alvos de cobrança:', error);
  }

  return targets;
}

// Enviar cobrança
export async function sendCollection(target: CollectionTarget): Promise<boolean> {
  try {
    const messages = generateCollectionMessage(target);
    const baseUrl = getBaseUrlForServerFetch();
    const cronAuth = getCronAuthHeader();
    
    for (const msg of messages) {
      if (msg.platform === 'internal') {
        // notifications.user_id = auth.users.id (não é clients.id / employees.id)
        let authUserId: string | null = null;
        if (target.type === 'employee') {
          const { data: employee } = await supabase
            .from('employees')
            .select('user_id')
            .eq('id', target.id)
            .maybeSingle();
          authUserId = employee?.user_id ? String(employee.user_id) : null;
        } else if (target.type === 'client') {
          const { data: client } = await supabase
            .from('clients')
            .select('user_id')
            .eq('id', target.id)
            .maybeSingle();
          authUserId = client?.user_id ? String(client.user_id) : null;
        }

        if (!authUserId) continue;

        // Criar notificação interna
        await supabase.from('notifications').insert({
          user_id: authUserId,
          type: 'reminder',
          title: 'Lembrete da Val',
          message: msg.message.substring(0, 200),
          link: target.context.approvalLink || target.context.taskLink || null,
          is_read: false,
          metadata: { actions: msg.actions, target_type: target.type, target_entity_id: target.id, reason: target.reason }
        });
      }
      
      if (msg.platform === 'whatsapp' && target.phone) {
        // Enviar via WhatsApp Business API
        if (baseUrl === null) continue;
        await fetch(`${baseUrl}/api/whatsapp/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: target.phone,
            message: msg.message
          })
        });
      }
      
      if (msg.platform === 'email') {
        // Enviar via email
        if (baseUrl === null) continue;
        await fetch(`${baseUrl}/api/email/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(cronAuth ? { Authorization: cronAuth } : {}),
          },
          body: JSON.stringify({
            to: target.email,
            subject: getEmailSubject(target.reason),
            html: msg.message
          })
        });
      }
    }

    // Registrar cobrança enviada
    await supabase.from('collection_logs').insert({
      target_id: target.id,
      target_type: target.type,
      reason: target.reason,
      platforms: messages.map(m => m.platform),
      sent_at: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error('Erro ao enviar cobrança:', error);
    return false;
  }
}

// Obter assunto do email
function getEmailSubject(reason: string): string {
  const subjects: Record<string, string> = {
    payment_overdue: 'Lembrete: Fatura pendente - Valle 360',
    approval_pending: 'Você tem aprovações pendentes - Valle 360',
    nps_feedback: 'Como está sua experiência? - Valle 360'
  };
  return subjects[reason] || 'Mensagem da Valle 360';
}

// Executar cobrança automática (chamado por cron job)
export async function runAutoCollection(): Promise<{ sent: number; failed: number }> {
  const targets = await getCollectionTargets();
  let sent = 0;
  let failed = 0;

  for (const target of targets) {
    // Verificar se já enviou cobrança recentemente
    const { data: recentCollection } = await supabase
      .from('collection_logs')
      .select('id')
      .eq('target_id', target.id)
      .eq('reason', target.reason)
      .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .single();

    if (!recentCollection) {
      const success = await sendCollection(target);
      if (success) {
        sent++;
      } else {
        failed++;
      }
    }
  }

  return { sent, failed };
}

export default {
  generateCollectionMessage,
  getCollectionTargets,
  sendCollection,
  runAutoCollection
};









