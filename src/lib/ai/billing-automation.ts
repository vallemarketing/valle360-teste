/**
 * Valle AI - Billing Automation Service
 * Sistema de cobrança automática e escalonamento
 */

import { supabase } from '@/lib/supabase';

export interface Invoice {
  id?: string;
  client_id: string;
  client_name: string;
  client_email: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  payment_method?: string;
  paid_at?: string;
  items: InvoiceItem[];
  created_at?: string;
  reminder_count: number;
  last_reminder_at?: string;
  escalated_to_legal?: boolean;
  escalated_at?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface CollectionAction {
  id?: string;
  invoice_id: string;
  action_type: 'reminder' | 'call' | 'email' | 'whatsapp' | 'legal_notice' | 'legal_escalation';
  status: 'pending' | 'completed' | 'failed';
  scheduled_for: string;
  executed_at?: string;
  result?: string;
  created_at?: string;
}

export interface CollectionRule {
  days_overdue: number;
  action: 'reminder' | 'call' | 'legal_notice' | 'legal_escalation';
  channel: 'email' | 'whatsapp' | 'phone' | 'all';
  message_template: string;
  escalate_after_failures?: number;
}

// Regras de cobrança padrão
const DEFAULT_COLLECTION_RULES: CollectionRule[] = [
  {
    days_overdue: 1,
    action: 'reminder',
    channel: 'email',
    message_template: 'gentle_reminder'
  },
  {
    days_overdue: 3,
    action: 'reminder',
    channel: 'whatsapp',
    message_template: 'friendly_reminder'
  },
  {
    days_overdue: 7,
    action: 'reminder',
    channel: 'all',
    message_template: 'urgent_reminder'
  },
  {
    days_overdue: 15,
    action: 'call',
    channel: 'phone',
    message_template: 'phone_script'
  },
  {
    days_overdue: 30,
    action: 'legal_notice',
    channel: 'email',
    message_template: 'formal_notice'
  },
  {
    days_overdue: 45,
    action: 'legal_escalation',
    channel: 'all',
    message_template: 'legal_escalation',
    escalate_after_failures: 2
  }
];

class BillingAutomationService {
  private collectionRules: CollectionRule[] = DEFAULT_COLLECTION_RULES;

  /**
   * Processa cobranças pendentes
   */
  async processOverdueInvoices(): Promise<{
    processed: number;
    reminders_sent: number;
    escalated: number;
  }> {
    const result = {
      processed: 0,
      reminders_sent: 0,
      escalated: 0
    };

    try {
      // Busca faturas vencidas
      const { data: overdueInvoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('status', 'overdue')
        .eq('escalated_to_legal', false)
        .order('due_date', { ascending: true });

      if (!overdueInvoices) return result;

      for (const invoice of overdueInvoices) {
        const daysOverdue = this.calculateDaysOverdue(invoice.due_date);
        const applicableRule = this.getApplicableRule(daysOverdue);

        if (applicableRule) {
          const actionResult = await this.executeCollectionAction(invoice, applicableRule);
          
          result.processed++;
          if (actionResult.type === 'reminder') {
            result.reminders_sent++;
          } else if (actionResult.type === 'escalation') {
            result.escalated++;
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Erro ao processar cobranças:', error);
      return result;
    }
  }

  /**
   * Calcula dias de atraso
   */
  private calculateDaysOverdue(dueDate: string): number {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Busca regra aplicável baseada nos dias de atraso
   */
  private getApplicableRule(daysOverdue: number): CollectionRule | null {
    // Encontra a regra mais recente aplicável
    const applicableRules = this.collectionRules
      .filter(rule => daysOverdue >= rule.days_overdue)
      .sort((a, b) => b.days_overdue - a.days_overdue);

    return applicableRules[0] || null;
  }

  /**
   * Executa ação de cobrança
   */
  private async executeCollectionAction(
    invoice: Invoice, 
    rule: CollectionRule
  ): Promise<{ type: string; success: boolean }> {
    try {
      // Verifica se já executou esta ação recentemente (últimas 24h)
      const { data: recentActions } = await supabase
        .from('collection_actions')
        .select('*')
        .eq('invoice_id', invoice.id)
        .eq('action_type', rule.action)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (recentActions && recentActions.length > 0) {
        return { type: 'skipped', success: true };
      }

      // Registra a ação
      const action: CollectionAction = {
        invoice_id: invoice.id!,
        action_type: rule.action,
        status: 'pending',
        scheduled_for: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      await supabase.from('collection_actions').insert(action);

      // Executa baseado no tipo
      if (rule.action === 'legal_escalation') {
        await this.escalateToLegal(invoice);
        return { type: 'escalation', success: true };
      }

      // Envia mensagem de cobrança
      const message = this.generateCollectionMessage(invoice, rule);
      await this.sendCollectionMessage(invoice, rule.channel, message);

      // Atualiza contador de lembretes
      await supabase
        .from('invoices')
        .update({
          reminder_count: (invoice.reminder_count || 0) + 1,
          last_reminder_at: new Date().toISOString()
        })
        .eq('id', invoice.id);

      return { type: 'reminder', success: true };
    } catch (error) {
      console.error('Erro ao executar ação de cobrança:', error);
      return { type: 'error', success: false };
    }
  }

  /**
   * Gera mensagem de cobrança personalizada
   */
  private generateCollectionMessage(invoice: Invoice, rule: CollectionRule): string {
    const templates: Record<string, string> = {
      gentle_reminder: `Olá ${invoice.client_name}!

Esperamos que esteja tudo bem. 😊

Gostaríamos de lembrar que a fatura no valor de R$ ${invoice.amount.toLocaleString('pt-BR')} venceu ontem.

Se já realizou o pagamento, por favor desconsidere esta mensagem.

Caso precise de ajuda ou tenha alguma dúvida, estamos à disposição!

Abraços,
Equipe Valle Group`,

      friendly_reminder: `Olá ${invoice.client_name}!

Passando para lembrar sobre a fatura de R$ ${invoice.amount.toLocaleString('pt-BR')} que está pendente há alguns dias.

Sabemos que imprevistos acontecem! Se precisar de um prazo extra ou parcelamento, é só nos avisar que encontramos uma solução juntos.

Aguardamos seu retorno!

Equipe Valle Group`,

      urgent_reminder: `Prezado(a) ${invoice.client_name},

Identificamos que a fatura no valor de R$ ${invoice.amount.toLocaleString('pt-BR')} encontra-se vencida há 7 dias.

Para evitar a suspensão dos serviços, solicitamos a regularização do pagamento o mais breve possível.

Caso já tenha efetuado o pagamento, por favor nos envie o comprovante.

Se precisar de condições especiais, entre em contato conosco.

Atenciosamente,
Financeiro - Valle Group`,

      formal_notice: `NOTIFICAÇÃO EXTRAJUDICIAL

Prezado(a) ${invoice.client_name},

Pelo presente instrumento, NOTIFICAMOS V.Sa. que a fatura no valor de R$ ${invoice.amount.toLocaleString('pt-BR')}, vencida há 30 dias, permanece em aberto.

Solicitamos a regularização no prazo de 5 (cinco) dias úteis, sob pena de adoção das medidas legais cabíveis, incluindo:
- Inclusão nos órgãos de proteção ao crédito (SPC/Serasa)
- Protesto do título
- Cobrança judicial

Para negociação ou esclarecimentos, entre em contato pelo e-mail financeiro@vallegroup.com.br

Atenciosamente,
Departamento Jurídico - Valle Group`,

      phone_script: `[ROTEIRO PARA LIGAÇÃO]

1. Apresentação: "Olá, aqui é [nome] da Valle Group"
2. Confirmar se está falando com: ${invoice.client_name}
3. Informar: "Estou entrando em contato sobre a fatura de R$ ${invoice.amount.toLocaleString('pt-BR')} que está pendente"
4. Ouvir o cliente
5. Oferecer opções:
   - Pagamento à vista com desconto
   - Parcelamento em até 3x
   - Nova data de vencimento
6. Registrar resultado da ligação`,

      legal_escalation: `ENCAMINHAMENTO AO JURÍDICO

Cliente: ${invoice.client_name}
Valor: R$ ${invoice.amount.toLocaleString('pt-BR')}
Dias em atraso: ${this.calculateDaysOverdue(invoice.due_date)}

Histórico de cobranças realizadas sem sucesso.
Solicita-se início de procedimento de cobrança extrajudicial/judicial.`
    };

    return templates[rule.message_template] || templates.gentle_reminder;
  }

  /**
   * Envia mensagem de cobrança
   */
  private async sendCollectionMessage(
    invoice: Invoice, 
    channel: string, 
    message: string
  ): Promise<void> {
    // Em produção, integraria com serviços de email, WhatsApp, etc.
    console.log(`[COBRANÇA] Enviando ${channel} para ${invoice.client_email}:`, message.substring(0, 100));
    
    // Registra o envio
    await supabase
      .from('message_logs')
      .insert({
        type: 'collection',
        channel,
        recipient: invoice.client_email,
        subject: `Cobrança - Fatura Valle Group`,
        content: message,
        invoice_id: invoice.id,
        sent_at: new Date().toISOString()
      });
  }

  /**
   * Escala caso para o Jurídico
   */
  private async escalateToLegal(invoice: Invoice): Promise<void> {
    try {
      // Atualiza fatura
      await supabase
        .from('invoices')
        .update({
          escalated_to_legal: true,
          escalated_at: new Date().toISOString()
        })
        .eq('id', invoice.id);

      // Cria caso no Jurídico
      await supabase
        .from('legal_cases')
        .insert({
          type: 'collection',
          client_name: invoice.client_name,
          client_email: invoice.client_email,
          amount: invoice.amount,
          invoice_id: invoice.id,
          days_overdue: this.calculateDaysOverdue(invoice.due_date),
          status: 'pending',
          priority: 'high',
          description: `Cobrança de fatura vencida há ${this.calculateDaysOverdue(invoice.due_date)} dias. Valor: R$ ${invoice.amount.toLocaleString('pt-BR')}`,
          created_at: new Date().toISOString()
        });

      // Notifica equipe jurídica
      try {
        const { data: admins } = await supabase
          .from('user_profiles')
          .select('user_id, user_type')
          .in('user_type', ['super_admin', 'admin']);

        const userIds = (admins || [])
          .map((r: any) => r.user_id)
          .filter(Boolean)
          .map((id: any) => String(id));

        if (userIds.length > 0) {
          await supabase.from('notifications').insert(
            userIds.map((userId) => ({
              user_id: userId,
              type: 'legal_case',
              title: 'Novo caso de cobrança',
              message: `Cliente ${invoice.client_name} escalado para cobrança jurídica.`,
              link: '/admin/financeiro',
              metadata: { invoice_id: invoice.id, target_role: 'juridico' },
              is_read: false,
              created_at: new Date().toISOString(),
            }))
          );
        }
      } catch {
        // best-effort
      }

    } catch (error) {
      console.error('Erro ao escalar para jurídico:', error);
    }
  }

  /**
   * Busca faturas por status
   */
  async getInvoices(filters?: {
    status?: string;
    client_id?: string;
    overdue_only?: boolean;
  }): Promise<Invoice[]> {
    try {
      let query = supabase
        .from('invoices')
        .select('*')
        .order('due_date', { ascending: true });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.client_id) {
        query = query.eq('client_id', filters.client_id);
      }
      if (filters?.overdue_only) {
        query = query.eq('status', 'overdue');
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar faturas:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar faturas:', error);
      return [];
    }
  }

  /**
   * Marca fatura como paga
   */
  async markAsPaid(invoiceId: string, paymentData?: {
    payment_method?: string;
    transaction_id?: string;
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payment_method: paymentData?.payment_method
        })
        .eq('id', invoiceId);

      if (error) {
        console.error('Erro ao marcar como pago:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao marcar como pago:', error);
      return false;
    }
  }

  /**
   * Verifica e atualiza status de faturas vencidas
   */
  async updateOverdueStatus(): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('invoices')
        .update({ status: 'overdue' })
        .eq('status', 'pending')
        .lt('due_date', today)
        .select();

      if (error) {
        console.error('Erro ao atualizar status:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      return 0;
    }
  }

  /**
   * Gera relatório de inadimplência
   */
  async generateDelinquencyReport(): Promise<{
    total_overdue: number;
    total_amount: number;
    by_age: Record<string, { count: number; amount: number }>;
    top_delinquents: Array<{ client_name: string; amount: number; days: number }>;
  }> {
    try {
      const { data: overdueInvoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('status', 'overdue');

      if (!overdueInvoices) {
        return {
          total_overdue: 0,
          total_amount: 0,
          by_age: {},
          top_delinquents: []
        };
      }

      const byAge: Record<string, { count: number; amount: number }> = {
        '1-7': { count: 0, amount: 0 },
        '8-15': { count: 0, amount: 0 },
        '16-30': { count: 0, amount: 0 },
        '31-60': { count: 0, amount: 0 },
        '60+': { count: 0, amount: 0 }
      };

      const delinquents: Array<{ client_name: string; amount: number; days: number }> = [];

      for (const invoice of overdueInvoices) {
        const days = this.calculateDaysOverdue(invoice.due_date);
        
        let ageGroup = '60+';
        if (days <= 7) ageGroup = '1-7';
        else if (days <= 15) ageGroup = '8-15';
        else if (days <= 30) ageGroup = '16-30';
        else if (days <= 60) ageGroup = '31-60';

        byAge[ageGroup].count++;
        byAge[ageGroup].amount += invoice.amount;

        delinquents.push({
          client_name: invoice.client_name,
          amount: invoice.amount,
          days
        });
      }

      return {
        total_overdue: overdueInvoices.length,
        total_amount: overdueInvoices.reduce((acc, inv) => acc + inv.amount, 0),
        by_age: byAge,
        top_delinquents: delinquents
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 10)
      };
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      return {
        total_overdue: 0,
        total_amount: 0,
        by_age: {},
        top_delinquents: []
      };
    }
  }
}

export const billingAutomation = new BillingAutomationService();
export default billingAutomation;




